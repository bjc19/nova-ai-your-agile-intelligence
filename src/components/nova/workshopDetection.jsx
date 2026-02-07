// Workshop type detection via semantic textual analysis with ML-inspired learning
// 100% client-side, text-based, no API calls
// Updated with precise Scrum framework distinctions based on ceremony objectives
// Reference: Distinctions claires entre Sprint Planning, Daily Scrum, Sprint Review, Retrospective

// Verb-based detection layer - specific verbs for each ceremony
const CEREMONY_SPECIFIC_VERBS = {
  RETROSPECTIVE: {
    verbs: [
      'améliorer', 'improve', 'arrêter', 'stop', 'cesser', 'cease',
      'commencer', 'start', 'continuer', 'continue', 'corriger', 'correct',
      'expérimenter', 'experiment', 'itérer', 'iterate', 'optimiser', 'optimize',
      'résoudre', 'resolve', 'simplifier', 'simplify', 'tester', 'test',
      'changer', 'change', 'évoluer', 'evolve', 'adapter', 'adapt'
    ],
    patterns: [
      /améliorer|improve|arrêter|stop|cesser|cease/gi,
      /commencer|start|continuer|continue|corriger|correct/gi,
      /expérimenter|experiment|itérer|iterate|optimiser|optimize/gi,
      /résoudre|resolve|simplifier|simplify|tester|test/gi,
      /changer|change|évoluer|evolve|adapter|adapt/gi
    ]
  },
  SPRINT_PLANNING: {
    verbs: [
      'estimer', 'estimate', 'prioriser', 'prioritize', 'sélectionner', 'select',
      'engager', 'commit', 'décomposer', 'decompose', 'affecter', 'assign',
      'valider', 'validate', 'définir', 'define', 'négocier', 'negotiate',
      'planifier', 'plan', 'allouer', 'allocate', 'accepter', 'accept',
      'découper', 'split', 'inclure', 'include', 'exclure', 'exclude'
    ],
    patterns: [
      /estimer|estimate|prioriser|prioritize|sélectionner|select/gi,
      /engager|commit|décomposer|decompose|affecter|assign/gi,
      /valider|validate|définir|define|négocier|negotiate/gi,
      /planifier|plan|allouer|allocate|accepter|accept/gi,
      /découper|split|inclure|include|exclure|exclude/gi
    ]
  },
  DAILY_SCRUM: {
    verbs: [
      'terminer', 'finish', 'commencer', 'start', 'bloquer', 'block',
      'aider', 'help', 'coordonner', 'coordinate', 'reporter', 'defer',
      'avancer', 'progress', 'résoudre', 'resolve', 'tester', 'test',
      'déployer', 'deploy', 'reviewer', 'review', 'documenter', 'document'
    ],
    patterns: [
      /terminer|finish|commencer|start|bloquer|block/gi,
      /aider|help|coordonner|coordinate|reporter|defer/gi,
      /avancer|progress|résoudre|resolve|tester|test/gi,
      /déployer|deploy|reviewer|review|documenter|document/gi
    ]
  },
  SPRINT_REVIEW: {
    verbs: [
      'démontrer', 'demonstrate', 'présenter', 'present', 'montrer', 'show',
      'expliquer', 'explain', 'recevoir', 'receive', 'collecter', 'collect',
      'valider', 'validate', 'illustrer', 'illustrate', 'partager', 'share',
      'questionner', 'question', 'adapter', 'adapt', 'mesurer', 'measure'
    ],
    patterns: [
      /démontrer|demonstrate|présenter|present|montrer|show/gi,
      /expliquer|explain|recevoir|receive|collecter|collect/gi,
      /valider|validate|illustrer|illustrate|partager|share/gi,
      /questionner|question|adapter|adapt|mesurer|measure/gi
    ]
  }
};

