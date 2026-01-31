import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { 
  analyzeMetricsHealth, 
  METRIC_TYPES, 
  generateLeverOptions 
} from "./ActionableMetricsEngine";
import { detectPilotMode, enrichRecommendationWithPilotWarning } from "./HawthorneAwarenessEngine";
import PilotModeIndicator from "./PilotModeIndicator";

export default function MetricsRadarCard({ metricsData, historicalData, onDiscussWithCoach, onApplyLever }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedLever, setSelectedLever] = useState(null);

  // Demo data if none provided
  const data = metricsData || {
    velocity: { current: 45, trend: "up", change: 20 },
    flow_efficiency: { current: 28, target: 55 },
    cycle_time: { current: 9, target: 4 },
    throughput: { current: 6, variance: 0.3 },
    deployment_frequency: { current: 1, target: 3 },
    data_days: 14,
  };

  const historical = historicalData || {
    sprints_count: 1,
    data_days: 7,
    is_audit_phase: false,
    is_new_team: true,
  };

  // Detect pilot mode
  const pilotMode = detectPilotMode(historical);
  
  const analysis = analyzeMetricsHealth(data);

  // Enrich levers with pilot warnings
  const enrichedLevers = analysis.top3Levers.map(lever => 
    enrichRecommendationWithPilotWarning(lever, pilotMode)
  );

  if (!analysis.canAnalyze) {
    return (
      <Card className="border-2 border-slate-200 bg-slate-50">
        <CardContent className="p-6 text-center">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">{analysis.message}</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    vanity_detected: {
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    levers_available: {
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    healthy: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  };

  const config = statusConfig[analysis.status] || statusConfig.healthy;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`overflow-hidden border-2 ${config.borderColor} ${config.bgColor}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Actionable Metrics Radar
              </CardTitle>
              <p className="text-sm text-slate-600 mt-0.5">{analysis.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <PilotModeIndicator pilotMode={pilotMode} compact />
              <Badge className={`${config.bgColor} ${config.color} border-0`}>
                80/20 Analysis
              </Badge>
            </div>
          </div>
          {pilotMode.isPilot && (
            <PilotModeIndicator pilotMode={pilotMode} />
          )}
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Detected Vanity Metrics Issues */}
          {analysis.detectedIssues.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Métriques trompeuses détectées
              </p>
              {analysis.detectedIssues.map((issue, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-white border border-amber-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{issue.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-1">{issue.title}</p>
                      <p className="text-sm text-slate-600 mb-2">
                        Signal réel : {issue.realSignal}
                      </p>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-700 mb-1">Question clé</p>
                            <p className="text-sm text-blue-900 italic">{issue.keyQuestion}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Métrique prioritaire :</span>
                        <Badge variant="outline" className="text-xs">
                          {METRIC_TYPES.ACTIONABLE[issue.priorityMetric]?.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TOP 3 Actionable Levers (80/20) */}
          {analysis.top3Levers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  TOP {analysis.top3Levers.length} leviers de performance (80% impact estimé)
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-slate-500"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              <div className="space-y-2">
                {enrichedLevers.map((lever, index) => {
                  const metricInfo = METRIC_TYPES.ACTIONABLE[lever.metric];
                  const isSelected = selectedLever === lever.metric;
                  const options = generateLeverOptions(lever);

                  return (
                    <div key={lever.metric}>
                      <button
                        onClick={() => setSelectedLever(isSelected ? null : lever.metric)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-white border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-slate-700">{index + 1}️⃣</span>
                              <span className="font-semibold text-slate-900">{metricInfo.name}</span>
                              <Badge variant="outline" className="text-xs">
                                Confiance {lever.confidence}%
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              {lever.current}{metricInfo.unit} → {lever.target}{metricInfo.unit}
                            </p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-500">Levier suggéré :</span>
                              <span className="font-medium text-blue-600">{lever.lever}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-1">
                              {lever.impact}
                            </Badge>
                            <p className="text-xs text-slate-500">{lever.effort} effort</p>
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isSelected && expanded && options.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                          >
                            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Options actionnables avec trade-offs
                            </p>
                            
                            {options.map((opt, idx) => (
                              <div 
                                key={idx}
                                className="p-3 rounded-lg bg-white border border-slate-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-slate-900 text-sm">{opt.option}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {opt.confidence}% confiance
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                  <div>
                                    <span className="text-slate-500">Impact : </span>
                                    <span className="text-emerald-600 font-medium">{opt.impact}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Effort : </span>
                                    <span className="text-blue-600 font-medium">{opt.effort}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                                  ⚠️ Trade-off : {opt.tradeoff}
                                </div>
                              </div>
                            ))}

                            {lever.pilotWarning && (
                              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-2">
                                {lever.pilotWarning}
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => onDiscussWithCoach?.(lever)}
                                className="flex-1"
                                variant="outline"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Discuter / valider avec le Coach
                              </Button>
                              <Button
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                title={lever.requiresValidation ? "Validation Coach/PO requise" : "Requiert validation humaine explicite"}
                              >
                                APPLY
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Healthy State - No Interruption */}
          {analysis.status === "healthy" && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-700">
                Métriques actionnables stables
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Aucune vanity metric dominante détectée
              </p>
            </div>
          )}

          {/* Note on hypotheses */}
          {analysis.top3Levers.length > 0 && (
            <p className="text-xs text-slate-500 italic">
              Les leviers sont des hypothèses à valider humainement. Nova ne recommande aucune action obligatoire ou automatique.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}