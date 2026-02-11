/**
 * Workshop Detection v2 - Strict Scrum Ceremony Classification
 * 
 * Rules:
 * - Daily: Tasks + Today (individual updates, immediate blockers)
 * - Review: Product + Validation (demo, delivery, client feedback)
 * - Retrospective: Team + Improvement (communication, process, friction)
 * - Planning: Backlog + Future (estimation, capacity, future commitment)
 * 
 * Priority: Dominant object determines classification
 * Minority signals cannot reverse the decision
 */

// ============================================
// OBJECT KEYWORDS (Dominant Object Detection)
// ============================================

const DAILY_OBJECTS = {
  tasks: ['tâche', 'task', 'ticket', 'ticket jira', 'issue', 'bug', 'pr', 'pull request', 'branche', 'branch', 'commit', 'déploiement', 'deployment'],
  actions: ['je travaille sur', 'i\'m working on', 'je continue', 'i continue', 'je termine', 'i\'m finishing', 'je fais', 'i\'m doing', 'en cours', 'in progress'],
  blockers: ['bloqué', 'blocked', 'blocage', 'blocker', 'obstacle', 'empêche', 'prevents', 'ne peut pas', 'can\'t'],
};

const REVIEW_OBJECTS = {
  product: ['démo', 'demo', 'incrément', 'increment', 'fonctionnalité', 'feature', 'livré', 'delivered', 'release', 'version', 'production', 'utilisateur', 'user'],
  validation: ['feedback', 'validation', 'client', 'stakeholder', 'acceptance', 'acceptation', 'testé', 'tested', 'qa', 'quality'],
  demo: ['montrer', 'show', 'présenter', 'present', 'voir', 'look at', 'voici', 'here is', 'démonstration'],
  retrospective: ['retours', 'feedback', 'suggestions', 'améliorations', 'improvements', 'backlog futur', 'future items'],
};

const RETROSPECTIVE_OBJECTS = {
  teamProcess: ['communication', 'collaboration', 'workflow', 'processus', 'process', 'dynamique', 'équipe', 'team', 'relation'],
  improvement: ['amélioration', 'improvement', 'friction', 'friction', 'difficultés', 'difficulties', 'on devrait', 'we should', 'la prochaine fois', 'next time', 'proposer', 'suggest'],
  emotion: ['frustration', 'stress', 'difficile', 'difficult', 'problème', 'problem', 'sentiment', 'feeling', 'ressenti', 'felt'],
};

const PLANNING_OBJECTS = {
  future: ['prochain sprint', 'next sprint', 'futur', 'future', 'engagement', 'commitment', 'on s\'engage', 'we commit', 'sprint objectif', 'sprint goal'],
  estimation: ['estimation', 'story points', 'points', 'capacité', 'capacity', 'vélocité', 'velocity', 'charges', 'effort'],
  backlogSelection: ['backlog', 'user story', 'user stories', 'histoire utilisateur'],
  prioritization: ['priorité', 'priority', 'important', 'critère', 'criteria', 'sélection', 'selection', 'choix', 'choice'],
};

// ============================================
// TEMPORALITY KEYWORDS
// ============================================

const DAILY_TIME = {
  short: ['hier', 'yesterday', 'aujourd\'hui', 'today', 'ce matin', 'this morning', 'demain', 'tomorrow', 'dernier jour', 'last day', 'quotidien', 'daily'],
  immediate: ['maintenant', 'now', 'immédiatement', 'immediately', 'urgent', 'asap', 'bloque', 'blocked'],
};

const REVIEW_TIME = {
  past: ['livré', 'delivered', 'fait', 'done', 'complété', 'completed', 'itération passée', 'last iteration', 'sprint dernier', 'last sprint', 'obtenu', 'achieved'],
};

const RETROSPECTIVE_TIME = {
  reflective: ['en regardant', 'looking back', 'rétrospectivement', 'retrospectively', 'dernièrement', 'recently', 'auparavant', 'previously'],
};

const PLANNING_TIME = {
  future: ['prochain', 'next', 'semaine prochaine', 'next week', 'futur', 'future', 'à venir', 'upcoming', 'jusqu\'à', 'until'],
  commitment: ['on s\'engage', 'we commit', 'engagement', 'commitment', 'promise', 'promis'],
};

// ============================================
// INTENT PATTERNS
// ============================================

