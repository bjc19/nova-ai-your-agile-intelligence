// Dependency-Aware Recommendations Engine
// Calculates confidence based on available enablers and data

export const ENABLERS = {
  dora_metrics: {
    name: "DORA Metrics Pipeline",
    description: "Deployment frequency, lead time, MTTR, change failure rate",
    critical_for: ["flow_efficiency", "deployment_frequency", "cycle_time"],
  },
  flow_metrics: {
    name: "Flow Metrics",
    description: "WIP, cycle time, throughput, flow efficiency",
    critical_for: ["flow_efficiency", "throughput", "wip_optimization"],
  },
  jira_integration: {
    name: "Jira Integration",
    description: "Tickets, sprints, blockers, assignees",
    critical_for: ["sprint_health", "blockers", "cycle_time"],
  },
  communication_data: {
    name: "Communication Data",
    description: "Slack/Teams messages, mentions, decisions",
    critical_for: ["decision_mapping", "organizational_reality"],
  },
  micro_feedback: {
    name: "Micro-Feedback System",
    description: "Anonymous team feedback on wastes",
    critical_for: ["waste_validation", "hawthorne_detection"],
  },
};

export const CONFIDENCE_WEIGHTS = {
  data_available: 0.5,
  enablers_present: 0.3,
  usage_signals: 0.2,
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 60,
  LOW: 35,
};

export function detectAvailableEnablers(integrationStatus) {
  const {
    jira_connected = false,
    slack_connected = false,
    teams_connected = false,
    dora_pipeline = false,
    flow_metrics_available = false,
    micro_feedback_active = false,
  } = integrationStatus;

  return {
    dora_metrics: { available: dora_pipeline, confidence: dora_pipeline ? 100 : 0 },
    flow_metrics: { available: flow_metrics_available, confidence: flow_metrics_available ? 100 : 0 },
    jira_integration: { available: jira_connected, confidence: jira_connected ? 100 : 0 },
    communication_data: { 
      available: slack_connected || teams_connected, 
      confidence: (slack_connected ? 50 : 0) + (teams_connected ? 50 : 0) 
    },
    micro_feedback: { available: micro_feedback_active, confidence: micro_feedback_active ? 100 : 0 },
  };
}

export function calculateRecommendationConfidence(recommendation, availableEnablers, usageSignals = 70) {
  const { required_enablers = [], data_quality = 80 } = recommendation;

  // 1. Data available score (50%)
  const dataScore = (data_quality / 100) * CONFIDENCE_WEIGHTS.data_available;

  // 2. Enablers present score (30%)
  let enablersScore = 0;
  if (required_enablers.length > 0) {
    const enablerConfidences = required_enablers.map(
      enabler => availableEnablers[enabler]?.confidence || 0
    );
    const avgEnablerConfidence = enablerConfidences.reduce((a, b) => a + b, 0) / enablerConfidences.length;
    enablersScore = (avgEnablerConfidence / 100) * CONFIDENCE_WEIGHTS.enablers_present;
  } else {
    enablersScore = CONFIDENCE_WEIGHTS.enablers_present; // No specific requirements
  }

  // 3. Usage signals score (20%)
  const usageScore = (usageSignals / 100) * CONFIDENCE_WEIGHTS.usage_signals;

  // Total confidence (0-100)
  const totalConfidence = Math.round((dataScore + enablersScore + usageScore) * 100);

  return {
    confidence: totalConfidence,
    breakdown: {
      data: Math.round(dataScore * 100),
      enablers: Math.round(enablersScore * 100),
      usage: Math.round(usageScore * 100),
    },
    level: totalConfidence >= CONFIDENCE_THRESHOLDS.HIGH 
      ? "high" 
      : totalConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM 
        ? "medium" 
        : "low",
  };
}

export function detectMissingEnablers(recommendation, availableEnablers) {
  const { required_enablers = [] } = recommendation;
  
  const missing = [];
  const partial = [];

  required_enablers.forEach(enablerKey => {
    const enabler = availableEnablers[enablerKey];
    if (!enabler || !enabler.available) {
      missing.push({
        key: enablerKey,
        name: ENABLERS[enablerKey]?.name || enablerKey,
        description: ENABLERS[enablerKey]?.description || "",
      });
    } else if (enabler.confidence < 80) {
      partial.push({
        key: enablerKey,
        name: ENABLERS[enablerKey]?.name || enablerKey,
        confidence: enabler.confidence,
      });
    }
  });

  return { missing, partial };
}

export function shouldRequireValidation(recommendation, confidenceAnalysis, impactScope) {
  const { confidence } = confidenceAnalysis;
  const { team_size = 5, impact_percentage = 0 } = impactScope;

  // High impact + missing enablers = validation required
  if (impact_percentage > 10 && confidence < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return {
      required: true,
      reason: "Impact élevé + dépendances techniques incomplètes",
    };
  }

  // Low confidence = validation required
  if (confidence < CONFIDENCE_THRESHOLDS.LOW) {
    return {
      required: true,
      reason: "Niveau de confiance insuffisant",
    };
  }

  return {
    required: false,
  };
}

export function generateDependencyWarning(missingEnablers, confidenceAnalysis) {
  const { missing, partial } = missingEnablers;
  const { confidence } = confidenceAnalysis;

  if (missing.length === 0 && partial.length === 0) {
    return null;
  }

  const hasMultipleMissing = missing.length > 1;

  return {
    severity: confidence < CONFIDENCE_THRESHOLDS.LOW ? "critical" : "warning",
    title: hasMultipleMissing 
      ? "⚠️ Dependency awareness – Données insuffisantes" 
      : "⚠️ Dependency awareness",
    message: missing.length > 0
      ? "Certaines données nécessaires à cette recommandation sont incomplètes."
      : "Certaines données sont partiellement disponibles.",
    confidence: `Niveau de confiance actuel : ${confidence}%`,
    missingEnablers: missing,
    partialEnablers: partial,
    alternativeAction: missing.length > 0
      ? `Compléter les métriques ${missing.map(e => e.name).join(", ")} pour améliorer la fiabilité`
      : null,
  };
}

export function enrichRecommendationWithDependency(recommendation, integrationStatus, usageSignals = 70, impactScope = {}) {
  const availableEnablers = detectAvailableEnablers(integrationStatus);
  const confidenceAnalysis = calculateRecommendationConfidence(recommendation, availableEnablers, usageSignals);
  const missingEnablers = detectMissingEnablers(recommendation, availableEnablers);
  const validation = shouldRequireValidation(recommendation, confidenceAnalysis, impactScope);
  const warning = generateDependencyWarning(missingEnablers, confidenceAnalysis);

  return {
    ...recommendation,
    dependency_aware: {
      confidence: confidenceAnalysis.confidence,
      confidence_level: confidenceAnalysis.level,
      breakdown: confidenceAnalysis.breakdown,
      missing_enablers: missingEnablers.missing,
      partial_enablers: missingEnablers.partial,
      requires_validation: validation.required,
      validation_reason: validation.reason,
      warning,
      can_apply: confidenceAnalysis.confidence >= CONFIDENCE_THRESHOLDS.LOW && !validation.required,
    },
  };
}

export function shouldSuppressRecommendation(confidenceAnalysis, missingEnablers) {
  // Safe mode: suppress if multiple critical enablers missing
  if (missingEnablers.missing.length >= 2 && confidenceAnalysis.confidence < CONFIDENCE_THRESHOLDS.LOW) {
    return {
      suppress: true,
      reason: "Données insuffisantes pour formuler une recommandation fiable. Nova continue l'observation.",
    };
  }

  return {
    suppress: false,
  };
}