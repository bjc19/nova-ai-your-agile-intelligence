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

  // Build context from history + last result
  const buildContext = () => {
    const recentAnalyses = analysisHistory.slice(0, 10);
    const totalBlockers = recentAnalyses.reduce((s, a) => s + (a.blockers_count || 0), 0);
    const totalRisks = recentAnalyses.reduce((s, a) => s + (a.risks_count || 0), 0);
    const sources = [...new Set(recentAnalyses.map(a => a.source).filter(Boolean))];
    const contextLabels = [...new Set(recentAnalyses.map(a => a.context_label).filter(Boolean))];
    const assessments = recentAnalyses
      .filter(a => a.analysis_data?.situational_assessment)
      .map(a => a.analysis_data.situational_assessment)
      .slice(0, 3)
      .join(" | ");

    const lastHealth = lastAnalysisResult?.overall_health || recentAnalyses[0]?.analysis_data?.overall_health;
    const lastAssessment = lastAnalysisResult?.situational_assessment || recentAnalyses[0]?.analysis_data?.situational_assessment;
    const historicalAlignment = lastAnalysisResult?.historical_alignment || recentAnalyses[0]?.analysis_data?.historical_alignment;

    return {
      totalBlockers,
      totalRisks,
      analysisCount: recentAnalyses.length,
      sources,
      contextLabels,
      assessments,
      lastHealth,
      lastAssessment,
      historicalAlignment,
    };
  };

  const generateModules = async () => {
    if (analysisHistory.length === 0 && !lastAnalysisResult) return;
    setLoading(true);
    try {
      const ctx = buildContext();
      const prompt = `Tu es Nova, un outil d'intelligence agile contextuelle qui s'adapte à tous les frameworks de gestion de projet (Scrum, Kanban, SAFe, Spotify, Lean, Kaizen, Six Sigma, OKR, gestion du changement, transformation digitale, hybrides, etc.).

Contexte détecté :
- ${ctx.analysisCount} analyses récentes
- ${ctx.totalBlockers} blockers totaux, ${ctx.totalRisks} risques
- Sources : ${ctx.sources.join(", ") || "situationnel"}
- Contextes étiquetés : ${ctx.contextLabels.join(", ") || "non défini"}
- Dernière santé : ${ctx.lastHealth || "inconnue"}
- Dernière évaluation : "${ctx.lastAssessment || ""}"
- Alignement historique : "${ctx.historicalAlignment || ""}"
- Résumés récents : "${ctx.assessments || ""}"

En fonction de ce contexte, génère entre 1 et 3 modules intelligents et adaptés. Chaque module doit correspondre à l'outil ou framework le plus pertinent compte tenu de la situation (ex : si on détecte beaucoup de blockers et tensions, propose un plan de transformation ou de gestion du changement ; si on détecte des problèmes de priorité, propose un alignement OKR ; si on détecte des gaspillages récurrents, propose Kaizen ; si le contexte est multi-projets complexe, propose une matrice de risques SAFe ou hybride, etc.).

Réponds en JSON strict avec ce format :
{
  "context_summary": "Résumé du contexte détecté en 1-2 phrases",
  "modules": [
    {
      "type": "transformation_plan|change_management|risk_matrix|okr_alignment|kaizen_sprint|lean_analysis|agile_health|generic",
      "title": "Titre du module",
      "framework": "Framework de référence (ex: SAFe, Kaizen, OKR...)",
      "rationale": "Pourquoi ce module est pertinent maintenant (1 phrase)",
      "sections": [
        { "label": "Diagnostic", "content": "Texte ou tableau..." },
        { "label": "Actions prioritaires", "content": ["Action 1", "Action 2", "Action 3"] },
        { "label": "Indicateurs à surveiller", "content": ["KPI 1", "KPI 2"] }
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