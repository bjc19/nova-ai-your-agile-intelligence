// Organizational Reality Engine - VSM Light
// Reveals systemic bottlenecks without blame

export const REALITY_THRESHOLDS = {
  MIN_DATA_DAYS: 30,
  DECISION_CONFIDENCE_HIGH: 85,
  DECISION_CONFIDENCE_MEDIUM: 68,
  SIGNIFICANT_IMPACT_DAYS: 5,
  WASTE_THRESHOLD_DAYS: 18,
  FEEDBACK_MATURITY_TARGET: 0.7, // 70%
};

export const WASTE_TYPES = {
  pmo_approvals: {
    name: "PMO multi-approbations",
    metric: "tickets bloqués > 5j",
    category: "bureaucracy",
  },
  handoff_delays: {
    name: "Handoffs inter-équipes",
    metric: "cycle time élevé",
    category: "silos",
  },
  waiting_time: {
    name: "Temps d'attente",
    metric: "% attente dans cycle",
    category: "flow",
  },
  rework: {
    name: "Retravail",
    metric: "tickets réouverts",
    category: "quality",
  },
};

export function analyzeDecisionReality(flowData) {
  const {
    assignee_changes = [],
    mention_patterns = [],
    blocked_resolutions = [],
    data_days = 0,
  } = flowData;

  // Check for insufficient data
  if (data_days < REALITY_THRESHOLDS.MIN_DATA_DAYS) {
    return {
      status: "insufficient_data",
      message: "Analyse en attente : historique insuffisant pour cartographie fiable.",
      canAnalyze: false,
    };
  }

  // Analyze who really makes decisions (not just official roles)
  const decisionMap = [];

  // Feature prioritization decisions
  const prioritizationDecider = analyzeDecisionPattern(mention_patterns, "prioritization");
  if (prioritizationDecider) {
    decisionMap.push({
      zone: "Priorisation features",
      officialRole: prioritizationDecider.official || "PO",
      realDecider: prioritizationDecider.actual,
      confidence: prioritizationDecider.confidence,
      ticketsImpacted: prioritizationDecider.count,
    });
  }

  // Urgent unblocking
  const unblockingDecider = analyzeDecisionPattern(blocked_resolutions, "unblocking");
  if (unblockingDecider) {
    decisionMap.push({
      zone: "Déblocage urgent",
      officialRole: "N/A",
      realDecider: unblockingDecider.actual,
      confidence: unblockingDecider.confidence,
      ticketsImpacted: unblockingDecider.count,
    });
  }

  return {
    status: "mapped",
    decisionMap,
    canAnalyze: true,
    neutralReading: decisionMap.length > 0
      ? `Les décisions impactant le lead time passent majoritairement par ${decisionMap[0].realDecider}.`
      : "Circuit de décision distribué",
    keyQuestion: "Ce circuit de décision est-il intentionnel et connu de tous ?",
  };
}

function analyzeDecisionPattern(patterns, type) {
  if (!patterns || patterns.length === 0) return null;

  // Count frequency of decision makers
  const frequency = {};
  patterns.forEach(p => {
    frequency[p.person] = (frequency[p.person] || 0) + 1;
  });

  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [topDecider, count] = sorted[0];
  const total = patterns.length;
  const confidence = Math.min(95, Math.round((count / total) * 100));

  return {
    actual: topDecider,
    official: null, // Would need org chart data
    confidence,
    count,
  };
}

