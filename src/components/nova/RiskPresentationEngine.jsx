// ============================================================================
// Risk Presentation Engine - Stratification Automatique par Rôle
// Architecture: LLM detection inchangée → Transformations additives
// ============================================================================

/**
 * Transforme les risques détectés par le LLM selon le rôle de l'utilisateur
 * @param {Array} rawRisks - Risques bruts du LLM (structure existante)
 * @param {String} userRole - Rôle de l'utilisateur ('admin', 'contributor', 'member')
 * @returns {Array} - Risques transformés pour présentation
 */
export function transformRisksForRole(rawRisks, userRole) {
  if (!rawRisks || rawRisks.length === 0) return [];
  
  const transformFunction = {
    'admin': transformToAdminView,
    'contributor': transformToContributorView,
    'member': transformToMemberView
  }[userRole] || transformToContributorView;
  
  return rawRisks.map(risk => transformFunction(risk));
}

/**
 * Transforme les blockers détectés par le LLM selon le rôle
 * @param {Array} rawBlockers - Blockers bruts du LLM
 * @param {String} userRole - Rôle de l'utilisateur
 * @returns {Array} - Blockers transformés
 */
export function transformBlockersForRole(rawBlockers, userRole) {
  if (!rawBlockers || rawBlockers.length === 0) return [];
  
  const transformFunction = {
    'admin': transformBlockerToAdminView,
    'contributor': transformBlockerToContributorView,
    'member': transformBlockerToMemberView
  }[userRole] || transformBlockerToContributorView;
  
  return rawBlockers.map(blocker => transformFunction(blocker));
}

// ============================================================================
// ADMIN VIEW - Vue Technique Complète
// ============================================================================

function transformToAdminView(risk) {
  return {
    presentation_level: 'admin_technical',
    title: `🔴 ${getUrgencyEmoji(risk.urgency)} ${risk.description || 'Risque Détecté'}`,
    content: risk.description,
    role_applied: 'admin',
    
    technical_details: {
      pattern_ids: risk.pattern_ids || [],
      urgency_level: risk.urgency,
      confidence_score: risk.confidence_score,
      affected_members: risk.affected_members || [],
      raw_metrics: risk.metrics || {},
      detection_context: risk.context || null
    },
    
    expert_actions: risk.mitigation ? [risk.mitigation] : [],
    
    impact_analysis: {
      sprint_impact: risk.impact || 'Impact à évaluer',
      severity: risk.urgency
    },
    
    flags: {
      llm_context_preserved: true,
      raw_data_accessible: true,
      automatic_view: true
    }
  };
}

function transformBlockerToAdminView(blocker) {
  return {
    presentation_level: 'admin_technical',
    title: `🚫 ${blocker.member || 'Membre'} - ${blocker.issue}`,
    content: blocker.issue,
    role_applied: 'admin',
    
    technical_details: {
      member: blocker.member,
      blocked_by: blocker.blocked_by || null,
      urgency: blocker.urgency,
      pattern_ids: blocker.pattern_ids || [],
      action_required: blocker.action
    },
    
    expert_actions: [blocker.action],
    
    flags: {
      operational_blocker: true,
      automatic_view: true
    }
  };
}

// ============================================================================
// CONTRIBUTOR VIEW - Vue Actionnable Équipe
// ============================================================================

function transformToContributorView(risk) {
  const simplifiedTitle = simplifyForContributor(risk.description);
  
  return {
    presentation_level: 'contributor_actionable',
    title: `🟠 ${simplifiedTitle}`,
    content: risk.description,
    role_applied: 'contributor',
    
    context_simplified: {
      what: extractWhatFromDescription(risk.description),
      impact: risk.impact || 'Ralentit l\'avancement de l\'équipe',
      why_matters: 'Risque d\'impact sur les objectifs'
    },
    
    actionable_steps: risk.mitigation ? [
      {
        priority: risk.urgency || 'MEDIUM',
        action: risk.mitigation,
        who: 'Équipe',
        time: estimateTimeNeeded(risk.urgency)
      }
    ] : [],
    
    conversation_starters: [
      'Comment peut-on résoudre ce point ensemble ?',
      'Qui peut aider sur ce sujet ?'
    ],
    
    flags: {
      technical_jargon_removed: true,
      focused_on_actions: true,
      automatic_view: true
    }
  };
}

function transformBlockerToContributorView(blocker) {
  return {
    presentation_level: 'contributor_actionable',
    title: `⚠️ ${blocker.member || 'Membre'} - Point d'Attention`,
    content: blocker.issue,
    role_applied: 'contributor',
    
    context_simplified: {
      what: blocker.issue,
      who: blocker.member,
      blocked_by: blocker.blocked_by || 'À identifier',
      impact: 'Ralentit la progression'
    },
    
    actionable_steps: [
      {
        priority: blocker.urgency,
        action: blocker.action,
        who: blocker.member || 'Équipe',
        time: '15-30min'
      }
    ],
    
    flags: {
      operational_focus: true,
      automatic_view: true
    }
  };
}

// ============================================================================
// MEMBER VIEW - Vue Constructive Haut Niveau
// ============================================================================