const DETECTION_PATTERNS = {
  SPRINT_PLANNING: {
    // Objectif: Déterminer CE QUI sera livré et COMMENT le livrer
    // Focus: Sélection, engagement, planification détaillée
    // Intelligence: Projection sur un horizon futur structuré (sprint, 2 semaines, itération)
    keywords: [
      'sprint goal', 'objectif sprint', 'objectif du sprint', 'goal statement',
      'backlog', 'user stories', 'user story', 'stories', 'tâches', 'tasks', 'items',
      'estimation', 'points', 'story points', 'story point', 'estimated', 'estimer', 'estim',
      'vélocité', 'velocity', 'capacité', 'capacity', 'throughput', 'definition of done', 'dod',
      'inclure', 'exclure', 'ajouter', 'retirer', 'priorité', 'priority', 'scope', 'coverage',
      'planning', 'planification', 'plan de sprint', 'sprint plan', 'itération', 'iteration',
      'assigner', 'assigné', 'assigned', 'owner', 'responsable', 'propriétaire',
      'peut-on réaliser', 'peut-on faire', 'can we', 'what can we', 'réalisable', 'feasible',
      'taille', 'size', 'complexity', 'complexité', 'effort', 'charge',
      'horizon', 'sprints', 'itérations', 'semaines', 'weeks',
      'risque', 'risk', 'dépendance', 'dependency', 'contrainte', 'constraint',
      'critique', 'critical', 'must have', 'should have', 'nice to have',
      'sera livré', 'will deliver', 'livrer', 'deliver', 'accomplished', 'complété'
    ],
    patterns: [
      /sprint goal|objectif.*sprint|goal statement|product goal/gi,
      /user stor(ies|y)|backlog|stories?|tâches?|tasks?|items?/gi,
      /estim|points?|story point|estimated|complexity|complexité|capacity|capacité|effort|charge/gi,
      /inclure|exclure|ajouter|retirer|priorit|scope|négocier|coverage|selection/gi,
      /assigner|assigné|assigned|owner|responsable|propriétaire/gi,
      /peut(-|)?on réaliser|peut(-|)?on faire|can we|what can we|réalisable|feasible|accomplir/gi,
      /sera livré|will deliver|livrer|deliver|accomplished|complété|finished|réalisé/gi,
      /horizon|2 semaines|itération|sprint.*dur|iteration|weeks|cycle de/gi,
      /risque|risk|dépendance|dependency|contrainte|constraint|bloquant|blocking/gi,
      /critique|critical|must have|should have|nice to have|priorisation/gi
    ],
    markers: {
      sprint_goal_definition: (text) => /sprint goal|objectif.*sprint|goal statement|product goal|objectif de l'itération/gi.test(text),
      backlog_items_discussion: (text) => /backlog|user stor|stories?|tâches?|tasks?|items?|work items/gi.test(text),
      estimation_and_sizing: (text) => /estim|points?|story point|effort|complexity|complexité|capacity|capacité|charge|size/gi.test(text),
      prioritization_and_scope: (text) => /inclure|exclure|priorit|scope|négocier|must have|should have|nice to have|coverage/gi.test(text),
      assignment_and_commitment: (text) => /assigner|assigné|assigned|owner|responsable|propriétaire|s'engager|commitment/gi.test(text),
      future_temporal_horizon: (text) => /horizon|ce sprint|this sprint|prochain|next|2 semaines|itération|week|sprints?|semaines|duration/gi.test(text),
      future_projection_language: (text) => /sera|will be|allons|we will|va faire|going to|planning to|plan|prévoir|anticipate|projet/gi.test(text),
      feasibility_discussion: (text) => /peut(-|)?on|can we|réalisable|feasible|possible|accomplissable|what can we/gi.test(text),
      delivery_focus: (text) => /sera livré|will deliver|livrer|deliver|accomplir|accomplish|complété|completed|finished/gi.test(text),
      risk_and_dependency_analysis: (text) => /risque|risk|dépendance|dependency|contrainte|constraint|bloquant|blocking|impact/gi.test(text),
      
      // Exclusion markers - if these are present, it's likely NOT Planning
      no_demo: (text) => !/démo|démonstration|show|présent|fonctionnalité|feature\s+livr|incrément|delivered|écran|screen/gi.test(text),
      no_retrospective: (text) => !/amélioration|apprentissage|ce qu'on|what went|went well|went wrong|retrospective|retro|debrief|fonctionn[ée]|s'est bien|s'est mal/gi.test(text),
      no_standup: (text) => !/hier|aujourd'hui|ce matin|cet après|yesterday|today|this morning|bloc|blocked|aide/gi.test(text) || /estimation|backlog|sprint goal|planning/gi.test(text)
    }
  },

  DAILY_SCRUM: {
    // Objectif: Synchronisation quotidienne, identification des blocages
    // Focus: Progression, obstacles, coordination immédiate
    keywords: [
      'hier', 'aujourd\'hui', 'ce matin', 'cet après-midi', 'demain',
      'fait hier', 'ai fait', 'travaillé hier', 'hier j\'ai',
      'today', 'yesterday', 'this morning', 'this afternoon',
      'vais faire', 'vais continuer', 'will do', 'going to do',
      'bloqué', 'blocage', 'stoppé', 'arrêté', 'attendant',
      'aide', 'support', 'problème', 'issue',
      'blocked', 'blocked by', 'waiting for', 'need help',
      'standup', 'stand-up', 'daily standup', 'daily scrum',
      'standup quotidien', 'tour de table', 'chacun son tour',
      'statut', 'status', 'fait', 'done', 'en cours', 'in progress',
      'terminé', 'finished', 'démarré', 'started'
    ],
    patterns: [
      /\w+\s*:\s*[^:\n]{10,}/g, // "Name: text" pattern (round-table)
      /hier|aujourd['u]i|ce matin|cet apr[eè]s-midi|demain|yesterday|today|this morning|tomorrow/gi,
      /j'ai|ai fait|a fait|ont fait|did|finished|completed/gi,
      /vais|vas|va faire|will do|going to/gi,
      /bloqué|blocage|arrêté|stoppé|en attente|aide|support|issue|blocked|waiting|help/gi,
      /standup|stand-up|daily scrum|tour de table|tour rapide/gi
    ],
    markers: {
      sequential_roundtable: (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        let namePatternCount = 0;
        lines.forEach(line => {
          if (/^\s*\w+\s*:/.test(line)) namePatternCount++;
        });
        return namePatternCount >= 3;
      },
      short_temporal_focus: (text) => /hier|aujourd['u]i|ce matin|cet apr[eè]s-midi|demain|yesterday|today|this morning/gi.test(text),
      operational_blockers: (text) => /bloqué|blocage|aide|support|attend|waiting|blocked|help|problème|issue|obstacle/gi.test(text),
      rapid_status_exchanges: (text) => /fait|terminé|en cours|démarré|started|done|in progress|finished/gi.test(text),
      short_utterances: (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 3) return false;
        const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
        return avgLineLength < 150; // Short utterances typical of standups
      },
      no_strategic_planning: (text) => !/estimation|story point|backlog|user stor|capacité|velocity|planification|sprint plan/gi.test(text),
      no_demo: (text) => !/démo|démonstration|show|présent|fonctionnalité|feature|incrément/gi.test(text),
      no_retrospective: (text) => !/amélioration|apprentissage|ce qu'on|what went|went well|went wrong|retrospective|retro/gi.test(text)
    }
  },

  SPRINT_REVIEW: {
    // Objectif: Inspecter l'incrément et adapter le backlog
    // Focus: Démonstration, feedback, validation de la valeur
    keywords: [
      'démo', 'demo', 'démonstration', 'demonstration', 'montrer', 'montré', 'show', 'shown',
      'fonctionnalité', 'feature', 'features', 'delivered', 'livrée', 'livré',
      'incrément', 'increment', 'résultat', 'result', 'réalisé', 'accomplished',
      'feedback', 'retour', 'opinion', 'avis', 'thoughts', 'qu\'en pensez',
      'po', 'product owner', 'client', 'utilisateur', 'user', 'stakeholder',
      'valeur', 'value', 'impact', 'utilité', 'usefulness',
      'slide', 'écran', 'screen', 'présentation', 'presentation',
      'comment ça marche', 'how it works', 'voici', 'here is'
    ],
    patterns: [
      /démo|démonstration|demo|demonstration|montrer|show|présent/gi,
      /fonctionnalité|feature|livré|delivered|incrément|increment|réalisé|accomplished/gi,
      /feedback|retour|avis|opinion|qu'en pensez|qu'en pense|what do you think/gi,
      /po|product owner|client|utilisateur|user|stakeholder|partie prenante|externes?/gi,
      /valeur|value|impact|utilité|useful|bénéf/gi,
      /slide|écran|screen|présent|presentation|voici|here is|comme vous pouvez/gi
    ],
    markers: {
      demo_vocabulary: (text) => /démo|démonstration|show|montrer|présent|fonctionnalité|feature|livré/gi.test(text),
      delivered_increment: (text) => /livré|delivered|réalisé|accomplished|incrément|increment|réalisat/gi.test(text),
      feedback_collection: (text) => /feedback|retour|avis|opinion|qu'en|what.*think|thoughts|comment.*trouvez/gi.test(text),
      external_focus: (text) => /po|product owner|client|utilisateur|user|stakeholder|externe|external|partie prenante/gi.test(text),
      value_focus: (text) => /valeur|value|impact|utilité|bénéfice|benefit|business value/gi.test(text),
      presentation_structure: (text) => /voici|here|slide|écran|screen|montrer|show|présent|demo|démonstr/gi.test(text),
      
      // Exclusion markers
      no_planning: (text) => !/estimation|story point|backlog|user stor|vélocité|velocity|assigné|capacité/gi.test(text),
      no_retrospective: (text) => !/amélioration|apprentissage|ce qu'on|what went|went well|went wrong|retrospective|retro/gi.test(text),
      no_standup: (text) => !/hier|aujourd'hui|ce matin|yesterday|today|blocage|bloqué|blocked/gi.test(text) || /démo|feedback|stakeholder/gi.test(text)
    }
  },

  RETROSPECTIVE: {
    // Objectif: Inspecter et adapter le processus - Évaluation fin de cycle
    // Intelligence: End-of-cycle reflection, root cause analysis (5 whys), continuous improvement, action ownership
    keywords: [
      'amélioration', 'improvement', 'améliorer', 'apprentissage', 'learning', 'leçon', 'lesson',
      'fonctionné', 'worked', 'marché', 'went well', 'ce qui a bien', 'a fonctionné',
      'à améliorer', 'to improve', 'pourrait être mieux', 'could be better', 'faire mieux',
      'problème', 'problem', 'friction', 'processus', 'process', 'méthode', 'method',
      'start stop continue', 'mad sad glad', '4l', 'thermomètre', 'rétro format',
      'plus', 'moins', 'delta', 'bien', 'mal', 'plus et moins', 'positif', 'négatif',
      'action d\'amélioration', 'improvement action', 'plan d\'action', 'action plan',
      'comment faire mieux', 'how to improve', 'faire évoluer', 'process change', 'évolution',
      'ce sprint', 'this sprint', 'la semaine', 'the last sprint', 'l\'itération', 'cycle',
      'ce qu\'on a', 'what went', 's\'est bien passé', 's\'est mal passé', 'ce qui',
      'rétrospective', 'retro', 'rétro', 'retrospective', 'débriefing', 'debrief', 'bilan',
      'équipe', 'team', 'nous', 'we', 'obstacles', 'ralenti', 'slowed down', 'bloqué',
      'récurrent', 'recurring', 'pattern', 'répétitif', 'tendance', 'trend', 'systématique',
      'pourquoi', 'why', 'root cause', 'cause racine', 'analyse', '5 whys', 'causale',
      'résolution', 'resolution', 'responsable', 'owner', 'porteur', 'engagement',
      'décision', 'decision', 'engager', 'commit', 'prochaine fois', 'next time'
    ],
    patterns: [
      /amélior|apprentiss|leçon|lesson|fonctionn[ée]|marché|went well|what went|worked/gi,
      /à améliorer|to improve|pourrait être mieux|could be better|faire mieux|faire évoluer/gi,
      /problème|problem|friction|processus|process|obstacle|issue|concern|méthode/gi,
      /start.?stop.?continue|mad.?sad.?glad|4l|thermomètre|plus.?moins|bien.?mal|good.?bad/gi,
      /action.*amélioration|amélioration.*action|plan d'action|action plan|action items/gi,
      /comment faire mieux|how to improve|faire évoluer|process change|change.*process/gi,
      /ce sprint|this sprint|la semaine|the last sprint|l'itération|au cours du sprint|cycle complété/gi,
      /ce qu'on|what went well|went wrong|s'est bien|s'est mal|a fonctionné|a échoué|ce qui/gi,
      /rétrospective|retro|rétro|retrospective|débriefing|debrief|team retrospective|bilan/gi,
      /équipe|team|nous|we|on a|we have|notre|our|ensemble|collectively/gi,
      /récurrent|recurring|pattern|répétitif|tendance|trend|friction|ralenti|slowed|systématique/gi,
      /pourquoi|why|root cause|cause racine|analyse|analysis|5 whys|trop|pas assez|why didn't/gi,
      /résolution|resolution|responsable|owner|porteur|engagement|s'engager|décision/gi,
      /prochaine fois|next time|on va|we will|à l'avenir|in the future|améliorer|improve/gi
    ],
    markers: {
      retrospective_ceremony: (text) => /retrospective|retro|rétrospective|debrief|débriefing|post-mortem|bilan/gi.test(text),
      end_of_cycle_language: (text) => /fin de sprint|end of sprint|ce sprint|this sprint|cycle complété|dernier sprint|last sprint/gi.test(text),
      process_evaluation: (text) => /processus|process|méthode|method|workflow|façon de travailler|équipe|team|collaboration/gi.test(text),
      positive_negative_reflection: (text) => /qu'est-ce qui|what went|bien|positif|mal|négatif|positive|negative|went well|went wrong|succès|difficulty/gi.test(text),
      root_cause_analysis: (text) => /pourquoi|why|cause|root cause|analyse|analysis|5 whys|trop|pas assez|why didn't|how come|causale/gi.test(text),
      continuous_improvement_focus: (text) => /amélioration|improvement|améliorer|optimize|optimiser|enhance|adapter|adapt|éviter|avoid|faire autrement/gi.test(text),
      action_and_ownership: (text) => /résolution|resolution|action|décision|engagement|s'engager|responsable|owner|porteur|assigné|next step|plan/gi.test(text),
      learning_and_reflection: (text) => /apprentissage|learning|leçon|lesson|insight|découvert|réalisation|compris|understood|appris|réalisé/gi.test(text),
      team_reflection_and_dynamics: (text) => /équipe|team|nous|we|on|notre|our|ensemble|together|collectif|collaborative|communication/gi.test(text),
      
      // Exclusion markers
      no_planning_scope: (text) => !/estimation|story point|backlog|user stor|vélocité|velocity|assigné|capacité|planification|sprint goal/gi.test(text),
      no_demo: (text) => !/démo|démonstration|show|livr|présent|fonctionnalité|feature|livré|delivered|incrément|stakeholder/gi.test(text),
      no_standup: (text) => !/hier|aujourd'hui|ce matin|cet après|yesterday|today|blocage|bloqué|blocked|aide|working on|vais faire/gi.test(text) || /amélioration|apprentissage|retrospective|processus/gi.test(text)
    }
  },

  KANBAN: {
    keywords: [
      'work in progress', 'wip', 'wip limit', 'wip limits', 'limites wip', 'limite de wip',
      'flux', 'flow', 'throughput', 'débit', 'lead time', 'cycle time',
      'colonnes', 'columns', 'tableau kanban', 'kanban board', 'pull system',
      'continuous delivery', 'livraison continue', 'cadences', 'cadence',
      'optimiser', 'optimize', 'améliorer le flux', 'improve flow'
    ],
    patterns: [
      /wip|work in progress|work-in-progress|limite de wip|wip limit/gi,
      /flux|flow|throughput|débit|lead time|cycle time/gi,
      /colonne|column|kanban|pull system|tableau kanban/gi,
      /continuous delivery|livraison continue|cadence|cadences/gi,
      /optimiser|optimize|améliorer.*flux|improve.*flow/gi
    ],
    markers: {
      kanban_vocabulary: (text) => /wip|work in progress|kanban|pull system|lead time|cycle time/gi.test(text),
      flow_metrics_focus: (text) => /flux|flow|throughput|débit|optimize|lead time|cycle time/gi.test(text),
      wip_discussion: (text) => /wip|work in progress|limite|limit/gi.test(text),
      no_scrum_artifacts: (text) => !/sprint|planification|planning|story point|vélocité|velocity|standup|retrospective/gi.test(text)
    }
  },

  SAFE: {
    keywords: [
      'pi planning', 'art', 'agile release train', 'system demo',
      'features', 'enablers', 'portfolio', 'value stream', 'lpm',
      'programme', 'program', 'train', 'trains', 'multi-équipes',
      'grande échelle', 'large scale', 'scaled agile', 'safe'
    ],
    patterns: [
      /pi planning|pi.?planning|agile release train|art\b/gi,
      /feature|enabler|value stream|portfolio|programme/gi,
      /grande échelle|large scale|scaled agile|safe|safe framework/gi,
      /train|multiple teams|multi-équipes|cross-team|cross-équipes/gi
    ],
    markers: {
      safe_vocabulary: (text) => /pi planning|art|agile release train|safe|scaled agile/gi.test(text),
      large_scale_context: (text) => /programme|program|train|trains|grande échelle|large scale|portfolio/gi.test(text),
      multi_team_coordination: (text) => /multiple teams|multi-équipes|cross-team|cross team|portfolio|lpm/gi.test(text)
    }
  }
};

export function detectWorkshopType(text) {
  if (!text || text.trim().length < 20) {
    return {
      type: 'Autre',
      subtype: 'Autre',
      confidence: 0,
      justifications: ['Texte trop court'],
      tags: ['#Indéterminé']
    };
  }

  const scores = {};

  // Step 1: Check for non-Scrum frameworks first (decision tree logic)
  if (/wip|work.?in.?progress|kanban|lead time|cycle time|flux|flow/gi.test(text) &&
      !/sprint|planning|story point|vélocité|velocity/gi.test(text)) {
    return {
      type: 'Autre',
      subtype: '#Kanban',
      confidence: 85,
      justifications: ['Présence de vocabulaire Kanban (WIP, lead time, flux)', 'Absence de patterns Scrum'],
      tags: ['#Kanban', '#FluxContinu', '#WIP']
    };
  }

  if (/pi.?planning|agile release train|art\b|safe framework/gi.test(text) ||
      (/programme|program|train|portfolio|multi-équipes/gi.test(text) && /grande échelle|large scale|scaled agile/gi.test(text))) {
    return {
      type: 'Autre',
      subtype: '#SAFe',
      confidence: 85,
      justifications: ['Vocabulaire SAFe détecté', 'Framework de scaling'],
      tags: ['#SAFe', '#GrandeEchelle', '#Programme']
    };
  }

  // Step 2: Score each Scrum ceremony type with precise multi-variable detection
  Object.entries(DETECTION_PATTERNS).forEach(([ceremonyType, config]) => {
    let score = 0;
    const matchedMarkers = [];

    if (ceremonyType === 'KANBAN' || ceremonyType === 'SAFE') {
      return; // Already handled above
    }

    // Intelligence: Detect temporal horizon (key differentiator for Planning)
    const hasFutureHorizon = ceremonyType === 'SPRINT_PLANNING' &&
      /horizon|sprint|itération|2 semaines|semaines|week|cycle|planning horizon|upcoming/gi.test(text);
    const hasCommitmentLanguage = ceremonyType === 'SPRINT_PLANNING' &&
      /s'engager|commitment|assigner|assigned|responsable|owner/gi.test(text);
    const hasNegotiationLanguage = ceremonyType === 'SPRINT_PLANNING' &&
      /inclure|exclure|négocier|scope|priorité|can we|can't we|must have|should have/gi.test(text);

    // Check exclusion markers first
    const markerEntries = Object.entries(config.markers);
    let exclusionCount = 0;
    const hasExclusions = [];

    markerEntries.forEach(([markerName, markerFn]) => {
      if (markerName.startsWith('no_') && markerFn(text)) {
        exclusionCount++;
        hasExclusions.push(markerName);
      }
    });

    // Base score reduced by exclusions
    score = Math.max(15 - exclusionCount * 12, 0);

    // Score positive markers with higher precision for Planning
    let positiveMarkerCount = 0;
    markerEntries.forEach(([markerName, markerFn]) => {
      if (!markerName.startsWith('no_')) {
        if (markerFn(text)) {
          const markerWeight = ceremonyType === 'SPRINT_PLANNING' ? 20 : 24;
          score += markerWeight;
          matchedMarkers.push(markerName.replace(/_/g, ' '));
          positiveMarkerCount++;
        }
      }
    });

    // Bonus for multiple positive markers (multi-variable detection)
    if (positiveMarkerCount >= 5) {
      score += 10; // Strong confidence with 5+ markers
    } else if (positiveMarkerCount >= 3) {
      score += 5;
    }

    // Keyword density (refined)
    const keywords = config.keywords || [];
    const keywordMatches = keywords.filter(kw =>
      new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(text)
    ).length;

    const keywordDensity = (keywordMatches / Math.max(keywords.length, 1)) * 100;
    score += Math.min(keywordDensity * 0.3, 15); // Max 15 points

    // Intelligence boost: Planning-specific multi-variable analysis (8+ variables)
    if (ceremonyType === 'SPRINT_PLANNING') {
      let intelligenceBonus = 0;
      
      // Multi-variable detection for Planning (projection future + engagement + négociation)
      if (hasFutureHorizon) intelligenceBonus += 8;
      if (hasCommitmentLanguage) intelligenceBonus += 8;
      if (hasNegotiationLanguage) intelligenceBonus += 8;
      
      // Temporal horizon is a strong differentiator
      if (/sprint.*dur|2 semaines|itération|planning horizon|upcoming sprint|le prochain sprint/gi.test(text)) {
        intelligenceBonus += 10;
      }
      
      // CRUCIAL: Temporal focus on FUTURE (key differentiator from Retrospective)
      // Planning focuses on what WILL happen, with unknowns, uncertainties, estimations
      const futureReferences = (text.match(/sera|will be|va|going to|planning|prévoir|le prochain|next|upcoming|va faire|will do/gi) || []).length;
      const estimationLanguage = (text.match(/planning poker|t-shirt sizing|sizing|estimation|points?|story point|buffer|unknowns|incertitude|incertitudes|on ne sait|risks?|dépendances|dependencies/gi) || []).length;
      const pastReferences = (text.match(/s'est|a été|a fonctionné|lors du|pendant|au cours|l'impact|the impact/gi) || []).length;
      
      if (futureReferences >= 4 && estimationLanguage >= 2 && futureReferences > pastReferences) {
        intelligenceBonus += 10; // Strong future-focus + estimation language = strong planning signal
      }
      
      // LAYER: Ceremony-specific verbs (strongest semantic signal for Planning)
      const planningVerbMatches = CEREMONY_SPECIFIC_VERBS.SPRINT_PLANNING.patterns.reduce((count, pattern) => {
        const matches = text.match(pattern) || [];
        return count + matches.length;
      }, 0);
      
      if (planningVerbMatches >= 3) {
        intelligenceBonus += 15; // Very strong signal - multiple planning-specific verbs
      } else if (planningVerbMatches >= 1) {
        intelligenceBonus += 8;
      }
      
      score = Math.min(score + intelligenceBonus, 100);
    }

    // Intelligence boost: Retrospective-specific multi-variable analysis (8+ variables)
    if (ceremonyType === 'RETROSPECTIVE') {
      let retroBonus = 0;
      
      // 1. End-of-cycle language (fin de sprint, bilan)
      if (/fin de sprint|end of sprint|ce sprint|this sprint|cycle complété|dernier sprint|last sprint|bilan/gi.test(text)) {
        retroBonus += 8;
      }
      
      // 2. Process evaluation (fokus on how we work)
      if (/processus|process|méthode|method|workflow|façon de travailler|équipe|team|collaboration/gi.test(text)) {
        retroBonus += 7;
      }
      
      // 3. What worked + what didn't (positive/negative reflection)
      if (/qu'est-ce qui|what went|bien|mal|positive|negative|went well|went wrong|succès|difficulty|fonctionné|échoué/gi.test(text)) {
        retroBonus += 8;
      }
      
      // 4. Root cause analysis (5 whys, why, causale)
      if (/pourquoi|why|cause|root cause|analyse|analysis|5 whys|trop|pas assez|why didn't|how come/gi.test(text)) {
        retroBonus += 8;
      }
      
      // 5. Continuous improvement focus
      if (/amélioration|improvement|améliorer|optimize|enhance|adapter|adapt|faire autrement/gi.test(text)) {
        retroBonus += 7;
      }
      
      // 6. Action and ownership (résolution, responsable, porteur)
      if (/résolution|resolution|action|décision|engagement|s'engager|responsable|owner|porteur|assigné/gi.test(text)) {
        retroBonus += 8;
      }
      
      // 7. Team reflection (équipe, nous, ensemble, collectif)
      if (/équipe|team|nous|we|on|notre|our|ensemble|together|collectif|collaborative/gi.test(text)) {
        retroBonus += 7;
      }
      
      // 8. CRUCIAL: Temporal focus on PAST (key differentiator from Planning)
      // Retrospective focuses on what happened, Planning focuses on what WILL happen
      const pastReferences = (text.match(/s'est|a été|a fonctionné|a échoué|on a|nous avons|we had|we were|during|pendant|au cours|lors du|l'impact|the impact/gi) || []).length;
      const futureReferences = (text.match(/sera|will be|va|going to|planning|prévoir|estimé|estimation|planning poker|t-shirt|sizing|buffer|unknowns/gi) || []).length;
      
      if (pastReferences > futureReferences && pastReferences >= 4) {
        retroBonus += 10; // Strong past-focus = strong retro signal
      }
      
      // 9. LAYER: Ceremony-specific verbs (strongest semantic signal)
      const retroVerbMatches = CEREMONY_SPECIFIC_VERBS.RETROSPECTIVE.patterns.reduce((count, pattern) => {
        const matches = text.match(pattern) || [];
        return count + matches.length;
      }, 0);
      
      if (retroVerbMatches >= 3) {
        retroBonus += 15; // Very strong signal - multiple retro-specific verbs
      } else if (retroVerbMatches >= 1) {
        retroBonus += 8;
      }
      
      score = Math.min(score + retroBonus, 100);
    }

    scores[ceremonyType] = {
      score: Math.max(0, Math.min(score, 100)),
      markers: matchedMarkers.slice(0, 4)
    };
  });

  // Step 3: Determine best match with confidence threshold
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score);
  const [bestType, bestScore] = sorted[0];

  const typeMapping = {
    DAILY_SCRUM: { display: 'Daily Scrum', tags: ['#Standup', '#Quotidien', '#TourDeTable'] },
    SPRINT_PLANNING: { display: 'Sprint Planning', tags: ['#Planification', '#Estimation', '#Backlog'] },
    SPRINT_REVIEW: { display: 'Sprint Review', tags: ['#Démonstration', '#Feedback', '#Valeur'] },
    RETROSPECTIVE: { display: 'Retrospective', tags: ['#Rétrospective', '#Amélioration', '#Processus'] }
  };

  const mapping = typeMapping[bestType] || { display: 'Autre', tags: ['#Autre', '#Indéterminé'] };

  // Low confidence or no clear match
  if (bestScore.score < 40) {
    return {
      type: 'Autre',
      subtype: 'Autre',
      confidence: Math.round(bestScore.score),
      justifications: ['Patterns Scrum insuffisants détectés'],
      tags: ['#Autre', '#Indéterminé']
    };
  }

  // Special handling: Planning vs others with close scores
  if (bestType === 'SPRINT_PLANNING' && bestScore.score >= 40) {
    // Verify strong Planning signals
    const planningSignals = [
      /sprint goal|objectif.*sprint/gi.test(text),
      /estimation|points?|story point/gi.test(text),
      /horizon|sprint|itération|2 semaines/gi.test(text),
      /engagement|commitment|assigner|responsable/gi.test(text)
    ];
    const planningSignalCount = planningSignals.filter(s => s).length;
    
    if (planningSignalCount >= 2) {
      bestScore.score = Math.min(bestScore.score + 15, 100);
    }
  }

  // Special handling: Retrospective vs others with close scores
  if (bestType === 'RETROSPECTIVE' && bestScore.score >= 40) {
    // Verify strong Retrospective signals (multi-variable confirmation)
    const retroSignals = [
      /fin de sprint|ce sprint|cycle complété|dernier sprint/gi.test(text),
      /qu'est-ce qui|what went|bien|mal|positive|negative|went well|went wrong/gi.test(text),
      /amélioration|improvement|améliorer|process change/gi.test(text),
      /résolution|resolution|responsable|owner|action/gi.test(text),
      /équipe|team|nous|we|collectif/gi.test(text)
    ];
    const retroSignalCount = retroSignals.filter(s => s).length;
    
    if (retroSignalCount >= 3) {
      bestScore.score = Math.min(bestScore.score + 12, 100);
    }
  }

  return {
    type: mapping.display,
    subtype: null,
    confidence: Math.round(bestScore.score),
    justifications: bestScore.markers.length > 0
      ? bestScore.markers
      : ['Patterns agiles identifiés'],
    tags: mapping.tags || [],
    allScores: Object.entries(scores).map(([type, s]) => ({
      type: typeMapping[type]?.display || type,
      score: Math.round(s.score)
    }))
  };
}