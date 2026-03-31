import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoginDialog } from "@/components/LoginDialog";
import { useRef } from "react";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Zap,
  BarChart3,
  Users,
  Target,
  Shield,
  Database,
  Brain,
  Layers,
  ChevronRight,
  Globe,
  Award
} from "lucide-react";
import { DemoSimulator } from "@/components/nova/DemoSimulator.jsx";
import ConsultationModal from "@/components/nova/ConsultationModal";

const PricingSection = lazy(() => import("@/components/nova/PricingSection").then(m => ({ default: m.PricingSection })));

const translations = {
  en: {
    tagline: "AI-Native Agile Transformation",
    heroTitle1: "Accelerate Your",
    heroTitle2: "Digital Transformation",
    heroSubtitle: "Novagile AI fuses strategic consulting, human coaching and agentic AI to modernize your data ecosystem and maximize agile performance — with humans always in the loop.",
    ctaPrimary: "Explore Our Solutions",
    ctaSecondary: "Sign In",
    trustedBy: "Trusted by agile teams and organizations",
    whatWeDo: "Our Expertise",
    whatWeDoSub: "AI-native and human-centered — every service is augmented by agentic intelligence and governed by HITL/RLHF loops for continuous improvement.",
    pillar1: "AI-Augmented Strategic Consulting",
    pillar1desc: "Transformation roadmaps co-designed by human consultants and AI agents. Our agentic layer analyzes organizational signals in real time, while HITL loops ensure every recommendation is validated by expert judgment.",
    pillar2: "Human + AI Team Coaching",
    pillar2desc: "Scrum Masters and Agile Coaches amplified by AI copilots. Nova's RLHF-trained models surface coaching insights from ceremonies, letting humans focus on what matters: people, trust and growth.",
    pillar3: "Agentic AI Solution Deployment",
    pillar3desc: "End-to-end deployment of autonomous AI agents that detect patterns, trigger actions and learn from human feedback (RLHF). Built AI-native from day one — not retrofitted.",
    pillar4: "AI-Driven Data Modernization",
    pillar4desc: "Data architecture unified by intelligent agents. We design pipelines where AI continuously monitors data quality and humans retain governance — HITL by design, not by accident.",
    ourApproach: "Our Approach",
    approachSub: "From diagnosis to deployment — a structured methodology for sustainable transformation.",
    step1: "Organizational Audit",
    step1desc: "Deep analysis of your processes, flows, and team dynamics.",
    step2: "Strategic Roadmap",
    step2desc: "Co-construction of a transformation plan aligned with your business objectives.",
    step3: "AI Deployment",
    step3desc: "Integration of tailored intelligence solutions into your existing ecosystem.",
    step4: "Coaching & Adoption",
    step4desc: "Ongoing support to anchor new practices and measure impact.",
    novaProduct: "Nova — Our Agile Intelligence Platform",
    novaProductSub: "An AI platform that analyzes your team ceremonies in real-time, detects blockers, identifies risks, and generates actionable recommendations.",
    tryDemo: "Try Demo",
    noReg: "No registration required · 2 free demo analyses",
    securityTitle: "Enterprise-Grade Security",
    securitySub: "All the analytical value, zero data breach risk.",
    readOnly: "Read-Only Access",
    readOnlyDesc: "We never write or modify your data.",
    zeroStorage: "Zero Raw Storage",
    zeroStorageDesc: "Data is analyzed in RAM and immediately deleted.",
    anonymized: "Anonymized Insights",
    anonymizedDesc: "No PII stored — SHA256-hashed identifiers only.",
    integrations: "Integrations",
    integrationsSub: "Connect Novagile AI with your existing tools.",
    ctaTitle: "Ready to Transform Your Organization?",
    ctaSub: "Let's discuss your transformation challenges and how Novagile AI can accelerate your agile journey.",
    bookConsultation: "Book a Consultation",
    explorePlatform: "Explore the Platform",
  },
  fr: {
    tagline: "Transformation Agile AI-Native",
    heroTitle1: "Accélérez Votre",
    heroTitle2: "Transformation Numérique",
    heroSubtitle: "Novagile AI fusionne conseil stratégique, coaching humain et IA agentique pour moderniser votre écosystème de données et maximiser la performance agile — avec l'humain au coeur de la boucle.",
    ctaPrimary: "Découvrir Nos Solutions",
    ctaSecondary: "Se Connecter",
    trustedBy: "La confiance d'équipes et d'organisations agiles",
    whatWeDo: "Nos Expertises",
    whatWeDoSub: "AI-native et centré sur l'humain — chaque service est augmenté par l'intelligence agentique et gouverné par des boucles HITL/RLHF pour une amélioration continue.",
    pillar1: "Conseil Stratégique Augmenté par l'IA",
    pillar1desc: "Feuilles de route co-conçues par des consultants humains et des agents IA. Notre couche agentique analyse les signaux organisationnels en temps réel, pendant que les boucles HITL garantissent que chaque recommandation est validée par un expert humain.",
    pillar2: "Coaching d'Équipes Human + AI",
    pillar2desc: "Scrum Masters et Agile Coaches amplifiés par des copilotes IA. Les modèles entraînés par RLHF de Nova détectent les insights de coaching dans les cérémonies, libérant les humains pour l'essentiel : les personnes, la confiance et la croissance.",
    pillar3: "Déploiement de Solutions IA Agentiques",
    pillar3desc: "Déploiement de bout en bout d'agents IA autonomes qui détectent les patterns, déclenchent des actions et apprennent du feedback humain (RLHF). Construit AI-native dès le premier jour — jamais en rétrofit.",
    pillar4: "Modernisation des Données par l'IA",
    pillar4desc: "Architecture de données unifiée par des agents intelligents. Nous concevons des pipelines où l'IA surveille en continu la qualité des données tandis que les humains gardent la gouvernance — HITL by design, pas par accident.",
    ourApproach: "Notre Approche",
    approachSub: "Du diagnostic au déploiement — une méthodologie structurée pour une transformation durable.",
    step1: "Audit Organisationnel",
    step1desc: "Analyse approfondie de vos processus, flux et dynamiques d'équipe.",
    step2: "Feuille de Route Stratégique",
    step2desc: "Co-construction d'un plan de transformation aligné avec vos objectifs business.",
    step3: "Déploiement IA",
    step3desc: "Intégration de solutions d'intelligence adaptées dans votre écosystème existant.",
    step4: "Coaching & Adoption",
    step4desc: "Accompagnement continu pour ancrer les nouvelles pratiques et mesurer l'impact.",
    novaProduct: "Nova — Notre Plateforme d'Intelligence Agile",
    novaProductSub: "Une plateforme IA qui analyse vos cérémonies d'équipe en temps réel, détecte les blocages, identifie les risques et génère des recommandations actionnables.",
    tryDemo: "Essayer la Démo",
    noReg: "Sans inscription · 2 analyses de démo gratuites",
    securityTitle: "Sécurité de Niveau Entreprise",
    securitySub: "Toute la valeur analytique, aucun risque de fuite de données.",
    readOnly: "Accès Lecture Seule",
    readOnlyDesc: "Nous n'écrivons ni ne modifions jamais vos données.",
    zeroStorage: "Zéro Stockage Brut",
    zeroStorageDesc: "Les données sont analysées en RAM et supprimées immédiatement.",
    anonymized: "Insights Anonymisés",
    anonymizedDesc: "Aucune PII stockée — identifiants hashés SHA256 uniquement.",
    integrations: "Intégrations",
    integrationsSub: "Connectez Novagile AI à vos outils existants.",
    ctaTitle: "Prêt à Transformer Votre Organisation?",
    ctaSub: "Discutons de vos défis de transformation et de la façon dont Novagile AI peut accélérer votre parcours agile.",
    bookConsultation: "Réserver une Consultation",
    explorePlatform: "Explorer la Plateforme",
  }
};

