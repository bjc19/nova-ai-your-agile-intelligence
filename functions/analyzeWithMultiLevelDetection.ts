import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyse multi-niveaux avec détection hybride (Niveaux 1, 2 et 3)
 * Architecture serverless sur Base44
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, workshop_type, context } = await req.json();

    if (!transcript) {
      return Response.json({ error: 'Transcript required' }, { status: 400 });
    }

    // 1. NIVEAU 1 - DÉTECTION CANONIQUE (Référentiel local)
    const antiPatterns = await base44.entities.AntiPattern.filter({ is_active: true });
    
    // Sélection dynamique de ~45 patterns selon le contexte
    const selectedPatterns = selectContextualPatterns(antiPatterns, workshop_type, context);
    
    // Détection par règles et mots-clés
    const level1Detections = await detectCanonicalPatterns(
      transcript, 
      selectedPatterns, 
      base44
    );

    // 2. NIVEAU 2 - SIGNAUX FAIBLES
    const level2Signals = await detectWeakSignals(
      transcript,
      user.email,
      context,
      base44
    );

    // 3. NIVEAU 3 - TENDANCES ÉMERGENTES
    const level3Trends = await detectEmergingTrends(
      user.email,
      context,
      base44
    );

    // Construire le rapport stratifié
    const stratifiedReport = {
      level_1_canonical: {
        count: level1Detections.length,
        confidence_range: "80-100%",
        usage: "Diagnostic explicite + Quick Wins",
        detections: level1Detections
      },
      level_2_weak_signals: {
        count: level2Signals.length,
        confidence_range: "60-79%",
        usage: "Investigation et prévention",
        signals: level2Signals
      },
      level_3_emerging_trends: {
        count: level3Trends.length,
        confidence_range: "40-59%",
        usage: "Observation, questionnement et vigilance",
        trends: level3Trends
      },
      agile_health_score: calculateHealthScore(level1Detections, level2Signals, level3Trends),
      context_used: {
        workshop_type,
        patterns_selected: selectedPatterns.length,
        total_available: antiPatterns.length
      }
    };

    return Response.json(stratifiedReport);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Sélection contextuelle de ~45 patterns pertinents
 */
function selectContextualPatterns(allPatterns, workshopType, context) {
  const workshopRelevance = {
    daily_scrum: ["A", "C", "E", "K"],
    retrospective: ["A", "B", "K", "D"],
    sprint_planning: ["B", "D", "F", "G"],
    sprint_review: ["B", "H", "I"],
    other: ["A", "B", "C", "K"]
  };

  const relevantCategories = workshopRelevance[workshopType] || workshopRelevance.other;
  
  const filtered = allPatterns.filter(p => 
    relevantCategories.includes(p.category) &&
    (p.ceremony_type?.includes(workshopType) || p.ceremony_type?.includes("other"))
  );

  // Prioriser par priority_weight et limiter à ~45
  return filtered
    .sort((a, b) => (b.priority_weight || 50) - (a.priority_weight || 50))
    .slice(0, 45);
}

/**
 * NIVEAU 1 - Détection canonique avec règles et LLM
 */
async function detectCanonicalPatterns(transcript, selectedPatterns, base44) {
  const detections = [];
  
  // Analyse LLM avec patterns sélectionnés
  const patternDescriptions = selectedPatterns.map(p => 
    `${p.pattern_id} - ${p.name}: ${p.description}\nMarqueurs: ${p.markers?.join(', ')}`
  ).join('\n\n');

  const analysisResult = await base44.integrations.Core.InvokeLLM({
    prompt: `Analyse ce transcript et identifie les anti-patterns Agile présents.

PATTERNS À CONSIDÉRER (sélection contextuelle de ${selectedPatterns.length} sur 105):
${patternDescriptions}

TRANSCRIPT:
${transcript}

Pour chaque pattern détecté, fournis:
- Le pattern_id exact
- Des preuves concrètes du transcript
- Un score de confiance (80-100% uniquement)`,
    response_json_schema: {
      type: "object",
      properties: {
        detected_patterns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pattern_id: { type: "string" },
              confidence: { type: "number" },
              evidence: { type: "string" },
              severity: { type: "string" }
            }
          }
        }
      }
    }
  });

  // Enrichir avec données du référentiel
  for (const detection of (analysisResult.detected_patterns || [])) {
    if (detection.confidence >= 80) {
      const pattern = selectedPatterns.find(p => p.pattern_id === detection.pattern_id);
      if (pattern) {
        detections.push({
          ...detection,
          pattern_name: pattern.name,
          category: pattern.category,
          category_name: pattern.category_name,
          quick_win: pattern.quick_win,
          recommended_actions: pattern.recommended_actions,
          level: 1
        });
      }
    }
  }

  return detections;
}

