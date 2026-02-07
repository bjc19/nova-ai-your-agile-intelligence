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
    heroSubtitle: "Synchronisation multi-sources, gestion intelligente des risques, détection adaptative du mode projet, recommandations personnalisées, anonymisation intelligente sans rétention — création de valeur mesurable dans chaque sprint ou cycle de développement.",
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
    ready: "Prêt à transformer votre équipe?",
    tryNovaFree: "Essayez Nova gratuitement avec 2 analyses de démo. Puis choisissez le plan qui convient à votre équipe.",
    launchDemo: "Lancer la Démo",
    seePlans: "Voir les Plans",
    blockersDetection: "Détection des Blocages",
    blockersDesc: "Identifiez automatiquement les blocages et les obstacles à partir des conversations de standup",
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
              🎮 {t("noReg")}
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
                           className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t opacity-80"
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