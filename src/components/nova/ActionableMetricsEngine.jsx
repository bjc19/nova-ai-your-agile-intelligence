// Actionable Metrics Engine - Anti-Vanity Radar
// Distinguishes vanity metrics from real performance levers

export const METRIC_TYPES = {
  VANITY: {
    velocity: { 
      name: "Vélocité (Story Points)", 
      danger: "Mesure le volume produit, pas la valeur livrée",
      alternative: "flow_efficiency"
    },
    lines_of_code: { 
      name: "Lignes de code", 
      danger: "Plus de code ≠ meilleure qualité ni plus de valeur",
      alternative: "cycle_time"
    },
    tickets_closed: { 
      name: "Nombre de tickets fermés", 
      danger: "Quantité sans contexte de valeur ou complexité",
      alternative: "throughput"
    },
    burndown: { 
      name: "Burndown / Burnup", 
      danger: "Vue rétrospective, non actionnable en temps réel",
      alternative: "wip_age"
    },
  },
  ACTIONABLE: {
    flow_efficiency: {
      name: "Flow Efficiency",
      description: "% temps à valeur ajoutée vs temps d'attente",
      target: 55,
      unit: "%",
      priority: 1,
      color: "emerald",
    },
    cycle_time: {
      name: "Cycle Time",
      description: "Temps moyen entre start et done",
      target: 4,
      unit: "jours",
      priority: 2,
      color: "blue",
    },
    throughput: {
      name: "Throughput Stable",
      description: "Nombre d'items finis par unité de temps (stable)",
      target: 8,
      unit: "items/semaine",
      priority: 3,
      color: "indigo",
    },
    deployment_frequency: {
      name: "Deployment Frequency",
      description: "Fréquence de mise en production",
      target: 3,
      unit: "déploiements/semaine",
      priority: 4,
      color: "purple",
    },
    wip_age: {
      name: "WIP Age",
      description: "Âge moyen du travail en cours",
      target: 2,
      unit: "jours",
      priority: 5,
      color: "amber",
    }
  }
};

export const MIN_DATA_DAYS = 7;

export function analyzeMetricsHealth(metricsData) {
  const {
    velocity = null,
    flow_efficiency = null,
    cycle_time = null,
    throughput = null,
    deployment_frequency = null,
    lines_of_code_per_week = null,
    data_days = 0,
  } = metricsData;

  // Check for insufficient data
  if (data_days < MIN_DATA_DAYS) {
    return {
      status: "insufficient_data",
      message: "Données insuffisantes pour distinguer vanity vs performance réelle. En attente de plus d'historique.",
      canAnalyze: false,
    };
  }

  const detectedIssues = [];
  const actionableLevers = [];

  // Detect vanity metric anti-patterns
  
  // 1. Velocity up but Flow Efficiency low
  if (velocity && velocity.trend === "up" && flow_efficiency && flow_efficiency.current < 35) {
    detectedIssues.push({
      type: "vanity_detected",
      severity: "warning",
      vanityMetric: "velocity",
      title: "Vanity metric détectée : Vélocité en hausse",
      realSignal: `Flow Efficiency faible (${flow_efficiency.current}%)`,
      keyQuestion: "Qu'est-ce qui empêche réellement le travail de circuler plus vite ?",
      priorityMetric: "flow_efficiency",
      emoji: "🟡"
    });
  }

  // 2. Lines of code focus but high cycle time
  if (lines_of_code_per_week && lines_of_code_per_week > 3000 && cycle_time && cycle_time.current > 7) {
    detectedIssues.push({
      type: "anti_pattern",
      severity: "critical",
      vanityMetric: "lines_of_code",
      title: "Signal trompeur détecté : lignes de code ≠ valeur livrée",
      realSignal: `Cycle Time élevé (${cycle_time.current}j)`,
      keyQuestion: "Pourquoi le code met-il autant de temps à atteindre la production ?",
      priorityMetric: "cycle_time",
      emoji: "🔴"
    });
  }

  // 3. High tickets closed but low throughput stability
  if (throughput && throughput.variance > 0.5) {
    detectedIssues.push({
      type: "instability",
      severity: "warning",
      vanityMetric: "tickets_closed",
      title: "Volume instable détecté",
      realSignal: "Throughput erratique (variance élevée)",
      keyQuestion: "Qu'est-ce qui crée cette instabilité dans le flux ?",
      priorityMetric: "throughput",
      emoji: "🟡"
    });
  }

  // Identify actionable levers with potential impact
  if (flow_efficiency && flow_efficiency.current < METRIC_TYPES.ACTIONABLE.flow_efficiency.target) {
    const gap = METRIC_TYPES.ACTIONABLE.flow_efficiency.target - flow_efficiency.current;
    actionableLevers.push({
      metric: "flow_efficiency",
      current: flow_efficiency.current,
      target: METRIC_TYPES.ACTIONABLE.flow_efficiency.target,
      gap,
      lever: "Réduire la taille des batchs (-30%)",
      impact: "Flow Efficiency +27%",
      effort: "2 jours",
      confidence: 87,
      estimatedValue: "125K€ / trimestre",
    });
  }

  if (cycle_time && cycle_time.current > METRIC_TYPES.ACTIONABLE.cycle_time.target) {
    const gap = cycle_time.current - METRIC_TYPES.ACTIONABLE.cycle_time.target;
    actionableLevers.push({
      metric: "cycle_time",
      current: cycle_time.current,
      target: METRIC_TYPES.ACTIONABLE.cycle_time.target,
      gap,
      lever: "Réduire le WIP actif (-40%)",
      impact: "Cycle Time -4j",
      effort: "1 jour",
      confidence: 92,
      estimatedValue: "85K€ / trimestre",
    });
  }

  if (deployment_frequency && deployment_frequency.current < METRIC_TYPES.ACTIONABLE.deployment_frequency.target) {
    const gap = METRIC_TYPES.ACTIONABLE.deployment_frequency.target - deployment_frequency.current;
    actionableLevers.push({
      metric: "deployment_frequency",
      current: deployment_frequency.current,
      target: METRIC_TYPES.ACTIONABLE.deployment_frequency.target,
      gap,
      lever: "Trunk-based / release plus fréquentes",
      impact: "Deployment Frequency +2/semaine",
      effort: "3 jours",
      confidence: 78,
      estimatedValue: "65K€ / trimestre",
    });
  }

  // Sort by confidence and impact
  actionableLevers.sort((a, b) => b.confidence - a.confidence);

  // Get top 3 levers (80/20 principle)
  const top3Levers = actionableLevers.slice(0, 3);

  // Determine overall status
  const hasIssues = detectedIssues.length > 0;
  const hasLevers = top3Levers.length > 0;

  return {
    status: hasIssues ? "vanity_detected" : hasLevers ? "levers_available" : "healthy",
    detectedIssues,
    top3Levers,
    canAnalyze: true,
    message: hasIssues 
      ? `${detectedIssues.length} métrique(s) trompeuse(s) détectée(s)` 
      : hasLevers 
        ? `${top3Levers.length} levier(s) actionnable(s) identifié(s)`
        : "Métriques actionnables stables",
  };
}

