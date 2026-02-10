// Product Goal Alignment Detection Engine
// Detects instability and misalignment to prevent wasted execution

export const ALIGNMENT_THRESHOLDS = {
  MIN_SPRINTS_FOR_ANALYSIS: 3,
  GOAL_CHANGES_RISK: 2, // changes in last 3 sprints
  ALIGNMENT_SCORE_LOW: 50,
  ALIGNMENT_SCORE_PARTIAL: 75,
  STABLE_SPRINTS_FOR_POSITIVE: 3,
};

export const RISK_LEVELS = {
  STABLE: {
    id: "stable",
    label: "Cap stable et aligné",
    color: "emerald",
    icon: "CheckCircle2",
    severity: 0,
  },
  PARTIAL: {
    id: "partial",
    label: "Alignement partiel",
    color: "amber",
    icon: "AlertTriangle",
    severity: 1,
  },
  INSTABILITY: {
    id: "instability",
    label: "Product Goal instable",
    color: "red",
    icon: "AlertOctagon",
    severity: 2,
  },
  MISALIGNED: {
    id: "misaligned",
    label: "Sprint Goal désaligné",
    color: "red",
    icon: "XCircle",
    severity: 2,
  },
  INSUFFICIENT_DATA: {
    id: "insufficient",
    label: "Données insuffisantes",
    color: "slate",
    icon: "HelpCircle",
    severity: 0,
  },
};

export function analyzeProductGoalStability(productGoal, sprintGoals = []) {
  // Check minimum data
  if (sprintGoals.length < ALIGNMENT_THRESHOLDS.MIN_SPRINTS_FOR_ANALYSIS) {
    return {
      risk: RISK_LEVELS.INSUFFICIENT_DATA,
      message: `Données insuffisantes pour analyse fiable (min ${ALIGNMENT_THRESHOLDS.MIN_SPRINTS_FOR_ANALYSIS} sprints)`,
      suggestions: [],
      cta: null,
    };
  }

  const changeCount = productGoal?.change_history?.length || 0;
  const recentChanges = (productGoal?.change_history || []).filter(c => {
    const changeDate = new Date(c.date);
    const threeSprintsAgo = new Date();
    threeSprintsAgo.setDate(threeSprintsAgo.getDate() - 42); // ~3 sprints
    return changeDate > threeSprintsAgo;
  });

  // Detect instability
  if (recentChanges.length >= ALIGNMENT_THRESHOLDS.GOAL_CHANGES_RISK) {
    return {
      risk: RISK_LEVELS.INSTABILITY,
      message: `Product Goal modifié ${recentChanges.length} fois sur les 3 derniers sprints – risque élevé de gaspillage`,
      question: `Quels apprentissages récents (feedback users, metrics business, changements marché…) confirment que ce Product Goal reste le bon cap pour les 2–4 prochaines itérations ?`,
      suggestions: [
        {
          id: "rephrase",
          title: "Re-phraser le Product Goal",
          description: "Intégrer les derniers learnings metrics (ex: focus sur rétention plutôt que acquisition si churn > 20%)",
          effort: "low",
        },
        {
          id: "workshop",
          title: "Quick validation workshop",
          description: "Planifier 30 min avec 2–3 stakeholders clés avant prochain sprint planning",
          effort: "medium",
        },
        {
          id: "icebox",
          title: "Nettoyer le backlog",
          description: "Mettre en icebox les User Stories non alignées sur la version actuelle du Goal",
          effort: "low",
        },
      ],
      cta: {
        label: "Confirmer ou ajuster le cap maintenant",
        action: "confirm_goal",
        urgent: true,
      },
    };
  }

  // Check sprint alignment
  const misalignedSprints = sprintGoals.filter(
    sg => sg.alignment_status === "misaligned" || sg.alignment_score < ALIGNMENT_THRESHOLDS.ALIGNMENT_SCORE_LOW
  );

  if (misalignedSprints.length > 0) {
    return {
      risk: RISK_LEVELS.MISALIGNED,
      message: `${misalignedSprints.length} Sprint Goal(s) non aligné(s) – risque d'exécution sur non-valeur`,
      question: `En quoi ce Sprint Goal contribue-t-il directement au Product Goal actuel ? (Si pas clair, quel ajustement minimal proposes-tu ?)`,
      suggestions: [
        {
          id: "keyword",
          title: "Ajouter le mot-clé du Product Goal",
          description: `Inclure explicitement "${productGoal?.title?.split(' ').slice(0, 3).join(' ')}..." dans le Sprint Goal`,
          effort: "low",
        },
        {
          id: "scope",
          title: "Réduire le scope",
          description: "Prioriser uniquement les items les plus alignés (MoSCoW ou scoring impact)",
          effort: "medium",
        },
        {
          id: "delay",
          title: "Reporter le planning",
          description: "Reporter le sprint planning de 1h pour un quick check avec l'équipe",
          effort: "low",
        },
      ],
      cta: {
        label: "Ajuster Sprint Goal",
        action: "adjust_sprint_goal",
        urgent: true,
      },
      affectedSprints: misalignedSprints,
    };
  }

  // Check partial alignment
  const partialSprints = sprintGoals.filter(
    sg => sg.alignment_status === "partial" || 
         (sg.alignment_score >= ALIGNMENT_THRESHOLDS.ALIGNMENT_SCORE_LOW && 
          sg.alignment_score < ALIGNMENT_THRESHOLDS.ALIGNMENT_SCORE_PARTIAL)
  );

  if (partialSprints.length > 0) {
    return {
      risk: RISK_LEVELS.PARTIAL,
      message: `Alignement partiel détecté sur ${partialSprints.length} sprint(s)`,
      suggestions: [
        {
          id: "clarify",
          title: "Clarifier le lien",
          description: "Rendre explicite la contribution de chaque Sprint Goal au Product Goal",
          effort: "low",
        },
      ],
      cta: {
        label: "Revoir l'alignement",
        action: "review_alignment",
        urgent: false,
      },
    };
  }

  // All aligned = stable
  const alignedCount = sprintGoals.filter(sg => 
    sg.alignment_status === "aligned" || sg.alignment_score >= ALIGNMENT_THRESHOLDS.ALIGNMENT_SCORE_PARTIAL
  ).length;

  return {
    risk: RISK_LEVELS.STABLE,
    message: `Alignement 100% sur ${alignedCount} sprints – bravo ! 🟢`,
    suggestions: [
      {
        id: "share",
        title: "Partager ce statut",
        description: "Informer l'équipe de cette bonne nouvelle via Slack/Teams",
        effort: "low",
      },
      {
        id: "reminder",
        title: "Programmer un rappel",
        description: "Fixer un re-check automatique dans 2 sprints",
        effort: "low",
      },
    ],
    cta: {
      label: "Partager avec l'équipe",
      action: "share_status",
      urgent: false,
    },
  };
}

