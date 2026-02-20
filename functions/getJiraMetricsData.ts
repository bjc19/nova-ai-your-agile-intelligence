import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Forbidden: Admin or Contributor access required' }, { status: 403 });
    }

    const { workspaceId, days = 30 } = await req.json();
    
    if (!workspaceId) {
      return Response.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Récupérer la connexion Jira et la sélection du projet
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({});
    const jiraProjectSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({ 
      id: workspaceId 
    });

    if (!jiraConnections || jiraConnections.length === 0) {
      return Response.json({ error: 'No Jira connection found' }, { status: 404 });
    }

    if (!jiraProjectSelections || jiraProjectSelections.length === 0) {
      return Response.json({ error: 'No Jira project selection found' }, { status: 404 });
    }

    const jiraConnection = jiraConnections[0];
    const projectSelection = jiraProjectSelections[0];
    
    const accessToken = jiraConnection.access_token;
    const cloudId = jiraConnection.cloud_id;
    const boardId = projectSelection.board_id;
    
    if (!boardId) {
      return Response.json({ error: 'board_id not found in project selection' }, { status: 400 });
    }

    // Récupérer l'historique des issues du board pour les X derniers jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const jql = `project = "${projectSelection.project_key}" AND updated >= "${startDate.toISOString().split('T')[0]}" ORDER BY updated DESC`;
    
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&expand=changelog&fields=created,updated,status,statuses,issuetype`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json({ 
        error: `Jira API error: ${response.status}`,
        details: errorData 
      }, { status: response.status });
    }

    const jiraData = await response.json();
    const issues = jiraData.issues || [];

    // Traiter les issues pour extraire les données de cycle time et flow efficiency
    const metricsData = {
      workspace_id: workspaceId,
      workspace_type: 'jira',
      issues_processed: issues.length,
      raw_issues: issues,
      cycle_times: [],
      status_transitions: [],
      issues_by_status: {}
    };

    // Analyser chaque issue
    for (const issue of issues) {
      const changelog = issue.changelog || { histories: [] };
      const histories = changelog.histories || [];
      
      let createdDate = new Date(issue.fields.created);
      let resolvedDate = null;
      let startedDate = null;
      let statuses = [];

      // Parcourir l'historique pour trouver les transitions de statut
      for (const history of histories) {
        for (const item of history.items || []) {
          if (item.field === 'status') {
            const statusChange = {
              fromStatus: item.fromString,
              toStatus: item.toString,
              date: new Date(history.created),
              timestamp: history.created
            };
            statuses.push(statusChange);

            // Déterminer si c'est un statut "En Cours" (Started)
            if (!startedDate && (item.toString === 'In Progress' || item.toString === 'Doing')) {
              startedDate = new Date(history.created);
            }

            // Déterminer si c'est un statut "Terminé" (Resolved)
            if ((item.toString === 'Done' || item.toString === 'Closed')) {
              resolvedDate = new Date(history.created);
            }
          }
        }
      }

      // Calculer le cycle time
      if (startedDate && resolvedDate) {
        const cycleTime = (resolvedDate - startedDate) / (1000 * 60 * 60 * 24); // en jours
        metricsData.cycle_times.push({
          issue_key: issue.key,
          cycle_time: parseFloat(cycleTime.toFixed(2)),
          created: issue.fields.created,
          started: startedDate.toISOString(),
          resolved: resolvedDate.toISOString()
        });
      }

      // Tracker les transitions de statut pour flow efficiency
      metricsData.status_transitions.push({
        issue_key: issue.key,
        statuses: statuses
      });

      // Compter par statut
      const currentStatus = issue.fields.status.name;
      metricsData.issues_by_status[currentStatus] = (metricsData.issues_by_status[currentStatus] || 0) + 1;
    }

    return Response.json(metricsData);
  } catch (error) {
    console.error('Error in getJiraMetricsData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});