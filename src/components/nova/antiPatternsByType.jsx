// Anti-patterns et suggestions d'amélioration spécifiques par type d'atelier

const ANTIPATTERNS_BY_TYPE = {
  'Daily Scrum': {
    patterns: [
      {
        name: "Status Reports Passifs",
        severity: "high",
        description: "Membres lisent une liste au lieu de discuter problèmes",
        suggestions: [
          "Reformuler les questions: 'Qu'avez-vous appris?' au lieu de 'Qu'avez-vous fait?'",
          "Utiliser le format: Fait → Apprendre → Bloquer (plutôt que pas/plan/bloc)",
          "Limiter à 15 min maximum pour maintenir l'engagement",
          "Se positionner debout/cercle pour dynamique énergique"
        ]
      },
      {
        name: "Blocages Non Résolus",
        severity: "high",
        description: "Dépendances identifiées mais pas de plan d'action immédiat",
        suggestions: [
          "Créer un 'blocage board' visible en temps réel",
          "Assigner un débloqueur immédiatement (not une tâche pour 'plus tard')",
          "Escalader les blocages > 24h après le standup",
          "Revoir les blocages récurrents en retro"
        ]
      },
      {
        name: "Context Switching",
        severity: "medium",
        description: "L'équipe change constamment de contexte entre projets",
        suggestions: [
          "Limiter à 2-3 contextes max par développeur par sprint",
          "Mapper les dépendances inter-projets en avance",
          "Créer des timeboxes de contexte (ex: AM=Projet A, PM=Projet B)",
          "Documenter les switchs pour analyse en retro"
        ]
      },
      {
        name: "WIP Overload",
        severity: "high",
        description: "Trop de tickets en cours simultanément",
        suggestions: [
          "Définir limite WIP = nombre de devs / 2",
          "Visualiser WIP sur tableau physique/digital",
          "Stopper nouvelles tâches si WIP dépassé",
          "Analyser temps cycle vs effort initial pour recalibrer"
        ]
      },
      {
        name: "Communication Inefficace",
        severity: "medium",
        description: "Membres parlent peu ou mutisme de certains",
        suggestions: [
          "Rotation du facilitateur (pas toujours SM)",
          "Donner la parole d'abord aux juniors/silencieux",
          "Poser questions individuelles: 'Alex, qu'en est-il de ton ticket?'",
          "Utiliser le silence comme signal → enquêter en side"
        ]
      }
    ]
  },

  'Sprint Planning': {
    patterns: [
      {
        name: "Sprint Goal Flou",
        severity: "high",
        description: "Objectif du sprint pas clair ou trop vague",
        suggestions: [
          "Formuler en 1 phrase: 'Nous allons [verbe] [quoi] pour [bénéfice]'",
          "PO et équipe doivent pouvoir le redire en 5 secondes",
          "Lister 3-5 critères de succès mesurables",
          "Vérifier alignement avec Product Goal"
        ]
      },
      {
        name: "Surcommitment",
        severity: "high",
        description: "Équipe s'engage sur trop de stories pour la capacité réelle",
        suggestions: [
          "Utiliser historique vélocité + facteur de réalisme (0.8x)",
          "Inclure interruptions estimées (support, meetings)",
          "Ajouter 20% buffer pour l'imprévu",
          "Mieux vaut finir avec surplus que manquer le goal"
        ]
      },
      {
        name: "Estimations Optimistes",
        severity: "medium",
        description: "Points estimés vs réalité écart important (±50%)",
        suggestions: [
          "Comparer estimations de planning vs temps réel post-sprint",
          "Former à estimation: user stories? complexity? effort?",
          "Utiliser planning poker pour débats transparents",
          "Documenter assomptions (dépendances, blocages potentiels)"
        ]
      },
      {
        name: "Dépendances Cachées",
        severity: "high",
        description: "Dépendances inter-équipes découvertes trop tard",
        suggestions: [
          "Revoir dépendances explicitement en planning (5 min dédiées)",
          "Créer tableau 'External Deps' visible pour l'équipe",
          "Contact préalable avec équipes dépendantes",
          "Prioriser stories indépendantes en premier"
        ]
      },
      {
        name: "Manque de Clarté User Story",
        severity: "medium",
        description: "Stories mal définies, critères d'acceptation vagues",
        suggestions: [
          "Appliquer format: 'En tant que [user], je veux [action] pour [bénéfice]'",
          "Lister ≥3 critères d'acceptation testables",
          "Inclure edge cases et contraintes techniques",
          "DoD clair et partagé avant start du sprint"
        ]
      }
    ]
  },

  'Sprint Review': {
    patterns: [
      {
        name: "Feedback Limité",
        severity: "high",
        description: "Peu de feedback des stakeholders, demo unilatérale",
        suggestions: [
          "Inviter 5-7 stakeholders clés (client, users, métier)",
          "Durée: 50% démo, 50% discussion feedback",
          "Poser questions: 'Manque-t-il quelque chose? Surprises?'",
          "Capturer feedback spécifique sur backlog (pas vague)"
        ]
      },
      {
        name: "Backlog Chaotique",
        severity: "high",
        description: "Feedback non intégré au backlog, décisions ad-hoc",
        suggestions: [
          "Réécrire chaque feedback en story pour backlog",
          "Assigner responsable décision (PO) immédiatement",
          "Prioriser par impact client vs effort tech",
          "Communiquer au client: 'Ceci sera fait au sprint X'"
        ]
      },
      {
        name: "Démo Chaotique",
        severity: "medium",
        description: "Manque d'ordre, features pas fonctionnelles, bugs",
        suggestions: [
          "Préparation: test features 1h avant review (non jour-même)",
          "Script démo: quelle histoire raconter? ordre logique?",
          "Limiter démo à features vraiment 'done' (DoD respecté)",
          "Prévoir backup: screenshot/video si démo échoue"
        ]
      },
      {
        name: "Absence d'Alignement Produit",
        severity: "high",
        description: "Features livrées ne correspondent pas à roadmap produit",
        suggestions: [
          "Afficher Product Goal + Roadmap au début de review",
          "Connecter chaque feature au goal produit",
          "Valider avec PO: 'Cela avance-t-il vers notre vision?'",
          "Discuter metriques produit (adoption, NPS, usage)"
        ]
      },
      {
        name: "Communication Technique",
        severity: "medium",
        description: "Équipe parle tech, stakeholders ne comprennent pas",
        suggestions: [
          "Éviter jargon: pas 'API', dire 'le système peut être utilisé partout'",
          "Montrer de l'impact utilisateur, pas du code/architecture",
          "Utiliser terms métier: 'gagner du temps', 'réduire erreurs'",
          "Un non-tech valide la démo (PO ou UX)"
        ]
      }
    ]
  },

  'Retrospective': {
    patterns: [
      {
        name: "Rétrospective Passive",
        severity: "high",
        description: "Participants peu engagés, réponses monosyllabiques",
        suggestions: [
          "Changer de format: 4L, Mad-Sad-Glad, Timeline, Thermomètre",
          "Donner 5 min silencieuses pour réfléchir individuellement d'abord",
          "Poser open questions: 'Qu'avez-vous appris?'",
          "Faciliter débats: désaccords = richesse, explorer pourquoi"
        ]
      },
      {
        name: "Actions Vagues",
        severity: "high",
        description: "Plans d'amélioration pas SMART, jamais implémentés",
        suggestions: [
          "Format action: [Qui] fera [Quoi] pour [Objectif] avant [Date]",
          "Max 3 actions par retro (moins = plus de chances)",
          "Assigner propriétaire action (pas 'l'équipe')",
          "Vérifier actions antérieures en début de retro"
        ]
      },
      {
        name: "Blâme vs Apprentissage",
        severity: "medium",
        description: "Culture de blâme au lieu de curiosité et apprentissage",
        suggestions: [
          "Rappel: 'Sans blâme, on apprend mieux'",
          "Utiliser '5 Whys' pour root cause, pas culpabilité",
          "Valoriser erreurs: 'Qui a pris un risque?'",
          "Faciliter: 'Comment on pourrait faire différemment?'"
        ]
      },
      {
        name: "Récurrence de Problèmes",
        severity: "medium",
        description: "Mêmes problèmes soulevés sprint après sprint",
        suggestions: [
          "Afficher 'blocages récurrents' de 3 sprints précédents",
          "Analyse: 'Pourquoi n'avons-nous pas résolu cela?'",
          "Escalader problems non-résolvables équipe (→ management)",
          "Créer 'issue technique' au lieu de plan d'action équipe"
        ]
      },
      {
        name: "Dynamique Équipe Non Abordée",
        severity: "high",
        description: "Jamais de discussion sur collaboration, émotions, confiance",
        suggestions: [
          "Ajouter question: 'Comment vous vous sentez? Énergisé ou épuisé?'",
          "Discuter collaboration: 'Qui s'aide mutuellement? Où tensions?'",
          "Parler du SM: 'Comment je t'aide? Qu'est-ce que tu attends?'",
          "One-on-ones si problèmes interpersonnels détectés"
        ]
      }
    ]
  },

  'Autre': {
    patterns: [
      {
        name: "Clarté Type d'Atelier",
        severity: "medium",
        description: "Format non standard, objectif flou",
        suggestions: [
          "Définir clairement: quel est le but de cet atelier?",
          "Comparer avec cérémonies Scrum standard si possible",
          "Documenter l'objectif et output attendus",
          "Revoir si c'est vraiment utile ou peut être fusionné"
        ]
      },
      {
        name: "Participation",
        severity: "medium",
        description: "Certains participants peu engagés ou absents",
        suggestions: [
          "Vérifier qui devrait vraiment être présent",
          "Rendre async si possible (pour flexibilité)",
          "Documenter décisions pour absent pour transparence",
          "Alterner time slots pour zones horaires différentes"
        ]
      }
    ]
  }
};

export function getAntiPatternsByCeremonyType(ceremonyType) {
  return ANTIPATTERNS_BY_TYPE[ceremonyType] || ANTIPATTERNS_BY_TYPE['Autre'];
}

export function getPatternSuggestions(ceremonyType, patternName) {
  const patterns = getAntiPatternsByCeremonyType(ceremonyType);
  const found = patterns.patterns.find(p => p.name === patternName);
  return found?.suggestions || [];
}