export function calculateAlignmentScore(sprintGoal, productGoal) {
  if (!sprintGoal || !productGoal) return 0;

  const sprintText = (sprintGoal.goal_statement || "").toLowerCase();
  const productText = (productGoal.title + " " + (productGoal.description || "")).toLowerCase();
  
  // Extract keywords from product goal
  const stopWords = ["le", "la", "les", "un", "une", "de", "du", "des", "pour", "et", "ou", "à", "en", "sur"];
  const productKeywords = productText
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));

  // Count matches
  let matches = 0;
  productKeywords.forEach(keyword => {
    if (sprintText.includes(keyword)) matches++;
  });

  const score = productKeywords.length > 0 
    ? Math.round((matches / productKeywords.length) * 100)
    : 50;

  return Math.min(100, score);
}

export function generatePersonalizedQuestion(alignmentReport, sprintGoalData) {
  const { risk, sprintGoals, productGoal, averageAlignment } = alignmentReport;
  const currentSprint = sprintGoalData || sprintGoals?.[0];
  
  if (!currentSprint || !productGoal) return null;

  // Generate context-specific questions based on alignment status and sprint data
  const questionTemplates = {
    instability: () => `Vu que le Product Goal a changé ${sprintGoals.length > 0 ? sprintGoals.length : 2} fois récemment, quels signaux business (churn, DAU, NPS...) confirment que le cap vers "${productGoal.title}" est le bon focus pour les 2–4 prochains sprints ?`,
    
    misaligned: () => {
      const misalignedCount = sprintGoals.filter(sg => sg.alignment_status === "misaligned").length;
      return `En quoi "${currentSprint.goal_statement}" contribue-t-il directement à "${productGoal.title}" ? ${averageAlignment < 50 ? `(Score d'alignement: ${averageAlignment}% – si c'est flou, quel ajustement minimal proposes-tu ?)` : ''}`;
    },
    
    partial: () => `Nous avons ${sprintGoals.filter(sg => sg.alignment_status === "aligned").length}/${sprintGoals.length} sprints alignés. Pour les sprints partiellement alignés, comment clarifier leur contribution au cap : "${productGoal.title.split(' ').slice(0, 5).join(' ')}..." ?`,
    
    stable: () => `Excellent ${averageAlignment}% d'alignement ! Pour confirmer ce cap stable, quels KPIs (rétention, NPS, engagement…) validez-vous dans "${productGoal.title}" ?`,
  };

  return questionTemplates[risk.id]?.() || questionTemplates.stable();
}

export function generateAlignmentReport(productGoal, sprintGoals) {
  const analysis = analyzeProductGoalStability(productGoal, sprintGoals);
  
  // Enrich sprint goals with scores if not present
  const enrichedSprints = sprintGoals.map(sg => ({
    ...sg,
    alignment_score: sg.alignment_score ?? calculateAlignmentScore(sg, productGoal),
  }));

  const report = {
    ...analysis,
    productGoal: productGoal,
    sprintGoals: enrichedSprints,
    analyzedAt: new Date().toISOString(),
    totalSprints: sprintGoals.length,
    averageAlignment: enrichedSprints.length > 0
      ? Math.round(enrichedSprints.reduce((sum, sg) => sum + (sg.alignment_score || 0), 0) / enrichedSprints.length)
      : 0,
  };

  // Override question with personalized version
  if (!report.question) {
    report.question = generatePersonalizedQuestion(report, enrichedSprints[0]);
  }

  return report;
}