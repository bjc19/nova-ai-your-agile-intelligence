import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertOctagon, ShieldAlert, CheckCircle2, TrendingUp, ChevronDown, ChevronUp, FileText, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { anonymizeNamesInText } from "@/components/nova/anonymizationEngine";

const URGENCY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

function ItemCard({ item, type, onResolve, resolving }) {
  const [expanded, setExpanded] = useState(false);
  const anon = (t) => {
    if (!t) return "-";
    return t.replace(/\b([A-ZÀ-ÿ][a-zà-ÿ]+)\b/g, (m) => {
      const skip = ['Vous','Excellent','À','Continuez','Priorisez','You','Needs','Keep','Prioritize','Resolved','Blockers','Risks'];
      return skip.includes(m) ? m : anonymizeNamesInText(m);
    });
  };

  const title = anon(item.issue || item.description || item.title || "-");
  const urgencyStyle = URGENCY_STYLES[item.urgency] || URGENCY_STYLES.low;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 text-sm leading-snug">{title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {item.urgency && (
                <Badge variant="outline" className={`text-xs ${urgencyStyle}`}>
                  {item.urgency === "high" ? "Élevé" : item.urgency === "medium" ? "Moyen" : "Faible"}
                </Badge>
              )}
              {item.analysisDate && (
                <span className="text-xs text-slate-400">
                  {new Date(item.analysisDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
              {item.analysisTitle && (
                <span className="text-xs text-slate-400 truncate max-w-[120px]">{item.analysisTitle}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {type !== "resolved" && item.urgency && item.urgency !== "low" && (
              <Button
                size="sm" variant="outline"
                onClick={(e) => { e.stopPropagation(); onResolve(item); }}
                disabled={resolving === item.id}
                className="text-xs h-7 px-2"
              >
                {resolving === item.id ? "..." : "Résolu"}
              </Button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4 bg-slate-50 space-y-3">
              {item.root_cause && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cause racine</p>
                  <p className="text-sm text-slate-700">{anon(item.root_cause)}</p>
                </div>
              )}
              {(item.impact || item.system_impact) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Impact</p>
                  <p className="text-sm text-slate-700">{anon(item.impact || item.system_impact)}</p>
                </div>
              )}
              {(item.action || item.mitigation || item.recommendation) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommandation</p>
                  <p className="text-sm text-slate-700">{anon(item.action || item.mitigation || item.recommendation)}</p>
                </div>
              )}
              {item.resolved_date && (
                <p className="text-xs text-emerald-600">✓ Résolu le {new Date(item.resolved_date).toLocaleDateString("fr-FR")}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuickStatsDetailDrawer({ isOpen, onClose, type, analysisHistory = [], resolvedItems = [], onResolve, resolving }) {
  const CONFIG = {
    blockers: {
      title: "Blockers détectés",
      icon: AlertOctagon,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    risks: {
      title: "Risques identifiés",
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    resolved: {
      title: "Éléments résolus",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    analyses: {
      title: "Toutes les analyses",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  };

  const config = CONFIG[type] || CONFIG.blockers;
  const Icon = config.icon;

  const getItems = () => {
    if (type === "blockers") {
      const items = analysisHistory.flatMap((a, idx) => {
        // Prefer analysis_data.blockers, fallback to top-level blockers array
        const blockers = a.analysis_data?.blockers || a.blockers || [];
        if (blockers.length > 0) {
          return blockers.map((b, i) => ({
            id: `b-${a.id || idx}-${i}`,
            ...b,
            analysisTitle: a.title,
            analysisDate: a.created_date,
          }));
        }
        // If no detailed blockers but blockers_count > 0, show a synthetic entry
        if ((a.blockers_count || 0) > 0) {
          return [{
            id: `b-${a.id || idx}-synth`,
            issue: `${a.blockers_count} blocker(s) détecté(s)`,
            description: a.transcript_preview || a.title || "Analyse sans détail",
            analysisTitle: a.title,
            analysisDate: a.created_date,
          }];
        }
        return [];
      });
      return items.filter(item => !resolvedItems.some(r => r.item_id === item.id));
    }
    if (type === "risks") {
      const items = analysisHistory.flatMap((a, idx) => {
        const risks = a.analysis_data?.risks || a.risks || [];
        if (risks.length > 0) {
          return risks.map((r, i) => ({
            id: `r-${a.id || idx}-${i}`,
            ...r,
            analysisTitle: a.title,
            analysisDate: a.created_date,
          }));
        }
        if ((a.risks_count || 0) > 0) {
          return [{
            id: `r-${a.id || idx}-synth`,
            issue: `${a.risks_count} risque(s) identifié(s)`,
            description: a.transcript_preview || a.title || "Analyse sans détail",
            analysisTitle: a.title,
            analysisDate: a.created_date,
          }];
        }
        return [];
      });
      return items.filter(item => !resolvedItems.some(r => r.item_id === item.id));
    }
    if (type === "resolved") {
      return resolvedItems.map(item => ({
        id: item.id,
        issue: item.title || item.item_id,
        description: item.title,
        urgency: item.urgency,
        analysisTitle: item.source,
        analysisDate: item.resolved_date || item.created_date,
        resolved_date: item.resolved_date,
      }));
    }
    if (type === "analyses") {
      return analysisHistory.map(a => ({
        id: a.id,
        issue: a.title,
        description: `${a.blockers_count || 0} blockers · ${a.risks_count || 0} risques`,
        analysisTitle: a.source,
        analysisDate: a.created_date,
      }));
    }
    return [];
  };

  const items = getItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b border-slate-200 ${config.bg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <h2 className="font-semibold text-slate-900">{config.title}</h2>
                  <p className="text-xs text-slate-500">{items.length} élément{items.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Icon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun élément à afficher</p>
                </div>
              ) : (
                items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    type={type}
                    onResolve={onResolve}
                    resolving={resolving}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}