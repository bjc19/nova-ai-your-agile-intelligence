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
};

const RETROSPECTIVE_OBJECTS = {
  teamProcess: ['communication', 'collaboration', 'workflow', 'processus', 'process', 'dynamique', 'équipe', 'team', 'relation', 'entraide', 'mutual support'],
  improvement: ['amélioration', 'improvement', 'friction', 'friction', 'difficultés', 'difficulties', 'on devrait', 'we should', 'la prochaine fois', 'next time', 'proposer', 'suggest', 'action', 'action de réparation', 'action plan', 'dette technique', 'technical debt'],
  emotion: ['frustration', 'stress', 'difficile', 'difficult', 'problème', 'problem', 'sentiment', 'feeling', 'ressenti', 'felt', 'sur les rotules', 'burned out', 'ancre', 'anchor'],
  retrospectiveMethod: ['speedboat', 'voile', 'voiles', 'ancre', 'ancres', 'requin', 'requins', 'rose thorn', 'bud', 'glad sad mad', '4ls', 'sailing', 'sail', 'anchor', 'shark'],
};

const PLANNING_OBJECTS = {
  future: ['prochain sprint', 'next sprint', 'futur', 'future', 'engagement', 'commitment', 'on s\'engage', 'we commit', 'sprint objectif', 'sprint goal'],
  estimation: ['estimation', 'story points', 'points', 'capacité', 'capacity', 'vélocité', 'velocity', 'charges', 'effort', 'embarquer', 'undertake'],
  backlogSelection: ['backlog', 'user story', 'user stories', 'histoire utilisateur', 'sélectionner', 'select'],
  prioritization: ['priorité', 'priority', 'intervertir', 'swap', 'ordre', 'order', 'criblage', 'filtering'],
  decomposition: ['découpage', 'breakdown', 'décomposition', 'tâche', 'task', 'sous-tâche', 'subtask'],
};

// CRITICAL REVIEW vs PLANNING DIFFERENTIATORS
const REVIEW_DIFFERENTIATORS = {
  demoDelivery: ['démo', 'demo', 'partage d\'écran', 'screen share', 'montrer', 'show', 'voici', 'here', 'regardez', 'look at'],
  stakeholderValidation: ['feedback', 'avis', 'opinion', 'stakeholder', 'client', 'utilisateur', 'acceptation', 'acceptance', 'testé', 'validated'],
  retrospectiveDiscussion: ['comment on', 'how we', 'nous avons', 'we have', 'données', 'data', 'signaux', 'signals', 'apprentissage', 'learning'],
  priorForwardDiscussion: ['prochain sprint', 'next sprint', 'backlog prochain', 'next backlog', 'envisager', 'consider', 'ajouter au backlog', 'add to backlog'],
};