export function reformulateCLevelQuestion(question, metricsData) {
  const lowerQuestion = question.toLowerCase();
  
  // Detect velocity question
  if (lowerQuestion.includes("vélocité") || lowerQuestion.includes("velocity")) {
    const flowEfficiency = metricsData.flow_efficiency?.current || 28;
    
    if (flowEfficiency < 40) {
      return {
        type: "vanity_alert",
        emoji: "🟡",
        title: "Alerte métrique trompeuse",
        reformulation: `La vélocité progresse, mais le flux reste contraint.\nMétrique prioritaire actuelle : Flow Efficiency (${flowEfficiency}%)`,
        impact: "Impact estimé si améliorée :\n+125K€ / trimestre (réduction lead time + livraisons plus fréquentes)",
        keyQuestion: "Souhaitez-vous améliorer la vitesse réelle de livraison ou le volume produit ?",
        allowFallback: true,
      };
    }
  }

  // Detect lines of code question
  if (lowerQuestion.includes("ligne") || lowerQuestion.includes("code")) {
    return {
      type: "anti_pattern",
      emoji: "🔴",
      title: "Signal trompeur",
      reformulation: "Les lignes de code ne mesurent pas la valeur livrée.\nMétrique recommandée : Cycle Time ou Deployment Frequency",
      keyQuestion: "Souhaitez-vous mesurer la vitesse de mise en production ou le volume de code ?",
      allowFallback: false,
    };
  }

  return null; // No reformulation needed
}

export function generateLeverOptions(lever) {
  const options = {
    flow_efficiency: [
      { 
        option: "Réduire batch size (-30%)", 
        impact: "Flow +27%", 
        effort: "2 jours", 
        confidence: 87,
        tradeoff: "Requiert coordination PO/équipe"
      },
      { 
        option: "Limiter WIP à 3 items max", 
        impact: "Cycle -40%", 
        effort: "1 jour", 
        confidence: 92,
        tradeoff: "Peut ralentir perception de vélocité"
      },
    ],
    cycle_time: [
      { 
        option: "Réduire WIP à 3 items", 
        impact: "Cycle Time -4j", 
        effort: "1 jour", 
        confidence: 92,
        tradeoff: "Focalisé sur finition vs démarrage"
      },
      { 
        option: "Trunk-based development", 
        impact: "Merge Time -60%", 
        effort: "2 jours", 
        confidence: 85,
        tradeoff: "Requiert CI/CD robuste"
      },
    ],
    deployment_frequency: [
      { 
        option: "Feature flags + déploiements quotidiens", 
        impact: "Frequency +200%", 
        effort: "3 jours", 
        confidence: 78,
        tradeoff: "Nécessite monitoring renforcé"
      },
      { 
        option: "Automated regression tests", 
        impact: "Confidence +35%", 
        effort: "5 jours", 
        confidence: 90,
        tradeoff: "Investissement initial élevé"
      },
    ],
  };

  return options[lever.metric] || [];
}