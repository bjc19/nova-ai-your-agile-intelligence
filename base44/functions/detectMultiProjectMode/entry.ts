import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Détection automatique du mode multi-projets via analyse linguistique et cross-source
 * Poids indicatifs : Mentions projets (+0.35), Backlogs multiples (+0.40), 
 * Impediments cross-projets (+0.30), Goals instables (+0.28)
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, analysis_id, context } = await req.json();

    // Vérifier config existante
    const teamConfigs = await base44.entities.TeamConfiguration.list();
    const currentConfig = teamConfigs.length > 0 ? teamConfigs[0] : null;

    // Si déjà confirmé par admin, skip détection
    if (currentConfig?.confirmed_by_admin && currentConfig.project_mode !== "auto_detect") {
      return Response.json({
        mode: currentConfig.project_mode,
        skip_detection: true,
        message: "Configuration confirmée par administrateur"
      });
    }

    // === DÉTECTION MULTI-NIVEAUX ===
    const detectionSignals = {
      projects_weight: 0,
      backlogs_weight: 0,
      impediments_weight: 0,
      goals_weight: 0,
      total_score: 0
    };

    const detectedData = {
      project_mentions: [],
      backlog_references: [],
      cross_dependencies: [],
      goal_instabilities: []
    };

    // 1. SIGNAL : Mentions multiples de projets (Poids +0.35)
    const projectAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse ce transcript et identifie toutes les mentions de projets distincts, noms de produits, boards ou initiatives.

Transcript:
${transcript}

Liste chaque projet/produit mentionné avec le nombre d'occurrences.`,
      response_json_schema: {
        type: "object",
        properties: {
          projects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                mentions: { type: "number" }
              }
            }
          },
          total_distinct_projects: { type: "number" }
        }
      }
    });

    if (projectAnalysis.total_distinct_projects > 2) {
      detectionSignals.projects_weight = 0.35;
      detectedData.project_mentions = projectAnalysis.projects.map(p => p.name);
    } else if (projectAnalysis.total_distinct_projects === 2) {
      detectionSignals.projects_weight = 0.20;
      detectedData.project_mentions = projectAnalysis.projects.map(p => p.name);
    }

    // 2. SIGNAL : Backlogs multiples (Poids +0.40)
    // Analyser si mentions de boards/backlogs distincts
    const backlogPattern = /board|backlog|projet\s+[A-Z]|epic\s+[A-Z]/gi;
    const backlogMatches = transcript.match(backlogPattern) || [];
    const uniqueBacklogs = [...new Set(backlogMatches.map(m => m.toLowerCase()))];
    
    if (uniqueBacklogs.length > 2) {
      detectionSignals.backlogs_weight = 0.40;
      detectedData.backlog_references = uniqueBacklogs;
    } else if (uniqueBacklogs.length === 2) {
      detectionSignals.backlogs_weight = 0.25;
      detectedData.backlog_references = uniqueBacklogs;
    }

    // 3. SIGNAL : Impediments cross-projets (Poids +0.30)
    const impedimentAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Identifie les blocages ou dépendances qui impliquent plusieurs projets/équipes dans ce transcript:

${transcript}

