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
// STRUCTURAL PATTERN DETECTION (PRIMARY)
// ============================================

function detectYesterdayTodayBlockers(text) {
  // RÈGLE ABSOLUE: Si structure "Hier - Aujourd'hui - Bloqueurs/Blocages" = DAILY
  const patterns = [
    /hier\s*:[\s\S]*aujourd'hui\s*:[\s\S]*bloc/i,
    /yesterday\s*:[\s\S]*today\s*:[\s\S]*block/i,
    /j'ai\s+terminé[\s\S]*je\s+(commence|travaille|continue)/i,
    /i\s+(finished|completed)[\s\S]*i\s+(start|work|continue)/i,
  ];
  
  return patterns.some(p => p.test(text));
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
  if (matchesAny(text, REVIEW_OBJECTS.product)) score += 30;
  if (matchesAny(text, REVIEW_OBJECTS.validation)) score += 25;
  if (matchesAny(text, REVIEW_OBJECTS.demo)) score += 25;
  
  // Temporality scoring (past tense confirms review)
  if (matchesAny(text, REVIEW_TIME.past)) score += 15;
  
  // Intent patterns
  if (PATTERNS.review.demoIndicator.test(text)) score += 15;
  if (PATTERNS.review.deliveryFocus.test(text)) score += 15;
  if (PATTERNS.review.feedbackRequest.test(text)) score += 15;
  if (PATTERNS.review.stakeholder.test(text)) score += 10;
  
  // Anti-pattern penalties: Planning-specific keywords (without engagement/estimation)
  // If Planning keywords exist but NOT followed by capacity/estimation discussion, likely Review proposing future work
  if (matchesAny(text, PLANNING_OBJECTS.future) && !matchesAny(text, PLANNING_OBJECTS.estimation)) score -= 10;
  if (matchesAny(text, DAILY_OBJECTS.tasks)) score -= 10;
  
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
  return keywordArray.some(keyword => text.includes(keyword.toLowerCase()));
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