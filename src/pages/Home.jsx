import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Play,
  AlertTriangle,
  TrendingUp,
  Zap,
  BarChart3,
  LineChart as LineChartIcon,
  Check,
  X
} from "lucide-react";
import { DemoSimulator } from "@/components/nova/DemoSimulator.jsx";

const PricingSection = lazy(() => import("@/components/nova/PricingSection").then(m => ({ default: m.PricingSection })));

// Animation CSS pour la progression séquentielle des blocs
const commandAnimationStyles = `
  @keyframes cursor-blink {
    0%, 99% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes validate-frame {
    0% { 
      box-shadow: inset 0 0 0 0 #10b981, inset 0 0 0 0 #10b981;
    }
    50% {
      box-shadow: inset 24px 0 0 0 #10b981, inset -24px 0 0 0 #10b981;
    }
    100% {
      box-shadow: inset 24px 0 0 0 #10b981, inset -24px 0 0 0 #10b981;
    }
  }

  .terminal-block .text-white {
    position: relative;
    display: inline-block;
  }

  .terminal-block .text-white::after {
    content: '|';
    display: inline;
    margin-left: 2px;
    animation: cursor-blink 0.7s step-end 10s forwards;
    opacity: 1;
  }

  .terminal-block-0 .text-white::after { animation-delay: 0s; }
  .terminal-block-1 .text-white::after { animation-delay: 1s; }
  .terminal-block-2 .text-white::after { animation-delay: 1s; }
  .terminal-block-3 .text-white::after { animation-delay: 1s; }
  .terminal-block-4 .text-white::after { animation-delay: 1s; }

  .terminal-block-5 {
    animation: validate-frame 1s ease-out 10s forwards;
  }
`;

const translations = {
  en: {
    aiPoweredScrum: "Your AI Agile Expert",
    heroPart1: "Transform Your Routine into",
    heroPart2: "Actionable Insights",
    heroSubtitle: "Multi-source synchronization, intelligent risk management, adaptive project mode detection, personalized recommendations, smart anonymization with zero retention — measurable value creation in every sprint.",
    tryDemo: "Try Demo",
    signIn: "Sign In",
    daysLeft: "days left in sprint",
    noReg: "No registration required • 2 free demo analyses per 24h",
    everythingNeeds: "Everything Your Team Needs",
    novaUnderstandsNuances: "Nova understands the nuances of your team's daily routine and provides intelligent insights.",
    whatNovaAnalyzes: "What Nova Analyzes",
    demoVisualizations: "Example demo visualizations",
    sprintPerformance: "Sprint Performance",
    sprintTracking: "Sprint Tracking",
    simulated: "Simulated",
    antiPatterns: "Anti-patterns",
    demoData: "Demo data only",
    keyKPIs: "Key KPIs",
    ready: "Ready to transform your team?",
    tryNovaFree: "Try Nova for free with 2 demo analyses. Then choose the plan that suits your team.",
    launchDemo: "Launch Demo",
    seePlans: "See Plans",
    blockersDetection: "Blocker Detection",
    blockersDesc: "Automatically identify blockers and impediments from standup conversations",
    riskAnalysis: "Risk Analysis",
    riskDesc: "Proactively surface risks before they impact your sprint delivery",
    sprintInsights: "Sprint Insights",
    insightsDesc: "Track trends and patterns across your daily standups over time",
    recommendations: "Recommendations",
    recommendationsDesc: "Get AI-powered suggestions to unblock your team and accelerate delivery"
  },
  fr: {
    aiPoweredScrum: "Votre Expert Agile IA",
    heroPart1: "Transformez votre routine en",
    heroPart2: "Insights Actionnables",
    heroSubtitle: "Conçu pour vos équipes agiles de projets et de produits. Synchronisation multi-sources, gestion intelligente des risques, recommandations personnalisées, anonymisation intelligente sans rétention — création de valeur mesurable dans chaque sprint ou cycle de développement.",
    tryDemo: "Essayer la Démo",
    signIn: "Se Connecter",
    daysLeft: "jours restants dans le sprint",
    noReg: "Aucune inscription requise • 2 analyses de démo gratuites par 24h",
    everythingNeeds: "Tout ce dont votre équipe a besoin",
    novaUnderstandsNuances: "Nova comprend les nuances de votre travail d'équipe au quotidien et fournit des insights intelligents.",
    whatNovaAnalyzes: "Ce que Nova analyse",
    demoVisualizations: "Exemples de visualisations de démo",
    sprintPerformance: "Performance Sprint",
    sprintTracking: "Suivi du Sprint",
    simulated: "Simulé",
    antiPatterns: "Anti-patterns",
    demoData: "Données de démo uniquement",
    keyKPIs: "KPIs Clés",
    ready: "Prêts à transformer vos équipes?",
    tryNovaFree: "Essayez Nova gratuitement avec 2 analyses de démo. Puis choisissez le plan qui convient à votre équipe.",
    launchDemo: "Lancer la Démo",
    seePlans: "Voir les Plans",
    blockersDetection: "Détection des Blocages",
    blockersDesc: "Identifiez automatiquement les blocages et les obstacles à partir des conversations d'ateliers et réunions",
    riskAnalysis: "Analyse des Risques",
    riskDesc: "Surfacez proactivement les risques avant qu'ils n'impactent la livraison de votre sprint",
    sprintInsights: "Insights du Sprint / Cycle",
    insightsDesc: "Suivez les tendances et les modèles sur vos standups quotidiens au fil du temps",
    recommendations: "Recommandations",
    recommendationsDesc: "Obtenez des suggestions alimentées par l'IA pour débloquer votre équipe et accélérer la livraison"
  }
};