/**
 * NIVEAU 2 - Détection de signaux faibles
 */
async function detectWeakSignals(transcript, userEmail, context, base44) {
  const signals = [];

  // Récupérer les analyses récentes (30 derniers jours)
  const recentAnalyses = await base44.entities.AnalysisHistory.filter({
    created_by: userEmail
  });

  const last30Days = recentAnalyses.filter(a => {
    const date = new Date(a.created_date);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  });

  if (last30Days.length < 3) {
    // Pas assez de données pour signaux faibles
    return signals;
  }

  // 1. CHANGEMENT LINGUISTIQUE (Δ > 15%)
  const linguisticChange = await analyzeLinguisticChange(transcript, last30Days, base44);
  if (linguisticChange && linguisticChange.delta > 15) {
    signals.push({
      type: "linguistic_change",
      description: linguisticChange.description,
      confidence: linguisticChange.confidence,
      metric_value: linguisticChange.delta,
      threshold: 15
    });
  }

  // 2. PATTERNS TEMPORELS (> 2/mois)
  const temporalPattern = detectTemporalPatterns(last30Days);
  if (temporalPattern && temporalPattern.frequency > 2) {
    signals.push({
      type: "temporal_pattern",
      description: temporalPattern.description,
      confidence: temporalPattern.confidence,
      metric_value: temporalPattern.frequency,
      threshold: 2
    });
  }

  // 3. ANOMALIES STATISTIQUES (Z > 2.5)
  const anomaly = detectStatisticalAnomalies(last30Days, context);
  if (anomaly && anomaly.z_score > 2.5) {
    signals.push({
      type: "statistical_anomaly",
      description: anomaly.description,
      confidence: anomaly.confidence,
      metric_value: anomaly.z_score,
      threshold: 2.5
    });
  }

  return signals;
}

/**
 * Analyse du changement linguistique
 */