const PLANNING_DIFFERENTIATORS = {
  estimationActivity: ['combien de points', 'how many points', 'story points', 'capacité', 'capacity', 'on embarque', 'we take', 'on peut', 'we can'],
  commitmentLanguage: ['on s\'engage', 'we commit', 'embarquer', 'undertake', 'c\'est dans', 'that\'s in', 'promesse', 'promise'],
  backlogSelection: ['qu\'est-ce qu\'on', 'what are we', 'sélectionner', 'select', 'choisir', 'choose', 'dans le sprint', 'in the sprint'],
  scopeBreakdown: ['découpage', 'breakdown', 'dépendance', 'dependency', 'comment on découpe', 'how we break down', 'sous-tâche', 'subtask'],
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
  future: ['prochain', 'next', 'semaine prochaine', 'next week', 'futur', 'future', 'à venir', 'upcoming', 'jusqu\'à', 'until', 'repart', 'restarting'],
  commitment: ['on s\'engage', 'we commit', 'engagement', 'commitment', 'promise', 'promis', 'embarque', 'embarquer', 'on l\'embarque'],
  planning_intent: ['qu\'est-ce qu\'on', 'what will', 'comment on', 'how we', 'on va', 'we will'],
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
    processAnalysis: /(?:communication|collaboration|workflow|processus|process|dynamique|friction|entraide)/i,
    improvementProposal: /(?:amélioration|improvement|on devrait|we should|la prochaine fois|next time|proposer|suggest|différent|different|action\s+(?:de|plan|item)|action\s+de\s+réparation)/i,
    emotionalContext: /(?:frustration|stress|difficile|difficult|problème|problem|sentir|feel|ressenti|felt|sur\s+les\s+rotules|burned\s+out)/i,
    teamFocus: /(?:équipe|team|nous|we|ensemble|together|collaboration|collectif)/i,
    retrospectiveMethod: /(?:speedboat|voile|ancre|requin|rose\s+thorn|glad\s+sad\s+mad|4ls|sailing)/i,
    technicalDebt: /(?:dette\s+technique|technical\s+debt|refactor|refactoring|code\s+(?:rapide|quick)|propre|clean\s+(?:up|code))/i,
  },
  planning: {
    futureCommitment: /(?:prochain sprint|next sprint|engagement|commitment|on s'engage|we commit|repart|embarque)/i,
    estimationDiscussion: /(?:estimation|story points|points|capacité|capacity|vélocité|velocity|charge)\b/i,
    backlogSelection: /(?:\bbacklog\b|user story|user stories|histoire utilisateur|qu'est-ce qu'on|what.*on\s+(?:a|have))/i,
    sprintGoal: /(?:objectif|goal|objectif sprint|sprint goal|comment on|how we)/i,
    decomposition: /(?:découpage|breakdown|tâche|sous-tâche|subtask|dépendance)/i,
  },
};

// ============================================
// EXPLICIT CEREMONY DECLARATION (PRIMARY - UNBREAKABLE)
// ============================================

/**
 * RULE: Daily Hard Override - checks if the opening speaker announces
 * the Daily Scrum format (hier/aujourd'hui/blocages triplet)
 * within first 180 words or 10-12 lines
 * Returns { isForcedDaily: boolean, confidence: number }
 */
function detectDailyHardOverride(text) {
  if (!text) return { isForcedDaily: false, confidence: 0 };

  // Extract first 180 words for analysis
  const words = text.split(/\s+/).slice(0, 180).join(' ').toLowerCase();

  // Normalize variations: aujourd'hui → auj + hier + bloc + (passé récent + présent/futur + obstacles)
  const normalizeForMatching = (str) => {
    return str
      .replace(/aujourd['´]hui|auj\s*d?[´']?hui|aujdhui|aujourd\s+hui/gi, 'AUJOURD_HUI')
      .replace(/hier/gi, 'HIER')
      .replace(/bloquage|bloquant|blockage|bloquer|obstacle|impediment|empêch/gi, 'BLOCAGE')
      .replace(/ce\s+qu[eo]|what/gi, 'CE_QUE')
      .replace(/avez|as|a(?!u)|ai\s+(?:fait|do)/gi, 'FAIT')
      .replace(/faites|fais|fait|doing|going|va(?:is)?|vais|aller|will/gi, 'FAIT_OU_VA');
  };

  const normalized = normalizeForMatching(words);

  // Pattern 1: Check for all three triplet elements (HIER + AUJOURD_HUI + BLOCAGE)
  // Order-agnostic: just need all three present in first 180 words
  const hasHier = /HIER/i.test(normalized);
  const hasAujourdhui = /AUJOURD_HUI/i.test(normalized);
  const hasBlockage = /BLOCAGE/i.test(normalized);
  const tripletPresent = hasHier && hasAujourdhui && hasBlockage;

  // Pattern 2: Explicit ceremony announcement (format habituel, point quotidien, etc.)
  const announcementPatterns = [
    /(?:format|point|tour|réunion|stand|daily)[\s\w:,]*(?:habituel|quotidien|journalier|matinal|rapide|de\s+(?:la\s+)?réunion)/i,
  ];
  const hasAnnouncement = announcementPatterns.some(p => p.test(normalized));

  // Daily Hard Override: if triplet present + announcement, force Daily
  if (tripletPresent && hasAnnouncement) {
    return { isForcedDaily: true, confidence: 99 };
  }

  // Fallback: just triplet present without explicit announcement (still strong signal)
  if (tripletPresent) {
    return { isForcedDaily: true, confidence: 95 };
  }

  return { isForcedDaily: false, confidence: 0 };
}