const PATTERNS = {
  daily: {
    statusUpdate: /(?:hier|today|here|ce matin|this morning|yesterday).*(?:travaillé|worked|fait|did|complété|completed)/i,
    continuousWork: /(?:je continue|i continue|en cours|in progress|je fais|i'm doing)/i,
    blockageReporting: /(?:bloqué|blocked|blocage|blocker|empêche|prevents|ne peut pas|can't)/i,
    taskFocus: /(?:tâche|task|ticket|issue|pr|pull request|bug|déploiement|deployment)/i,
  },
  review: {
    demoIndicator: /(?:démo|demo|montrer|show|voir|voici|here|présenter|present)/i,
    deliveryFocus: /(?:incrément|increment|livré|delivered|fonctionnalité|feature|release|version|production)/i,
    feedbackRequest: /(?:feedback|validation|acceptation|acceptance|testé|tested|qa|avis|opinion)/i,
    stakeholder: /(?:client|customer|stakeholder|utilisateur|user|sponsor|product owner)/i,
  },
  retrospective: {
    processAnalysis: /(?:communication|collaboration|workflow|processus|process|dynamique|friction)/i,
    improvementProposal: /(?:amélioration|improvement|on devrait|we should|la prochaine fois|next time|proposer|suggest|différent|different)/i,
    emotionalContext: /(?:frustration|stress|difficile|difficult|problème|problem|sentir|feel|ressenti|felt)/i,
    teamFocus: /(?:équipe|team|nous|we|ensemble|together|collaboration|collectif)/i,
  },
  planning: {
    futureCommitment: /(?:prochain sprint|next sprint|engagement|commitment|on s'engage|we commit)/i,
    estimationDiscussion: /(?:estimation|estimation|story points|points|capacité|capacity|vélocité|velocity)/i,
    backlogSelection: /(?:backlog|user story|user stories|histoire utilisateur|priorité|priority|sélection|selection)/i,
    sprintGoal: /(?:objectif|goal|objectif sprint|sprint goal|on fait|we do|on veut|we want)/i,
  },
};

// ============================================
// EXPLICIT CEREMONY DECLARATION (PRIMARY - UNBREAKABLE)
// ============================================

function detectExplicitCeremony(text) {
  // Speaker explicitly declares the ceremony in opening (first 10 lines)
  const firstLines = text.split('\n').slice(0, 10).join(' ').toLowerCase();

  const ceremonies = {
    retrospective: [
      /on\s+démarre\s+la\s+rétrospective/i,
      /on\s+fait\s+la\s+rétrospective/i,
      /rétrospective\s+de\s+sprint/i,
      /we\s+start\s+the\s+retrospective/i,
      /let's\s+do\s+the\s+retro/i,
      /sprint\s+retrospective/i,
    ],
    review: [
      /on\s+démarre\s+la\s+sprint\s+review/i,
      /on\s+fait\s+la\s+sprint\s+review/i,
      /sprint\s+review/i,
      /we\s+start\s+the\s+sprint\s+review/i,
      /démo\s+de\s+sprint/i,
      /sprint\s+demo/i,
    ],
    daily: [
      /on\s+démarre\s+le\s+daily/i,
      /daily\s+scrum/i,
      /standup/i,
      /stand[\s-]up/i,
      /voici\s+le\s+daily/i,
      /here's\s+the\s+daily/i,
      // CRITICAL: Format declaration "ce que vous avez fait hier, ce que vous faites aujourd'hui, vos blocages"
      /ce\s+que\s+vous\s+avez\s+fait\s+hier[\s\S]*ce\s+que\s+vous\s+faites\s+aujourd'hui[\s\S]*blocages?/i,
      /what\s+you\s+(?:did|worked\s+on)\s+yesterday[\s\S]*what\s+you\s+(?:are\s+)?(?:doing|working\s+on)\s+today[\s\S]*(?:blocker|blocking)/i,
    ],
    planning: [
      /on\s+démarre\s+le\s+sprint\s+planning/i,
      /sprint\s+planning/i,
      /planification\s+de\s+sprint/i,
      /we\s+start\s+sprint\s+planning/i,
      /planning\s+meeting/i,
    ],
  };

  for (const [ceremony, patterns] of Object.entries(ceremonies)) {
    if (patterns.some(p => p.test(firstLines))) {
      return ceremony;
    }
  }

  return null;
}

// ============================================
// STRUCTURAL PATTERN DETECTION (SECONDARY)
// ============================================

function detectYesterdayTodayBlockers(text) {
  // RÈGLE ABSOLUE: Si structure "Hier - Aujourd'hui - Bloqueurs/Blocages" = DAILY
  const lower = text.toLowerCase();

  // Count occurrences of key temporal/blocker keywords
  const hierCount = (lower.match(/\bhier\b/g) || []).length;
  const aujourdhuiCount = (lower.match(/\baujourd'hui\b/g) || []).length;
  const blockageCount = (lower.match(/\b(blocage|blocages|bloqué|bloqués|blocked|blocking)\b/g) || []).length;
  const pasDeBlockageCount = (lower.match(/pas\s+de\s+(blocage|blocages|bloqué|bloqués|blocked|blocking)/g) || []).length;

  // Daily structure: lots of "hier" + "aujourd'hui" + mention of "blocage" (even "pas de blocage")
  const hasStructure = hierCount >= 3 && aujourdhuiCount >= 3 && (blockageCount + pasDeBlockageCount) >= 3;

  // OR explicit patterns
  const patterns = [
    /hier\s*:[\s\S]*aujourd'hui\s*:[\s\S]*bloc/i,
    /yesterday\s*:[\s\S]*today\s*:[\s\S]*block/i,
    /j'ai\s+(terminé|fait|corrigé|implémenté)[\s\S]{0,200}je\s+(commence|travaille|continue|vais|dois)/i,
    /i\s+(finished|completed|fixed|implemented)[\s\S]{0,200}i\s+(start|work|continue|will|can)/i,
  ];

  return hasStructure || patterns.some(p => p.test(text));
}

// ============================================
// SCORING SYSTEM
// ============================================

function analyzeText(text) {
  const lower = text.toLowerCase();
  
  // PRIMARY CHECK: Structural Daily pattern (UNBREAKABLE)
  const hasYesterdayTodayPattern = detectYesterdayTodayBlockers(lower);
  
  return {
    daily: scoreDaily(lower, hasYesterdayTodayPattern),
    review: scoreReview(lower, hasYesterdayTodayPattern),
    retrospective: scoreRetrospective(lower, hasYesterdayTodayPattern),
    planning: scorePlanning(lower, hasYesterdayTodayPattern),
  };
}

function scoreDaily(text, hasStructuralPattern = false) {
  let score = 0;
  
  // STRUCTURAL PATTERN (UNBREAKABLE RULE)
  if (hasStructuralPattern) {
    score = 100; // Maximum score - cannot be beaten
    return score;
  }
  
  // Object scoring (dominant object)
  if (matchesAny(text, DAILY_OBJECTS.tasks)) score += 30;
  if (matchesAny(text, DAILY_OBJECTS.actions)) score += 20;
  if (matchesAny(text, DAILY_OBJECTS.blockers)) score += 15;
  
  // Temporality scoring (confirms daily)
  if (matchesAny(text, DAILY_TIME.short)) score += 20;
  if (matchesAny(text, DAILY_TIME.immediate)) score += 15;
  
  // Intent patterns
  if (PATTERNS.daily.statusUpdate.test(text)) score += 15;
  if (PATTERNS.daily.continuousWork.test(text)) score += 10;
  if (PATTERNS.daily.blockageReporting.test(text)) score += 10;
  if (PATTERNS.daily.taskFocus.test(text)) score += 10;
  
  // Anti-pattern penalties (doesn't look like daily)
  if (matchesAny(text, REVIEW_OBJECTS.demo)) score -= 20;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess)) score -= 15;
  if (matchesAny(text, PLANNING_OBJECTS.future)) score -= 15;
  
  return Math.max(0, score);
}

function scoreReview(text, hasStructuralPatternDaily = false) {
  let score = 0;
  
  // If structural Daily pattern exists, heavily penalize Review
  if (hasStructuralPatternDaily) score -= 50;
  
  // Object scoring (dominant object)
  // Review = PRODUCT + DEMO (not just "feedback" which is in Retro too)
  const hasDemo = matchesAny(text, REVIEW_OBJECTS.demo);
  const hasProduct = matchesAny(text, REVIEW_OBJECTS.product);
  
  if (hasDemo) score += 35;
  if (hasProduct) score += 30;
  if (hasDemo && hasProduct) score += 15;
  
  // Validation only counts if Demo OR Product is present (context-specific)
  if (matchesAny(text, REVIEW_OBJECTS.validation) && (hasDemo || hasProduct)) score += 20;
  
  // Temporality scoring (past tense confirms review)
  if (matchesAny(text, REVIEW_TIME.past)) score += 15;
  
  // Intent patterns
  if (PATTERNS.review.demoIndicator.test(text)) score += 20;
  if (PATTERNS.review.deliveryFocus.test(text)) score += 20;
  if (PATTERNS.review.stakeholder.test(text)) score += 15;
  
  // Heavy penalty: if team/process/improvement keywords dominate → Retrospective, not Review
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess)) score -= 50;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.improvement)) score -= 50;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess) && matchesAny(text, RETROSPECTIVE_OBJECTS.improvement)) score -= 30;
  
  // Anti-pattern penalties
  if (matchesAny(text, PLANNING_OBJECTS.future) && !matchesAny(text, PLANNING_OBJECTS.estimation)) score -= 10;
  if (matchesAny(text, DAILY_OBJECTS.blockers)) score -= 15;
  
  return Math.max(0, score);
}

