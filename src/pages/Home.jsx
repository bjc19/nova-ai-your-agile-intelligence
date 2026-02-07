import { useState, useEffect } from "react";
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
  LineChart as LineChartIcon
} from "lucide-react";
import { PricingSection } from "@/components/nova/PricingSection";
import { DemoSimulator } from "@/components/nova/DemoSimulator.jsx";

const translations = {
  en: {
    aiPoweredScrum: "AI-Powered Scrum Intelligence",
    heroPart1: "Turn Daily Standups into",
    heroPart2: "Actionable Insights",
    heroSubtitle: "Nova analyzes your team's standup conversations to detect blockers, identify risks, and provide recommendations — so you can focus on delivering value.",
    tryDemo: "Try Demo",
    signIn: "Sign In",
    daysLeft: "days left in sprint",
    noReg: "No registration required • 2 free demo analyses per 24h per IP",
    everythingNeeds: "Everything Your Scrum Master Needs",
    novaUnderstandsNuances: "Nova understands the nuances of agile ceremonies and provides intelligent insights.",
    whatNovaAnalyzes: "What Nova Analyzes",
    demoVisualizations: "Example demo visualizations",
    sprintPerformance: "Sprint Performance",
    simulated: "Simulated",
    antiPatterns: "Anti-patterns",
    demoData: "Demo data only",
    keyKPIs: "Key KPIs",
    ready: "Ready to transform your standups?",
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
    aiPoweredScrum: "Intelligence Scrum Alimentée par l'IA",
    heroPart1: "Transformez vos Standups en",
    heroPart2: "Insights Actionnables",
    heroSubtitle: "Nova analyse les conversations de standup de votre équipe pour détecter les blocages, identifier les risques et proposer des recommandations — afin que vous puissiez vous concentrer sur la création de valeur.",
    tryDemo: "Essayer la Démo",
    signIn: "Se Connecter",
    daysLeft: "jours restants dans le sprint",
    noReg: "Aucune inscription requise • 2 analyses de démo gratuites par 24h par IP",
    everythingNeeds: "Tout ce dont votre Scrum Master a besoin",
    novaUnderstandsNuances: "Nova comprend les nuances des cérémonies agiles et fournit des insights intelligents.",
    whatNovaAnalyzes: "Ce que Nova analyse",
    demoVisualizations: "Exemples de visualisations de démo",
    sprintPerformance: "Performance Sprint",
    simulated: "Simulé",
    antiPatterns: "Anti-patterns",
    demoData: "Données de démo uniquement",
    keyKPIs: "KPIs Clés",
    ready: "Prêt à transformer vos standups?",
    tryNovaFree: "Essayez Nova gratuitement avec 2 analyses de démo. Puis choisissez le plan qui convient à votre équipe.",
    launchDemo: "Lancer la Démo",
    seePlans: "Voir les Plans",
    blockersDetection: "Détection des Blocages",
    blockersDesc: "Identifiez automatiquement les blocages et les obstacles à partir des conversations de standup",
    riskAnalysis: "Analyse des Risques",
    riskDesc: "Surfacez proactivement les risques avant qu'ils n'impactent la livraison de votre sprint",
    sprintInsights: "Insights du Sprint",
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
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
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
                Try Demo ({demoTriesLeft}/2)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg rounded-xl"
              >
                <a href="#pricing" className="flex items-center">Sign In</a>
              </Button>
            </div>

            <p className="text-sm text-slate-500 mt-4">
              🎮 No registration required • 2 free demo analyses per 24h per IP
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
            Everything Your Scrum Master Needs
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Nova understands the nuances of agile ceremonies and provides intelligent insights.
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

      {/* Demo Visualizations Section */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ce que Nova analyse
            </h2>
            <p className="text-slate-600">Exemples de visualisations de démo</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sprint Performance Chart */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Performance Sprint</h3>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">🎮 Simulé</Badge>
                </div>
                <div className="h-32 flex items-end justify-between gap-1">
                  {[30, 35, 45, 50, 65, 72, 85, 90, 88].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">Données simulées pour démonstration</p>
              </CardContent>
            </Card>

            {/* Anti-patterns Trends */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Anti-patterns</h3>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">🎮 Simulé</Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "WIP Overload", count: 12, color: "bg-red-500" },
                    { name: "Context Switch", count: 8, color: "bg-amber-500" },
                    { name: "Blocked Items", count: 5, color: "bg-yellow-500" }
                  ].map(item => (
                    <div key={item.name} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${(item.count/12)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">Ces données sont simulées</p>
              </CardContent>
            </Card>

            {/* KPIs */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">KPIs Clés</h3>
                <div className="space-y-4">
                  {[
                    { label: "Stabilité Sprint Goal", value: "85%", emoji: "🎮" },
                    { label: "Adoption Recommandations", value: "65%", emoji: "🎮" },
                    { label: "Dérives Anticipées", value: "80%", emoji: "🎮" }
                  ].map(kpi => (
                    <div key={kpi.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600">{kpi.label} {kpi.emoji}</span>
                        <span className="text-sm font-bold text-blue-600">{kpi.value}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: kpi.value }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">Données de démo uniquement</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-16">
        <PricingSection />
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Prêt à transformer vos standups?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Essayez Nova gratuitement avec 2 analyses de démo. Puis choisissez le plan qui convient à votre équipe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => setShowDemoSimulator(true)}
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 px-8"
            >
              <Play className="w-4 h-4 mr-2" />
              Lancer la Démo
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8"
            >
              <a href="#pricing">Voir les Plans</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}