function transformToMemberView(risk) {
  const constructiveTitle = reframePositively(risk.description);
  
  return {
    presentation_level: 'user_constructive',
    title: `🟢 ${constructiveTitle}`,
    content: reframeDescriptionPositively(risk.description),
    role_applied: 'member',
    
    business_context: {
      situation: 'Pour assurer la meilleure livraison possible',
      need: extractBusinessNeed(risk.description),
      outcome_desired: 'Flux de travail plus fluide et prévisible'
    },
    
    constructive_framing: {
      positive: 'L\'équipe identifie des opportunités d\'optimisation',
      forward_looking: 'Des ajustements sont en cours pour améliorer la fluidité'
    },
    
    flags: {
      no_technical_terms: true,
      solution_oriented: true,
      automatic_view: true
    }
  };
}

function transformBlockerToMemberView(blocker) {
  return {
    presentation_level: 'user_constructive',
    title: `💡 Point d'Amélioration Identifié`,
    content: reframeDescriptionPositively(blocker.issue),
    role_applied: 'member',
    
    business_context: {
      situation: 'L\'équipe travaille sur l\'optimisation du flux',
      need: 'Clarification des priorités',
      outcome_desired: 'Meilleure coordination'
    },
    
    constructive_framing: {
      positive: 'Processus normal d\'amélioration continue',
      forward_looking: 'L\'équipe s\'ajuste pour mieux avancer'
    },
    
    flags: {
      no_blame: true,
      automatic_view: true
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS - Transformations de contenu
// ============================================================================

function getUrgencyEmoji(urgency) {
  const map = {
    'high': 'URGENT',
    'medium': 'ATTENTION',
    'low': 'INFO'
  };
  return map[urgency?.toLowerCase()] || 'ATTENTION';
}

function simplifyForContributor(description) {
  if (!description) return 'Point d\'Attention';
  
  // Patterns de simplification
  if (description.includes('WIP')) return 'Charge de Travail Élevée';
  if (description.includes('blocage') || description.includes('bloque')) return 'Point de Blocage Détecté';
  if (description.includes('dépendance')) return 'Dépendance à Résoudre';
  if (description.includes('vélocité') || description.includes('velocity')) return 'Ralentissement Détecté';
  
  return description.substring(0, 50);
}

function extractWhatFromDescription(description) {
  if (!description) return 'Situation à clarifier';
  
  // Extrait la partie factuelle
  const match = description.match(/^([^,\.]+)/);
  return match ? match[1] : description.substring(0, 80);
}

function estimateTimeNeeded(urgency) {
  const map = {
    'high': '15min (urgent)',
    'medium': '30min',
    'low': '1h (à planifier)'
  };
  return map[urgency?.toLowerCase()] || '30min';
}

function reframePositively(description) {
  if (!description) return 'Optimisation en Cours';
  
  // Patterns de reformulation positive
  if (description.includes('WIP') || description.includes('charge')) return 'Optimisation du Flux en Cours';
  if (description.includes('blocage') || description.includes('bloqué')) return 'Clarification des Priorités';
  if (description.includes('dépendance')) return 'Coordination Inter-Équipes';
  if (description.includes('vélocité') || description.includes('ralenti')) return 'Ajustement du Rythme';
  
  return 'Point d\'Amélioration Identifié';
}

function reframeDescriptionPositively(description) {
  if (!description) return 'L\'équipe travaille sur des améliorations';
  
  // Version constructive de la description
  return `L'équipe identifie des opportunités d'amélioration pour mieux ${extractBusinessNeed(description)?.toLowerCase()}`;
}

function extractBusinessNeed(description) {
  if (!description) return 'optimiser le flux';
  
  if (description.includes('WIP') || description.includes('charge')) return 'Mieux répartir la charge de travail';
  if (description.includes('blocage')) return 'Fluidifier la collaboration';
  if (description.includes('dépendance')) return 'Améliorer la coordination';
  if (description.includes('vélocité')) return 'Stabiliser le rythme de livraison';
  
  return 'optimiser le flux de travail';
}

// ============================================================================
// ROLE DETECTION
// ============================================================================

/**
 * Détermine la vue appropriée selon le rôle utilisateur
 * @param {Object} user - Objet utilisateur avec propriété 'role'
 * @returns {String} - Type de vue ('admin', 'contributor', 'member')
 */
export function detectViewForUser(user) {
  if (!user || !user.role) return 'contributor'; // Défaut sécurisé
  
  const roleMapping = {
    'admin': 'admin',
    'contributor': 'contributor',
    'member': 'member',
    // Rôles hérités (compatibilité)
    'scrum_master': 'admin',
    'product_owner': 'contributor',
    'stakeholder': 'member',
    'observer': 'member'
  };
  
  return roleMapping[user.role] || 'contributor';
}

/**
 * Retourne la configuration complète de la vue pour un rôle
 * @param {String} role - Rôle de l'utilisateur
 * @returns {Object} - Configuration de la vue
 */
export function getViewConfigForRole(role) {
  const configs = {
    'admin': {
      view_type: 'admin_technical',
      description: 'Vue experte avec tous les détails techniques',
      show_patterns: true,
      show_metrics: true,
      show_confidence: true,
      show_raw_data: true
    },
    'contributor': {
      view_type: 'contributor_actionable',
      description: 'Vue équipe avec actions concrètes',
      show_patterns: false,
      show_metrics: false,
      show_confidence: false,
      show_raw_data: false
    },
    'member': {
      view_type: 'user_constructive',
      description: 'Vue constructive haut niveau',
      show_patterns: false,
      show_metrics: false,
      show_confidence: false,
      show_raw_data: false
    }
  };
  
  return configs[role] || configs['contributor'];
}