import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus,
  Zap, Target, Clock, Activity, ChevronDown, ChevronUp, RefreshCw,
  Brain, Shield, Users, BarChart2, Flame
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, CartesianGrid, Cell
} from "recharts";

const HEALTH_CONFIG = {
  healthy: { label: "Saine", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, dot: "bg-emerald-500" },
  at_risk: { label: "À surveiller", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: AlertTriangle, dot: "bg-orange-500" },
  critical: { label: "Critique", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: Flame, dot: "bg-red-500" },
};

const TONE_CONFIG = {
  confident: { label: "Confiant·e", color: "text-emerald-600", emoji: "💪" },
  anxious: { label: "Anxieux·se", color: "text-orange-600", emoji: "😰" },
  uncertain: { label: "Incertain·e", color: "text-yellow-600", emoji: "🤔" },
  neutral: { label: "Neutre", color: "text-slate-600", emoji: "😐" },
};

function HealthTrendBar({ history }) {
  if (!history.length) return null;
  const data = history.slice().reverse().slice(-14).map((h, i) => {
    const health = h.analysis_data?.overall_health || (h.blockers_count > 2 ? "critical" : h.blockers_count > 0 ? "at_risk" : "healthy");
    const score = health === "healthy" ? 100 : health === "at_risk" ? 50 : 10;
    return {
      date: new Date(h.analysis_time || h.created_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      score,
      blockers: h.blockers_count || 0,
      risks: h.risks_count || 0,
      health,
    };
  });

  const trend = data.length >= 2
    ? data[data.length - 1].score - data[0].score
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">Tendance de santé équipe</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          trend > 0 ? "bg-emerald-50 text-emerald-700" : trend < 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
        }`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend > 0 ? "En amélioration" : trend < 0 ? "En dégradation" : "Stable"}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(v, name) => [name === "score" ? `${v}%` : v, name === "score" ? "Santé" : name]}
          />
          <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="url(#healthGrad)" dot={{ r: 3, fill: "#3b82f6" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function BlockersRisksChart({ history }) {
  if (!history.length) return null;
  const data = history.slice().reverse().slice(-10).map(h => ({
    date: new Date(h.analysis_time || h.created_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    blockers: h.blockers_count || 0,
    risques: h.risks_count || 0,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-slate-800">Blockers & Risques</span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={data} barSize={10} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="blockers" fill="#f97316" radius={[3, 3, 0, 0]} />
          <Bar dataKey="risques" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Blockers</span>
        <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Risques</span>
      </div>
    </div>
  );
}

function LastAnalysisPanel({ analysis }) {
  if (!analysis) return null;
  const data = analysis.analysis_data || {};
  const health = HEALTH_CONFIG[data.overall_health] || HEALTH_CONFIG.at_risk;
  const tone = TONE_CONFIG[data.detected_tone] || TONE_CONFIG.neutral;
  const Icon = health.icon;
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 ${health.border} ${health.bg} rounded-2xl overflow-hidden`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${health.bg} border ${health.border}`}>
            <Icon className={`w-5 h-5 ${health.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${health.color}`}>{health.label}</span>
              <Badge variant="outline" className="text-xs">{tone.emoji} {tone.label}</Badge>
              <span className="text-xs text-slate-400">
                {new Date(analysis.analysis_time || analysis.created_date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">Dernière analyse situationnelle</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600">
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
            <div className="px-5 pb-5 space-y-4 bg-white border-t border-slate-100">

              {/* Assessment */}
              {data.situational_assessment && (
                <div className="pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Évaluation Nova
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{data.situational_assessment}</p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-2xl font-bold text-orange-600">{analysis.blockers_count || 0}</p>
                  <p className="text-xs text-orange-700 font-medium">Blockers</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-2xl font-bold text-indigo-600">{analysis.risks_count || 0}</p>
                  <p className="text-xs text-indigo-700 font-medium">Risques</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{(analysis.cross_source_confidence * 100 || 85).toFixed(0)}%</p>
                  <p className="text-xs text-blue-700 font-medium">Confiance</p>
                </div>
              </div>

              {/* Tone interpretation */}
              {data.tone_interpretation && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                  <p className="font-medium text-slate-500 text-xs mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Signal émotionnel</p>
                  {data.tone_interpretation}
                </div>
              )}

              {/* Actions */}
              <div className="grid md:grid-cols-2 gap-3">
                {data.short_term_actions?.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Actions 48h</p>
                    <ul className="space-y-1.5">
                      {data.short_term_actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-orange-900">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-orange-200 text-orange-700 text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.long_term_actions?.length > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Long terme</p>
                    <ul className="space-y-1.5">
                      {data.long_term_actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-indigo-900">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Historical alignment */}
              {data.historical_alignment && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  <p className="font-semibold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Alignement historique</p>
                  {data.historical_alignment}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryTimeline({ history, loading }) {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? history : history.slice(0, 5);

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
      <RefreshCw className="w-4 h-4 animate-spin" /> Chargement de l'historique...
    </div>
  );

  if (!history.length) return (
    <div className="text-center py-8 text-slate-400 text-sm">
      <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
      Aucune situation analysée encore. Saisissez votre première observation.
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Historique situationnel
        </span>
        <Badge variant="outline" className="text-xs">{history.length} entrées</Badge>
      </div>

      {items.map((h, i) => {
        const data = h.analysis_data || {};
        const health = HEALTH_CONFIG[data.overall_health] || HEALTH_CONFIG.at_risk;
        const tone = TONE_CONFIG[data.detected_tone] || TONE_CONFIG.neutral;
        return (
          <div key={h.id || i} className={`flex items-start gap-3 p-3 rounded-xl border ${health.border} bg-white hover:shadow-sm transition-shadow`}>
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${health.dot}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold ${health.color}`}>{health.label}</span>
                <span className="text-xs text-slate-400">{tone.emoji} {tone.label}</span>
                {h.blockers_count > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{h.blockers_count} blocker{h.blockers_count > 1 ? 's' : ''}</span>
                )}
                {h.risks_count > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{h.risks_count} risque{h.risks_count > 1 ? 's' : ''}</span>
                )}
              </div>
              {data.situational_assessment && (
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{data.situational_assessment}</p>
              )}
              {h.transcript_preview && !data.situational_assessment && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">"{h.transcript_preview}"</p>
              )}
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {new Date(h.analysis_time || h.created_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        );
      })}

      {history.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-blue-600 hover:text-blue-800 text-center py-2 border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
        >
          {showAll ? "Réduire" : `Voir les ${history.length - 5} autres entrées`}
        </button>
      )}
    </div>
  );
}

