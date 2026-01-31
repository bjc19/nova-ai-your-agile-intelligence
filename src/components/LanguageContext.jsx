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
    interfaceLanguage: "Interface Language",
    languageDescription: "Langue de l'interface utilisateur",
    languageApplied: "💡 La langue sera appliquée au prochain rafraîchissement de la page",
    integrations: "Integrations",
    integrationsDescription: "Connect your team's tools to enable real-time analysis and insights.",
    backendRequired: "Backend Functions Required",
    backendRequiredDescription: "To enable live integrations with external services, you need to activate Backend Functions in your app settings. This requires the Builder plan or higher.",
    
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