/**
 * Role-Based Messaging Engine
 * Adapts dashboard messages based on user role perspective
 */

/**
 * Adapts a message based on user role
 * @param {string} messageKey - The message key to adapt
 * @param {string} userRole - User role: 'admin', 'contributor', or 'user'
 * @param {object} context - Additional context (numbers, names, etc.)
 */
export function adaptMessage(messageKey, userRole, context = {}) {
  const messages = {
    // Quick Stats Labels
    totalBlockers: {
      admin: "Bloquants <br> (sources: analyses)",
      contributor: "Points de Blocage à Traiter",
      user: "Défis en Cours"
    },
    risksIdentified: {
      admin: "Risques (sources:analyses)",
      contributor: "Risques à Anticiper",
      user: "Points d'Attention"
    },
    analysesRun: {
      admin: "Analyses Exécutées",
      contributor: "Sessions Analysées",
      user: "Réunions Suivies"
    },
    resolved: {
      admin: "Résolus (sources:vos validations)",
      contributor: "Problèmes Résolus",
      user: "Succès Réalisés"
    },

    // Sprint Health Messages
    sprintHealthy: {
      admin: "Sprint en bonne santé - KPIs normaux",
      contributor: "Sprint sur les rails - Aucune action requise",
      user: "Excellent travail d'équipe ! 🚀"
    },
    potentialDrift: {
      admin: "Dérive détectée - WIP: {wip}, Bloqués: {blocked}",
      contributor: "Attention : {wip} tâches en cours, {blocked} bloquées",
      user: "L'équipe fait face à quelques défis temporaires"
    },
    driftQuestion: {
      admin: "Analyser les métriques de flux et identifier la cause racine du bottleneck",
      contributor: "Qu'est-ce qui empêche actuellement l'équipe de faire avancer le flux ?",
      user: "Comment pouvons-nous mieux collaborer pour avancer ensemble ?"
    },

    // Recommendations Tone
    recommendationPrefix: {
      admin: "Action technique requise:",
      contributor: "Action suggérée:",
      user: "Suggestion pour améliorer:"
    },
    
    // Analysis descriptions
    analysisBlocker: {
      admin: "Blocker détecté - Pattern {pattern} - Urgence: {urgency}",
      contributor: "Blocage identifié - Action nécessaire: {action}",
      user: "Défi rencontré - Opportunité d'amélioration"
    },
    analysisRisk: {
      admin: "Risque {severity} - Impact: {impact} - Probabilité: {probability}",
      contributor: "Risque à surveiller - Impact: {impact}",
      user: "Point d'attention pour l'équipe"
    },

    // Multi-project alert
    multiProjectDetected: {
      admin: "Détection multi-projets (score: {score}) - Configuration système requise",
      contributor: "Plusieurs projets détectés - Vérifier la configuration",
      user: "L'équipe gère plusieurs initiatives en parallèle"
    },

    // GDPR Signals
    gdprSignalHigh: {
      admin: "Signal GDPR critique - Pattern: {pattern} - Récurrence: {count}",
      contributor: "Signal d'équipe important - À traiter en priorité",
      user: "Point important soulevé par l'équipe"
    },
    gdprSignalMedium: {
      admin: "Signal GDPR moyen - Monitoring requis",
      contributor: "Signal à surveiller",
      user: "Observation de l'équipe"
    }
  };

  const roleMessages = messages[messageKey];
  if (!roleMessages) return messageKey;

  const message = roleMessages[userRole] || roleMessages.contributor || messageKey;
  
  // Replace context variables
  return message.replace(/\{(\w+)\}/g, (match, key) => context[key] || match);
}

/**
 * Gets the appropriate tone/style for a role
 */
export function getRoleTone(userRole) {
  const tones = {
    admin: {
      style: "technical",
      showPatterns: true,
      showMetrics: true,
      showRawData: true,
      emphasis: "governance"
    },
    contributor: {
      style: "actionable",
      showPatterns: false,
      showMetrics: true,
      showRawData: false,
      emphasis: "execution"
    },
    user: {
      style: "constructive",
      showPatterns: false,
      showMetrics: false,
      showRawData: false,
      emphasis: "collaboration"
    }
  };

  return tones[userRole] || tones.user;
}

/**
 * Formats a recommendation based on role
 */
export function formatRecommendation(recommendation, userRole) {
  const tone = getRoleTone(userRole);
  
  if (userRole === 'admin') {
    // Technical, detailed
    return {
      ...recommendation,
      prefix: "🔧 Action technique:",
      showDetails: true
    };
  }
  
  if (userRole === 'contributor') {
    // Action-oriented, clear
    return {
      ...recommendation,
      prefix: "✅ Action suggérée:",
      showDetails: true
    };
  }
  
  // User - constructive, motivating
  return {
    ...recommendation,
    prefix: "💡 Suggestion:",
    description: makeConstructive(recommendation.description),
    showDetails: false
  };
}

/**
 * Makes a message more constructive and motivating (for 'user' role)
 */
function makeConstructive(text) {
  if (!text) return text;
  
  // Replace negative/technical terms with constructive alternatives
  const replacements = {
    'blocker': 'défi temporaire',
    'blocked': 'en attente',
    'risk': 'point d\'attention',
    'problem': 'opportunité d\'amélioration',
    'issue': 'point à optimiser',
    'failed': 'à réajuster',
    'error': 'ajustement nécessaire',
    'critical': 'important',
    'urgent': 'prioritaire'
  };
  
  let constructive = text;
  Object.entries(replacements).forEach(([negative, positive]) => {
    const regex = new RegExp(negative, 'gi');
    constructive = constructive.replace(regex, positive);
  });
  
  return constructive;
}

/**
 * Adapts sprint health message
 */
export function adaptSprintHealthMessage(status, signals, userRole) {
  if (userRole === 'admin') {
    return `Status: ${status} | Signaux: ${signals.map(s => s.id).join(', ')} | Analyse technique requise`;
  }
  
  if (userRole === 'contributor') {
    return `${signals.length} signaux détectés - Actions concrètes disponibles`;
  }
  
  // User - constructive and motivating
  if (status === 'healthy') {
    return "L'équipe avance bien ! Continuez ce rythme 🎯";
  }
  
  return "L'équipe peut bénéficier de quelques ajustements pour faciliter le travail de tous";
}