async function analyzeLinguisticChange(currentTranscript, historicalAnalyses, base44) {
  if (historicalAnalyses.length < 3) return null;

  // Extraire vocabulaire et ton
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Compare ce transcript avec l'historique et détecte les changements linguistiques significatifs:

TRANSCRIPT ACTUEL:
${currentTranscript.substring(0, 2000)}

Analyse:
1. Changement de vocabulaire (nouveaux mots, mots disparus)
2. Évolution du ton (positif → neutre → négatif)
3. Changement de structure de communication

Fournis le delta en pourcentage et la confiance.`,
    response_json_schema: {
      type: "object",
      properties: {
        delta: { type: "number" },
        description: { type: "string" },
        confidence: { type: "number" },
        tone_evolution: { type: "string" }
      }
    }
  });

  return result.delta > 15 ? result : null;
}

/**
 * Détection de patterns temporels
 */
function detectTemporalPatterns(analyses) {
  // Vérifier répétition de mêmes problèmes
  const blockerPatterns = {};
  
  analyses.forEach(analysis => {
    const blockers = analysis.analysis_data?.blockers || [];
    blockers.forEach(blocker => {
      const key = blocker.issue?.substring(0, 50);
      blockerPatterns[key] = (blockerPatterns[key] || 0) + 1;
    });
  });

  const repeatedPatterns = Object.entries(blockerPatterns)
    .filter(([_, count]) => count >= 2);

  if (repeatedPatterns.length > 0) {
    const maxFrequency = Math.max(...repeatedPatterns.map(([_, count]) => count));
    return {
      description: `Pattern récurrent détecté: ${repeatedPatterns[0][0]} (${maxFrequency} occurrences)`,
      frequency: maxFrequency,
      confidence: Math.min(60 + maxFrequency * 5, 79)
    };
  }

  return null;
}

/**
 * Détection d'anomalies statistiques
 */
function detectStatisticalAnomalies(analyses, context) {
  const blockerCounts = analyses.map(a => a.blockers_count || 0);
  const mean = blockerCounts.reduce((a, b) => a + b, 0) / blockerCounts.length;
  const variance = blockerCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / blockerCounts.length;
  const stdDev = Math.sqrt(variance);

  const current = blockerCounts[blockerCounts.length - 1];
  const zScore = stdDev > 0 ? Math.abs((current - mean) / stdDev) : 0;

  if (zScore > 2.5) {
    return {
      description: `Anomalie statistique: ${current} blockers (moyenne: ${mean.toFixed(1)}, Z-score: ${zScore.toFixed(2)})`,
      z_score: zScore,
      confidence: Math.min(60 + (zScore - 2.5) * 10, 79)
    };
  }

  return null;
}

/**
 * NIVEAU 3 - Détection de tendances émergentes
 */
async function detectEmergingTrends(userEmail, context, base44) {
  const trends = [];

  // Récupérer les signaux faibles actifs
  const activeSignals = await base44.entities.WeakSignal.filter({
    created_by: userEmail,
    status: "active"
  });

  // Grouper par type
  const signalGroups = {};
  activeSignals.forEach(signal => {
    const type = signal.signal_type;
    if (!signalGroups[type]) signalGroups[type] = [];
    signalGroups[type].push(signal);
  });

  // Détecter tendances émergentes (≥ 3 sprints)
  for (const [type, signals] of Object.entries(signalGroups)) {
    if (signals.length >= 3) {
      const avgConfidence = signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length;
      
      // Calculer confiance N3 (40-59%)
      const trendConfidence = Math.min(40 + signals.length * 5, 59);

      trends.push({
        type,
        name: `Tendance émergente - ${type.replace('_', ' ')}`,
        description: `Observée sur ${signals.length} sprints consécutifs`,
        confidence: trendConfidence,
        sprint_count: signals.length,
        source_signal_ids: signals.map(s => s.id),
        hypothesis: generateHypothesis(type, signals),
        level: 3
      });
    }
  }

  return trends;
}

/**
 * Génération d'hypothèse pour tendances
 */
function generateHypothesis(type, signals) {
  const hypotheses = {
    linguistic_change: "L'équipe pourrait traverser une phase de changement culturel ou de stress",
    temporal_pattern: "Un problème systémique récurrent pourrait nécessiter une intervention structurelle",
    statistical_anomaly: "Les conditions de travail ou la charge pourraient avoir évolué significativement",
    hidden_correlation: "Des dépendances cachées pourraient impacter la vélocité",
    implicit_feedback: "Des tensions non exprimées pourraient affecter la collaboration"
  };

  return hypotheses[type] || "Évolution à surveiller et questionner avec l'équipe";
}

/**
 * Calcul du score de santé Agile (explicable)
 */
function calculateHealthScore(level1, level2, level3) {
  let baseScore = 100;

  // Pénalités par niveau
  baseScore -= level1.length * 8; // Patterns canoniques (fort impact)
  baseScore -= level2.length * 4; // Signaux faibles (impact moyen)
  baseScore -= level3.length * 2; // Tendances (impact léger)

  // Pénalités par sévérité (niveau 1)
  const criticalCount = level1.filter(d => d.severity === "critical").length;
  const highCount = level1.filter(d => d.severity === "high").length;
  baseScore -= criticalCount * 5;
  baseScore -= highCount * 3;

  return {
    score: Math.max(0, Math.min(100, baseScore)),
    interpretation: getScoreInterpretation(baseScore),
    factors: {
      canonical_impact: level1.length * 8,
      weak_signals_impact: level2.length * 4,
      trends_impact: level3.length * 2,
      severity_impact: criticalCount * 5 + highCount * 3
    },
    disclaimer: "Ce score est un indicateur explicable, non un verdict absolu. Il sert à éclairer la décision humaine."
  };
}

function getScoreInterpretation(score) {
  if (score >= 80) return "Excellent - Pratiques Agile saines";
  if (score >= 65) return "Bon - Quelques points d'attention";
  if (score >= 50) return "Moyen - Améliorations recommandées";
  if (score >= 35) return "Faible - Actions correctives nécessaires";
  return "Critique - Intervention urgente recommandée";
}