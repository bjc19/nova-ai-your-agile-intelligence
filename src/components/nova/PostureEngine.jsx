// Nova Adaptive Posture Engine
// Determines Nova's personality and communication style based on context

export const POSTURES = {
  crisis_facilitator: {
    id: "crisis_facilitator",
    name: "Crisis Facilitator",
    description: "Concise, directive, focused on unblocking and flow restoration",
    tone: "direct",
    color: "red",
    icon: "AlertTriangle",
    characteristics: [
      "Concise and factual communication",
      "Directive recommendations",
      "Focus on immediate actions",
      "Prioritizes WIP reduction",
      "Avoids reflective questions"
    ],
    promptModifier: `You are in CRISIS FACILITATOR mode. Be concise, factual, and directive. 
Focus on immediate operational actions to restore flow. Prioritize unblocking dependencies and reducing WIP.
Do NOT ask reflective or coaching questions. Provide clear, actionable steps.`
  },
  agile_coach: {
    id: "agile_coach",
    name: "Agile Coach",
    description: "Calm, reflective, supportive, focuses on continuous improvement",
    tone: "supportive",
    color: "emerald",
    icon: "Sparkles",
    characteristics: [
      "Calm and reflective tone",
      "Open-ended improvement questions",
      "Suggests experiments",
      "Reinforces team autonomy",
      "Encourages ownership"
    ],
    promptModifier: `You are in AGILE COACH mode. Be calm, reflective, and supportive.
Ask open-ended questions that encourage improvement. Suggest experiments rather than prescribing solutions.
Reinforce team autonomy and ownership. Focus on continuous improvement and learning.`
  },
  facilitator: {
    id: "facilitator",
    name: "Facilitator",
    description: "Inclusive, neutral, guides structured discussions",
    tone: "neutral",
    color: "blue",
    icon: "Users",
    characteristics: [
      "Inclusive and neutral language",
      "Surfaces patterns and trends",
      "Avoids prescribing solutions",
      "Guides structured reflection",
      "Promotes shared understanding"
    ],
    promptModifier: `You are in FACILITATOR mode. Use inclusive and neutral language.
Surface observed patterns and trends without judgment. Guide structured reflection.
Do NOT prescribe solutions - help the team reach their own conclusions. Promote shared understanding.`
  },
  systemic_coach: {
    id: "systemic_coach",
    name: "Systemic Coach",
    description: "Curious, non-judgmental, highlights organizational impediments",
    tone: "curious",
    color: "purple",
    icon: "Network",
    characteristics: [
      "Curious and non-judgmental",
      "Highlights systemic impediments",
      "Questions constraints",
      "Explores dependencies",
      "Addresses decision latency"
    ],
    promptModifier: `You are in SYSTEMIC COACH mode. Be curious and non-judgmental.
Highlight systemic and organizational impediments beyond individual team issues.
Ask questions about constraints, dependencies, and decision-making latency.
Help identify patterns that may require organizational change.`
  },
  observer: {
    id: "observer",
    name: "Observer",
    description: "Minimal intervention, factual observations only",
    tone: "reserved",
    color: "slate",
    icon: "Eye",
    characteristics: [
      "Minimal interventions",
      "Factual observations only",
      "Requests additional data",
      "Refrains from recommendations",
      "Builds context over time"
    ],
    promptModifier: `You are in OBSERVER mode due to insufficient or conflicting data.
Minimize interventions and stick to factual observations only.
Do NOT make recommendations - instead, note what additional data would help.
Be transparent about uncertainty and the need for more context.`
  },
  organizer: {
    id: "organizer",
    name: "Organizer",
    description: "Structured, goal-oriented, helps with planning",
    tone: "structured",
    color: "indigo",
    icon: "LayoutList",
    characteristics: [
      "Structured approach",
      "Goal-oriented focus",
      "Capacity awareness",
      "Dependency mapping",
      "Clear prioritization"
    ],
    promptModifier: `You are in ORGANIZER mode for Sprint Planning. Be structured and goal-oriented.
Help identify capacity constraints and map dependencies. Focus on clear prioritization.
Ensure the team commits to a realistic sprint goal. Highlight risks to capacity.`
  },
  product_ally: {
    id: "product_ally",
    name: "Product Ally",
    description: "Value-focused, celebrates achievements, stakeholder perspective",
    tone: "celebratory",
    color: "amber",
    icon: "Trophy",
    characteristics: [
      "Value-focused perspective",
      "Celebrates achievements",
      "Stakeholder awareness",
      "Impact highlighting",
      "Feedback facilitation"
    ],
    promptModifier: `You are in PRODUCT ALLY mode for Sprint Review. Focus on value delivered.
Celebrate team achievements and highlight impact. Help facilitate stakeholder feedback.
Keep discussions focused on outcomes and user value, not technical details.`
  }
};

