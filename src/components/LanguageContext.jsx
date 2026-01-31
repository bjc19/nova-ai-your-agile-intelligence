import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const translations = {
  fr: {
    // Navigation
    dashboard: "Dashboard",
    analyze: "Analyze",
    settings: "Settings",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    tryDemo: "Essayer la démo",
    
    // Home Page
    homeTitle: "Nova – Votre Scrum Master IA",
    homeSubtitle: "Détectez les blocages et risques en temps réel, sans jugement. Nova analyse vos Daily Scrums et propose des recommandations actionnables.",
    demoButton: "Voir la démo",
    
    // Dashboard
    welcomeBack: "Bon retour",
    welcomeBackTitle: "Bienvenue",
    sprintOverview: "Voici votre vue d'ensemble du sprint et vos dernières analyses.",
    recentAnalyses: "Analyses récentes",
    recommendations: "Recommandations",
    aiPoweredScrumMaster: "Scrum Master IA",
    daysLeftInSprint: "jours restants dans le sprint",
    newAnalysis: "Nouvelle analyse",
    readyForDailyScrum: "Prêt pour votre Daily Scrum ?",
    importDataDescription: "Importez des données depuis Slack, téléchargez des transcripts de réunion, ou collez vos notes directement. Nova analysera et fournira des insights actionnables.",
    connectSlack: "Connecter Slack",
    startAnalysis: "Démarrer l'analyse",
    keyRecommendations: "Recommandations clés",
    basedOnLatestAnalysis: "Basées sur votre dernière analyse",
    high: "élevée",
    medium: "moyenne",
    low: "basse",
    sprintPerformance: "Performance du Sprint",
    blockerRiskTrends: "Tendances des blockers et risques durant le sprint",
    blockers: "Blockers",
    risks: "Risques",
    fromYesterday: "depuis hier",
    noChange: "Aucun changement",
    more: "de plus",
    totalBlockers: "Blockers totaux",
    risksIdentified: "Risques identifiés",
    analysesRun: "Analyses effectuées",
    resolved: "Résolus",
    
    // Settings
    languageSettings: "Langue / Language",
    chooseLanguage: "Choisissez votre langue préférée • Choose your preferred language",
    interfaceLanguage: "Langue de l'interface",
    languageDescription: "Langue de l'interface utilisateur",
    languageApplied: "💡 La langue sera appliquée au prochain rafraîchissement de la page",
    integrations: "Intégrations",
    integrationsDescription: "Connectez les outils de votre équipe pour activer l'analyse et les insights en temps réel.",
    backendRequired: "Backend Functions Requis",
    backendRequiredDescription: "Pour activer les intégrations en direct avec les services externes, vous devez activer les Backend Functions dans les paramètres de votre app. Cela nécessite le plan Builder ou supérieur.",
    backToDashboard: "Retour au Dashboard",
    goToAppSettings: "Aller aux paramètres",
    availableIntegration: "Intégration disponible",
    recommended: "Recommandé",
    slackDescription: "Capturez les messages de standup depuis les canaux Slack. Nova analysera les conversations de vos canaux #standup ou #daily-scrum comme alternative à Teams/Zoom.",
    readChannelMessages: "Lire les messages du canal",
    postSummaries: "Publier des résumés",
    connected: "Connecté",
    connectSlack: "Connecter Slack",
    comingSoon: "Prochainement",
    requiresBackend: "Nécessite Backend",
    connect: "Connecter",
    manualDataImport: "Import manuel de données",
    manualDataImportDescription: "Vous n'avez pas d'intégrations activées ? Vous pouvez quand même utiliser Nova en important manuellement des données :",
    pasteTranscript: "Coller un transcript",
    pasteTranscriptDescription: "Copier/coller des notes de réunion",
    uploadFile: "Télécharger un fichier",
    uploadFileDescription: "Fichiers CSV, JSON ou TXT",
    jiraDescription: "Importez les données de sprint, les issues et les blockers directement depuis vos boards Jira.",
    azureDescription: "Synchronisez les work items, sprints et vélocité d'équipe depuis Azure DevOps.",
    teamsDescription: "Rejoignez et analysez les réunions Daily Scrum menées via Teams.",
    zoomDescription: "Connectez-vous aux réunions Zoom et analysez les transcripts en temps réel.",
    
    // Analysis
    analyzeTitle: "Analyser votre Daily Scrum",
    analyzeDescription: "Importez des données depuis Slack, téléchargez des fichiers ou collez votre transcript.",
    analyzeButton: "Analyser avec Nova",
    analyzing: "Nova analyse la réunion...",
    backToDashboard: "Retour au Dashboard",
    liveMode: "Mode en direct",
    simulationMode: "Mode simulation",
    slackTab: "Slack",
    uploadTab: "Télécharger",
    pasteTab: "Coller",
    dataReady: "Données prêtes pour l'analyse",
    characters: "caractères",
    demoMode: "Mode Démo",
    demoModeDescription: "Connectez Slack dans",
    toImportReal: "pour importer de vrais messages. Pour l'instant, utilisez les canaux d'exemple ci-dessus.",
    integrations: "Intégrations",
    fileUploadDescription: "Téléchargez les transcripts de réunion, les rapports Jira exportés, ou tout fichier texte avec des notes de standup.",
    
    // Sprint Health
    sprintHealthy: "Sprint en bonne santé",
    potentialDrift: "Dérive potentielle détectée",
    insufficientData: "Données insuffisantes",
    confidence: "Confiance",
    keyQuestion: "Question clé",
    suggestions: "suggestion(s) Nova",
    reviewSprint: "Revoir le sprint maintenant",
    acknowledge: "Acquitter",
    
    // Common
    loading: "Chargement...",
    error: "Erreur",
    cancel: "Annuler",
    save: "Enregistrer",
    send: "Envoyer",
    anonymous: "anonyme",

    // Footer
    aiScrumMaster: "Scrum Master IA",
    demoVersionNotice: "Version Démo • Mode Simulation • Aucune intégration réelle",

    // Posture Indicator
    novaIsInMode: "Nova est en mode",

    // Results Page
    analysisComplete: "Analyse Complète",
    analysisResults: "Résultats de l'Analyse",
    launchNewSimulation: "Lancer une nouvelle simulation",
    blockersDetected: "Blockers Détectés",
    risksIdentified: "Risques Identifiés",
    blockerDetails: "Détails des Blockers",
    riskDetails: "Détails des Risques",
    meetingSummary: "Résumé de la Réunion",
    detectedBlockersIssues: "Blockers & Problèmes Détectés",
    identifiedRisks: "Risques Identifiés",
    wantRealTimeAnalysis: "Veux-tu l'Analyse en Temps Réel ?",
    inFullVersion: "Dans la version complète, Nova se connecte directement à tes outils et fournit des insights automatiquement, sans entrée manuelle.",
    comingSoonIntegrations: "Bientôt : Jira · Azure DevOps · Teams · Zoom",
    improvementRecommendations: "Recommandations d'Amélioration",
    novaAnalyzing: "Nova analyse...",
    suggestedActionPlan: "Plan d'action suggéré par Nova",
    viewIn: "Voir dans",
    source: "la source",
    translateSummary: "Traduis en français le résumé suivant de manière concise et claire:\n\n{summary}",
    noItemsFound: "Aucun élément trouvé",
    items: "éléments",
    item: "élément",
    resolved: "Résolu",
    action: "Action",
    impact: "Impact",
    blockers: "blockers",
    risks: "risques",
    },
  en: {
    // Navigation
    dashboard: "Dashboard",
    analyze: "Analyze",
    settings: "Settings",
    signIn: "Sign In",
    signOut: "Sign Out",
    tryDemo: "Try Demo",
    
    // Home Page
    homeTitle: "Nova – Your AI Scrum Master",
    homeSubtitle: "Detect blockers and risks in real-time, without judgment. Nova analyzes your Daily Scrums and provides actionable recommendations.",
    demoButton: "See Demo",
    
    // Dashboard
    welcomeBack: "Welcome back",
    welcomeBackTitle: "Welcome back",
    sprintOverview: "Here's your sprint overview and latest insights.",
    recentAnalyses: "Recent Analyses",
    recommendations: "Recommendations",
    aiPoweredScrumMaster: "AI-Powered Scrum Master",
    daysLeftInSprint: "days left in sprint",
    newAnalysis: "New Analysis",
    readyForDailyScrum: "Ready for your Daily Scrum?",
    importDataDescription: "Import data from Slack, upload meeting transcripts, or paste your notes directly. Nova will analyze and provide actionable insights.",
    connectSlack: "Connect Slack",
    startAnalysis: "Start Analysis",
    keyRecommendations: "Key Recommendations",
    basedOnLatestAnalysis: "Based on your latest analysis",
    high: "high",
    medium: "medium",
    low: "low",
    sprintPerformance: "Sprint Performance",
    blockerRiskTrends: "Blocker and risk trends over the sprint",
    blockers: "Blockers",
    risks: "Risks",
    fromYesterday: "from yesterday",
    noChange: "No change",
    more: "more",
    totalBlockers: "Total Blockers",
    risksIdentified: "Risks Identified",
    analysesRun: "Analyses Run",
    resolved: "Resolved",
    
    // Settings
    languageSettings: "Language / Langue",
    chooseLanguage: "Choose your preferred language • Choisissez votre langue préférée",
    interfaceLanguage: "Interface Language",
    languageDescription: "User interface language",
    languageApplied: "💡 Language will be applied on the next page refresh",
    integrations: "Integrations",
    integrationsDescription: "Connect your team's tools to enable real-time analysis and insights.",
    backendRequired: "Backend Functions Required",
    backendRequiredDescription: "To enable live integrations with external services, you need to activate Backend Functions in your app settings. This requires the Builder plan or higher.",
    backToDashboard: "Back to Dashboard",
    goToAppSettings: "Go to App Settings",
    availableIntegration: "Available Integration",
    recommended: "Recommended",
    slackDescription: "Capture standup messages from Slack channels. Nova will analyze conversations from your #standup or #daily-scrum channels as an alternative to Teams/Zoom.",
    readChannelMessages: "Read channel messages",
    postSummaries: "Post summaries",
    connected: "Connected",
    connectSlack: "Connect Slack",
    comingSoon: "Coming Soon",
    requiresBackend: "Requires Backend",
    connect: "Connect",
    manualDataImport: "Manual Data Import",
    manualDataImportDescription: "Don't have integrations enabled? You can still use Nova by manually importing data:",
    pasteTranscript: "Paste Transcript",
    pasteTranscriptDescription: "Copy/paste meeting notes",
    uploadFile: "Upload File",
    uploadFileDescription: "CSV, JSON, or TXT files",
    jiraDescription: "Import sprint data, issues, and blockers directly from your Jira boards.",
    azureDescription: "Sync work items, sprints, and team velocity from Azure DevOps.",
    teamsDescription: "Join and analyze Daily Scrum meetings conducted via Teams.",
    zoomDescription: "Connect to Zoom meetings and analyze transcripts in real-time.",
    
    // Analysis
    analyzeTitle: "Analyze Your Daily Scrum",
    analyzeDescription: "Import data from Slack, upload files, or paste your transcript.",
    analyzeButton: "Analyze with Nova",
    analyzing: "Nova is analyzing the meeting...",
    backToDashboard: "Back to Dashboard",
    liveMode: "Live Mode",
    simulationMode: "Simulation Mode",
    slackTab: "Slack",
    uploadTab: "Upload",
    pasteTab: "Paste",
    dataReady: "Data Ready for Analysis",
    characters: "characters",
    demoMode: "Demo Mode",
    demoModeDescription: "Connect Slack in",
    toImportReal: "to import real messages. For now, use the sample channels above.",
    integrations: "Integrations",
    fileUploadDescription: "Upload meeting transcripts, exported Jira reports, or any text file with standup notes.",
    
    // Sprint Health
    sprintHealthy: "Sprint is healthy",
    potentialDrift: "Potential drift detected",
    insufficientData: "Insufficient data",
    confidence: "Confidence",
    keyQuestion: "Key Question",
    suggestions: "Nova suggestion(s)",
    reviewSprint: "Review sprint now",
    acknowledge: "Acknowledge",
    
    // Common
    loading: "Loading...",
    error: "Error",
    cancel: "Cancel",
    save: "Save",
    send: "Send",
    anonymous: "anonymous",

    // Footer
    aiScrumMaster: "AI Scrum Master",
    demoVersionNotice: "Demo Version • Simulation Mode • No real integrations",

    // Posture Indicator
    novaIsInMode: "Nova is in",

    // Results Page
    analysisComplete: "Analysis Complete",
    analysisResults: "Analysis Results",
    launchNewSimulation: "Run a New Simulation",
    blockersDetected: "Blockers Detected",
    risksIdentified: "Risks Identified",
    blockerDetails: "Blocker Details",
    riskDetails: "Risk Details",
    meetingSummary: "Meeting Summary",
    detectedBlockersIssues: "Detected Blockers & Issues",
    identifiedRisks: "Identified Risks",
    wantRealTimeAnalysis: "Want Real-Time Analysis?",
    inFullVersion: "In the full version, Nova connects directly to your tools and provides insights automatically, without any manual input.",
    comingSoonIntegrations: "Coming Soon: Jira · Azure DevOps · Teams · Zoom",
    improvementRecommendations: "Improvement Recommendations",
    novaAnalyzing: "Nova is analyzing...",
    suggestedActionPlan: "Action Plan Suggested by Nova",
    viewIn: "View in",
    source: "source",
    translateSummary: "Translate the following summary into English in a concise and clear way:\n\n{summary}",
    noItemsFound: "No items found",
    items: "items",
    item: "item",
    resolved: "Resolved",
    action: "Action",
    impact: "Impact",
    blockers: "blockers",
    risks: "risks",
    }

    };

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('nova_language') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('nova_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['fr'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}