// Workshop type detection via semantic textual analysis
// 100% client-side, text-based, no API calls

const DETECTION_PATTERNS = {
  DAILY_SCRUM: {
    keywords: [
      'hier', 'aujourd\'hui', 'ce matin', 'cet après-midi',
      'fait hier', 'travaillé hier', 'vais faire', 'vais continuer',
      'bloqué', 'blocage', 'stoppé', 'arrêté', 'attendant',
      'aide', 'support needed', 'blocked by', 'waiting for',
      'standup', 'stand-up', 'daily standup', 'daily scrum', 'standup quotidien'
    ],
    patterns: [
      /\b\w+\s*:\s*[^:\n]{10,}/g, // "Name: text" pattern (round-table)
      /hier|aujourd[\'u]i|ce matin|cet apr[eè]s-midi/gi, // short-term temporal
      /bloqué|blocage|arrêté|stoppé|en attente/gi, // operational blockers
    ],
    markers: {
      sequential_structure: (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        let count = 0;
        lines.forEach(line => {
          if (/^\w+\s*:/.test(line)) count++;
        });
        return count >= 3; // At least 3 "Name:" patterns
      },
      short_temporal: (text) => /hier|aujourd['u]i|ce matin|cet apr[eè]s-midi|yesterday|today|this morning/gi.test(text),
      operational_focus: (text) => /bloqué|blocage|aide|support|attend|waiting|blocked|help|issue/gi.test(text),
      no_strategic: (text) => !/stratégique|long terme|roadmap|vision|direction|vision à long terme/gi.test(text)
    }
  },

  SPRINT_PLANNING: {
    keywords: [
      'sprint goal', 'objectif sprint', 'backlog', 'user stories', 'user story',
      'estimation', 'points', 'story points', 'vélocité', 'velocity', 'capacité',
      'definition of done', 'dod', 'stories', 'tâches', 'tasks',
      'inclure', 'exclure', 'priorité', 'priority', 'scope',
      'planning', 'planification'
    ],
    patterns: [
      /sprint goal|objectif du sprint|goal statement/gi,
      /user stor(ies|y)|backlog item|story|tâche|task/gi,
      /estim|points?|story point|capacité|velocity|vélocité/gi,
      /inclure|exclure|ajouter|retirer|priorit/gi,
    ],
    markers: {
      planning_vocab: (text) => /sprint goal|backlog|user stor|estimation|points|capacité|definition of done|dod/gi.test(text),
      prioritization: (text) => /inclure|exclure|priorit|scope|ajouter|retirer|négocier/gi.test(text),
      effort_discussion: (text) => /estim|points|capacité|effort|complexity|difficul/gi.test(text),
      fixed_horizon: (text) => /sprint de|2 semaines|itération|2 weeks|iteration|sprint duration/gi.test(text)
    }
  },

  SPRINT_REVIEW: {
    keywords: [
      'démo', 'demo', 'montrer', 'montré', 'show', 'shown', 'fonctionnalité', 'feature',
      'résultat', 'result', 'slide', 'écran', 'screen', 'présentation',
      'comment ça marche', 'how it works', 'feedback', 'retour', 'opinion',
      'po', 'client', 'utilisateur', 'user', 'stakeholder', 'valeur', 'value'
    ],
    patterns: [
      /démo|démonstration|demo|demonstration|montrer|show/gi,
      /fonctionnalité|feature|résultat|result|sortie|output/gi,
      /feedback|retour|opinion|avis|thoughts/gi,
      /po|client|utilisateur|user|stakeholder|partie prenante/gi,
    ],
    markers: {
      demo_vocab: (text) => /démo|démonstration|montrer|show|fonctionnalité|feature/gi.test(text),
      feedback_structure: (text) => /feedback|retour|avis|opinion|comment|qu'en|how/gi.test(text),
      external_audience: (text) => /po|client|utilisateur|user|stakeholder|externe|external/gi.test(text),
      value_discussion: (text) => /valeur|value|livrée|delivered|impact|utilité/gi.test(text)
    }
  },

  RETROSPECTIVE: {
    keywords: [
      'amélioration', 'improvement', 'apprentissage', 'learning', 'fonctionné', 'worked',
      'marché', 'à améliorer', 'to improve', 'problème', 'problem', 'processus', 'process',
      'start stop continue', 'mad sad glad', '4l', 'thermomètre', 'plus', 'moins', 'delta',
      'action d\'amélioration', 'improvement action', 'plan d\'action', 'action plan',
      'comment faire mieux', 'how to improve', 'rétro', 'retrospective', 'retro'
    ],
    patterns: [
      /amélior|apprentiss|fonctiomn[né]|marché|problème|issue|concern/gi,
      /start.?stop.?continue|mad.?sad.?glad|4l|thermomètre|plus.?moins/gi,
      /action.*amélioration|amélioration.*action|plan d'action|action plan/gi,
      /comment faire mieux|how to improve|faire évoluer|process change/gi,
    ],
    markers: {
      introspective_vocab: (text) => /amélior|apprentiss|fonctionn[ée]|marché|problème|processus/gi.test(text),
      reflection_structure: (text) => /start.?stop.?continue|mad.?sad.?glad|bien.?mal|good.?bad|plus.?moins/gi.test(text),
      improvement_actions: (text) => /action|plan|proposer|proposé|engager|commit|changement|change/gi.test(text),
      pattern_identification: (text) => /récurrent|recurring|pattern|répétitif|recurring|tendance/gi.test(text)
    }
  },

  KANBAN: {
    keywords: [
      'work in progress', 'wip', 'wip limits', 'limites wip', 'flux', 'flow',
      'lead time', 'cycle time', 'throughput', 'débit',
      'colonnes', 'columns', 'tableau kanban', 'kanban board', 'pull system',
      'cadences', 'cadence', 'continuous delivery', 'livraison continue'
    ],
    patterns: [
      /wip|work in progress|work-in-progress|limite de wip/gi,
      /flux|flow|throughput|débit|lead time|cycle time/gi,
      /colonne|column|kanban|pull system|tableau kanban/gi,
      /cadence|continuous delivery|livraison continue/gi,
    ],
    markers: {
      kanban_vocab: (text) => /wip|work in progress|flux|flow|kanban|lead time|cycle time/gi.test(text),
      flow_focus: (text) => /flux|flow|throughput|débit|optimiser|optimize/gi.test(text),
      wip_limits: (text) => /wip|work in progress|limite|limit/gi.test(text),
      no_scrum: (text) => !/sprint|planning|story point|vélocité|velocity/gi.test(text)
    }
  },

  SAFE: {
    keywords: [
      'pi planning', 'art', 'agile release train', 'system demo',
      'features', 'enablers', 'portfolio', 'value stream',
      'programme', 'program', 'train', 'trains',
      'grande échelle', 'large scale', 'scaled agile'
    ],
    patterns: [
      /pi planning|pi.?planning|agile release train|art\b/gi,
      /feature|enabler|value stream|portfolio|programme/gi,
      /grande échelle|large scale|scaled agile|safe|safe framework/gi,
      /train|multiple teams|multi-équipes|cross-team/gi,
    ],
    markers: {
      safe_vocab: (text) => /pi planning|art|agile release train|safe|scaled agile/gi.test(text),
      large_scale: (text) => /programme|program|train|trains|grande échelle|large scale/gi.test(text),
      multi_team: (text) => /multiple teams|multi-équipes|cross-team|cross team|portfolio/gi.test(text),
      strategic_alignment: (text) => /stratégique|strategic|alignment|aligné|roadmap|vision/gi.test(text)
    }
  }
};

export function detectWorkshopType(text) {
  if (!text || text.trim().length < 20) {
    return {
      type: 'Autre',
      subtype: 'Autre',
      confidence: 0,
      justification: 'Texte trop court ou vide',
      tags: ['#Indéterminé']
    };
  }

  const scores = {};

  // Score each ceremony type
  Object.entries(DETECTION_PATTERNS).forEach(([ceremonyType, config]) => {
    let score = 0;
    const justifications = [];

    // Check markers (weighted)
    Object.entries(config.markers).forEach(([markerName, markerFn]) => {
      if (markerFn(text)) {
        score += 20;
        justifications.push(`${markerName.replace(/_/g, ' ')}`);
      }
    });

    // Check keyword density
    const keywords = config.keywords || [];
    const keywordMatches = keywords.filter(kw => 
      new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(text)
    ).length;
    
    const keywordDensity = (keywordMatches / Math.max(keywords.length, 1)) * 100;
    score += Math.min(keywordDensity * 0.3, 25); // Max 25 points for keywords

    scores[ceremonyType] = {
      score: Math.min(score, 100),
      justifications: justifications.slice(0, 3) // Top 3 justifications
    };
  });

  // Determine best match
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score);
  const [bestType, bestScore] = sorted[0];

  // Map to user-facing type
  const typeMapping = {
    DAILY_SCRUM: { display: 'Daily Scrum', tags: ['#Standup', '#Quotidien', '#TourDeTable'] },
    SPRINT_PLANNING: { display: 'Sprint Planning', tags: ['#Planification', '#Estimation', '#Backlog'] },
    SPRINT_REVIEW: { display: 'Sprint Review', tags: ['#Démonstration', '#Feedback', '#Valeur'] },
    RETROSPECTIVE: { display: 'Retrospective', tags: ['#Rétrospective', '#Amélioration', '#Processus'] },
    KANBAN: { display: 'Autre', subtype: '#Kanban', tags: ['#Kanban', '#FluxContinu', '#WIP'] },
    SAFE: { display: 'Autre', subtype: '#SAFe', tags: ['#SAFe', '#GrandeEchelle', '#Programme'] }
  };

  const mapping = typeMapping[bestType] || { display: 'Autre', subtype: 'Autre', tags: ['#Autre', '#Indéterminé'] };
  
  // Confidence calculation
  let confidence = bestScore.score;
  if (bestScore.score < 30) {
    confidence = Math.max(confidence, 15); // At least show low confidence
    mapping.display = 'Autre';
    mapping.subtype = mapping.subtype || 'Autre';
    mapping.tags = ['#Autre', '#Indéterminé'];
  }

  return {
    type: mapping.display,
    subtype: mapping.subtype || null,
    confidence: Math.round(confidence),
    justifications: bestScore.justifications.length > 0 
      ? bestScore.justifications 
      : ['Patterns agiles non identifiés'],
    tags: mapping.tags || [],
    allScores: Object.entries(scores).map(([type, s]) => ({
      type: typeMapping[type]?.display || type,
      score: s.score
    }))
  };
}