function detectExplicitCeremony(text) {
  // PRIMARY: Check Daily Hard Override (triplet pattern)
  const dailyOverride = detectDailyHardOverride(text);
  if (dailyOverride.isForcedDaily) {
    return 'daily';
  }

  // SECONDARY: Check explicit ceremony declarations (first 10 lines)
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

  // Count occurrences of key temporal/blocker keywords (more lenient matching)
  const hierCount = (lower.match(/hier\b/g) || []).length;
  const aujourdhuiCount = (lower.match(/auj(?:ourd)?[']?hui\b/g) || []).length;
  const blockageCount = (lower.match(/blocage|blocages|bloqué|bloqués|pas de blocage|pas de bloquage|blocked|blocking|no blocker/gi) || []).length;

  // Daily structure: at least 2 "hier" + 2 "aujourd'hui" + mention of "blocage" pattern
  // (lowered threshold to catch patterns across multiple speakers)
  const hasStructure = hierCount >= 2 && aujourdhuiCount >= 2 && blockageCount >= 2;

  // Explicit pattern announcement (format habituel)
  const hasAnnouncementPattern = /format\s+habituel|point\s+(?:quotidien|daily)|ce\s+que\s+vous\s+avez\s+fait\s+hier|tour\s+de\s+table/i.test(text);

  // Action sequence pattern: "hier...j'ai" + "aujourd'hui...vais/je"
  const actionSequencePattern = /hier[^.]*(?:j'ai|j'|je\s+(?:ai|suis|vais))[^.]*aujourd['´]?hui[^.]*(?:je\s+(?:vais|fais|continue|dois|vais)|vais|fais)/i;

  return hasStructure || hasAnnouncementPattern || actionSequencePattern.test(text);
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
  
  // If structural Daily pattern exists, HEAVILY penalize Review (UNBREAKABLE)
  if (hasStructuralPatternDaily) {
    score = Math.max(0, score - 100); // Absolute penalty
    return score; // Exit early: Daily pattern dominates
  }

  // REVIEW-SPECIFIC: Must have demo OR stakeholder validation (not just future discussion)
  const hasDemo = matchesAny(text, REVIEW_OBJECTS.demo);
  const hasProduct = matchesAny(text, REVIEW_OBJECTS.product);
  const hasStakeholderValidation = matchesAny(text, REVIEW_DIFFERENTIATORS.stakeholderValidation);
  const hasDemoDelivery = matchesAny(text, REVIEW_DIFFERENTIATORS.demoDelivery);

  // DEMO IS UNBEATABLE - if present with product/validation, Review wins
  const isDemoWithContext = (hasDemo || hasDemoDelivery) && (hasProduct || hasStakeholderValidation);
  if (isDemoWithContext) {
    score += 100; // Maximum score - Review is confirmed
    return score;
  }

  // Strong demo alone is very strong signal
  if (hasDemo) score += 40;
  if (hasDemoDelivery) score += 35;
  if (hasProduct) score += 30;
  if (hasStakeholderValidation && (hasDemo || hasProduct)) score += 30;
  
  // Validation only counts if Demo OR Product is present (context-specific)
  if (matchesAny(text, REVIEW_OBJECTS.validation) && (hasDemo || hasProduct)) score += 20;
  
  // Temporality scoring (past tense confirms review)
  if (matchesAny(text, REVIEW_TIME.past)) score += 15;
  
  // Intent patterns
  if (PATTERNS.review.demoIndicator.test(text)) score += 25;
  if (PATTERNS.review.deliveryFocus.test(text)) score += 25;
  if (PATTERNS.review.stakeholder.test(text)) score += 20;
  
  // CRITICAL DIFFERENTIATOR: If estimation + commitment/breakdown TOGETHER = PLANNING (not just estimation alone)
  const hasEstimation = matchesAny(text, PLANNING_OBJECTS.estimation);
  const hasCommitment = matchesAny(text, PLANNING_DIFFERENTIATORS.commitmentLanguage);
  const hasScopeBreakdown = matchesAny(text, PLANNING_DIFFERENTIATORS.scopeBreakdown);
  
  // Only penalize if it's a PLANNING ceremony pattern (estimation + commitment/scope)
  if (hasEstimation && (hasCommitment || hasScopeBreakdown)) score -= 70;
  
  // Lighter penalty for estimation alone (could be Review discussing delivered work)
  if (hasEstimation && !(hasCommitment || hasScopeBreakdown) && !hasDemo) score -= 20;
  
  // Heavy penalty: if team/process/improvement keywords dominate → Retrospective, not Review
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess)) score -= 50;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.improvement)) score -= 50;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess) && matchesAny(text, RETROSPECTIVE_OBJECTS.improvement)) score -= 30;
  
  // Anti-pattern penalties
  if (matchesAny(text, DAILY_OBJECTS.blockers)) score -= 15;
  
  return Math.max(0, score);
}