const pillars = (t) => [
  {
    icon: Target,
    title: t("pillar1"),
    description: t("pillar1desc"),
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    tag: "HITL · Agentic",
    tagColor: "text-teal-500",
  },
  {
    icon: Users,
    title: t("pillar2"),
    description: t("pillar2desc"),
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    tag: "RLHF · Human-in-the-Loop",
    tagColor: "text-indigo-400",
  },
  {
    icon: Brain,
    title: t("pillar3"),
    description: t("pillar3desc"),
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    tag: "AI-Native · Multi-Agent",
    tagColor: "text-teal-400",
  },
  {
    icon: Database,
    title: t("pillar4"),
    description: t("pillar4desc"),
    color: "text-indigo-400",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    tag: "HITL by Design",
    tagColor: "text-indigo-400",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [showDemoSimulator, setShowDemoSimulator] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [demoTriesLeft, setDemoTriesLeft] = useState(2);
  const [lang, setLang] = useState("fr");
  const authChecked = useRef(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language || navigator.userLanguage;
    setLang(browserLang.startsWith("fr") ? "fr" : "en");

    const tries = localStorage.getItem("nova_demo_tries") || "2";
    setDemoTriesLeft(parseInt(tries));

    const checkAuth = async () => {
      if (authChecked.current) return;
      authChecked.current = true;
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          setTimeout(() => {
            navigate(createPageUrl(user?.app_role ? "Dashboard" : "ChooseAccess"));
          }, 0);
        }
      } catch (e) {
        console.warn("Auth check skipped:", e.message);
      }
    };
    checkAuth();
  }, [navigate]);

  const t = (key) => translations[lang]?.[key] || translations["fr"][key];

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/10 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-400/40 bg-teal-500/10 text-teal-300 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              {t("tagline")}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              {t("heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-teal-400 to-indigo-300 bg-clip-text text-transparent">
                {t("heroTitle2")}
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => document.getElementById("expertise")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-teal-900/40 transition-all hover:-translate-y-0.5"
              >
                {t("ctaPrimary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowLoginDialog(true)}
                className="px-8 py-6 text-base rounded-xl border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                {t("ctaSecondary")}
              </Button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10"
          >
            {[
              { value: "50+", label: lang === "fr" ? "Équipes accompagnées" : "Teams Coached" },
              { value: "40%", label: lang === "fr" ? "Réduction des blocages" : "Blocker Reduction" },
              { value: "3×", label: lang === "fr" ? "Vélocité améliorée" : "Velocity Improved" },
              { value: "GDPR", label: lang === "fr" ? "Conformité native" : "Native Compliance" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 px-6 py-5 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── EXPERTISE PILLARS ─── */}
      <section id="expertise" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
              {t("whatWeDo")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t("whatWeDo")}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("whatWeDoSub")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars(t).map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className={`h-full border-2 ${pillar.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white`}>
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 rounded-xl ${pillar.bgColor} flex items-center justify-center mb-5`}>
                      <pillar.icon className={`w-6 h-6 ${pillar.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{pillar.title}</h3>
                    {pillar.tag && (
                      <span className={`text-xs font-semibold uppercase tracking-wider ${pillar.tagColor} mb-3 inline-block`}>{pillar.tag}</span>
                    )}
                    <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APPROACH ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t("ourApproach")}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t("approachSub")}</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-teal-200 via-indigo-300 to-teal-200" />

            {[
              { num: "01", title: t("step1"), desc: t("step1desc"), color: "bg-teal-500" },
              { num: "02", title: t("step2"), desc: t("step2desc"), color: "bg-indigo-400" },
              { num: "03", title: t("step3"), desc: t("step3desc"), color: "bg-teal-400" },
              { num: "04", title: t("step4"), desc: t("step4desc"), color: "bg-indigo-500" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center px-4 relative"
              >
                <div className={`w-20 h-20 rounded-full ${step.color} flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg relative z-10`}>
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISUAL PROOF SECTION ─── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
              {lang === "fr" ? "Humain + IA, en action" : "Human + AI, in action"}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {lang === "fr" ? "Transformation vécue, pas seulement théorisée" : "Transformation lived, not just theorized"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {lang === "fr"
                ? "Nos consultants travaillent aux côtés de vos équipes, augmentés par des agents IA en temps réel."
                : "Our consultants work alongside your teams, augmented by real-time AI agents."}
            </p>
          </motion.div>

          <div className="grid grid-cols-12 gap-4">
            {/* Large left image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="col-span-12 md:col-span-7 relative rounded-2xl overflow-hidden h-80 md:h-96 group"
            >
              <img
                src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/8be8b94da_generated_image.png"
                alt="Équipe agile en collaboration"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 text-white">
                <p className="text-sm font-semibold">{lang === "fr" ? "Coaching d'équipe augmenté" : "Augmented team coaching"}</p>
                <p className="text-xs text-slate-300 mt-0.5">Human-in-the-Loop · Agile</p>
              </div>
            </motion.div>

            {/* Right column — 2 stacked images */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative rounded-2xl overflow-hidden h-44 group"
              >
                <img
                  src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/e6f91e73f_generated_image.png"
                  alt="Intelligence artificielle agentique"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-semibold">{lang === "fr" ? "IA Agentique" : "Agentic AI"}</p>
                  <p className="text-xs text-teal-200 mt-0.5">RLHF · Multi-Agent</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative rounded-2xl overflow-hidden h-44 group"
              >
                <img
                  src="https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/ea0f79171_generated_image.png"
                  alt="Consultants en transformation digitale"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-semibold">{lang === "fr" ? "Conseil stratégique" : "Strategic consulting"}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">HITL · AI-Native</p>
                </div>
              </motion.div>
            </div>

            {/* Bottom row — 3 images */}
            {[
              {
                src: "https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/639beac4c_generated_image.png",
                label: lang === "fr" ? "Automatisation intelligente" : "Intelligent automation",
                tag: "AI-Native",
                delay: 0.1
              },
              {
                src: "https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/8525261da_generated_image.png",
                label: lang === "fr" ? "Cérémonies Scrum" : "Scrum ceremonies",
                tag: "Agile Coaching",
                delay: 0.2
              },
              {
                src: "https://media.base44.com/images/public/697a48b6e08a49e0f4c8ada6/e6f91e73f_generated_image.png",
                label: lang === "fr" ? "Agents IA en temps réel" : "Real-time AI agents",
                tag: "Agentic · RLHF",
                delay: 0.3
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: item.delay }}
                className="col-span-12 md:col-span-4 relative rounded-2xl overflow-hidden h-52 group"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{item.tag}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NOVA PRODUCT SPOTLIGHT ─── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-teal-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="mb-6 bg-teal-500/20 text-teal-300 border-teal-400/30 px-3 py-1">
                Nova Platform
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {t("novaProduct")}
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                {t("novaProductSub")}
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  lang === "fr" ? "Détection automatique des blocages et risques" : "Automatic blocker and risk detection",
                  lang === "fr" ? "Analyse multi-sources (Slack, Teams, Jira, Trello)" : "Multi-source analysis (Slack, Teams, Jira, Trello)",
                  lang === "fr" ? "Recommandations contextuelles actionnables" : "Contextual actionable recommendations",
                  lang === "fr" ? "Conformité GDPR native — zéro rétention de données brutes" : "Native GDPR compliance — zero raw data retention",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowDemoSimulator(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-white px-6 py-5 rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t("tryDemo")} ({demoTriesLeft}/2)
                </Button>
                <p className="text-xs text-slate-500">{t("noReg")}</p>
              </div>
            </motion.div>

            {/* Visual product preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-500 ml-2">Nova Dashboard</span>
                </div>

                {/* Simulated dashboard content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: lang === "fr" ? "Blocages" : "Blockers", value: "3", color: "text-red-400", bg: "bg-red-500/10" },
                      { label: lang === "fr" ? "Risques" : "Risks", value: "7", color: "text-amber-400", bg: "bg-amber-500/10" },
                      { label: lang === "fr" ? "Résolus" : "Resolved", value: "12", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} rounded-xl p-3 text-center border border-white/5`}>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Fake recommendations */}
                  {[
                    { label: lang === "fr" ? "PR bloquée depuis 48h — revoir en daily" : "PR blocked 48h — review in daily", priority: "high" },
                    { label: lang === "fr" ? "Charge WIP élevée — 8 tickets en parallèle" : "High WIP load — 8 parallel tickets", priority: "medium" },
                    { label: lang === "fr" ? "Sprint Goal aligné à 87%" : "Sprint Goal aligned 87%", priority: "low" },
                  ].map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        rec.priority === "high" ? "bg-red-400" :
                        rec.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"
                      }`} />
                      <p className="text-xs text-slate-300 leading-relaxed">{rec.label}</p>
                    </motion.div>
                  ))}

                  {/* Fake chart bars */}
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 mb-3">{lang === "fr" ? "Tendance des blocages (7 jours)" : "Blocker trend (7 days)"}</p>
                    <div className="h-16 flex items-end gap-1">
                      {[40, 55, 35, 70, 50, 45, 30].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-teal-500 to-indigo-400 rounded-t opacity-70"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                🎮 {lang === "fr" ? "Données simulées" : "Simulated data"}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("securityTitle")}</h2>
            <p className="text-slate-600 max-w-xl mx-auto">{t("securitySub")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Shield, title: t("readOnly"), desc: t("readOnlyDesc"), color: "text-teal-600", bg: "bg-teal-50" },
              { icon: Database, title: t("zeroStorage"), desc: t("zeroStorageDesc"), color: "text-violet-600", bg: "bg-violet-50" },
              { icon: Award, title: t("anonymized"), desc: t("anonymizedDesc"), color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-slate-200 h-full text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-5`}>
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Certifications strip */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["SOC 2 Type II", "ISO 27001", "GDPR", "CCPA"].map((cert) => (
              <div key={cert} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS ─── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{t("integrations")}</h2>
            <p className="text-slate-600">{t("integrationsSub")}</p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Slack", color: "#4A154B" },
              { name: "Microsoft Teams", color: "#464EB8" },
              { name: "Jira", color: "#0052CC" },
              { name: "Confluence", color: "#0052CC" },
              { name: "Trello", color: "#0052CC" },
              { name: "Zoom", color: "#2D8CFF" },
            ].map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tool.color }} />
                <span className="text-sm font-medium text-slate-700">{tool.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <Suspense fallback={<div className="py-16 h-96" />}>
        <div id="pricing" className="max-w-7xl mx-auto px-6 py-16">
          <PricingSection />
        </div>
      </Suspense>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-teal-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-400/30 bg-teal-500/10 text-teal-300 text-sm font-medium mb-8">
              <Globe className="w-4 h-4" />
              Novagile AI
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t("ctaTitle")}
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
              {t("ctaSub")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setShowConsultationModal(true)}
                size="lg"
                className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-6 rounded-xl text-base font-semibold shadow-lg shadow-teal-900/40"
              >
                {t("bookConsultation")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setShowDemoSimulator(true)}
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base rounded-xl border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Play className="w-4 h-4 mr-2" />
                {t("explorePlatform")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      {showDemoSimulator && (
        <DemoSimulator
          onClose={() => setShowDemoSimulator(false)}
          onTriesUpdate={setDemoTriesLeft}
        />
      )}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        lang={lang}
      />
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />
    </div>
  );
}