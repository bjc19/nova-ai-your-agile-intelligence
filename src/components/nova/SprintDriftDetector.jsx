// Sprint Drift Detection Engine
// Detects early drift signals without judgment - empowers human decision

export const DRIFT_THRESHOLDS = {
  MIN_SPRINT_DAYS: 3,
  WIP_MULTIPLIER: 1.3, // 30% above historical
  TICKET_AGE_DAYS: 3,
  BLOCKED_HOURS: 48,
  MIN_STALE_TICKETS: 2,
  MIN_BLOCKED_TICKETS: 1,
  CONFIDENCE_HIGH: 75,
  MIN_HISTORICAL_SPRINTS: 2,
};

export const DRIFT_STATUS = {
  HEALTHY: {
    id: "healthy",
    label: "Sprint en bonne santé",
    emoji: "🟢",
    color: "emerald",
  },
  POTENTIAL_DRIFT: {
    id: "potential_drift",
    label: "Dérive potentielle détectée",
    emoji: "⚠️",
    color: "amber",
  },
  INSUFFICIENT_DATA: {
    id: "insufficient_data",
    label: "Données insuffisantes",
    emoji: "⏳",
    color: "slate",
  },
};

export function analyzeSprintDrift(sprintData) {
  const {
    wip_count = 0,
    wip_historical_avg = 5,
    tickets_in_progress_over_3d = 0,
    blocked_tickets_over_48h = 0,
    sprint_day = 0,
    historical_sprints_count = 0,
  } = sprintData;

  // Check for insufficient data
  if (historical_sprints_count < DRIFT_THRESHOLDS.MIN_HISTORICAL_SPRINTS) {
    return {
      status: DRIFT_STATUS.INSUFFICIENT_DATA,
      confidence: 0,
      signals: [],
      message: "Données insuffisantes pour détecter une dérive fiable. En attente de plus d'historique sprint.",
      canAnalyze: false,
    };
  }

  // Only analyze after day 3
  if (sprint_day < DRIFT_THRESHOLDS.MIN_SPRINT_DAYS) {
    return {
      status: DRIFT_STATUS.HEALTHY,
      confidence: 0,
      signals: [],
      message: `Analyse disponible à partir de J+${DRIFT_THRESHOLDS.MIN_SPRINT_DAYS}`,
      canAnalyze: false,
    };
  }

  // Detect convergent signals
  const signals = [];
  
  // Signal 1: WIP exceeds historical average by 30%+
  const wipExceeded = wip_count > wip_historical_avg * DRIFT_THRESHOLDS.WIP_MULTIPLIER;
  if (wipExceeded) {
    signals.push({
      id: "wip_high",
      label: `WIP supérieur à l'historique de l'équipe (${wip_count} vs ${Math.round(wip_historical_avg)} moy.)`,
      severity: "medium",
    });
  }

  // Signal 2: Stale tickets (In Progress > 3 days)
  const hasStaleTickets = tickets_in_progress_over_3d >= DRIFT_THRESHOLDS.MIN_STALE_TICKETS;
  if (hasStaleTickets) {
    signals.push({
      id: "stale_tickets",
      label: `${tickets_in_progress_over_3d} tickets actifs depuis plus de 3 jours`,
      severity: "medium",
    });
  }

  // Signal 3: Blocked tickets (> 48h)
  const hasBlockedTickets = blocked_tickets_over_48h >= DRIFT_THRESHOLDS.MIN_BLOCKED_TICKETS;
  if (hasBlockedTickets) {
    signals.push({
      id: "blocked_tickets",
      label: `${blocked_tickets_over_48h} ticket(s) bloqué(s) depuis plus de 48h`,
      severity: "high",
    });
  }

  // Calculate confidence based on signal convergence
  const signalCount = signals.length;
  const confidence = signalCount === 0 ? 0 : Math.min(95, 50 + (signalCount * 15));

  // Determine status
  const hasDrift = signalCount >= 2 || (signalCount === 1 && hasBlockedTickets);
  
  return {
    status: hasDrift ? DRIFT_STATUS.POTENTIAL_DRIFT : DRIFT_STATUS.HEALTHY,
    confidence,
    signals,
    canAnalyze: true,
  };
}

export function shouldSendDriftAlert(driftAnalysis, alertSent = false) {
  // Never spam - only one alert per drift detection
  if (alertSent) return false;
  
  // Only alert on potential drift with high confidence
  if (driftAnalysis.status.id !== "potential_drift") return false;
  
  return driftAnalysis.confidence >= DRIFT_THRESHOLDS.CONFIDENCE_HIGH;
}

export function generateDriftSuggestions(signals) {
  // Non-prescriptive suggestions based on detected signals
  const suggestions = [];

  const hasBlocked = signals.some(s => s.id === "blocked_tickets");
  const hasStale = signals.some(s => s.id === "stale_tickets");
  const hasWip = signals.some(s => s.id === "wip_high");

  if (hasBlocked) {
    suggestions.push({
      id: "unblock",
      text: "Identifier un ticket bloquant à débloquer aujourd'hui",
      effort: "low",
    });
  }

  if (hasWip || hasStale) {
    suggestions.push({
      id: "reduce_wip",
      text: "Réduire temporairement le WIP pour finir avant de démarrer",
      effort: "medium",
    });
  }

  if (hasStale) {
    suggestions.push({
      id: "check_scope",
      text: "Vérifier si une User Story est trop large pour le sprint",
      effort: "low",
    });
  }

  // Always suggest sync if drift detected
  if (suggestions.length === 0) {
    suggestions.push({
      id: "sync",
      text: "Organiser un point de synchronisation rapide avec l'équipe",
      effort: "low",
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

export function formatDriftAlert(sprintName, driftAnalysis) {
  const { signals, confidence } = driftAnalysis;
  
  return {
    title: `⚠️ Sprint ${sprintName} – dérive potentielle détectée`,
    confidenceLabel: confidence >= 75 ? "confiance élevée" : "confiance modérée",
    signals: signals.map(s => s.label),
    keyQuestion: "Qu'est-ce qui empêche actuellement l'équipe de faire avancer le flux ?",
    suggestions: generateDriftSuggestions(signals),
    cta: {
      label: "Revoir le sprint maintenant",
      action: "review_sprint",
    },
  };
}

// Enrich sprint data from transcript analysis
export function enrichSprintDataFromTranscript(transcript, existingData = {}) {
  const blockedMentions = (transcript.match(/blocked|bloqué|stuck|waiting|en attente/gi) || []).length;
  const wipMentions = (transcript.match(/in progress|en cours|working on|travaille sur/gi) || []).length;
  const delayMentions = (transcript.match(/delayed|retard|taking longer|prend plus de temps/gi) || []).length;

  return {
    ...existingData,
    wip_count: Math.max(existingData.wip_count || 0, wipMentions),
    blocked_tickets_over_48h: Math.max(existingData.blocked_tickets_over_48h || 0, Math.floor(blockedMentions / 2)),
    tickets_in_progress_over_3d: Math.max(existingData.tickets_in_progress_over_3d || 0, delayMentions),
  };
}

// Mark drift as acknowledged by human action
export function acknowledgeDrift(sprintHealth) {
  return {
    ...sprintHealth,
    drift_acknowledged: true,
    drift_acknowledged_date: new Date().toISOString(),
  };
}