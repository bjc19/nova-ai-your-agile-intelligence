/**
 * Dashboard Component Registry
 * Définit chaque bloc avec ses règles d'affichage et scoring de pertinence
 */

export const DASHBOARD_COMPONENTS = {
  // SITUATION ANALYSIS BLOCKS
  sprintHealth: {
    id: "sprintHealth",
    name: "Sprint Health & Drift Detection",
    category: "situation",
    priority: 10,
    
    // Conditions d'affichage
    show_if: (situation) => {
      return situation.active_sprint && (
        situation.blockers_count > 0 ||
        situation.wip_high ||
        situation.velocity_unstable ||
        situation.sprint_day > 3
      );
    },
    hide_if: (situation) => {
      return !situation.active_sprint || 
             (situation.blockers_count === 0 && !situation.wip_high);
    },
    
    // Scoring de pertinence (0-100)
    relevance_score: (situation) => {
      let score = 0;
      if (situation.blockers_count > 2) score += 40;
      else if (situation.blockers_count > 0) score += 20;
      
      if (situation.wip_high) score += 30;
      if (situation.velocity_unstable) score += 20;
      if (situation.risks_count > 3) score += 15;
      
      return Math.min(score, 100);
    },
    
    // Rôles autorisés
    roles: ["admin", "contributor"],
    
    // Adaptations par rôle
    config_by_role: {
      admin: { showTrend: true, showMultiProject: true, detailed: true },
      contributor: { showTrend: true, showMultiProject: false, detailed: true }
    }
  },

  // PERFORMANCE BLOCKS
  sprintPerformance: {
    id: "sprintPerformance",
    name: "Sprint Performance Evolution",
    category: "performance",
    priority: 6,
    
    show_if: (situation) => situation.analysis_count > 1,
    hide_if: (situation) => situation.analysis_count < 2,
    
    relevance_score: (situation) => {
      let score = 40; // Base score
      if (situation.velocity_variance > 30) score += 30;
      if (situation.trend_negative) score += 20;
      return Math.min(score, 100);
    },
    
    roles: ["admin", "contributor"],
    config_by_role: {
      admin: { showComparison: true, showForecast: true },
      contributor: { showComparison: true, showForecast: false }
    }
  },

  // ACTIONABLE BLOCKS
  keyRecommendations: {
    id: "keyRecommendations",
    name: "Key Recommendations & Quick Wins",
    category: "actions",
    priority: 9,
    
    show_if: (situation) => situation.recommendations_count > 0,
    hide_if: (situation) => situation.recommendations_count === 0,
    
    relevance_score: (situation) => {
      let score = 30;
      if (situation.quick_wins_count > 0) score += 40;
      if (situation.urgent_actions_count > 0) score += 30;
      return Math.min(score, 100);
    },
    
    roles: ["admin", "contributor", "user"],
    config_by_role: {
      admin: { detailed: true, showImpact: true },
      contributor: { detailed: true, showImpact: true },
      user: { detailed: false, showImpact: false }
    }
  },

  recentAnalyses: {
    id: "recentAnalyses",
    name: "Recent Analyses",
    category: "history",
    priority: 3,
    
    show_if: (situation) => situation.analysis_count > 0,
    hide_if: (situation) => situation.analysis_count === 0,
    
    relevance_score: (situation) => {
      let score = 20;
      if (situation.analysis_count > 5) score += 20;
      return Math.min(score, 100);
    },
    
    roles: ["admin", "contributor", "user"],
    config_by_role: {
      admin: { showAll: true, detailed: true },
      contributor: { showAll: true, detailed: false },
      user: { showAll: false, detailed: false }
    }
  },

  integrationStatus: {
    id: "integrationStatus",
    name: "Integration Status",
    category: "system",
    priority: 2,
    
    show_if: (situation) => !situation.integrations_all_connected,
    hide_if: (situation) => situation.integrations_all_connected && situation.data_collected > 30,
    
    relevance_score: (situation) => {
      let score = 0;
      const connected = situation.integrations_connected || 0;
      const total = situation.integrations_total || 3;
      
      if (connected < total) {
        score = 50 - (connected / total * 30);
      }
      return Math.min(score, 100);
    },
    
    roles: ["admin", "contributor"],
    config_by_role: {
      admin: { detailed: true, showMissing: true },
      contributor: { detailed: true, showMissing: false }
    }
  },

  antiPatternDetection: {
    id: "antiPatternDetection",
    name: "Anti-Pattern Detection",
    category: "patterns",
    priority: 8,
    
    show_if: (situation) => situation.patterns_detected > 0,
    hide_if: (situation) => situation.patterns_detected === 0,
    
    relevance_score: (situation) => {
      let score = 0;
      const critical = situation.critical_patterns || 0;
      const high = situation.high_patterns || 0;
      
      score = critical * 40 + high * 20;
      return Math.min(score, 100);
    },
    
    roles: ["admin", "contributor"],
    config_by_role: {
      admin: { showAll: true, detailed: true },
      contributor: { showAll: true, detailed: true }
    }
  }
};

/**
 * Filtre et trie les composants en fonction de la situation et du rôle
 */
export function getRelevantComponents(situation, userRole) {
  return Object.values(DASHBOARD_COMPONENTS)
    .filter(component => {
      // Vérifier rôle
      if (!component.roles.includes(userRole)) return false;
      
      // Vérifier conditions d'affichage
      if (component.hide_if && component.hide_if(situation)) return false;
      if (component.show_if && !component.show_if(situation)) return false;
      
      return true;
    })
    .map(component => ({
      ...component,
      relevance: component.relevance_score(situation),
      config: component.config_by_role[userRole] || {}
    }))
    .sort((a, b) => {
      // Trier par relevance, puis par priority
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return b.priority - a.priority;
    });
}

/**
 * Obtient la configuration d'un composant pour un rôle
 */
export function getComponentConfig(componentId, userRole) {
  const component = DASHBOARD_COMPONENTS[componentId];
  if (!component) return null;
  return component.config_by_role[userRole] || {};
}