// Hawthorne Awareness Engine - MVP simplifié
// Détecte phase pilote et exige validation humaine

export const PILOT_MODE = {
  MIN_SPRINTS_FOR_TRENDS: 2,
  MIN_DATA_DAYS: 14,
  CONFIDENCE_PILOT: 55,
  COMPARATIVE_THRESHOLD: 0.3, // 30% variance
  MIN_TEAMS_FOR_COMPARISON: 3,
};

export function detectPilotMode(historicalData) {
  const {
    sprints_count = 0,
    data_days = 0,
    is_audit_phase = false,
    is_new_team = false,
  } = historicalData;

  // Detect pilot/audit mode
  const isPilot = 
    sprints_count < PILOT_MODE.MIN_SPRINTS_FOR_TRENDS ||
    data_days < PILOT_MODE.MIN_DATA_DAYS ||
    is_audit_phase ||
    is_new_team;

  return {
    isPilot,
    confidence: isPilot ? PILOT_MODE.CONFIDENCE_PILOT : 85,
    reason: isPilot
      ? sprints_count < PILOT_MODE.MIN_SPRINTS_FOR_TRENDS
        ? "Moins de 2 sprints historiques"
        : data_days < PILOT_MODE.MIN_DATA_DAYS
        ? "Moins de 14 jours de données"
        : is_audit_phase
        ? "Phase d'audit en cours"
        : "Équipe nouvellement observée"
      : "Données suffisantes pour analyse fiable",
    requiresCoachValidation: isPilot,
  };
}

export function calculateTrendReliability(metricHistory) {
  // Ignore single-day spikes, focus on trends over ≥2 sprints
  if (!metricHistory || metricHistory.length < PILOT_MODE.MIN_SPRINTS_FOR_TRENDS) {
    return {
      reliable: false,
      reason: "Historique insuffisant (< 2 sprints)",
    };
  }

  // Check for single-day spikes (novelty effect)
  const values = metricHistory.map(h => h.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const spikes = values.filter(v => Math.abs(v - avg) / avg > 0.5).length;

  if (spikes > values.length * 0.3) {
    return {
      reliable: false,
      reason: "Trop de pics isolés (effet nouveauté)",
      spikesDetected: spikes,
    };
  }

  return {
    reliable: true,
    confidence: 85 - (spikes * 5),
  };
}

export function detectHawthorneEffect(teamMetrics, comparativeTeams) {
  // Simple comparative detection: if team differs by >30% from average
  if (!comparativeTeams || comparativeTeams.length < PILOT_MODE.MIN_TEAMS_FOR_COMPARISON) {
    return {
      detected: false,
      reason: `Comparaison impossible (< ${PILOT_MODE.MIN_TEAMS_FOR_COMPARISON} équipes pilotes)`,
    };
  }

  const metrics = ["flow_efficiency", "cycle_time", "deployment_frequency"];
  const anomalies = [];

  metrics.forEach(metric => {
    const teamValue = teamMetrics[metric];
    if (!teamValue) return;

    const otherValues = comparativeTeams
      .map(t => t[metric])
      .filter(v => v !== null && v !== undefined);
    
    if (otherValues.length === 0) return;

    const avgValue = otherValues.reduce((a, b) => a + b, 0) / otherValues.length;
    const variance = Math.abs(teamValue - avgValue) / avgValue;

    if (variance > PILOT_MODE.COMPARATIVE_THRESHOLD) {
      anomalies.push({
        metric,
        teamValue,
        avgValue: Math.round(avgValue * 10) / 10,
        variance: Math.round(variance * 100),
      });
    }
  });

  if (anomalies.length > 0) {
    return {
      detected: true,
      confidence: PILOT_MODE.CONFIDENCE_PILOT,
      anomalies,
      message: "🟡 Hawthorne possible – confiance 55%",
      recommendation: "Données atypiques détectées – validation Coach requise",
    };
  }

  return {
    detected: false,
    message: "Métriques alignées avec équipes comparables",
  };
}

export function enrichRecommendationWithPilotWarning(recommendation, pilotMode) {
  if (!pilotMode.isPilot) return recommendation;

  return {
    ...recommendation,
    pilotWarning: "⚠️ Données pilotes – vérification humaine obligatoire",
    requiresValidation: true,
    confidence: Math.min(recommendation.confidence || 70, PILOT_MODE.CONFIDENCE_PILOT),
  };
}

export function generatePilotBadge(pilotMode) {
  if (!pilotMode.isPilot) return null;

  return {
    label: "🟡 PILOTE MODE",
    confidence: `Confiance ${pilotMode.confidence}%`,
    validation: "Validation Coach requise",
    tooltip: pilotMode.reason,
  };
}