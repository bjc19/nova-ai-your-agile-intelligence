import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { formatRecommendation, getRoleTone } from "./RoleBasedMessaging";
import { useRoleAccess } from "./useRoleAccess";
import { anonymizeFirstName, extractInterlocutors } from "@/components/nova/anonymizationEngine";
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

// Anonymize names in recommendation text
const anonymizeRecommendationText = (text, knownNames = []) => {
  if (!text) return text;
  
  let result = text;
  const allNames = [...new Set(knownNames)];
  
  // Anonymize all known names (NEVER anonymize verbs)
  allNames.forEach(name => {
    if (!name || name.length <= 2) return;
    // CRITICAL: Never anonymize if it's a verb
    if (anonymizeFirstName.isVerb?.(name) || isVerbFrenchEnglish(name)) return;
    
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\p{L})${escapedName}(?!\\p{L})`, 'giu');
    result = result.replace(regex, anonymizeFirstName(name));
  });
  
  return result;
};

// Helper: Check if word is a French/English verb
const isVerbFrenchEnglish = (word) => {
  const lowerWord = word.toLowerCase();
  
  // French infinitives
  if (/er$|ir$|re$|oir$/.test(lowerWord) && lowerWord.length > 3) return true;
  
  // English -ing, -ed
  if (/(ing|ed)$/.test(lowerWord) && lowerWord.length > 4) return true;
  
  return false;
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

  // Fetch all recommendations from all sources via unified endpoint (no cache - always fresh)
  useEffect(() => {
    const fetchAllRecommendations = async () => {
      try {
        const response = await base44.functions.invoke('getAllRecommendations', {});
        if (response.data?.recommendations) {
          setAllSourceRecommendations(response.data.recommendations);
        }
      } catch (error) {
        console.error("Error fetching all recommendations:", error);
      }
    };

    fetchAllRecommendations();
    }, []);

    // Extract known names from transcript + recommendations
    const knownNames = new Set();
    if (latestAnalysis?.transcript) {
      const interlocutors = extractInterlocutors(latestAnalysis.transcript);
      interlocutors.forEach(name => knownNames.add(name));
    }

    // Also extract names from recommendations text itself
    allSourceRecommendations.forEach(rec => {
      const recText = rec.text || rec.description || '';
      const capitalizedWords = (recText.match(/\b\p{Lu}\p{Ll}+\b/gu) || []).filter(w => w.length > 2);
      capitalizedWords.forEach(name => knownNames.add(name));
    });

    // Combine recommendations from manual analysis + all unified sources
    const getRecommendations = () => {
      const allRecs = [];

      // Add recommendations from all unified sources (backend handles all sources: analysis, slack, teams, etc.)
      allSourceRecommendations.forEach((rec, idx) => {
        const recText = rec.text || '';
        allRecs.push({
          type: "default",
          title: recText.substring(0, 50) + (recText.length > 50 ? "..." : ""),
          description: recText,
          priority: rec.priority || 'medium',
          source: rec.source,
          entityType: rec.entityType
        });
      });

      // Add manual analysis recommendations if available (only if no data from backend)
      if (allRecs.length === 0 && latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0) {
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

        const translationPrompt = `Traduis chaque recommandation en français de manière concise.

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels. NE JAMAIS les dé-anonymiser ou les remplacer par des noms complets.

Recommandations:\n\n${JSON.stringify(descriptions)}\n\nRetourne un tableau JSON avec les traductions en français, au même index que l'original.`;
        
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

      // Paginated/Anonymized recommendations calculation
      const allRecommendations = getRecommendations();
      const recommendations = allRecommendations
        .map(rec => ({
          ...rec,
          title: anonymizeRecommendationText(rec.title, Array.from(knownNames)),
          description: anonymizeRecommendationText(rec.description, Array.from(knownNames))
        }))
        .map(rec => {
          const formatted = formatRecommendation(rec, userRole);
          // Re-anonymize après formatRecommendation au cas où makeConstructive() l'aurait cassée
          return {
            ...formatted,
            title: anonymizeRecommendationText(formatted.title, Array.from(knownNames)),
            description: anonymizeRecommendationText(formatted.description, Array.from(knownNames))
          };
        });
      const itemsPerPage = 4;
      const totalPages = Math.max(1, Math.ceil(recommendations.length / itemsPerPage));
      const startIdx = currentPage * itemsPerPage;
      const paginatedRecs = recommendations.slice(startIdx, startIdx + itemsPerPage);

      // Keyboard navigation for pagination
      useEffect(() => {
      const handleKeyDown = (e) => {
       if (e.key === 'ArrowLeft' && currentPage > 0) {
         setCurrentPage(currentPage - 1);
       } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
         setCurrentPage(currentPage + 1);
       }
      };

      if (totalPages > 0) {
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
      }
      }, [currentPage, totalPages]);

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

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels dans ton plan d'action. NE JAMAIS les dé-anonymiser.

Recommandation: ${rec.title}
Description: ${rec.description}

Fournis 3-5 étapes concrètes et spécifiques que l'équipe peut suivre immédiatement. Sois pragmatique et actionnable.`
        : `You are Nova, an AI Scrum Master. Detail this recommendation with a concrete action plan in the form of numbered, actionable to-do items.

ABSOLUTE ANONYMIZATION RULE: If the text contains anonymized names (first letter + asterisks + last letter, example: A*****e, I**s, S****l), you MUST keep them EXACTLY as they are in your action plan. NEVER de-anonymize them.

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
        const translationPrompt = `Traduis chaque étape en français de manière concise.

RÈGLE ABSOLUE D'ANONYMISATION : Si le texte contient des noms au format anonymisé (première lettre + astérisques + dernière lettre, exemple: A*****e, I**s, S****l), tu DOIS les conserver EXACTEMENT tels quels. NE JAMAIS les dé-anonymiser.

Étapes:\n\n${JSON.stringify(actionPlan)}\n\nRetourne le JSON avec les mêmes clés (step, description) mais avec les valeurs traduites en français.`;
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
        {(isAdmin || isContributor) && (
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
        )}
        {(isAdmin || isContributor) && (
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
                                  const isCompleted = completedItems[`${globalIndex}-${idx}`];
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
                                        onClick={() => handleItemCheck(globalIndex, idx)}
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
          
          {/* Pagination dots */}
          {totalPages >= 1 && (
            <div className="flex justify-center gap-2 mt-6 pb-2">
              {Array.from({ length: totalPages }).map((_, page) => (
                <motion.button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPage === page ? 'bg-amber-500 w-6' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Page ${page + 1}`}
                />
              ))}
            </div>
          )}
          
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
          )}
          </Card>
          </motion.div>
          );
          }