function scoreRetrospective(text, hasStructuralPatternDaily = false) {
  let score = 0;
  
  // If structural Daily pattern exists, heavily penalize Retrospective
  if (hasStructuralPatternDaily) score -= 40;
  
  // Object scoring (dominant object)
  const hasTeamProcess = matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess);
  const hasImprovement = matchesAny(text, RETROSPECTIVE_OBJECTS.improvement);
  const hasEmotion = matchesAny(text, RETROSPECTIVE_OBJECTS.emotion);
  
  if (hasTeamProcess) score += 40;
  if (hasImprovement) score += 35;
  if (hasEmotion) score += 25;
  
  // Strong bonus if process + improvement (classic retro combo)
  if (hasTeamProcess && hasImprovement) score += 20;
  
  // If Planning keywords dominate, penalize Retrospective heavily
  if (matchesAny(text, PLANNING_OBJECTS.future) || matchesAny(text, PLANNING_OBJECTS.estimation)) score -= 30;
  
  // Temporality scoring (reflective confirms retro)
  if (matchesAny(text, RETROSPECTIVE_TIME.reflective)) score += 15;
  
  // Intent patterns
  if (PATTERNS.retrospective.processAnalysis.test(text)) score += 20;
  if (PATTERNS.retrospective.improvementProposal.test(text)) score += 20;
  if (PATTERNS.retrospective.emotionalContext.test(text)) score += 15;
  if (PATTERNS.retrospective.teamFocus.test(text)) score += 15;
  
  // Anti-pattern penalties
  if (matchesAny(text, REVIEW_OBJECTS.demo)) score -= 30;
  if (matchesAny(text, PLANNING_OBJECTS.estimation)) score -= 15;
  
  return Math.max(0, score);
}