export default function ContextualAnalyticsDashboard({ workspaceId, workspaceType, lastAnalysisResult }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSituationalAnalysis, setLastSituationalAnalysis] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let items = [];
      if (workspaceId && workspaceType === 'trello') {
        items = await base44.entities.AnalysisHistory.filter({ trello_project_selection_id: workspaceId }, '-analysis_time', 30);
      } else if (workspaceId && workspaceType === 'jira') {
        items = await base44.entities.AnalysisHistory.filter({ jira_project_selection_id: workspaceId }, '-analysis_time', 30);
      } else {
        items = await base44.entities.AnalysisHistory.list('-analysis_time', 30);
      }

      // Situational analyses = those with analysis_data.overall_health (from SituationInputWidget)
      const situational = items.filter(h => h.analysis_data?.overall_health);
      setHistory(situational);
      if (situational.length > 0) setLastSituationalAnalysis(situational[0]);
    } catch (e) {
      console.error("Error loading contextual history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [workspaceId, workspaceType, refreshKey]);

  // When a new analysis comes in from the widget, prepend it
  useEffect(() => {
    if (lastAnalysisResult) {
      const fakeEntry = {
        id: `live-${Date.now()}`,
        analysis_data: lastAnalysisResult,
        analysis_time: new Date().toISOString(),
        blockers_count: lastAnalysisResult.overall_health === 'critical' ? 3 : lastAnalysisResult.overall_health === 'at_risk' ? 1 : 0,
        risks_count: lastAnalysisResult.overall_health !== 'healthy' ? 2 : 0,
        cross_source_confidence: 0.85,
        transcript_preview: "",
      };
      setLastSituationalAnalysis(fakeEntry);
      setHistory(prev => [fakeEntry, ...prev]);
    }
  }, [lastAnalysisResult]);

  if (loading && !history.length) return (
    <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
      <RefreshCw className="w-4 h-4 animate-spin" /> Chargement des analyses...
    </div>
  );

  if (!history.length && !lastAnalysisResult) return null;

  return (
    <div className="space-y-4">
      {/* Latest Analysis */}
      {lastSituationalAnalysis && (
        <LastAnalysisPanel analysis={lastSituationalAnalysis} />
      )}

      {/* Charts (show when enough history) */}
      {history.length >= 2 && (
        <div className="grid md:grid-cols-2 gap-4">
          <HealthTrendBar history={history} />
          <BlockersRisksChart history={history} />
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div />
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Actualiser
          </button>
        </div>
        <HistoryTimeline history={history} loading={loading} />
      </div>
    </div>
  );
}