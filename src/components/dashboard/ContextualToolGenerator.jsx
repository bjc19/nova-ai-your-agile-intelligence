import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  Users,
  GitBranch,
  Lightbulb,
  ArrowRight,
  Loader2
} from "lucide-react";

// Icônes pour les outils
const toolIcons = {
  RACI_MATRIX: Users,
  ROAM_ANALYSIS: GitBranch,
  KAIZEN_PLAN: Lightbulb,
  COMMUNICATION_MAP: Users,
  SKILL_DEVELOPMENT_PLAN: Zap,
  KANBAN_OPTIMIZATION: GitBranch,
  DECISION_LOG: CheckCircle2,
  WORKLOAD_REBALANCING: Users
};

const toolDescriptions = {
  RACI_MATRIX: {
    title: 'Matrice RACI',
    description: 'Clarifier qui est Responsable, Accountable, Consulted, Informed',
    benefits: ['Responsabilités claires', 'Réduction des conflits', 'Prise de décision rapide']
  },
  ROAM_ANALYSIS: {
    title: 'Analyse ROAM',
    description: 'Résolu, Possédé, Accepté, Mitigé - pour les risques et dépendances',
    benefits: ['Gestion des risques', 'Clarification des propriétés', 'Plan de mitigation']
  },
  KAIZEN_PLAN: {
    title: 'Plan Kaizen',
    description: 'Amélioration continue ciblée sur les goulots identifiés',
    benefits: ['Augmenter la vélocité', 'Réduire les goulots', 'Engager l\'équipe']
  },
  COMMUNICATION_MAP: {
    title: 'Impact Mapping',
    description: 'Cartographier les dépendances et améliorer la collaboration',
    benefits: ['Meilleure coordination', 'Réduire les silos', 'Augmenter l\'engagement']
  },
  SKILL_DEVELOPMENT_PLAN: {
    title: 'Plan de Développement',
    description: 'Identifier et combler les lacunes de compétences',
    benefits: ['Augmenter la qualité', 'Développer les talents', 'Réduire la technique debt']
  },
  KANBAN_OPTIMIZATION: {
    title: 'Optimisation Kanban',
    description: 'Analyser et optimiser le flux de travail',
    benefits: ['Réduire le cycle time', 'Augmenter le throughput', 'Stabiliser le flux']
  },
  DECISION_LOG: {
    title: 'Decision Log',
    description: 'Tracer toutes les décisions importantes et leur justification',
    benefits: ['Traçabilité', 'Apprentissage historique', 'Éviter les regressions']
  },
  WORKLOAD_REBALANCING: {
    title: 'Rééquilibrage de Charge',
    description: 'Répartir équitablement la charge de travail pour éviter le burnout',
    benefits: ['Santé mentale', 'Stabilité équipe', 'Performance durable']
  }
};

const priorityConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  medium: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  low: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' }
};

export default function ContextualToolGenerator({ analysisHistory, teamContext, detectionData, userRole }) {
  const [recommendations, setRecommendations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState(null);
  const [generatingTool, setGeneratingTool] = useState(null);

  useEffect(() => {
    const analyzeContext = async () => {
      try {
        const response = await base44.functions.invoke('intelligentContextAnalysis', {
          analysisHistory,
          teamContext,
          detectionData
        });

        setRecommendations(response.data.recommendedTools || []);
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Error analyzing context:', error);
      } finally {
        setLoading(false);
      }
    };

    if (analysisHistory && analysisHistory.length > 0) {
      analyzeContext();
    } else {
      setLoading(false);
    }
  }, [analysisHistory, teamContext, detectionData]);

  const handleGenerateTool = async (tool) => {
    setGeneratingTool(tool.tool);
    try {
      // Appeler la fonction de génération appropriée
      // Cela sera implémenté selon le type d'outil
      await base44.functions.invoke('generateAnalysisTool', {
        toolType: tool.tool,
        analysisHistory,
        teamContext,
        detectionData
      });
    } catch (error) {
      console.error(`Error generating ${tool.tool}:`, error);
    } finally {
      setGeneratingTool(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-blue-700">Analyse contextuelle en cours...</span>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Recommended Tools */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Outils Intelligemment Recommandés
          </h3>
          <div className="grid gap-3">
            {recommendations.map((tool, idx) => {
              const Icon = toolIcons[tool.tool] || AlertCircle;
              const toolInfo = toolDescriptions[tool.tool];
              const priorityStyle = priorityConfig[tool.priority];

              return (
                <motion.div
                  key={tool.tool}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`border ${priorityStyle.border} ${priorityStyle.bg} cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => setExpandedTool(expandedTool === tool.tool ? null : tool.tool)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-white/50">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-slate-900">
                                {toolInfo?.title}
                              </p>
                              <Badge className={priorityStyle.badge} variant="outline">
                                {tool.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">
                              {tool.reason}
                            </p>

                            {/* Expanded Details */}
                            {expandedTool === tool.tool && (
                              <div className="mt-3 pt-3 border-t border-white/50 space-y-3">
                                <p className="text-xs text-slate-700">
                                  {toolInfo?.description}
                                </p>
                                <div>
                                  <p className="text-xs font-semibold text-slate-700 mb-2">Bénéfices:</p>
                                  <ul className="space-y-1">
                                    {toolInfo?.benefits.map((benefit, i) => (
                                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                        <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                        {benefit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateTool(tool);
                                  }}
                                  disabled={generatingTool === tool.tool}
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mt-2"
                                >
                                  {generatingTool === tool.tool ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                      Génération...
                                    </>
                                  ) : (
                                    <>
                                      Générer {toolInfo?.title}
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedTool === tool.tool ? '−' : '+'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contextual Suggestions */}
      {suggestions.length > 0 && (userRole === 'admin' || userRole === 'contributor') && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Actions Contextuelles Recommandées
          </h3>
          <div className="grid gap-2">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 mb-1">
                          {suggestion.title}
                        </p>
                        {suggestion.actions && (
                          <ul className="space-y-1">
                            {suggestion.actions.map((action, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                <span className="text-yellow-600">→</span> {action}
                              </li>
                            ))}
                          </ul>
                        )}
                        {suggestion.description && (
                          <p className="text-xs text-slate-600 mt-1">{suggestion.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}