function scorePlanning(text, hasStructuralPatternDaily = false) {
  let score = 0;
  
  // If structural Daily pattern exists, heavily penalize Planning
  if (hasStructuralPatternDaily) score -= 40;
  
  // Object scoring (dominant object)
  // Planning REQUIRES estimation + backlog selection together
  const hasEstimation = matchesAny(text, PLANNING_OBJECTS.estimation);
  const hasBacklogSelection = matchesAny(text, PLANNING_OBJECTS.backlogSelection);
  const hasFuture = matchesAny(text, PLANNING_OBJECTS.future);
  
  // Planning requires ACTUAL estimation discussion (story points, capacity)
  // NOT just mentioning "backlog" for future items
  if (hasEstimation && (hasBacklogSelection || hasFuture)) score += 40;
  if (hasEstimation && matchesAny(text, PLANNING_TIME.commitment)) score += 30;
  if (matchesAny(text, PLANNING_OBJECTS.prioritization) && hasEstimation) score += 15;
  
  // Temporality scoring (future confirms planning ONLY with estimation)
  if (matchesAny(text, PLANNING_TIME.commitment) && hasEstimation) score += 15;
  
  // Intent patterns (strong indicators of Planning)
  if (PATTERNS.planning.futureCommitment.test(text) && hasEstimation) score += 25;
  if (PATTERNS.planning.estimationDiscussion.test(text)) score += 30;
  if (PATTERNS.planning.backlogSelection.test(text) && hasEstimation) score += 20;
  if (PATTERNS.planning.sprintGoal.test(text) && hasEstimation) score += 20;
  
  // Heavy penalty: backlog mentioned WITHOUT estimation = likely Review proposing future items
  if (hasBacklogSelection && !hasEstimation) score -= 30;
  
  // Anti-pattern penalties
  if (matchesAny(text, REVIEW_OBJECTS.demo)) score -= 30;
  if (matchesAny(text, REVIEW_OBJECTS.validation)) score -= 15;
  if (matchesAny(text, DAILY_OBJECTS.blockers)) score -= 10;
  
  return Math.max(0, score);
}

function matchesAny(text, keywords) {
  const keywordArray = Array.isArray(keywords) ? keywords : Object.values(keywords).flat();
  // Word boundary matching to avoid "démarre" matching "démo"
  return keywordArray.some(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
    return regex.test(text);
  });
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

