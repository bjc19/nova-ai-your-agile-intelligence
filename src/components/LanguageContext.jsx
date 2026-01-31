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
    sprintOverview: "Vue d'ensemble du sprint",
    recentAnalyses: "Analyses récentes",
    recommendations: "Recommandations",
    
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
    analyzeTitle: "Analyze Your Daily Scrum",
    analyzeDescription: "Import data from Slack, upload files, or paste your transcript.",
    analyzeButton: "Analyser avec Nova",
    analyzing: "Nova analyse la réunion...",
    
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
    sprintOverview: "Sprint Overview",
    recentAnalyses: "Recent Analyses",
    recommendations: "Recommendations",
    
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