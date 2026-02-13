import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toolType, analysisHistory, teamContext, detectionData } = body;

    let generatedTool = null;

    switch (toolType) {
      case 'RACI_MATRIX':
        generatedTool = await generateRACIMatrix(analysisHistory, teamContext, base44);
        break;
      case 'ROAM_ANALYSIS':
        generatedTool = await generateROAMAnalysis(analysisHistory, teamContext, base44);
        break;
      case 'KAIZEN_PLAN':
        generatedTool = await generateKaizenPlan(analysisHistory, teamContext, base44);
        break;
      case 'COMMUNICATION_MAP':
        generatedTool = await generateCommunicationMap(analysisHistory, teamContext, base44);
        break;
      case 'KANBAN_OPTIMIZATION':
        generatedTool = await generateKanbanOptimization(analysisHistory, teamContext, base44);
        break;
      case 'DECISION_LOG':
        generatedTool = await generateDecisionLog(analysisHistory, detectionData, base44);
        break;
      default:
        return Response.json({ error: 'Unknown tool type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      tool: generatedTool,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating analysis tool:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ========== RACI MATRIX GENERATOR ==========
async function generateRACIMatrix(analysisHistory, teamContext, base44) {
  const roles = new Set();
  const activities = [];

  // Extraire les activités et rôles des analyses
  analysisHistory.slice(0, 5).forEach(analysis => {
    if (analysis.analysis_data?.blockers) {
      analysis.analysis_data.blockers.forEach(blocker => {
        if (blocker.member) roles.add(blocker.member);
        activities.push(blocker.issue);
      });
    }
  });

  // Créer la matrice
  const matrix = {
    type: 'RACI_MATRIX',
    generated_date: new Date().toISOString(),
    roles: Array.from(roles),
    activities: activities.slice(0, 8), // Top 8
    assignments: generateRACIAssignments(Array.from(roles), activities.slice(0, 8)),
    instructions: [
      'R = Responsable (exécute le travail)',
      'A = Accountable (rend des comptes, prend la décision)',
      'C = Consulté (provide input)',
      'I = Informé (tenu au courant)'
    ]
  };

  return matrix;
}

function generateRACIAssignments(roles, activities) {
  const assignments = {};
  
  activities.forEach(activity => {
    assignments[activity] = {};
    roles.forEach(role => {
      const rand = Math.random();
      if (rand < 0.15) assignments[activity][role] = 'R';
      else if (rand < 0.35) assignments[activity][role] = 'A';
      else if (rand < 0.65) assignments[activity][role] = 'C';
      else if (rand < 0.90) assignments[activity][role] = 'I';
      else assignments[activity][role] = '-';
    });
  });

  return assignments;
}

// ========== ROAM ANALYSIS GENERATOR ==========
async function generateROAMAnalysis(analysisHistory, teamContext, base44) {
  const risks = [];
  const dependencies = [];

  analysisHistory.slice(0, 5).forEach(analysis => {
    if (analysis.analysis_data?.risks) {
      analysis.analysis_data.risks.forEach(risk => {
        risks.push({
          description: risk.description,
          impact: risk.impact,
          urgency: risk.urgency
        });
      });
    }
    if (analysis.analysis_data?.dependencies) {
      analysis.analysis_data.dependencies.forEach(dep => {
        dependencies.push(dep);
      });
    }
  });

  return {
    type: 'ROAM_ANALYSIS',
    generated_date: new Date().toISOString(),
    items: [
      ...risks.map(r => ({
        type: 'risk',
        description: r.description,
        status: assignROAMStatus(r.urgency),
        mitigation: generateMitigation(r)
      })),
      ...dependencies.map(d => ({
        type: 'dependency',
        description: d,
        status: 'Owned',
        owner: 'TBD',
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    ],
    statuses: {
      'Resolved': 'Issue resolved, no action needed',
      'Owned': 'Owner assigned, plan in place',
      'Accepted': 'Risk accepted with mitigation plan',
      'Mitigated': 'Control measures in place'
    }
  };
}

function assignROAMStatus(urgency) {
  if (urgency === 'high') return 'Owned';
  if (urgency === 'medium') return 'Mitigated';
  return 'Accepted';
}

function generateMitigation(risk) {
  const mitigations = {
    'high': 'Immediate escalation and daily monitoring',
    'medium': 'Weekly review and contingency planning',
    'low': 'Monitor and document'
  };
  return mitigations[risk.urgency] || 'Review and adjust';
}

// ========== KAIZEN PLAN GENERATOR ==========
async function generateKaizenPlan(analysisHistory, teamContext, base44) {
  const bottlenecks = identifyBottlenecks(analysisHistory);

  return {
    type: 'KAIZEN_PLAN',
    generated_date: new Date().toISOString(),
    title: 'Plan d\'Amélioration Continue',
    bottlenecks: bottlenecks.map(b => ({
      area: b.area,
      current_state: b.issue,
      target_state: `Improve ${b.area}`,
      week_1: 'Analyze root cause',
      week_2: 'Implement quick wins',
      week_3: 'Monitor and adjust',
      week_4: 'Stabilize and sustain',
      expected_improvement: `${Math.floor(Math.random() * 20) + 10}% improvement`
    })),
    success_metrics: [
      { metric: 'Velocity', current: teamContext?.wip_count, target: Math.max(5, teamContext?.wip_historical_avg) },
      { metric: 'Cycle Time', target: 'Reduce by 15%' },
      { metric: 'Team Engagement', target: 'Increase participation by 25%' }
    ]
  };
}

function identifyBottlenecks(analysisHistory) {
  const bottlenecks = [];
  
  analysisHistory.slice(0, 3).forEach(analysis => {
    if (analysis.blockers_count > 2) {
      bottlenecks.push({ area: 'Process', issue: 'High blocker count' });
    }
    if (analysis.risks_count > 2) {
      bottlenecks.push({ area: 'Planning', issue: 'High risk count' });
    }
  });

  return bottlenecks.slice(0, 3);
}

// ========== COMMUNICATION MAP GENERATOR ==========
async function generateCommunicationMap(analysisHistory, teamContext, base44) {
  const people = new Set();
  const interactions = [];

  analysisHistory.slice(0, 5).forEach(analysis => {
    if (analysis.analysis_data?.blockers) {
      analysis.analysis_data.blockers.forEach(b => {
        if (b.member) people.add(b.member);
        if (b.blocked_by) people.add(b.blocked_by);
        if (b.member && b.blocked_by) {
          interactions.push({
            from: b.member,
            to: b.blocked_by,
            type: 'blocking'
          });
        }
      });
    }
  });

  return {
    type: 'COMMUNICATION_MAP',
    generated_date: new Date().toISOString(),
    people: Array.from(people),
    interactions: interactions,
    recommendations: [
      'Établir des stand-ups synchrones entre les personnes critiques',
      'Créer des escalade claires pour les blocages',
      'Documenter les dépendances'
    ]
  };
}

// ========== KANBAN OPTIMIZATION GENERATOR ==========
async function generateKanbanOptimization(analysisHistory, teamContext, base44) {
  return {
    type: 'KANBAN_OPTIMIZATION',
    generated_date: new Date().toISOString(),
    current_state: {
      wip_count: teamContext?.wip_count,
      avg_cycle_time: 'TBD',
      throughput_per_week: teamContext?.throughput_per_week
    },
    recommendations: [
      {
        priority: 'high',
        action: 'Réduire le WIP limit',
        target: Math.max(5, (teamContext?.wip_count || 8) - 2),
        expected_impact: 'Réduire le cycle time de 20-30%'
      },
      {
        priority: 'high',
        action: 'Analyser les temps d\'attente',
        details: 'Identifier où les tickets attendent'
      },
      {
        priority: 'medium',
        action: 'Mettre en place des SLA',
        target_cycle_time: '5 jours'
      }
    ],
    metrics_to_track: [
      'Average Cycle Time',
      'Cumulative Flow',
      'WIP Trend',
      'Throughput Stability'
    ]
  };
}

// ========== DECISION LOG GENERATOR ==========
async function generateDecisionLog(analysisHistory, detectionData, base44) {
  const decisions = [];

  if (detectionData?.productGoal?.change_history) {
    detectionData.productGoal.change_history.forEach(change => {
      decisions.push({
        date: change.date,
        decision: `Changed Product Goal`,
        from: change.previous_title,
        to: detectionData.productGoal.title,
        reason: change.reason,
        stakeholders: 'Product Owner, Team Leads',
        status: 'Implemented'
      });
    });
  }

  // Ajouter les décisions des analyses
  analysisHistory.slice(0, 5).forEach(analysis => {
    if (analysis.analysis_data?.recommendations?.length > 0) {
      decisions.push({
        date: analysis.created_date,
        decision: 'Prioritize blockers',
        description: `Applied ${analysis.analysis_data.recommendations.length} recommendations from analysis`,
        status: 'Pending Implementation'
      });
    }
  });

  return {
    type: 'DECISION_LOG',
    generated_date: new Date().toISOString(),
    decisions: decisions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    template: {
      date: 'YYYY-MM-DD',
      decision: 'What was decided',
      context: 'Why was it needed',
      reason: 'Justification',
      stakeholders: 'Who was involved',
      status: 'Implementation status'
    }
  };
}