Exemple : "Bloqué sur dépendance Projet C", "Capacité divisée entre X et Y"`,
      response_json_schema: {
        type: "object",
        properties: {
          cross_project_impediments: {
            type: "array",
            items: { type: "string" }
          },
          count: { type: "number" }
        }
      }
    });

    if (impedimentAnalysis.count > 1) {
      detectionSignals.impediments_weight = 0.30;
      detectedData.cross_dependencies = impedimentAnalysis.cross_project_impediments;
    } else if (impedimentAnalysis.count === 1) {
      detectionSignals.impediments_weight = 0.18;
      detectedData.cross_dependencies = impedimentAnalysis.cross_project_impediments;
    }

    // 4. SIGNAL : Goals instables cross-projets (Poids +0.28)
    // Vérifier historique Product Goals et Sprint Goals
    const recentGoals = await base44.entities.SprintGoal.list('-created_date', 5);
    const productGoals = await base44.entities.ProductGoal.filter({ status: "active" });
    
    if (productGoals.length > 1) {
      detectionSignals.goals_weight = 0.28;
      detectedData.goal_instabilities = productGoals.map(g => g.title);
    }

    // Vérifier modifications fréquentes de goals
    const goalChanges = recentGoals.filter(g => 
      g.alignment_status === "misaligned" || g.alignment_status === "partial"
    );
    if (goalChanges.length >= 2) {
      detectionSignals.goals_weight = Math.max(detectionSignals.goals_weight, 0.20);
    }

    // === CALCUL SCORE TOTAL ===
    detectionSignals.total_score = 
      detectionSignals.projects_weight +
      detectionSignals.backlogs_weight +
      detectionSignals.impediments_weight +
      detectionSignals.goals_weight;

    // === DÉCISION ===
    let recommendation = "uncertain";
    let mode_suggestion = "auto_detect";
    let requires_notification = false;

    if (detectionSignals.total_score >= 0.70) {
      recommendation = "multi_projects";
      mode_suggestion = "multi_projects";
      requires_notification = false; // Auto-activation
    } else if (detectionSignals.total_score >= 0.50) {
      recommendation = "multi_projects";
      mode_suggestion = "multi_projects";
      requires_notification = true; // Zone grise - demander confirmation
    } else {
      recommendation = "mono_project";
      mode_suggestion = "mono_project";
    }

    // === LOG DÉTECTION ===
    const detectionLog = await base44.entities.MultiProjectDetectionLog.create({
      analysis_id: analysis_id || "manual",
      detection_score: detectionSignals.total_score,
      signals_detected: detectedData,
      weighted_signals: detectionSignals,
      recommendation,
      admin_notified: requires_notification,
      admin_response: requires_notification ? "pending" : "auto_confirmed"
    });

    // === MISE À JOUR CONFIG ===
    if (currentConfig) {
      await base44.entities.TeamConfiguration.update(currentConfig.id, {
        detection_confidence: detectionSignals.total_score,
        detected_projects: projectAnalysis.projects,
        detection_signals: {
          multiple_projects_mentions: detectionSignals.projects_weight,
          multiple_backlogs: detectionSignals.backlogs_weight,
          cross_project_impediments: detectionSignals.impediments_weight,
          unstable_goals: detectionSignals.goals_weight
        },
        last_detection_date: new Date().toISOString(),
        project_count: Math.max(projectAnalysis.total_distinct_projects, 1)
      });
    } else {
      // Créer config initiale
      await base44.entities.TeamConfiguration.create({
        project_mode: requires_notification ? "auto_detect" : mode_suggestion,
        detection_confidence: detectionSignals.total_score,
        confirmed_by_admin: !requires_notification,
        detected_projects: projectAnalysis.projects,
        detection_signals: {
          multiple_projects_mentions: detectionSignals.projects_weight,
          multiple_backlogs: detectionSignals.backlogs_weight,
          cross_project_impediments: detectionSignals.impediments_weight,
          unstable_goals: detectionSignals.goals_weight
        },
        last_detection_date: new Date().toISOString(),
        project_count: Math.max(projectAnalysis.total_distinct_projects, 1)
      });
    }

    return Response.json({
      mode: mode_suggestion,
      confidence: detectionSignals.total_score,
      recommendation,
      requires_admin_confirmation: requires_notification,
      detection_log_id: detectionLog.id,
      signals: detectionSignals,
      detected_data: detectedData,
      adjustments: getAdjustmentsForMode(mode_suggestion)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Retourne les ajustements à appliquer selon le mode
 */
function getAdjustmentsForMode(mode) {
  if (mode === "multi_projects") {
    return {
      capacity_threshold_multiplier: 0.75, // Réduire seuil WIP de 25%
      risk_score_multiplier: 1.15, // Augmenter scores de risque de 15%
      recommendations: [
        "Risque de dispersion : suggérez un focus sprint par projet",
        "Alerte capacité : surveiller surcharge due au multi-projets",
        "Handoffs organisationnels : détecter frictions cross-projets"
      ],
      metrics_adjustments: {
        wip_alert_threshold: "Réduit de 25% pour multi-projets",
        velocity_stability: "Variance attendue +20%",
        focus_score: "Pénalité de -10 points si >2 projets actifs"
      }
    };
  }

  return {
    capacity_threshold_multiplier: 1.0,
    risk_score_multiplier: 1.0,
    recommendations: [],
    metrics_adjustments: {}
  };
}