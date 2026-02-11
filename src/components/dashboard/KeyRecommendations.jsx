import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { formatRecommendation, getRoleTone } from "./RoleBasedMessaging";
import { useRoleAccess } from "./useRoleAccess";
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
  const [translatedRecommendations, setTranslatedRecommendations] = useState(null);
  const [allSourceRecommendations, setAllSourceRecommendations] = useState([]);
  const { role: userRole, isAdmin, isContributor, isUser } = useRoleAccess();
  const [localUserRole, setLocalUserRole] = useState('user');
  const [currentPage, setCurrentPage] = useState(0);

  // Sync local role state
  useEffect(() => {
    setLocalUserRole(userRole);
  }, [userRole]);

  // Fetch all recommendations from all sources via unified endpoint with cache
  useEffect(() => {
    const fetchAllRecommendations = async () => {
      const cacheKey = 'all_recommendations';
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
      
      if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < 5 * 60 * 1000) {
          setAllSourceRecommendations(JSON.parse(cached));
          return;
        }
      }
      
      try {
        const response = await base44.functions.invoke('getAllRecommendations', {});
        if (response.data?.recommendations) {
          setAllSourceRecommendations(response.data.recommendations);
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data.recommendations));
          sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        }
      } catch (error) {
        console.error("Error fetching all recommendations:", error);
      }
    };

    fetchAllRecommendations();
  }, []);
  
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

  // Translate recommendations if needed
  useEffect(() => {
    setTranslatedRecommendations(null);
  }, [language]);

  useEffect(() => {
    const allRecs = getRecommendations();
    if (allRecs.length > 0 && language === 'fr' && !translatedRecommendations && allRecs[0]?.source !== undefined) {
      const translateRecommendations = async () => {
        const descriptions = allRecs.map(rec => 
          typeof rec === 'string' ? rec : rec?.description || rec?.title || JSON.stringify(rec)
        );

        const translationPrompt = `Traduis chaque recommandation en français de manière concise:\n\n${JSON.stringify(descriptions)}\n\nRetourne un tableau JSON avec les traductions en français, au même index que l'original.`;
        
        try {
          const translated = await base44.integrations.Core.InvokeLLM({
            prompt: translationPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                translations: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          });

          const translatedList = (translated.translations || translated).map((desc, i) => ({
            type: "default",
            description: desc,
            title: desc.substring(0, 50) + (desc.length > 50 ? "..." : ""),
            priority: i === 0 ? "high" : "medium",
          }));

          setTranslatedRecommendations(translatedList);
        } catch (error) {
          console.error("Error translating recommendations:", error);
          setTranslatedRecommendations(descriptions.map((desc, i) => ({
            type: "default",
            description: desc,
            title: desc.substring(0, 50) + (desc.length > 50 ? "..." : ""),
            priority: i === 0 ? "high" : "medium",
          })));
        }
      };

      translateRecommendations();
    }
  }, [allSourceRecommendations, language, translatedRecommendations]);

  // Combine recommendations from manual analysis + all unified sources
  const getRecommendations = () => {
    const allRecs = [];
    
    // Add manual analysis recommendations if available
    if (latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0) {
      allRecs.push(...latestAnalysis.recommendations.map((rec, i) => {
        const recText = typeof rec === 'string' ? rec : rec?.description || rec?.action || JSON.stringify(rec);
        return {
          type: "default",
          title: recText.substring(0, 50) + (recText.length > 50 ? "..." : ""),
          description: recText,
          priority: i === 0 ? "high" : "medium",
          source: 'analysis'
        };
      }));
    }
    
    // Add recommendations from all unified sources (backend handles new sources automatically)
    allSourceRecommendations.forEach((rec, idx) => {
      allRecs.push({
        type: "default",
        title: rec.text?.substring(0, 50) + (rec.text?.length > 50 ? "..." : ""),
        description: rec.text,
        priority: rec.priority || 'medium',
        source: rec.source,
        entityType: rec.entityType
      });
    });
    
    // If no recommendations from any source, use samples
    if (allRecs.length === 0) {
      return sampleRecommendations;
    }
    
    // Apply translation if needed
    if (translatedRecommendations) {
      return translatedRecommendations;
    }
    
    return allRecs;
  };

  const recommendations = getRecommendations().map(rec => formatRecommendation(rec, userRole));
  const itemsPerPage = 4;
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const paginatedRecs = recommendations.slice(startIdx, startIdx + itemsPerPage);

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

      // Translate action plan if French
      let actionPlan = result.action_plan;
      if (language === 'fr') {
        const translationPrompt = `Traduis chaque étape en français de manière concise:\n\n${JSON.stringify(actionPlan)}\n\nRetourne le JSON avec les mêmes clés (step, description) mais avec les valeurs traduites en français.`;
        const translated = await base44.integrations.Core.InvokeLLM({
          prompt: translationPrompt,
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
        actionPlan = translated.action_plan;
      }

      setDetailsCache({ ...detailsCache, [index]: actionPlan });
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
            {paginatedRecs.map((rec, index) => {
              const globalIndex = startIdx + index;
              const Icon = recommendationIcons[rec.type] || recommendationIcons.default;
              
              const isExpanded = expandedIndex === globalIndex;
              const details = detailsCache[globalIndex];
              const isLoading = loadingDetails[globalIndex];

              return (
                <motion.div
                  key={globalIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="rounded-xl border border-slate-200 hover:border-amber-200 transition-all overflow-hidden"
                >
                  <div 
                    onClick={() => (isAdmin || isContributor) ? handleRecommendationClick(rec, globalIndex) : null}
                    className={`group p-4 transition-all ${(isAdmin || isContributor) ? 'hover:bg-amber-50/30 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-amber-100 transition-colors">
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {rec.prefix && (
                            <span className="text-xs font-medium text-slate-500">{rec.prefix}</span>
                          )}
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
                      {/* Expand arrow - Admin/Contributor only */}
                      {(isAdmin || isContributor) && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Detailed action plan - Admin/Contributor only */}
                  <AnimatePresence>
                    {(isAdmin || isContributor) && isExpanded && (
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
                                {t('novaAnalyzing')}
                              </span>
                            </div>
                          ) : details ? (
                            <div className="space-y-3">
                              <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                {t('suggestedActionPlan')}
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
          
          {/* External link - Admin/Contributor only */}
          {(isAdmin || isContributor) && sourceUrl && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <Button
                onClick={() => window.open(sourceUrl, '_blank')}
                variant="outline"
                size="sm"
                className="w-full hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('viewIn')} {sourceName || t('source')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}