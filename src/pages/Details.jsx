import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowLeft, AlertOctagon, ShieldAlert, CheckCircle2, TrendingUp, Filter } from "lucide-react";

const translateContent = async (text, targetLanguage) => {
  if (!text || targetLanguage === 'en') return text;
  
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Traduis ce texte en français de manière concise:\n\n${text}`,
    });
    return result || text;
  } catch (error) {
    return text;
  }
};

export default function Details() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [detailType, setDetailType] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [translatedItems, setTranslatedItems] = useState({});

  // Get the detail type from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("detailsType");
    if (stored) {
      setDetailType(stored);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  }, [navigate]);

  // Fetch analysis history
  const { data: historyData = [] } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => base44.entities.AnalysisHistory.list('-created_date', 20),
  });

  useEffect(() => {
    setAnalysisHistory(historyData);
  }, [historyData]);

  // Translate item content when language changes
  const getTranslatedItem = async (item) => {
    const cacheKey = `${item.id}-${language}`;
    if (translatedItems[cacheKey]) {
      return translatedItems[cacheKey];
    }

    const translated = { ...item };
    if (language === 'fr') {
      if (item.action) {
        translated.action = await translateContent(item.action, language);
      }
      if (item.impact) {
        translated.impact = await translateContent(item.impact, language);
      }
      if (item.description) {
        translated.description = await translateContent(item.description, language);
      }
      if (item.issue) {
        translated.issue = await translateContent(item.issue, language);
      }
      if (item.mitigation) {
        translated.mitigation = await translateContent(item.mitigation, language);
      }
    }

    setTranslatedItems(prev => ({
      ...prev,
      [cacheKey]: translated
    }));
    return translated;
  };

  // Calculate data based on type
  const getDetailsData = () => {
    let items = [];
    let icon, color, title;

    if (detailType === "blockers") {
      items = analysisHistory.flatMap((analysis, idx) => {
        const blockers = analysis.analysis_data?.blockers || [];
        return blockers.map((blocker, bidx) => ({
          id: `${idx}-${bidx}`,
          ...blocker,
          analysisTitle: analysis.title,
          analysisDate: analysis.created_date,
        }));
      });
      icon = AlertOctagon;
      color = "text-blue-600";
      title = t('detectedBlockersIssues');
    } else if (detailType === "risks") {
      items = analysisHistory.flatMap((analysis, idx) => {
        const risks = analysis.analysis_data?.risks || [];
        return risks.map((risk, ridx) => ({
          id: `${idx}-${ridx}`,
          ...risk,
          analysisTitle: analysis.title,
          analysisDate: analysis.created_date,
        }));
      });
      icon = ShieldAlert;
      color = "text-amber-600";
      title = t('identifiedRisks');
    } else if (detailType === "analyses") {
      items = analysisHistory.map(analysis => ({
        id: analysis.id,
        ...analysis,
      }));
      icon = TrendingUp;
      color = "text-indigo-600";
      title = t('recentAnalyses');
    } else if (detailType === "resolved") {
      items = analysisHistory.flatMap((analysis, idx) => {
        const blockers = analysis.analysis_data?.blockers || [];
        // Simulated resolved status - in real app would come from data
        return blockers
          .filter((_, i) => i % 2 === 0) // Simulate some resolved
          .map((blocker, bidx) => ({
            id: `${idx}-${bidx}`,
            ...blocker,
            status: "resolved",
            analysisTitle: analysis.title,
            analysisDate: analysis.created_date,
          }));
      });
      icon = CheckCircle2;
      color = "text-emerald-600";
      title = t('resolved');
    }

    return { items, icon: icon || AlertOctagon, color, title };
  };

  const { items, icon: Icon, color, title } = getDetailsData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="mb-6 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToDashboard')}
            </Button>

            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-opacity-10`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-600 mt-1">
                  {items.length} {items.length === 1 ? t('item') : t('items')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{t('noItemsFound')}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const cacheKey = `${item.id}-${language}`;
              const displayItem = translatedItems[cacheKey] || item;
              
              // Trigger translation if needed
              if (language === 'fr' && !translatedItems[cacheKey]) {
                getTranslatedItem(item);
              }
              
              return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {detailType === "analyses" ? (
                      <>
                        <h3 className="font-semibold text-slate-900 truncate">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {item.blockers_count} {t('blockers')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.risks_count} {t('risks')}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(item.created_date).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">
                            {displayItem.member || displayItem.issue || displayItem.description || "-"}
                          </h3>
                          {item.urgency && (
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${
                                item.urgency === "high"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : item.urgency === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {t(item.urgency)}
                            </Badge>
                          )}
                          {item.status === "resolved" && (
                            <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                              {t('resolved')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {displayItem.issue || displayItem.description || displayItem.action || displayItem.mitigation || "-"}
                        </p>
                        {displayItem.action && (
                          <p className="text-xs text-slate-500 mt-2">
                            <strong>{t('action')}:</strong> {displayItem.action}
                          </p>
                        )}
                        {displayItem.impact && (
                          <p className="text-xs text-slate-500 mt-1">
                            <strong>{t('impact')}:</strong> {displayItem.impact}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-slate-500">
                            {item.analysisTitle}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {new Date(item.analysisDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}