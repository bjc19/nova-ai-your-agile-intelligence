import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowRight, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";

const getTranslations = (language) => ({
  fr: {
    actionPlanPrompt: `Tu es Nova, un Scrum Master IA. Détaille cette recommandation avec un plan d'action concret sous forme de to-do items numérotés et actionnables.

Recommandation: {rec}

Fournis 3-5 étapes concrètes et spécifiques que l'équipe peut suivre immédiatement. Sois pragmatique et actionnable.`,
    actionPlanPromptEn: `You are Nova, an AI Scrum Master. Detail this recommendation with a concrete action plan in the form of numbered, actionable to-do items.

Recommendation: {rec}

Provide 3-5 concrete and specific steps that the team can follow immediately. Be pragmatic and actionable.`
  },
  en: {
    actionPlanPrompt: `You are Nova, an AI Scrum Master. Detail this recommendation with a concrete action plan in the form of numbered, actionable to-do items.

Recommendation: {rec}

Provide 3-5 concrete and specific steps that the team can follow immediately. Be pragmatic and actionable.`
  }
});

export default function RecommendationCard({ recommendations, sourceUrl, sourceName }) {
  const { language, t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState({});
  const [detailsCache, setDetailsCache] = useState({});
  const [completedItems, setCompletedItems] = useState({});

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
       const recText = typeof rec === 'string' ? rec : rec?.action || rec?.description || JSON.stringify(rec);

       const prompt = language === 'fr' 
         ? getTranslations('fr').fr.actionPlanPrompt.replace('{rec}', recText)
         : getTranslations('en').en.actionPlanPrompt.replace('{rec}', recText);

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

  const handleItemCheck = (recIndex, itemIndex) => {
    const key = `${recIndex}-${itemIndex}`;
    setCompletedItems({
      ...completedItems,
      [key]: !completedItems[key]
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-amber-100">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
           {t('improvementRecommendations')}
         </h3>
      </div>
      <ul className="space-y-2">
        {recommendations.map((rec, index) => {
          const recText = typeof rec === 'string' ? rec : rec?.action || rec?.description || JSON.stringify(rec);
          const isExpanded = expandedIndex === index;
          const details = detailsCache[index];
          const isLoading = loadingDetails[index];

          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="rounded-lg border border-amber-200 overflow-hidden"
            >
              <div
                onClick={() => handleRecommendationClick(rec, index)}
                className="flex items-start gap-3 p-3 text-slate-700 hover:bg-amber-50/50 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed font-medium text-slate-900">{recText.substring(0, 80)}{recText.length > 80 ? '...' : ''}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-amber-200 bg-white"
                  >
                    <div className="p-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                          <span className="ml-2 text-sm text-slate-500">
                            {language === 'fr' ? 'Nova analyse...' : 'Nova is analyzing...'}
                          </span>
                        </div>
                      ) : details ? (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            {language === 'fr' ? 'Plan d\'action suggéré' : 'Suggested Action Plan'}
                          </h5>
                          <div className="space-y-2">
                            {details.map((item, idx) => {
                              const isCompleted = completedItems[`${index}-${idx}`];
                              return (
                                <motion.div
                                  key={idx}
                                  animate={isCompleted ? { opacity: 0.6 } : { opacity: 1 }}
                                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 transition-all"
                                >
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs flex-shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium text-sm mb-0.5 transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                      {item.step}
                                    </p>
                                    <p className={`text-xs transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                                      {item.description}
                                    </p>
                                  </div>
                                  <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleItemCheck(index, idx)}
                                    className="cursor-pointer flex-shrink-0"
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-slate-300 hover:text-amber-500" />
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
            </motion.li>
          );
        })}
      </ul>
      
      {sourceUrl && (
        <div className="mt-5 pt-5 border-t border-amber-200">
          <Button
            onClick={() => window.open(sourceUrl, '_blank')}
            variant="outline"
            className="w-full bg-white hover:bg-amber-50 border-amber-300 text-amber-700 hover:text-amber-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'Voir dans' : 'View in'} {sourceName || (language === 'fr' ? 'la source' : 'source')}
          </Button>
        </div>
      )}
    </motion.div>
  );
}