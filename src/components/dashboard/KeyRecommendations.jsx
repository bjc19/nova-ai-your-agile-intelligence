import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import {
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  Users,
  Clock,
  Target,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ChevronDown
} from "lucide-react";

const recommendationIcons = {
  escalation: AlertTriangle,
  collaboration: Users,
  timeline: Clock,
  priority: Target,
  default: Lightbulb,
};

export default function KeyRecommendations({ latestAnalysis = null, sourceUrl, sourceName }) {
  const { t, language } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState({});
  const [detailsCache, setDetailsCache] = useState({});
  const [completedItems, setCompletedItems] = useState({});
  
  // Sample recommendations for demo
  const sampleRecommendations = language === 'fr' ? [
    {
      type: "escalation",
      title: "Escalader le blocage d'intégration API",
      description: "Retard de support API tierce affectant 2 membres. Considérer de contacter la gestion fournisseur.",
      priority: "high",
    },
    {
      type: "collaboration",
      title: "Planifier une sync inter-équipes",
      description: "Plusieurs dépendances identifiées entre tâches frontend et backend. Une sync de 15 min pourrait éviter des retards.",
      priority: "medium",
    },
    {
      type: "timeline",
      title: "Revoir le calendrier du sprint",
      description: "3 tâches risquent de manquer la deadline de démo. Considérer ajustement du scope ou réallocation de ressources.",
      priority: "high",
    },
    {
      type: "priority",
      title: "Reprioriser les éléments du backlog",
      description: "Tâches de faible priorité bloquant les éléments critiques. Suggérer de déplacer la tâche d'index de BDD en haut.",
      priority: "medium",
    },
  ] : [
    {
      type: "escalation",
      title: "Escalate API Integration Blocker",
      description: "Third-party API support delay affecting 2 team members. Consider reaching out to vendor management.",
      priority: "high",
    },
    {
      type: "collaboration",
      title: "Schedule Cross-Team Sync",
      description: "Multiple dependencies identified between frontend and backend tasks. A 15-min sync could prevent delays.",
      priority: "medium",
    },
    {
      type: "timeline",
      title: "Review Sprint Timeline",
      description: "3 tasks at risk of missing the demo deadline. Consider scope adjustment or resource reallocation.",
      priority: "high",
    },
    {
      type: "priority",
      title: "Reprioritize Backlog Items",
      description: "Low-priority tasks blocking critical path items. Suggest moving database indexes task to top.",
      priority: "medium",
    },
  ];

  const recommendations = latestAnalysis?.recommendations 
    ? latestAnalysis.recommendations.map((rec, i) => ({
        type: "default",
        title: rec.substring(0, 50) + (rec.length > 50 ? "..." : ""),
        description: rec,
        priority: i === 0 ? "high" : "medium",
      }))
    : sampleRecommendations;

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const handleItemCheck = (recIndex, itemIndex) => {
    const key = `${recIndex}-${itemIndex}`;
    setCompletedItems({
      ...completedItems,
      [key]: !completedItems[key]
    });
  };

  const handleRecommendationClick = async (rec, index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }

    setExpandedIndex(index);

    if (detailsCache[index]) {
      return;
    }

    setLoadingDetails({ ...loadingDetails, [index]: true });

    try {
      const prompt = language === 'fr' 
        ? `Tu es Nova, un Scrum Master IA. Détaille cette recommandation avec un plan d'action concret sous forme de to-do items numérotés et actionnables.

Recommandation: ${rec.title}
Description: ${rec.description}

Fournis 3-5 étapes concrètes et spécifiques que l'équipe peut suivre immédiatement. Sois pragmatique et actionnable.`
        : `You are Nova, an AI Scrum Master. Detail this recommendation with a concrete action plan in the form of numbered, actionable to-do items.

Recommendation: ${rec.title}
Description: ${rec.description}

Provide 3-5 concrete and specific steps that the team can follow immediately. Be pragmatic and actionable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            action_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setDetailsCache({ ...detailsCache, [index]: result.action_plan });
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetails({ ...loadingDetails, [index]: false });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {t('keyRecommendations')}
              </CardTitle>
              <p className="text-sm text-slate-500">{t('basedOnLatestAnalysis')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {recommendations.slice(0, 4).map((rec, index) => {
              const Icon = recommendationIcons[rec.type] || recommendationIcons.default;
              
              const isExpanded = expandedIndex === index;
              const details = detailsCache[index];
              const isLoading = loadingDetails[index];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="rounded-xl border border-slate-200 hover:border-amber-200 transition-all overflow-hidden"
                >
                  <div 
                    onClick={() => handleRecommendationClick(rec, index)}
                    className="group p-4 hover:bg-amber-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-amber-100 transition-colors">
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 truncate">
                            {rec.title}
                          </h4>
                          <Badge variant="outline" className={`text-xs shrink-0 ${priorityColors[rec.priority]}`}>
                            {t(rec.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {rec.description}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-200 bg-slate-50/50"
                      >
                        <div className="p-4">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                              <span className="ml-2 text-sm text-slate-500">
                                {language === 'fr' ? 'Nova analyse...' : 'Nova is analyzing...'}
                              </span>
                            </div>
                          ) : details ? (
                            <div className="space-y-3">
                              <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                {language === 'fr' ? 'Plan d\'action suggéré par Nova' : 'Action Plan Suggested by Nova'}
                              </h5>
                              <div className="space-y-2">
                                {details.map((item, idx) => {
                                  const isCompleted = completedItems[`${index}-${idx}`];
                                  return (
                                    <motion.div
                                      key={idx}
                                      animate={isCompleted ? { opacity: 0.6 } : { opacity: 1 }}
                                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 transition-all"
                                    >
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs shrink-0">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1">
                                        <p className={`font-medium text-sm mb-1 transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                          {item.step}
                                        </p>
                                        <p className={`text-xs transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                                          {item.description}
                                        </p>
                                      </div>
                                      <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleItemCheck(index, idx)}
                                        className="cursor-pointer shrink-0"
                                      >
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-500 transition-colors" />
                                        ) : (
                                          <CheckCircle2 className="w-4 h-4 text-slate-300 hover:text-amber-500 transition-colors" />
                                        )}
                                      </motion.div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          
          {sourceUrl && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <Button
                onClick={() => window.open(sourceUrl, '_blank')}
                variant="outline"
                size="sm"
                className="w-full hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Voir dans' : 'View in'} {sourceName || (language === 'fr' ? 'la source' : 'source')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}