function scoreRetrospective(text, hasStructuralPatternDaily = false) {
  let score = 0;
  
  // If structural Daily pattern exists, heavily penalize Retrospective
  if (hasStructuralPatternDaily) score -= 40;
  
  // CRITICAL HARD OVERRIDE: If explicit retro method detected (Speedboat, voiles/ancres/requins, etc.) = RETROSPECTIVE
  const hasRetroMethod = matchesAny(text, RETROSPECTIVE_OBJECTS.retrospectiveMethod);
  if (hasRetroMethod) {
    score += 100; // Maximum score - cannot be beaten
    return score;
  }
  
  // Object scoring (dominant object)
  const hasTeamProcess = matchesAny(text, RETROSPECTIVE_OBJECTS.teamProcess);
  const hasImprovement = matchesAny(text, RETROSPECTIVE_OBJECTS.improvement);
  const hasEmotion = matchesAny(text, RETROSPECTIVE_OBJECTS.emotion);
  const hasTechnicalDebt = PATTERNS.retrospective.technicalDebt.test(text);
  
  if (hasTeamProcess) score += 40;
  if (hasImprovement) score += 35;
  if (hasEmotion) score += 25;
  if (hasTechnicalDebt) score += 30; // Tech debt = retro topic
  
  // Strong bonus if process + improvement (classic retro combo)
  if (hasTeamProcess && hasImprovement) score += 20;
  if (hasImprovement && hasTechnicalDebt) score += 15;
  
  // If Planning keywords dominate, penalize Retrospective heavily
  if (matchesAny(text, PLANNING_OBJECTS.estimation)) score -= 50;
  // Note: DON'T penalize for "future" - retro discusses future improvements
  
  // Temporality scoring (reflective confirms retro)
  if (matchesAny(text, RETROSPECTIVE_TIME.reflective)) score += 15;
  
  // Intent patterns
  if (PATTERNS.retrospective.processAnalysis.test(text)) score += 20;
  if (PATTERNS.retrospective.improvementProposal.test(text)) score += 20;
  if (PATTERNS.retrospective.emotionalContext.test(text)) score += 15;
  if (PATTERNS.retrospective.teamFocus.test(text)) score += 15;
  if (PATTERNS.retrospective.retrospectiveMethod.test(text)) score += 40;
  if (PATTERNS.retrospective.technicalDebt.test(text)) score += 25;
  
  // Anti-pattern penalties
  if (matchesAny(text, REVIEW_OBJECTS.demo)) score -= 30;
  
  return Math.max(0, score);
}

