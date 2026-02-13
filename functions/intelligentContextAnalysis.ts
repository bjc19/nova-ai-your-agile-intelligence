import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { analysisHistory, teamContext, detectionData } = body;

    // DÉTECTION DE PATTERNS CONTEXTUELS
    const contextSignals = detectContextualSignals(analysisHistory, teamContext, detectionData);
    
    // RECOMMANDATION D'OUTILS SPÉCIFIQUES
    const recommendedTools = recommendAnalysisTools(contextSignals);
    
    // GÉNÉRATION DE SUGGESTIONS INTELLIGENTES
    const suggestions = generateContextualSuggestions(contextSignals, user.role);

    return Response.json({
      contextSignals,
      recommendedTools,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in intelligentContextAnalysis:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ========== DÉTECTION DE PATTERNS ==========
function detectContextualSignals(analysisHistory, teamContext, detectionData) {
  const signals = {
    engagement_low: false,
    responsibility_unclear: false,
    velocity_declining: false,
    cycle_time_increasing: false,
    wip_critical: false,
    communication_tension: false,
    dependency_unresolved: false,
    scope_creep: false,
    team_conflict: false,
    decision_paralysis: false,
    quality_degradation: false,
    burnout_risk: false,
    blocking_patterns: [],
    communication_gaps: [],
    skill_gaps: [],
    process_bottlenecks: []
  };

  if (!analysisHistory || analysisHistory.length === 0) {
    return signals;
  }

  // Analyser les dernières analyses
  const recentAnalyses = analysisHistory.slice(0, 5);
  
  // SIGNAL 1: Engagement faible
  const avgBlockersPerAnalysis = recentAnalyses.reduce((sum, a) => sum + (a.blockers_count || 0), 0) / recentAnalyses.length;
  const lowParticipation = recentAnalyses.some(a => 
    a.analysis_data?.communication_tone === 'silent' || 
    a.analysis_data?.engagement_level === 'low'
  );
  signals.engagement_low = lowParticipation || avgBlockersPerAnalysis > 5;

  // SIGNAL 2: Responsabilités floues
  const unownedIssues = recentAnalyses.filter(a => 
    a.analysis_data?.blockers?.some(b => !b.member || b.member === 'unknown')
  ).length;
  signals.responsibility_unclear = unownedIssues > 0;

  // SIGNAL 3: Vélocité déclinante
  if (recentAnalyses.length >= 2) {
    const velocities = recentAnalyses.map((a, i) => ({
      index: i,
      count: a.blockers_count + a.risks_count
    }));
    const trend = velocities[0].count > velocities[velocities.length - 1].count;
    signals.velocity_declining = trend;
  }

  // SIGNAL 4: Communication tendue
  signals.communication_tension = recentAnalyses.some(a => 
    a.analysis_data?.communication_tone === 'tense' ||
    (a.analysis_data?.blockers?.length > 3 && a.analysis_data?.risks?.length > 2)
  );

  // SIGNAL 5: Dépendances non résolues
  const unsolvedDependencies = recentAnalyses.reduce((sum, a) => 
    sum + (a.analysis_data?.dependencies?.length || 0), 0
  );
  signals.dependency_unresolved = unsolvedDependencies > 2;

  // SIGNAL 6: WIP critique
  signals.wip_critical = teamContext?.wip_count > teamContext?.wip_historical_avg * 1.5;

  // SIGNAL 7: Cycle time croissant
  signals.cycle_time_increasing = detectionData?.metrics?.cycle_time?.trend === 'down';

  // SIGNAL 8: Scope creep
  const goalChanges = detectionData?.productGoal?.change_history?.length || 0;
  signals.scope_creep = goalChanges > 2;

  // Extraire patterns spécifiques
  recentAnalyses.forEach(analysis => {
    if (analysis.analysis_data?.blockers) {
      analysis.analysis_data.blockers.forEach(blocker => {
        if (blocker.pattern_ids) {
          signals.blocking_patterns.push(...blocker.pattern_ids);
        }
      });
    }
    if (analysis.analysis_data?.recommendations) {
      const hasCommunicationRec = analysis.analysis_data.recommendations.some(r => 
        r.toLowerCase().includes('communiqu') || r.toLowerCase().includes('clarifi')
      );
      if (hasCommunicationRec) {
        signals.communication_gaps.push(analysis.id);
      }
    }
  });

  // Déduplication
  signals.blocking_patterns = [...new Set(signals.blocking_patterns)];

  return signals;
}

// ========== RECOMMANDATION D'OUTILS ==========
function recommendAnalysisTools(signals) {
  const recommendations = [];

  // RÈGLES DE RECOMMANDATION
  if (signals.responsibility_unclear && signals.team_conflict) {
    recommendations.push({
      tool: 'RACI_MATRIX',
      priority: 'high',
      reason: 'Responsabilités floues + conflits détectés',
      description: 'Génère une matrice RACI (Responsible, Accountable, Consulted, Informed)'
    });
  }

  if (signals.dependency_unresolved && signals.decision_paralysis) {
    recommendations.push({
      tool: 'ROAM_ANALYSIS',
      priority: 'high',
      reason: 'Dépendances non résolues + paralysie décisionnelle',
      description: 'ROAM: Resolved, Owned, Accepted, Mitigated'
    });
  }

  if (signals.velocity_declining && signals.process_bottlenecks.length > 0) {
    recommendations.push({
      tool: 'KAIZEN_PLAN',
      priority: 'medium',
      reason: 'Vélocité déclinante + goulots identifiés',
      description: 'Plan d\'amélioration continue Kaizen'
    });
  }

  if (signals.engagement_low && signals.communication_tension) {
    recommendations.push({
      tool: 'COMMUNICATION_MAP',
      priority: 'high',
      reason: 'Engagement faible + tensions de communication',
      description: 'Impact Mapping pour restaurer la cohésion'
    });
  }

  if (signals.quality_degradation && signals.skill_gaps.length > 0) {
    recommendations.push({
      tool: 'SKILL_DEVELOPMENT_PLAN',
      priority: 'medium',
      reason: 'Dégradation qualité + lacunes identifiées',
      description: 'Plan de développement des compétences'
    });
  }

  if (signals.cycle_time_increasing || signals.wip_critical) {
    recommendations.push({
      tool: 'KANBAN_OPTIMIZATION',
      priority: 'high',
      reason: 'Cycle time critique ou WIP élevé',
      description: 'Analyse Kanban pour fluidifier le flux'
    });
  }

  if (signals.scope_creep) {
    recommendations.push({
      tool: 'DECISION_LOG',
      priority: 'medium',
      reason: 'Scope creep détecté',
      description: 'Décision Log pour tracer les changements'
    });
  }

  if (signals.burnout_risk) {
    recommendations.push({
      tool: 'WORKLOAD_REBALANCING',
      priority: 'critical',
      reason: 'Risque de burnout détecté',
      description: 'Rééquilibrage de charge de travail urgent'
    });
  }

  // Trier par priorité
  return recommendations.sort((a, b) => {
    const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
}

// ========== GÉNÉRATION DE SUGGESTIONS INTELLIGENTES ==========
function generateContextualSuggestions(signals, userRole) {
  const suggestions = [];

  // SUGGESTIONS PAR RÔLE
  if (userRole === 'admin' || userRole === 'contributor') {
    if (signals.engagement_low) {
      suggestions.push({
        type: 'ACTION',
        severity: 'high',
        title: 'Réactiver l\'engagement d\'équipe',
        actions: [
          'Réunion 1:1 avec les contributeurs silencieux',
          'Clarifier les priorités et les attentes',
          'Reconnaître les contributions récentes'
        ]
      });
    }

    if (signals.responsibility_unclear) {
      suggestions.push({
        type: 'TOOL_GENERATION',
        severity: 'high',
        title: 'Générer une RACI Matrix',
        description: 'Pour clarifier qui est Responsible, Accountable, Consulted, Informed',
        action: 'generateRACIMatrix'
      });
    }

    if (signals.velocity_declining) {
      suggestions.push({
        type: 'INVESTIGATION',
        severity: 'medium',
        title: 'Analyser la baisse de vélocité',
        questions: [
          'Quels tickets causent les ralentissements?',
          'Y a-t-il des blocages systémiques?',
          'L\'équipe a-t-elle assez de ressources?'
        ]
      });
    }

    if (signals.communication_tension) {
      suggestions.push({
        type: 'FACILITATION',
        severity: 'high',
        title: 'Séance de clarification',
        description: 'Faciliter une conversation sans jugement sur les tensions',
        nextSteps: ['Pre-meeting 1:1', 'Group session', 'Follow-up']
      });
    }

    if (signals.scope_creep) {
      suggestions.push({
        type: 'DECISION_REQUIRED',
        severity: 'high',
        title: 'Revalider le Product Goal',
        action: 'createDecisionLog',
        details: 'Multiple goal changes detected - clarify with stakeholders'
      });
    }
  }

  // SUGGESTIONS POUR TOUS LES RÔLES
  if (signals.wip_critical) {
    suggestions.push({
      type: 'ALERT',
      severity: 'critical',
      title: 'WIP critique détecté',
      recommendation: 'Limiter les in-progress et compléter avant nouvelle prise'
    });
  }

  if (signals.cycle_time_increasing) {
    suggestions.push({
      type: 'METRIC_DEEP_DIVE',
      severity: 'medium',
      title: 'Analyser l\'augmentation du cycle time',
      metrics: ['average_wait_time', 'handoff_delays', 'review_time']
    });
  }

  return suggestions;
}