export function identifySystemicWastes(flowMetrics) {
  const {
    blocked_tickets_over_5d = 0,
    avg_cycle_time = 0,
    avg_wait_time_percent = 0,
    reopened_tickets = 0,
    total_tickets = 100,
    data_days = 0,
  } = flowMetrics;

  if (data_days < REALITY_THRESHOLDS.MIN_DATA_DAYS) {
    return {
      status: "insufficient_data",
      wastes: [],
      canAnalyze: false,
    };
  }

  const detectedWastes = [];

  // 1. PMO/Bureaucracy bottleneck
  if (blocked_tickets_over_5d >= 10) {
    const leadTimeImpact = Math.round(blocked_tickets_over_5d * 1.5);
    detectedWastes.push({
      priority: 1,
      severity: "critical",
      type: "pmo_approvals",
      name: "PMO multi-approbations",
      metric: `${blocked_tickets_over_5d} tickets > 5j bloqués`,
      impact: `+${leadTimeImpact}j lead time`,
      emoji: "🔴",
      confidence: 82,
    });
  }

  // 2. Handoff delays / Silos
  if (avg_cycle_time > 7 && avg_wait_time_percent > 60) {
    detectedWastes.push({
      priority: 2,
      severity: "warning",
      type: "handoff_delays",
      name: "Silo B2B – handoff Dev ↔ Sales",
      metric: `Cycle time ${avg_cycle_time.toFixed(1)}j`,
      impact: `${avg_wait_time_percent}% attente`,
      emoji: "🟡",
      confidence: 75,
    });
  }

  // 3. Rework waste
  if (reopened_tickets > total_tickets * 0.15) {
    detectedWastes.push({
      priority: 3,
      severity: "warning",
      type: "rework",
      name: "Taux de retravail élevé",
      metric: `${reopened_tickets} tickets réouverts`,
      impact: `${Math.round((reopened_tickets / total_tickets) * 100)}% tickets`,
      emoji: "🟡",
      confidence: 68,
    });
  }

  // Sort by priority
  detectedWastes.sort((a, b) => a.priority - b.priority);

  return {
    status: detectedWastes.length > 0 ? "wastes_detected" : "healthy",
    wastes: detectedWastes.slice(0, 3), // TOP 3
    canAnalyze: true,
    message: detectedWastes.length > 0
      ? `${detectedWastes.length} gaspillage(s) systémique(s) détecté(s)`
      : "Aucun blocage systémique majeur détecté sur la période. Flux globalement protégé.",
  };
}

export function analyzeMicroFeedback(feedbackData) {
  const {
    total_responses = 0,
    total_days = 30,
    negative_count = 0,
    neutral_count = 0,
    positive_count = 0,
    waste_id = null,
  } = feedbackData;

  if (total_responses === 0) {
    return {
      status: "no_feedback",
      message: "Aucun feedback collecté",
    };
  }

  const maturity = total_responses / total_days;
  const negativePercent = Math.round((negative_count / total_responses) * 100);
  const confirmed = negativePercent >= 60;

  return {
    status: confirmed ? "confirmed" : "inconclusive",
    maturity: Math.round(maturity * 100),
    negativePercent,
    confirmed,
    message: confirmed
      ? `🔴 Confirmé (${negativePercent}% 😞)`
      : `⏳ Feedback insuffisant (${negativePercent}% 😞)`,
    maturityLabel: `${total_responses} / ${total_days} jours (${Math.round(maturity * 100)}%)`,
    consolidatedSignal: confirmed
      ? "Signal consolidé : perception terrain alignée avec données de flux."
      : "Signal à confirmer : plus de feedback nécessaire.",
  };
}

export function generateActionableSuggestions(wastes, decisionMap) {
  const suggestions = [];

  // Decision clarity
  if (decisionMap.length > 0 && decisionMap[0].confidence > REALITY_THRESHOLDS.DECISION_CONFIDENCE_HIGH) {
    suggestions.push({
      id: "clarify_decision_circuit",
      text: "Clarifier publiquement le circuit réel de décision",
      effort: "low",
      impact: "Alignement équipe + réduction conflits",
    });
  }

  // Fast-track for urgent items
  const hasCriticalWaste = wastes.some(w => w.severity === "critical");
  if (hasCriticalWaste) {
    suggestions.push({
      id: "fast_track",
      text: "Tester une voie rapide (fast-track) pour urgences",
      effort: "medium",
      impact: "Réduction lead time sur items critiques",
    });
  }

  // Reduce approval layers
  const hasBureaucracy = wastes.some(w => w.type === "pmo_approvals");
  if (hasBureaucracy) {
    suggestions.push({
      id: "reduce_approvals",
      text: "Réduire le nombre d'approbations sur un périmètre pilote",
      effort: "medium",
      impact: "Réduction significative du lead time",
    });
  }

  // Cross-functional collaboration
  const hasSilos = wastes.some(w => w.type === "handoff_delays");
  if (hasSilos) {
    suggestions.push({
      id: "reduce_handoffs",
      text: "Former des équipes cross-fonctionnelles (réduire handoffs)",
      effort: "high",
      impact: "Amélioration drastique du cycle time",
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

export function calculateFrictionIndex(wastes) {
  if (wastes.length === 0) return { level: "low", emoji: "🟢", label: "Faible" };
  
  const criticalCount = wastes.filter(w => w.severity === "critical").length;
  const warningCount = wastes.filter(w => w.severity === "warning").length;

  if (criticalCount >= 2) return { level: "high", emoji: "🔴", label: "Élevé" };
  if (criticalCount >= 1 || warningCount >= 2) return { level: "medium", emoji: "🟡", label: "Moyen-élevé" };
  return { level: "low", emoji: "🟢", label: "Faible" };
}