function scorePlanning(text, hasStructuralPatternDaily = false) {
  let score = 0;
  
  // If structural Daily pattern exists, heavily penalize Planning
  if (hasStructuralPatternDaily) score -= 40;
  
  // Object scoring (dominant object)
  const hasEstimation = matchesAny(text, PLANNING_OBJECTS.estimation);
  const hasBacklogSelection = matchesAny(text, PLANNING_OBJECTS.backlogSelection);
  const hasFuture = matchesAny(text, PLANNING_OBJECTS.future);
  const hasDecomposition = matchesAny(text, PLANNING_OBJECTS.decomposition);
  const hasPrioritization = matchesAny(text, PLANNING_OBJECTS.prioritization);
  
  // PLANNING-SPECIFIC SIGNALS (Combined must be present)
  const hasCommitmentLang = matchesAny(text, PLANNING_DIFFERENTIATORS.commitmentLanguage);
  const hasEstimationActivity = matchesAny(text, PLANNING_DIFFERENTIATORS.estimationActivity);
  const hasBacklogWork = matchesAny(text, PLANNING_DIFFERENTIATORS.backlogSelection);
  const hasScopeBreakdown = matchesAny(text, PLANNING_DIFFERENTIATORS.scopeBreakdown);
  
  // CRITICAL: ESTIMATION + COMMITMENT = PLANNING ABSOLUTE (100% confidence)
  // Story points + "on embarque" / "we commit" / "on prend" = Planning, period.
  if (hasEstimation && (hasCommitmentLang || hasEstimationActivity)) {
    score += 100; // Maximum score - cannot be beaten
    return score;
  }
  
  // CRITICAL: If DEMO or stakeholder validation present (Review signals) → NOT Planning
  const hasDemo = matchesAny(text, REVIEW_OBJECTS.demo);
  const hasDemoDelivery = matchesAny(text, REVIEW_DIFFERENTIATORS.demoDelivery);
  const hasStakeholderValidation = matchesAny(text, REVIEW_DIFFERENTIATORS.stakeholderValidation);
  
  if (hasDemo || hasDemoDelivery) score -= 80; // Demo = Review signal
  if (hasStakeholderValidation && (hasDemo || hasDemoDelivery)) score -= 60; // Stakeholder validation with demo = Review
  
  // CRITICAL PENALTY: If retrospective method or improvement focus = NOT Planning
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.retrospectiveMethod)) score -= 100;
  if (matchesAny(text, RETROSPECTIVE_OBJECTS.improvement) && PATTERNS.retrospective.improvementProposal.test(text)) score -= 50;
  
  // Secondary signals: Future + Decomposition (without demo)
  if (hasFuture && (hasDecomposition || hasBacklogSelection) && !hasDemo) score += 50;
  
  // Strong signal: commitment language
  if (hasCommitmentLang && hasFuture) score += 30;
  if (hasEstimationActivity && hasBacklogWork) score += 35;
  if (hasScopeBreakdown && hasBacklogWork) score += 25;
  
  // Prioritization + selection = Planning activity
  if (hasPrioritization && hasBacklogSelection) score += 20;
  
  // Intent patterns (strong indicators of Planning)
  if (PATTERNS.planning.futureCommitment.test(text) && hasFuture) score += 20;
  if (PATTERNS.planning.backlogSelection.test(text) && (hasFuture || hasDecomposition)) score += 15;
  if (PATTERNS.planning.sprintGoal.test(text) && hasFuture) score += 15;
  if (PATTERNS.planning.decomposition.test(text) && hasBacklogSelection) score += 20;
  
  // Anti-pattern penalties
  if (matchesAny(text, DAILY_OBJECTS.blockers)) score -= 15;
  
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