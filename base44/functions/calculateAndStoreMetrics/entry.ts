import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  let bodyData;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Forbidden: Admin or Contributor access required' }, { status: 403 });
    }

    bodyData = await req.json();
    const { workspaceId, workspaceType, days = 30 } = bodyData;
    
    if (!workspaceId || !workspaceType) {
      return Response.json({ error: 'workspaceId and workspaceType are required' }, { status: 400 });
    }

    // Récupérer les données brutes du workspace
    let rawMetricsData;
    
    if (workspaceType === 'jira') {
      const jiraResponse = await base44.functions.invoke('getJiraMetricsData', { 
        workspaceId, 
        days 
      });
      rawMetricsData = jiraResponse.data;
    } else if (workspaceType === 'trello') {
      const trelloResponse = await base44.functions.invoke('getTrelloMetricsData', { 
        workspaceId, 
        days 
      });
      rawMetricsData = trelloResponse.data;
    } else {
      return Response.json({ error: 'Invalid workspace type' }, { status: 400 });
    }

    if (!rawMetricsData) {
      return Response.json({ error: 'Failed to retrieve metrics data' }, { status: 500 });
    }

    // Calculer les métriques
    const cycleTimes = rawMetricsData.cycle_times || [];
    const issuesByStatus = rawMetricsData.issues_by_status || rawMetricsData.cards_by_status || {};
    
    // Cycle Time Calculation
    let cycleTimeAvg = 0;
    let cycleTimeMin = Infinity;
    let cycleTimeMax = -Infinity;
    
    if (cycleTimes.length > 0) {
      const sum = cycleTimes.reduce((acc, ct) => acc + ct.cycle_time, 0);
      cycleTimeAvg = parseFloat((sum / cycleTimes.length).toFixed(2));
      cycleTimeMin = parseFloat(Math.min(...cycleTimes.map(ct => ct.cycle_time)).toFixed(2));
      cycleTimeMax = parseFloat(Math.max(...cycleTimes.map(ct => ct.cycle_time)).toFixed(2));
    }

    // Flow Efficiency Calculation - basée sur les mouvements de status
    let flowEfficiency = 0;
    let activeTimePercentage = 0;
    let passiveTimePercentage = 0;

    const statusTransitions = rawMetricsData.status_transitions || rawMetricsData.card_movements || [];
    
    if (statusTransitions.length > 0) {
      let totalActiveTime = 0;
      let totalPassiveTime = 0;
      let validCardsCount = 0;

      for (const transition of statusTransitions) {
        const movements = transition.statuses || transition.movements || [];
        if (movements.length < 2) continue;

        let isActive = false;
        let lastStatusChangeDate = null;

        for (let i = 0; i < movements.length; i++) {
          const movement = movements[i];
          const movementDate = new Date(movement.date || movement.timestamp);
          const currentStatus = movement.toStatus || movement.toListName || '';

          // Déterminer si le statut est actif (ajout de valeur) ou passif (attente/bloquage)
          const isCurrentActive = isStatusActive(currentStatus);
          
          if (lastStatusChangeDate && i > 0) {
            const timeDiff = (movementDate - lastStatusChangeDate) / (1000 * 60 * 60); // en heures
            
            if (isActive) {
              totalActiveTime += timeDiff;
            } else {
              totalPassiveTime += timeDiff;
            }
          }

          isActive = isCurrentActive;
          lastStatusChangeDate = movementDate;
        }

        validCardsCount++;
      }

      if (validCardsCount > 0) {
        const totalTime = totalActiveTime + totalPassiveTime;
        if (totalTime > 0) {
          flowEfficiency = parseFloat((totalActiveTime / totalTime * 100).toFixed(2));
          activeTimePercentage = parseFloat((totalActiveTime / totalTime * 100).toFixed(2));
          passiveTimePercentage = parseFloat((totalPassiveTime / totalTime * 100).toFixed(2));
        }
      }
    }

    // Change Failure Rate Calculation
    // Basé sur le nombre de bugs/incidents par rapport aux changements totaux
    let changeFailureRate = 0;
    
    // Dans Jira, on peut compter les issues de type "Bug" comme échecs
    // Dans Trello, c'est plus difficile sans convention de nommage
    const issuesCount = (rawMetricsData.raw_issues || rawMetricsData.cards_processed || 0);
    
    if (workspaceType === 'jira' && rawMetricsData.raw_issues) {
      const bugCount = rawMetricsData.raw_issues.filter(issue => 
        issue.fields.issuetype.name === 'Bug'
      ).length;
      
      if (issuesCount > 0) {
        changeFailureRate = parseFloat((bugCount / issuesCount * 100).toFixed(2));
      }
    }

    // WIP et Throughput
    const cardsCompleted = issuesByStatus['Done'] || issuesByStatus['Terminé'] || 0;
    const cardsInProgress = issuesByStatus['In Progress'] || issuesByStatus['En Cours'] || 0;
    const cardsBlocked = issuesByStatus['Blocked'] || issuesByStatus['Bloqué'] || 0;
    const wip = cardsInProgress + cardsBlocked;
    const throughput = cardsCompleted;

    // Préparer les données pour stockage
    const metricsRecord = {
      workspace_id: workspaceId,
      workspace_type: workspaceType,
      metric_date: new Date().toISOString().split('T')[0],
      cycle_time_avg: cycleTimeAvg,
      cycle_time_min: cycleTimeMin === Infinity ? 0 : cycleTimeMin,
      cycle_time_max: cycleTimeMax === -Infinity ? 0 : cycleTimeMax,
      flow_efficiency: flowEfficiency,
      change_failure_rate: changeFailureRate,
      cards_completed: cardsCCompleted,
      cards_in_progress: cardsInProgress,
      cards_blocked: cardsBlocked,
      throughput: throughput,
      wip: wip,
      active_time_percentage: activeTimePercentage,
      passive_time_percentage: passiveTimePercentage,
      calculation_status: 'success',
      data_points_count: cycleTimes.length,
      period_start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end_date: new Date().toISOString().split('T')[0]
    };

    // Stocker dans MetricsHistory
    const storedMetrics = await base44.asServiceRole.entities.MetricsHistory.create(metricsRecord);

    return Response.json({
      success: true,
      metrics: metricsRecord,
      stored_id: storedMetrics.id,
      raw_data_summary: {
        cycle_times_count: cycleTimes.length,
        status_transitions_count: statusTransitions.length,
        issues_by_status: issuesByStatus
      }
    });
  } catch (error) {
    console.error('Error in calculateAndStoreMetrics:', error);
    
    // Tenter de stocker au moins un enregistrement d'erreur
    try {
      if (!bodyData) {
        bodyData = {};
      }
      const { workspaceId, workspaceType } = bodyData;
      await base44.asServiceRole.entities.MetricsHistory.create({
        workspace_id: workspaceId,
        workspace_type: workspaceType,
        metric_date: new Date().toISOString().split('T')[0],
        calculation_status: 'error',
        error_message: error.message
      });
    } catch (e) {
      console.error('Could not store error metrics:', e);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});

function isStatusActive(statusName) {
  if (!statusName) return false;
  
  const activeKeywords = ['in progress', 'en cours', 'doing', 'development', 'review', 'en révision', 'testing', 'test'];
  const passiveKeywords = ['blocked', 'bloqué', 'waiting', 'en attente', 'on hold', 'todo', 'à faire', 'backlog'];
  
  const lowerStatus = statusName.toLowerCase();
  
  for (const keyword of passiveKeywords) {
    if (lowerStatus.includes(keyword)) {
      return false;
    }
  }
  
  for (const keyword of activeKeywords) {
    if (lowerStatus.includes(keyword)) {
      return true;
    }
  }
  
  // Par défaut, les statuts non reconnus ne sont pas actifs
  return false;
}