import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Target, GitBranch, TrendingUp, AlertTriangle,
  Layers, Zap, BarChart2, ArrowRight, Loader2
} from "lucide-react";

const MODULE_ICONS = {
  transformation_plan: GitBranch,
  change_management: Target,
  risk_matrix: AlertTriangle,
  okr_alignment: BarChart2,
  kaizen_sprint: Zap,
  lean_analysis: Layers,
  agile_health: TrendingUp,
  generic: Sparkles,
};

const MODULE_COLORS = {
  transformation_plan: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-800" },
  change_management: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  risk_matrix: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  okr_alignment: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-800" },
  kaizen_sprint: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  lean_analysis: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  agile_health: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
  generic: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-800" },
};

function ModuleCard({ module }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = MODULE_ICONS[module.type] || MODULE_ICONS.generic;
  const colors = MODULE_COLORS[module.type] || MODULE_COLORS.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 ${colors.border} ${colors.bg} rounded-2xl overflow-hidden`}
    >
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white/70 border ${colors.border}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-sm ${colors.text}`}>{module.title}</span>
              <Badge className={`text-xs ${colors.badge} border-0`}>{module.framework}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{module.rationale}</p>
          </div>
        </div>
        <button className="shrink-0 text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 bg-white/60 border-t border-white/50 space-y-4">
              {/* Main content sections */}
              {module.sections?.map((section, i) => (
                <div key={i} className="pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3" />
                    {section.label}
                  </p>
                  {Array.isArray(section.content) ? (
                    <ul className="space-y-1.5">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className={`shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold mt-0.5 bg-white border ${colors.border} ${colors.text}`}>
                            {j + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{section.content}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContextualModuleEngine({ analysisHistory = [], lastAnalysisResult = null }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [contextSummary, setContextSummary] = useState("");

  // Build context with precise signals to drive conditional generation
  const buildContext = () => {
    const recentAnalyses = analysisHistory.slice(0, 10);
    const totalBlockers = recentAnalyses.reduce((s, a) => s + (a.blockers_count || 0), 0);
    const totalRisks = recentAnalyses.reduce((s, a) => s + (a.risks_count || 0), 0);
    const totalResolved = recentAnalyses.reduce((s, a) => s + (a.resolved_count || 0), 0);
    const sources = [...new Set(recentAnalyses.map(a => a.source).filter(Boolean))];
    const contextLabels = [...new Set(recentAnalyses.map(a => a.context_label).filter(Boolean))];

    // Extract actual blocker/risk descriptions for precision
    const blockerTexts = recentAnalyses
      .flatMap(a => (a.analysis_data?.blockers || []).map(b => b.issue || b.description).filter(Boolean))
      .slice(0, 5);
    const riskTexts = recentAnalyses
      .flatMap(a => (a.analysis_data?.risks || []).map(r => r.description || r.issue).filter(Boolean))
      .slice(0, 5);
    const assessments = recentAnalyses
      .filter(a => a.analysis_data?.situational_assessment)
      .map(a => a.analysis_data.situational_assessment)
      .slice(0, 3);

    const lastHealth = lastAnalysisResult?.overall_health || recentAnalyses[0]?.analysis_data?.overall_health;
    const lastAssessment = lastAnalysisResult?.situational_assessment || recentAnalyses[0]?.analysis_data?.situational_assessment;
    const historicalAlignment = lastAnalysisResult?.historical_alignment || recentAnalyses[0]?.analysis_data?.historical_alignment;
    const recommendations = (lastAnalysisResult?.recommendations || recentAnalyses[0]?.analysis_data?.recommendations || [])
      .slice(0, 3).map(r => r.action || r.description || r).filter(Boolean);

    return {
      totalBlockers,
      totalRisks,
      totalResolved,
      analysisCount: recentAnalyses.length,
      sources,
      contextLabels,
      blockerTexts,
      riskTexts,
      assessments,
      lastHealth,
      lastAssessment,
      historicalAlignment,
      recommendations,
    };
  };

  const generateModules = async () => {
    if (analysisHistory.length === 0 && !lastAnalysisResult) return;
    setLoading(true);
    try {
      const ctx = buildContext();
      const prompt = `Tu es Nova, un moteur d'intelligence contextuelle pour équipes agiles. Tu dois générer des modules d'aide UNIQUEMENT si les signaux réels le justifient clairement.

DONNÉES RÉELLES OBSERVÉES :
- Nombre d'analyses : ${ctx.analysisCount}
- Blockers actifs : ${ctx.totalBlockers} (descriptions : ${ctx.blockerTexts.join(" / ") || "aucune"})
- Risques actifs : ${ctx.totalRisks} (descriptions : ${ctx.riskTexts.join(" / ") || "aucune"})
- Éléments résolus : ${ctx.totalResolved}
- Sources de données : ${ctx.sources.join(", ") || "non précisé"}
- Labels de contexte : ${ctx.contextLabels.join(", ") || "non défini"}
- Santé globale détectée : ${ctx.lastHealth || "inconnue"}
- Dernière évaluation situationnelle : "${ctx.lastAssessment || ""}"
- Évaluations passées : ${ctx.assessments.join(" | ") || "aucune"}
- Alignement historique : "${ctx.historicalAlignment || ""}"
- Recommandations existantes : ${ctx.recommendations.join(" / ") || "aucune"}

RÈGLES STRICTES :
1. Ne génère un module QUE si un signal précis dans les données le justifie directement (ex: blockers récurrents sur un même thème → matrice d'impact, risques non résolus qui s'accumulent → plan de mitigation, etc.)
2. Si aucun signal fort n'est détectable, retourne un tableau "modules" VIDE et explique pourquoi dans "context_summary".
3. Maximum 2 modules. Jamais plus.
4. Chaque module doit être directement ancré sur des données réelles citées ci-dessus, pas sur des généralités.
5. Les sections doivent contenir des éléments SPÉCIFIQUES à la situation détectée, pas des templates génériques.
6. Le "rationale" doit citer explicitement un chiffre ou un fait observé.

Réponds en JSON strict :
{
  "context_summary": "Ce que Nova a réellement détecté (basé sur les données, pas des suppositions)",
  "modules": [
    {
      "type": "risk_matrix|kaizen_sprint|okr_alignment|agile_health|lean_analysis|change_management|generic",
      "title": "Titre précis ancré dans le contexte réel",
      "framework": "Framework applicable",
      "rationale": "Justification basée sur un fait observé (ex: '3 blockers non résolus depuis 2 sprints sur le thème X')",
      "sections": [
        { "label": "Ce qui est détecté", "content": "Observation précise depuis les données" },
        { "label": "Actions ciblées", "content": ["Action 1 spécifique", "Action 2 spécifique"] }
      ]
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            context_summary: { type: "string" },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  framework: { type: "string" },
                  rationale: { type: "string" },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        content: {}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setModules(result.modules || []);
      setContextSummary(result.context_summary || "");
      setGenerated(true);
    } catch (e) {
      console.error("ContextualModuleEngine error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when enough history
  useEffect(() => {
    if (!generated && (analysisHistory.length >= 1 || lastAnalysisResult)) {
      generateModules();
    }
  }, [analysisHistory.length, lastAnalysisResult]);

  if (!analysisHistory.length && !lastAnalysisResult) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Modules contextuels Nova</h3>
            <p className="text-xs text-slate-400">Générés selon la situation et l'historique de votre projet</p>
          </div>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={generateModules}
          disabled={loading}
          className="text-slate-500 text-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
          Regénérer
        </Button>
      </div>

      {/* Context summary */}
      {contextSummary && (
        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 leading-relaxed">
          <span className="font-medium text-slate-700">Contexte détecté : </span>
          {contextSummary}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Nova analyse le contexte et génère les modules adaptés...
        </div>
      )}

      {/* Modules */}
      {!loading && modules.map((module, i) => (
        <ModuleCard key={i} module={module} />
      ))}
    </div>
  );
}