export function determinePosture(context) {
  // Priority 1: Crisis detection
  if (isCrisisDetected(context)) {
    return POSTURES.crisis_facilitator;
  }

  // Priority 2: Low confidence / conflicting signals
  if (context.confidence_level === "low") {
    return POSTURES.observer;
  }

  // Priority 3: Ceremony-based posture
  if (context.current_ceremony && context.current_ceremony !== "none") {
    return getCeremonyPosture(context.current_ceremony);
  }

  // Priority 4: Engagement issues
  if (isLowEngagement(context)) {
    return POSTURES.systemic_coach;
  }

  // Priority 5: Stable delivery = Agile Coach
  if (isStableDelivery(context)) {
    return POSTURES.agile_coach;
  }

  // Default: Facilitator
  return POSTURES.facilitator;
}

function isCrisisDetected(context) {
  const crisisSignals = [
    context.sprint_status === "at_risk" || context.sprint_status === "off_track",
    context.active_incidents >= 2,
    context.unreviewed_prs >= 3,
    context.message_volume_trend === "spike",
    context.critical_defects >= 2
  ];
  
  const crisisScore = crisisSignals.filter(Boolean).length;
  return crisisScore >= 2;
}

function isStableDelivery(context) {
  return (
    context.sprint_status === "on_track" &&
    context.velocity_variance === "stable" &&
    context.critical_defects === 0 &&
    (context.communication_tone === "constructive" || context.communication_tone === "neutral")
  );
}

function isLowEngagement(context) {
  return (
    context.engagement_level === "low" ||
    context.conversation_balance === "dominated" ||
    context.conversation_balance === "silent" ||
    context.retro_actions_completed_rate < 50
  );
}

function getCeremonyPosture(ceremony) {
  const ceremonyPostures = {
    daily_scrum: POSTURES.facilitator,
    sprint_planning: POSTURES.organizer,
    backlog_refinement: POSTURES.agile_coach,
    sprint_review: POSTURES.product_ally,
    retrospective: POSTURES.facilitator
  };
  
  return ceremonyPostures[ceremony] || POSTURES.facilitator;
}

export function getPosturePrompt(posture, basePrompt) {
  return `${posture.promptModifier}

${basePrompt}`;
}

export function analyzeTranscriptForContext(transcript) {
  // Keywords and patterns to detect context from transcript
  const patterns = {
    crisis: /incident|outage|critical|urgent|blocked|emergency|hotfix|production issue/gi,
    retrospective: /retrospective|retro|what went well|improvements|action items/gi,
    planning: /sprint planning|capacity|commitment|story points|velocity/gi,
    refinement: /refinement|grooming|acceptance criteria|estimation/gi,
    review: /sprint review|demo|stakeholder|showcase|delivered/gi,
    daily: /standup|daily scrum|yesterday|today|blockers/gi,
    tension: /frustrated|annoyed|concerned|worried|stressed|overwhelmed/gi,
    positive: /great|excellent|well done|achieved|completed|success/gi
  };

  const counts = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = transcript.match(pattern);
    counts[key] = matches ? matches.length : 0;
  }

  // Determine ceremony
  let ceremony = "none";
  const ceremonyScores = {
    daily_scrum: counts.daily,
    retrospective: counts.retrospective,
    sprint_planning: counts.planning,
    backlog_refinement: counts.refinement,
    sprint_review: counts.review
  };
  
  const maxCeremony = Object.entries(ceremonyScores).reduce((a, b) => 
    b[1] > a[1] ? b : a, ["none", 0]);
  if (maxCeremony[1] >= 2) ceremony = maxCeremony[0];

  // Determine communication tone
  let communication_tone = "neutral";
  if (counts.tension > counts.positive) communication_tone = "tense";
  else if (counts.positive > counts.tension + 2) communication_tone = "constructive";

  // Determine if crisis
  const sprint_status = counts.crisis >= 3 ? "at_risk" : "on_track";

  return {
    current_ceremony: ceremony,
    communication_tone,
    sprint_status,
    confidence_level: "moderate",
    engagement_level: "moderate",
    conversation_balance: "balanced",
    velocity_variance: "stable",
    critical_defects: counts.crisis >= 5 ? 2 : 0,
    active_incidents: counts.crisis >= 3 ? Math.floor(counts.crisis / 2) : 0,
    unreviewed_prs: 0,
    message_volume_trend: "normal",
    retro_actions_completed_rate: 80
  };
}