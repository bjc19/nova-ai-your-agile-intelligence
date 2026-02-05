import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Activity,
  Eye
} from "lucide-react";

/**
 * Tableau de bord stratifié multi-niveaux avec scores explicables
 */
export default function StratifiedHealthDashboard({ stratifiedData }) {
  const [expandedLevel, setExpandedLevel] = useState(1);

  if (!stratifiedData) {
    return null;
  }

  const { level_1_canonical, level_2_weak_signals, level_3_emerging_trends, agile_health_score } = stratifiedData;

  const levels = [
    {
      id: 1,
      title: "Niveau 1 – Patterns Canoniques",
      subtitle: "Factuels (Référentiel expert)",
      icon: Target,
      color: "red",
      data: level_1_canonical,
      usage: "Diagnostic explicite + Quick Wins",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badgeColor: "bg-red-100 text-red-800"
    },
    {
      id: 2,
      title: "Niveau 2 – Signaux Faibles",
      subtitle: "Indicateurs de risque",
      icon: Activity,
      color: "amber",
      data: level_2_weak_signals,
      usage: "Investigation et prévention",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      badgeColor: "bg-amber-100 text-amber-800"
    },
    {
      id: 3,
      title: "Niveau 3 – Tendances Émergentes",
      subtitle: "Hypothèses d'évolution",
      icon: TrendingUp,
      color: "blue",
      data: level_3_emerging_trends,
      usage: "Observation, questionnement et vigilance",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badgeColor: "bg-blue-100 text-blue-800"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Score de Santé Agile Explicable */}
      <Card className="border-slate-300 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Score de Santé Agile</CardTitle>
                <p className="text-sm text-slate-500">Indicateur explicable multi-facteurs</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">
                {agile_health_score.score}
                <span className="text-xl text-slate-500">/100</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {agile_health_score.interpretation}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Facteurs explicatifs */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-700">
                -{agile_health_score.factors.canonical_impact}
              </div>
              <div className="text-xs text-slate-600 mt-1">Patterns canoniques</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50">
              <div className="text-2xl font-bold text-amber-700">
                -{agile_health_score.factors.weak_signals_impact}
              </div>
              <div className="text-xs text-slate-600 mt-1">Signaux faibles</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">
                -{agile_health_score.factors.trends_impact}
              </div>
              <div className="text-xs text-slate-600 mt-1">Tendances</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">
                -{agile_health_score.factors.severity_impact}
              </div>
              <div className="text-xs text-slate-600 mt-1">Sévérité</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-100 border border-slate-200">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              {agile_health_score.disclaimer}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Niveaux de détection */}
      {levels.map((level) => (
        <motion.div
          key={level.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: level.id * 0.1 }}
        >
          <Card className={`${level.borderColor} border-2 ${level.bgColor}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${level.color}-100 flex items-center justify-center`}>
                    <level.icon className={`w-5 h-5 text-${level.color}-600`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{level.title}</CardTitle>
                      <Badge variant="outline" className={level.badgeColor}>
                        {level.data.count} détecté{level.data.count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-600">{level.subtitle}</p>
                      <Badge variant="outline" className="text-xs">
                        {level.data.confidence_range} confiance
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                >
                  {expandedLevel === level.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                <strong>Usage:</strong> {level.usage}
              </p>
            </CardHeader>

            {expandedLevel === level.id && (
              <CardContent className="pt-0">
                {level.id === 1 && level.data.detections?.length > 0 && (
                  <div className="space-y-3">
                    {level.data.detections.map((detection, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-lg border border-red-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {detection.pattern_id} – {detection.pattern_name}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {detection.category_name}
                            </Badge>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            {detection.confidence}% confiance
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{detection.evidence}</p>
                        {detection.quick_win && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            <strong>Quick Win:</strong> {detection.quick_win}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {level.id === 2 && level.data.signals?.length > 0 && (
                  <div className="space-y-3">
                    {level.data.signals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-lg border border-amber-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-slate-900">
                            {signal.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <Badge className="bg-amber-100 text-amber-800">
                            {signal.confidence}% confiance
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{signal.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Valeur: {signal.metric_value?.toFixed(2)}</span>
                          <span>Seuil: {signal.threshold}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {level.id === 3 && level.data.trends?.length > 0 && (
                  <div className="space-y-3">
                    {level.data.trends.map((trend, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-lg border border-blue-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-slate-900">{trend.name}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {trend.sprint_count} sprints observés
                            </Badge>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {trend.confidence}% confiance
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{trend.description}</p>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                          <strong>Hypothèse:</strong> {trend.hypothesis}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {level.data.count === 0 && (
                  <div className="text-center py-6 text-slate-500">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun élément détecté à ce niveau</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      ))}

      {/* Contexte d'analyse */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Contexte de l'analyse</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-600 space-y-1">
          <p>• Type d'atelier: <strong>{stratifiedData.context_used?.workshop_type || "N/A"}</strong></p>
          <p>• Patterns sélectionnés: <strong>{stratifiedData.context_used?.patterns_selected}</strong> sur {stratifiedData.context_used?.total_available} disponibles</p>
          <p>• Sélection dynamique contextuelle activée</p>
        </CardContent>
      </Card>
    </div>
  );
}