export function detectWorkshopType(transcript) {
  if (!transcript || transcript.length < 50) {
    return {
      type: 'Insufficient Data',
      confidence: 0,
      scores: {},
      tags: ['#InsufficientData'],
      justifications: ['Transcript too short for reliable classification'],
    };
  }

  // PRIMARY: Check for explicit ceremony declaration (UNBREAKABLE)
  const explicitCeremony = detectExplicitCeremony(transcript);
  if (explicitCeremony) {
    const ceremonyNames = {
      daily: 'Daily Scrum',
      review: 'Sprint Review',
      retrospective: 'Sprint Rétrospective',
      planning: 'Sprint Planning',
    };

    return {
      type: ceremonyNames[explicitCeremony],
      confidence: 99,
      scores: { [explicitCeremony]: 100 },
      tags: [`#${explicitCeremony.charAt(0).toUpperCase() + explicitCeremony.slice(1)}`],
      justifications: ['Ceremony explicitly declared by facilitator'],
    };
  }

  const lower = transcript.toLowerCase();
  const hasStructuralDaily = detectYesterdayTodayBlockers(lower);
  const scores = analyzeText(transcript);
  
  // Find dominant score
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [ceremonyType, dominantScore] = entries[0];
  const [, secondScore] = entries[1];
  
  // Minimum score threshold
  if (dominantScore < 30) {
    return {
      type: 'Unknown Ceremony',
      confidence: 0,
      scores,
      tags: ['#LowConfidence'],
      justifications: ['No dominant pattern detected'],
    };
  }
  
  // Prevent minority signals from inverting decision
  // Dominant must be at least 10 points higher than second
  const isClear = dominantScore - secondScore >= 10;
  const confidence = isClear ? Math.min(95, dominantScore) : Math.max(50, dominantScore - 20);
  
  const ceremonyNames = {
    daily: 'Daily Scrum',
    review: 'Sprint Review',
    retrospective: 'Sprint Rétrospective',
    planning: 'Sprint Planning',
  };
  
  return {
    type: ceremonyNames[ceremonyType] || 'Unknown',
    confidence: Math.round(confidence),
    scores,
    tags: generateTags(ceremonyType, scores),
    justifications: generateJustifications(ceremonyType, scores, transcript),
  };
}

function generateTags(ceremonyType, scores) {
  const tags = [];
  
  if (ceremonyType === 'daily') tags.push('#Daily', '#StatusUpdate', '#Blockers');
  if (ceremonyType === 'review') tags.push('#Review', '#Demo', '#Delivery');
  if (ceremonyType === 'retrospective') tags.push('#Retro', '#Process', '#Improvement');
  if (ceremonyType === 'planning') tags.push('#Planning', '#Future', '#Estimation');
  
  // Add secondary characteristics if strong
  Object.entries(scores).forEach(([type, score]) => {
    if (type !== ceremonyType && score > 40) {
      tags.push(`#Mixed${type}`);
    }
  });
  
  return tags;
}

function generateJustifications(ceremonyType, scores, transcript) {
  const justifications = [];
  
  if (ceremonyType === 'daily') {
    if (matchesAny(transcript, DAILY_OBJECTS.tasks)) justifications.push('Task-focused discussion detected');
    if (matchesAny(transcript, DAILY_TIME.short)) justifications.push('Short-term temporality (today/yesterday)');
    if (matchesAny(transcript, DAILY_OBJECTS.blockers)) justifications.push('Blocker reporting detected');
  }
  
  if (ceremonyType === 'review') {
    if (matchesAny(transcript, REVIEW_OBJECTS.demo)) justifications.push('Demo indicators found');
    if (matchesAny(transcript, REVIEW_OBJECTS.product)) justifications.push('Product delivery focus');
    if (matchesAny(transcript, REVIEW_OBJECTS.validation)) justifications.push('Validation/feedback discussion');
  }
  
  if (ceremonyType === 'retrospective') {
    if (matchesAny(transcript, RETROSPECTIVE_OBJECTS.teamProcess)) justifications.push('Team process discussion');
    if (matchesAny(transcript, RETROSPECTIVE_OBJECTS.improvement)) justifications.push('Improvement proposals detected');
    if (matchesAny(transcript, RETROSPECTIVE_OBJECTS.emotion)) justifications.push('Emotional context present');
  }
  
  if (ceremonyType === 'planning') {
    if (matchesAny(transcript, PLANNING_OBJECTS.future)) justifications.push('Future commitment language');
    if (matchesAny(transcript, PLANNING_OBJECTS.estimation)) justifications.push('Estimation/capacity discussion');
    if (matchesAny(transcript, PLANNING_OBJECTS.prioritization)) justifications.push('Prioritization indicators');
  }
  
  return justifications.slice(0, 3);
}