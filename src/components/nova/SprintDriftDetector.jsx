// Sprint Drift Detection Engine
// Calculates risk score and determines if sprint is at risk

export const RISK_THRESHOLDS = {
  AT_RISK: 75,
  CRITICAL: 90,
  WIP_MULTIPLIER: 1.3,
  MIN_SPRINT_DAYS: 3,
  TICKET_AGE_THRESHOLD: 3, // days
  BLOCKED_THRESHOLD: 48, // hours
};

export const RISK_WEIGHTS = {
  WIP: 0.4,
  BLOCKED: 0.3,
  AGE: 0.3,
};

export function calculateRiskScore(sprintData) {
  const {
    wip_count = 0,
    wip_historical_avg = 5,
    tickets_in_progress_over_3d = 0,
    blocked_tickets_over_48h = 0,
    total_tickets = 10,
  } = sprintData;

  // WIP Score: How much WIP exceeds historical average
  const wipRatio = wip_historical_avg > 0 ? wip_count / wip_historical_avg : 1;
  const wipScore = Math.min(100, (wipRatio / RISK_THRESHOLDS.WIP_MULTIPLIER) * 100);

  // Blocked Score: Based on number of blocked tickets
  const blockedScore = Math.min(100, (blocked_tickets_over_48h / Math.max(1, total_tickets * 0.2)) * 100);

  // Age Score: Based on stale tickets
  const ageScore = Math.min(100, (tickets_in_progress_over_3d / Math.max(1, total_tickets * 0.3)) * 100);

  // Weighted total
  const totalScore = Math.round(
    wipScore * RISK_WEIGHTS.WIP +
    blockedScore * RISK_WEIGHTS.BLOCKED +
    ageScore * RISK_WEIGHTS.AGE
  );

  return {
    totalScore: Math.min(100, totalScore),
    breakdown: {
      wip: Math.round(wipScore),
      blocked: Math.round(blockedScore),
      age: Math.round(ageScore),
    },
  };
}

export function determineSprintStatus(riskScore) {
  if (riskScore >= RISK_THRESHOLDS.CRITICAL) return "critical";
  if (riskScore >= RISK_THRESHOLDS.AT_RISK) return "at_risk";
  return "healthy";
}

export function shouldSendAlert(sprintHealth) {
  const { risk_score, status, alert_sent, sprint_start_date } = sprintHealth;

  // Only alert if at risk or critical
  if (status === "healthy") return false;

  // Don't alert if already sent
  if (alert_sent) return false;

  // Only alert after day 3
  const sprintStart = new Date(sprint_start_date);
  const today = new Date();
  const daysSinceStart = Math.floor((today - sprintStart) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < RISK_THRESHOLDS.MIN_SPRINT_DAYS) return false;

  return risk_score >= RISK_THRESHOLDS.AT_RISK;
}

export function generateRecommendations(sprintData, problematicTickets = []) {
  const recommendations = [];
  const { wip_count, wip_historical_avg, blocked_tickets_over_48h } = sprintData;

  // WIP too high
  if (wip_count > wip_historical_avg * RISK_THRESHOLDS.WIP_MULTIPLIER) {
    const excess = wip_count - Math.round(wip_historical_avg);
    recommendations.push(`Réduire le WIP de ${excess} ticket(s) - Focalisez l'équipe sur la finition`);
  }

  // Blocked tickets
  if (blocked_tickets_over_48h > 0) {
    const blockedTickets = problematicTickets.filter(t => t.status === "blocked");
    if (blockedTickets.length > 0) {
      const ticket = blockedTickets[0];
      recommendations.push(`Débloquer en priorité: ${ticket.ticket_id} "${ticket.title}" (bloqué depuis ${ticket.days_in_status}j)`);
    }
  }

  // Stale tickets
  const staleTickets = problematicTickets.filter(t => t.status === "in_progress" && t.days_in_status >= 3);
  if (staleTickets.length > 0) {
    const ticket = staleTickets[0];
    recommendations.push(`Couper ou revoir le scope de: ${ticket.ticket_id} "${ticket.title}" (en cours depuis ${ticket.days_in_status}j)`);
  }

  // Generic if no specific
  if (recommendations.length === 0 && sprintData.risk_score >= RISK_THRESHOLDS.AT_RISK) {
    recommendations.push("Organiser un point de synchronisation d'urgence avec l'équipe");
  }

  return recommendations;
}

export function formatAlertMessage(sprintHealth) {
  const { sprint_name, risk_score, tickets_in_progress_over_3d, blocked_tickets_over_48h, recommendations } = sprintHealth;
  
  return {
    title: `🚨 Sprint "${sprint_name}" À RISQUE`,
    summary: `Score: ${risk_score}% | ${tickets_in_progress_over_3d} tickets >3j | ${blocked_tickets_over_48h} bloqués`,
    recommendation: recommendations?.[0] || "Revoir la charge de travail de l'équipe",
    urgency: risk_score >= RISK_THRESHOLDS.CRITICAL ? "critical" : "high",
  };
}

// Simulate Jira data analysis (replace with real Jira integration when available)
export function analyzeSprintFromTranscript(transcript, existingData = {}) {
  // Extract signals from transcript
  const blockedMentions = (transcript.match(/blocked|bloqué|stuck|waiting|en attente/gi) || []).length;
  const wipMentions = (transcript.match(/in progress|en cours|working on|travaille sur/gi) || []).length;
  const delayMentions = (transcript.match(/delayed|retard|taking longer|prend plus de temps/gi) || []).length;

  // Estimate metrics from transcript signals
  const estimatedWip = Math.max(existingData.wip_count || 0, wipMentions);
  const estimatedBlocked = Math.max(existingData.blocked_tickets_over_48h || 0, Math.floor(blockedMentions / 2));
  const estimatedStale = Math.max(existingData.tickets_in_progress_over_3d || 0, delayMentions);

  return {
    wip_count: estimatedWip,
    blocked_tickets_over_48h: estimatedBlocked,
    tickets_in_progress_over_3d: estimatedStale,
    wip_historical_avg: existingData.wip_historical_avg || 5,
    total_tickets: existingData.total_tickets || 10,
  };
}