export default function Home() {
  const [showDemoSimulator, setShowDemoSimulator] = useState(false);
  const [demoTriesLeft, setDemoTriesLeft] = useState(2);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // Détecter la langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;
    setLang(browserLang.startsWith("fr") ? "fr" : "en");

    // Vérifier tries de démo (localStorage + IP-based)
    const tries = localStorage.getItem("nova_demo_tries") || "2";
    setDemoTriesLeft(parseInt(tries));
  }, []);

  const t = (key) => translations[lang][key] || translations["en"][key];

  const features = [
    {
      icon: AlertTriangle,
      title: t("blockersDetection"),
      description: t("blockersDesc"),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Zap,
      title: t("riskAnalysis"),
      description: t("riskDesc"),
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: TrendingUp,
      title: t("sprintInsights"),
      description: t("insightsDesc"),
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: BarChart3,
      title: t("recommendations"),
      description: t("recommendationsDesc"),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{commandAnimationStyles}</style>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur-sm border-slate-300 text-slate-700 mb-6">
              {t("aiPoweredScrum")}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
              {t("heroPart1")}{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("heroPart2")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => setShowDemoSimulator(true)}
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5 mr-2" />
                {t("tryDemo")} ({demoTriesLeft}/2)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg rounded-xl"
              >
                <a href="#pricing" className="flex items-center">{t("signIn")}</a>
              </Button>
            </div>

            <p className="text-sm text-slate-500 mt-4">
              {t("noReg")}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Demo Simulator Modal */}
      {showDemoSimulator && (
        <DemoSimulator 
          onClose={() => setShowDemoSimulator(false)}
          onTriesUpdate={setDemoTriesLeft}
        />
      )}

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t("everythingNeeds")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("novaUnderstandsNuances")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-slate-200">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zero-Retention Architecture Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-300">
              {lang === 'fr' ? 'Architecture Zero-Retention' : 'Zero-Retention Architecture'}
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {lang === 'fr' ? 'Comment Nova protège vos données' : 'How Nova protects your data'}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {lang === 'fr' 
                ? 'Toute la valeur analytique, aucun risque de fuite de données'
                : 'All the analytical value, zero data breach risk'}
            </p>
            </div>

            {/* Security Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <Card className="border-slate-200 bg-white h-full">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <span className="text-lg font-bold text-slate-700">R</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    {lang === 'fr' ? 'Lecture Seule, Jamais Écriture' : 'Read-Only, Never Write'}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Connexions en lecture seule à Slack, Teams, Jira' : 'Read-only connections to Slack, Teams, Jira'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>{lang === 'fr' ? 'Jamais d\'écriture, modification ou suppression' : 'Never write, modify or delete your data'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Accès temporaire uniquement pendant l\'analyse' : 'Temporary access only during analysis'}</span>
                    </li>
                  </ul>
                </CardContent>
                </Card>
                </div>

                <div>
              <Card className="border-slate-200 bg-white h-full">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <span className="text-lg font-bold text-slate-700">Ø</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    {lang === 'fr' ? 'Aucun Stockage de Données Sensibles' : 'No Sensitive Data Storage'}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Analyse en mémoire vive uniquement' : 'Analysis in RAM only'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Suppression immédiate post-traitement' : 'Immediate deletion post-processing'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Zéro stockage de conversations brutes' : 'Zero raw conversation storage'}</span>
                    </li>
                  </ul>
                </CardContent>
                </Card>
                </div>

                <div>
              <Card className="border-slate-200 bg-white h-full">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <span className="text-lg font-bold text-slate-700">A</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    {lang === 'fr' ? 'Données Anonymisées, Insights Préservés' : 'Anonymized Data, Preserved Insights'}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Marqueurs anonymisés au lieu de verbatims' : 'Anonymized markers instead of verbatims'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Pas de PII (Informations Personnelles)' : 'No PII (Personal Identifiable Information)'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{lang === 'fr' ? 'Identifiants hashés (SHA256)' : 'Hashed identifiers (SHA256)'}</span>
                    </li>
                  </ul>
                </CardContent>
                </Card>
                </div>
                </div>

                {/* Process Flow */}
                <div className="bg-slate-900 rounded-2xl p-8 mb-12 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-green-400">●</span>
              {lang === 'fr' ? 'Architecture Zero-Retention' : 'Zero-Retention Architecture'}
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-5xl mx-auto font-mono text-xs">
              {[
                { label: 'OAuth\nRead-Only', time: '< 1s' },
                { label: 'RAM\nLoad', time: '< 2s' },
                { label: 'AI\nAnalysis', time: '2-3s' },
                { label: 'Anonymize', time: '< 1s' },
                { label: 'Delete\nRaw', time: '< 1s' },
                { label: 'Store\nMarkers', time: '< 1s' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-24 h-16 bg-slate-800 border-2 border-slate-700 rounded flex flex-col items-center justify-center hover:border-blue-500 transition-colors terminal-block terminal-block-${i}`}>
                      <div className="text-white font-semibold whitespace-pre-line text-center leading-tight">
                        {item.label}
                      </div>
                    </div>
                    <div className="text-slate-500 mt-1">{item.time}</div>
                  </div>
                  {i < 5 && (
                    <div className="hidden md:flex items-center">
                      <ArrowRight className="w-6 h-6 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-green-400">✓</span>
              <span>{lang === 'fr' ? 'Temps total : ~5s | Données brutes : 0 bytes stockés' : 'Total time: ~5s | Raw data: 0 bytes stored'}</span>
            </div>
            </div>

            {/* Comparison Table */}
            <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Tableau Comparatif : Nova vs Les Autres
            </h3>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b-2 border-blue-100">
                      <th className="text-left p-5 font-semibold text-slate-900">
                        Critère
                      </th>
                      <th className="text-left p-5 font-semibold text-slate-900">
                        Les Autres
                      </th>
                      <th className="text-left p-5 font-semibold text-slate-900 bg-blue-50/50">
                        Nova
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Certifié SOC 2 Type II</td>
                      <td className="p-5 text-sm text-slate-600">Type I seulement (audit ponctuel)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Infrastructure et plateforme certifiées</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">ISO 27001</td>
                      <td className="p-5 text-sm text-slate-600">Pas certifié</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Infrastructure et plateforme certifiées</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">GDPR by Design</td>
                      <td className="p-5 text-sm text-slate-600">Adaptation postérieure (correctif)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Native depuis conception (Privacy by Design)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Architecture Zero-Retention</td>
                      <td className="p-5 text-sm text-slate-600">Stockage données (risque persistant)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Certifiée SOC 2 (mémoire vive uniquement)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Accès aux Données</td>
                      <td className="p-5 text-sm text-slate-600">Read/Write (risque modification)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Read-Only uniquement (votre contrôle)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Stockage Conversations</td>
                      <td className="p-5 text-sm text-slate-600">Archivées (exposition continue)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Supprimées post-traitement (protection maximale)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Analyse Données</td>
                      <td className="p-5 text-sm text-slate-600">Sur disque (persistance)</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Mémoire vive uniquement (volatilité)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-medium text-slate-900">Marqueurs Anonymisés</td>
                      <td className="p-5 text-sm text-slate-600">Option payante</td>
                      <td className="p-5 text-sm text-slate-900 bg-blue-50/30 font-medium">Par défaut (protection intégrée)</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="text-center text-sm text-slate-900 font-medium">
                Résultat : Toute la valeur analytique, aucun risque de fuite de données
              </p>
            </div>
          </div>

          {/* Certifications */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {lang === 'fr' ? 'Certifications & Conformité' : 'Certifications & Compliance'}
              </h3>
              <p className="text-slate-600">
                {lang === 'fr' 
                  ? 'Votre confiance est notre priorité absolue' 
                  : 'Your trust is our absolute priority'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div>
                <Card className="text-center p-6 hover:shadow-lg transition-all border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-16 h-16 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="#64748b" />
                      <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <text x="50" y="80" fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">SOC 2</text>
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">SOC 2</h4>
                  <p className="text-xs text-slate-600">Type II</p>
                </Card>
              </div>

              <div>
                <Card className="text-center p-6 hover:shadow-lg transition-all border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-16 h-16 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect x="10" y="10" width="80" height="80" rx="5" fill="#64748b" />
                      <text x="50" y="45" fontSize="18" fill="white" textAnchor="middle" fontWeight="bold">ISO</text>
                      <text x="50" y="65" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">27001</text>
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">ISO 27001</h4>
                  <p className="text-xs text-slate-600">Certified</p>
                </Card>
              </div>

              <div>
                <Card className="text-center p-6 hover:shadow-lg transition-all border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-16 h-16 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="#64748b" />
                      <circle cx="30" cy="30" r="3" fill="#cbd5e1" />
                      <circle cx="40" cy="30" r="3" fill="#cbd5e1" />
                      <circle cx="50" cy="30" r="3" fill="#cbd5e1" />
                      <circle cx="60" cy="30" r="3" fill="#cbd5e1" />
                      <circle cx="70" cy="30" r="3" fill="#cbd5e1" />
                      <text x="50" y="70" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">GDPR</text>
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">GDPR</h4>
                  <p className="text-xs text-slate-600">Compliant</p>
                </Card>
              </div>

              <div>
                <Card className="text-center p-6 hover:shadow-lg transition-all border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-16 h-16 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect x="5" y="5" width="90" height="90" rx="10" fill="#64748b" />
                      <path d="M20 30 L50 15 L80 30 L80 60 L50 85 L20 60 Z" fill="#475569" />
                      <text x="50" y="55" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">CCPA</text>
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">CCPA</h4>
                  <p className="text-xs text-slate-600">Compliant</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Visualizations Section */}
      <Suspense fallback={<div className="bg-slate-50 py-16 h-96" />}>
      <div className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t("whatNovaAnalyzes")}
            </h2>
            <p className="text-slate-600">{t("demoVisualizations")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Sprint Performance Chart */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0 }}
             viewport={{ once: true }}
           >
             <Card className="border-slate-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">{t("sprintPerformance")}</h3>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">🎮 {t("simulated")}</Badge>
                </div>
                <div className="h-32 flex items-end justify-between gap-1">
                  {[30, 35, 45, 50, 65, 72, 85, 90, 88].map((h, i) => (
                    <motion.div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">{t("demoData")}</p>
              </CardContent>
            </Card>
           </motion.div>

             {/* Anti-patterns Trends */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               viewport={{ once: true }}
             >
               <Card className="border-slate-200 h-full">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-semibold text-slate-900">{t("antiPatterns")}</h3>
                     <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">🎮 {t("simulated")}</Badge>
                   </div>
                   <div className="space-y-3">
                     {[
                       { name: "WIP Overload", count: 12, color: "bg-red-500" },
                       { name: "Context Switch", count: 8, color: "bg-amber-500" },
                       { name: "Blocked Items", count: 5, color: "bg-yellow-500" }
                     ].map((item, i) => {
                       const gradientClass = item.color === 'bg-red-500' 
                         ? 'bg-gradient-to-r from-red-400 to-red-500'
                         : item.color === 'bg-amber-500'
                         ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                         : 'bg-gradient-to-r from-yellow-400 to-yellow-500';

                       return (
                       <motion.div 
                         key={item.name} 
                         className="text-sm"
                         initial={{ opacity: 0, x: -10 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                         viewport={{ once: true }}
                       >
                         <div className="flex justify-between mb-1">
                           <span className="text-slate-600">{item.name}</span>
                           <span className="font-semibold">{item.count}</span>
                         </div>
                         <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                           <motion.div 
                             className={`h-full ${gradientClass}`}
                             initial={{ width: 0 }}
                             whileInView={{ width: `${(item.count/12)*100}%` }}
                             transition={{ duration: 0.8, delay: 0.15 + i * 0.1 }}
                             viewport={{ once: true }}
                           />
                         </div>
                       </motion.div>
                     );
                     })}
                   </div>
                   <p className="text-xs text-slate-500 mt-3 text-center">{t("demoData")}</p>
                 </CardContent>
               </Card>
             </motion.div>

             {/* Sprint Tracking */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               viewport={{ once: true }}
             >
               <Card className="border-slate-200 h-full">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-semibold text-slate-900">{t("sprintTracking")}</h3>
                     <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">🎮 {t("simulated")}</Badge>
                   </div>
                   <div className="relative h-32 flex items-end justify-between gap-0.5">
                     {/* Burndown curve background grid */}
                     <motion.svg 
                       className="absolute inset-0 w-full h-full" 
                       viewBox="0 0 100 100" 
                       preserveAspectRatio="none"
                       initial={{ opacity: 0 }}
                       whileInView={{ opacity: 1 }}
                       transition={{ duration: 0.8, delay: 0.25 }}
                       viewport={{ once: true }}
                     >
                       <defs>
                         <linearGradient id="burndownGradient" x1="0" y1="0" x2="100" y2="100">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                           <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                         </linearGradient>
                       </defs>
                       {/* Burndown line */}
                       <polyline points="0,85 14,75 28,60 42,48 56,35 70,20 85,15 100,12" fill="url(#burndownGradient)" stroke="#10b981" strokeWidth="2" />
                       {/* Ideal line reference */}
                       <line x1="0" y1="100" x2="100" y2="0" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
                     </motion.svg>
                     {/* Bar chart overlay */}
                     {[
                       { day: "Mon", value: 15 },
                       { day: "Tue", value: 18 },
                       { day: "Wed", value: 22 },
                       { day: "Thu", value: 28 },
                       { day: "Fri", value: 32 }
                     ].map((item, i) => (
                       <motion.div 
                         key={i} 
                         className="flex-1 flex flex-col items-center relative z-10"
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         transition={{ duration: 0.5, delay: 0.25 + i * 0.08 }}
                         viewport={{ once: true }}
                       >
                         <motion.div 
                           className="w-full bg-gradient-to-t from-green-500 via-emerald-400 to-emerald-300 rounded-t opacity-80"
                           initial={{ height: 0 }}
                           whileInView={{ height: `${(item.value/32)*100}%` }}
                           transition={{ duration: 0.8, delay: 0.25 + i * 0.08 }}
                           viewport={{ once: true }}
                         />
                         <span className="text-xs text-slate-500 mt-1">{item.day}</span>
                       </motion.div>
                     ))}
                   </div>
                   <p className="text-xs text-slate-500 mt-3 text-center">{t("demoData")}</p>
                 </CardContent>
               </Card>
             </motion.div>

             {/* KPIs */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               viewport={{ once: true }}
             >
               <Card className="border-slate-200 h-full">
                 <CardContent className="p-6">
                   <h3 className="font-semibold text-slate-900 mb-4">{t("keyKPIs")}</h3>
                   <div className="space-y-4">
                     {[
                       { label: "Stabilité Sprint Goal", value: "85%", emoji: "🎮" },
                       { label: "Adoption Recommandations", value: "65%", emoji: "🎮" },
                       { label: "Dérives Anticipées", value: "80%", emoji: "🎮" }
                     ].map((kpi, i) => (
                       <motion.div 
                         key={kpi.label}
                         initial={{ opacity: 0, x: -10 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                         viewport={{ once: true }}
                       >
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-xs text-slate-600">{kpi.label} {kpi.emoji}</span>
                           <span className="text-sm font-bold text-blue-600">{kpi.value}</span>
                         </div>
                         <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                           <motion.div 
                             className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                             initial={{ width: 0 }}
                             whileInView={{ width: kpi.value }}
                             transition={{ duration: 0.8, delay: 0.35 + i * 0.1 }}
                             viewport={{ once: true }}
                           />
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   <p className="text-xs text-slate-500 mt-4 text-center">{t("demoData")}</p>
                 </CardContent>
               </Card>
             </motion.div>
           </div>
           </div>
           </div>
           </Suspense>

           {/* Pricing Section */}
           <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-16 h-96" />}>
           <div id="pricing" className="max-w-7xl mx-auto px-6 py-16">
           <PricingSection />
           </div>
           </Suspense>

           {/* Integrations Section */}
           <Suspense fallback={<div className="bg-slate-50 py-16 h-96" />}>
           <div className="bg-slate-50 py-16">
           <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {lang === 'fr' ? 'Intégrations' : 'Integrations'}
            </h2>
            <p className="text-lg text-slate-600">
              {lang === 'fr' 
                ? 'Connectez Nova avec vos outils préférés' 
                : 'Connect Nova with your favorite tools'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Slack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-3 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-10 h-10" viewBox="0 0 127 127" fill="none">
                      <path d="M27.2 80c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8h8v8zm4 0c0-4.4 3.6-8 8-8s8 3.6 8 8v20c0 4.4-3.6 8-8 8s-8-3.6-8-8V80z" fill="#E01E5A"/>
                      <path d="M39.2 27c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8v8h-8zm0 4c4.4 0 8 3.6 8 8s-3.6 8-8 8h-20c-4.4 0-8-3.6-8-8s3.6-8 8-8h20z" fill="#36C5F0"/>
                      <path d="M99.8 47c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8h-8v-8zm-4 0c0 4.4-3.6 8-8 8s-8-3.6-8-8V27c0-4.4 3.6-8 8-8s8 3.6 8 8v20z" fill="#2EB67D"/>
                      <path d="M87.8 99.8c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8v-8h8zm0-4c-4.4 0-8-3.6-8-8s3.6-8 8-8h20c4.4 0 8 3.6 8 8s-3.6 8-8 8h-20z" fill="#ECB22E"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Slack</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Conversations d\'équipe' 
                      : 'Team conversations'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Microsoft Teams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 2228.833 2073.333">
                      <path fill="#5059C9" d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-1.711c-199.901.028-361.975-162-362.004-361.901V828.971c.001-28.427 23.045-51.471 51.471-51.471z"/>
                      <circle fill="#5059C9" cx="1943.75" cy="440.583" r="233.25"/>
                      <circle fill="#7B83EB" cx="1218.083" cy="336.917" r="336.917"/>
                      <path fill="#7B83EB" d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-95.01 99.676v598.105c-7.505 322.519 247.657 590.16 570.167 598.053 322.51-7.893 577.671-275.534 570.167-598.053V877.176c1.245-53.745-41.268-98.346-95.011-99.676z"/>
                      <path opacity=".1" d="M1244 777.5v838.145c-.258 38.435-23.549 72.964-59.09 87.598-11.316 4.787-23.478 7.254-35.765 7.257H667.613c-6.738-17.105-12.958-34.21-18.142-51.833a631.287 631.287 0 0 1-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52H1244z"/>
                      <path opacity=".2" d="M1192.167 777.5v889.978a91.84 91.84 0 0 1-7.257 35.765c-14.634 35.541-49.163 58.833-87.598 59.09H691.975c-8.812-17.105-17.105-34.21-24.362-51.833-7.257-17.623-12.958-34.21-18.142-51.833a631.282 631.282 0 0 1-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h475.313z"/>
                      <path opacity=".2" d="M1192.167 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855h-447.84A631.282 631.282 0 0 1 622 1475.177V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h475.312z"/>
                      <path opacity=".2" d="M1140.333 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H649.472A631.282 631.282 0 0 1 622 1475.177V877.02c-1.246-53.659 41.198-98.19 94.855-99.52h423.478z"/>
                      <path opacity=".1" d="M1244 509.522v163.275c-8.812.518-17.105 1.037-25.917 1.037s-17.105-.518-25.917-1.037c-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003 288.02 288.02 0 0 1-16.587-51.833h258.648c52.305.198 94.657 42.549 94.856 94.854z"/>
                      <path opacity=".2" d="M1192.167 561.355v111.442a951.733 951.733 0 0 1-25.917 1.037c-8.812 0-17.105-.518-25.917-1.037-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003h242.062c52.304.198 94.656 42.55 94.855 94.854z"/>
                      <path opacity=".2" d="M1192.167 561.355v111.442a951.733 951.733 0 0 1-25.917 1.037c-8.812 0-17.105-.518-25.917-1.037-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003h242.062c52.304.198 94.656 42.55 94.855 94.854z"/>
                      <path opacity=".2" d="M1140.333 561.355v111.442c-8.812.518-17.105 1.037-25.917 1.037s-17.105-.518-25.917-1.037c-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003h242.062c52.305.198 94.656 42.55 94.855 94.854z"/>
                      <path fill="#FFF" d="M1140.333 561.355v111.442c-8.812.518-17.105 1.037-25.917 1.037s-17.105-.518-25.917-1.037c-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003h242.062c52.305.198 94.656 42.55 94.855 94.854z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Microsoft Teams</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Transcriptions de réunions' 
                      : 'Meeting transcripts'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Jira */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 256 256">
                      <defs>
                        <linearGradient x1="98.031%" y1="0.161%" x2="58.888%" y2="40.766%" id="a">
                          <stop stopColor="#0052CC" offset="18%"/>
                          <stop stopColor="#2684FF" offset="100%"/>
                        </linearGradient>
                      </defs>
                      <path d="M244.658 0H121.707c0 55.502 45.001 100.503 100.503 100.503h22.448V22.448C244.658 10.048 234.61 0 244.658 0z" fill="#2684FF"/>
                      <path d="M121.707 0H0c0 55.502 45.001 100.503 100.503 100.503h21.204V21.204C121.707 9.503 111.204 0 121.707 0z" fill="url(#a)"/>
                      <path d="M121.707 121.707H0c0 55.502 45.001 100.503 100.503 100.503h21.204v-79.299c0-11.701-10.503-21.204-21.204-21.204z" fill="url(#a)"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Jira</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Métriques de backlog' 
                      : 'Backlog metrics'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Confluence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 256 256">
                      <defs>
                        <linearGradient x1="99.14%" y1="112.696%" x2="33.746%" y2="37.947%" id="b">
                          <stop stopColor="#0052CC" offset="18%"/>
                          <stop stopColor="#2684FF" offset="100%"/>
                        </linearGradient>
                      </defs>
                      <path d="M12.803 4.542c-6.845 10.52-6.845 22.972-6.845 22.972 0 2.369 1.901 4.27 4.27 4.27h52.44c2.368 0 3.612-2.791 2.052-4.596L19.69.915C17.48-1.476 14.1-.813 12.803 4.542z" fill="url(#b)"/>
                      <path d="M243.197 251.458c6.845-10.52 6.845-22.972 6.845-22.972 0-2.369-1.901-4.27-4.27-4.27h-52.44c-2.368 0-3.612 2.791-2.052 4.596l45.03 26.273c2.21 2.391 5.59 1.728 6.887-3.627z" fill="#2684FF"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Confluence</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Documentation d\'équipe' 
                      : 'Team documentation'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* GitHub */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 256 250">
                      <path d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46 6.397 1.185 8.746-2.777 8.746-6.158 0-3.052-.12-13.135-.174-23.83-35.61 7.742-43.124-15.103-43.124-15.103-5.823-14.795-14.213-18.73-14.213-18.73-11.613-7.944.876-7.78.876-7.78 12.853.902 19.621 13.19 19.621 13.19 11.417 19.568 29.945 13.911 37.249 10.64 1.149-8.272 4.466-13.92 8.127-17.116-28.431-3.236-58.318-14.212-58.318-63.258 0-13.975 5-25.394 13.188-34.358-1.329-3.224-5.71-16.242 1.24-33.874 0 0 10.749-3.44 35.21 13.121 10.21-2.836 21.16-4.258 32.038-4.307 10.878.049 21.837 1.47 32.066 4.307 24.431-16.56 35.165-13.12 35.165-13.12 6.967 17.63 2.584 30.65 1.255 33.873 8.207 8.964 13.173 20.383 13.173 34.358 0 49.163-29.944 59.988-58.447 63.157 4.591 3.972 8.682 11.762 8.682 23.704 0 17.126-.148 30.91-.148 35.126 0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002 256 57.307 198.691 0 128.001 0zm-80.06 182.34c-.282.636-1.283.827-2.194.39-.929-.417-1.45-1.284-1.15-1.922.276-.655 1.279-.838 2.205-.399.93.418 1.46 1.293 1.139 1.931zm6.296 5.618c-.61.566-1.804.303-2.614-.591-.837-.892-.994-2.086-.375-2.66.63-.566 1.787-.301 2.626.591.838.903 1 2.088.363 2.66zm4.32 7.188c-.785.545-2.067.034-2.86-1.104-.784-1.138-.784-2.503.017-3.05.795-.547 2.058-.055 2.861 1.075.782 1.157.782 2.522-.019 3.08zm7.304 8.325c-.701.774-2.196.566-3.29-.49-1.119-1.032-1.43-2.496-.726-3.27.71-.776 2.213-.558 3.315.49 1.11 1.03 1.45 2.505.701 3.27zm9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033-1.448-.439-2.395-1.613-2.103-2.626.301-1.01 1.747-1.484 3.207-1.028 1.446.436 2.396 1.602 2.095 2.622zm10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95-1.53.034-2.769-.82-2.786-1.86 0-1.065 1.202-1.932 2.733-1.958 1.522-.03 2.768.818 2.768 1.868zm10.555-.405c.182 1.03-.875 2.088-2.387 2.37-1.485.271-2.861-.365-3.05-1.386-.184-1.056.893-2.114 2.376-2.387 1.514-.263 2.868.356 3.061 1.403z" fill="#181717"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">GitHub</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Pull requests & commits' 
                      : 'Pull requests & commits'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zoom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 210 210">
                      <path d="M105 0C47.103 0 0 47.103 0 105s47.103 105 105 105 105-47.103 105-105S162.897 0 105 0z" fill="#2D8CFF"/>
                      <path d="M61.667 151.667V90l41.25 30.833V90h45.833v61.667l-41.25-30.834v30.834H61.667z" fill="#FFF"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Zoom</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Enregistrements vidéo' 
                      : 'Video recordings'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trello */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-14 h-14" viewBox="0 0 256 256">
                      <defs>
                        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="c">
                          <stop stopColor="#0091E6" offset="0%"/>
                          <stop stopColor="#0079BF" offset="100%"/>
                        </linearGradient>
                      </defs>
                      <rect fill="url(#c)" width="256" height="256" rx="25"/>
                      <rect fill="#FFF" x="144.64" y="33.28" width="78.08" height="112" rx="12"/>
                      <rect fill="#FFF" x="33.28" y="33.28" width="78.08" height="176" rx="12"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Trello</h3>
                  <p className="text-sm text-slate-600">
                    {lang === 'fr' 
                      ? 'Tableaux et cartes' 
                      : 'Boards & cards'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          </div>
          </div>
          </Suspense>

          {/* CTA Section */}
          <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-[#197aed] to-[#0f5bbf] p-8 md:p-12 text-center"
          >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t("ready")}
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            {t("tryNovaFree")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => setShowDemoSimulator(true)}
              size="lg" 
              className="bg-white text-[#197aed] hover:bg-blue-50 px-8 font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              {t("launchDemo")}
            </Button>
            <Button 
              size="lg"
              className="bg-white text-[#197aed] hover:bg-blue-50 px-8 font-semibold"
            >
              <a href="#pricing">{t("seePlans")}</a>
            </Button>
          </div>
          </motion.div>
        </div>
      </div>
    );
  }