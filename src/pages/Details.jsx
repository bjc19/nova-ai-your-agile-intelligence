import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useRoleAccess } from "@/components/dashboard/useRoleAccess";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowLeft, AlertOctagon, ShieldAlert, CheckCircle2, TrendingUp, Filter, Shield, ChevronDown } from "lucide-react";
import { anonymizeNamesInText as anonymizeText } from "@/components/nova/anonymizationEngine";

// Anonymize names in text
const anonymizeNamesInText = (text) => {
  if (!text) return text;
  
  const namePattern = /\b([A-ZÀ-ÿ][a-zà-ÿ]+)\b/g;
  return text.replace(namePattern, (match) => {
    const commonWords = ['Vous', 'Excellent', 'À', 'Continuez', 'Priorisez', 'You', 'Needs', 'Keep', 'Prioritize', 'Resolved', 'Blockers', 'Risks', 'IST'];
    if (commonWords.includes(match)) return match;
    return anonymizeText(match);
  });
};

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
  const [urgencyFilter, setUrgencyFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Generate contextual recommendations based on item
  const getContextualRecommendations = (item) => {
    const recommendations = [];
    const urgency = item.urgency || item.criticite;
    const source = item.source;
    const workshop = item.analysisData?.workshop_type;

    // Recommendation 1: Immediate action
    if (urgency === 'high' || urgency === 'critique') {
      recommendations.push({
        title: "Action Immédiate",
        description: "Escalader auprès du lead technique et du responsable de l'équipe pour résolution en priorité",
        icon: "🚨"
      });
    } else if (urgency === 'medium' || urgency === 'moyenne') {
      recommendations.push({
        title: "Planifier dans le Sprint",
        description: "Intégrer la résolution dans le prochain sprint avec un critère d'acceptation clair",
        icon: "⏱️"
      });
    } else {
      recommendations.push({
        title: "Ajouter au Backlog",
        description: "Cataloguer comme amélioration future et planifier quand la capacité le permet",
        icon: "📋"
      });
    }

    // Recommendation 2: Root cause investigation (context-specific)
    if (source === 'gdpr') {
      recommendations.push({
        title: "Audit Slack",
        description: "Analyser les messages du canal pour identifier les patterns récurrents et causes systémiques",
        icon: "🔍"
      });
    } else if (source === 'teams') {
      recommendations.push({
        title: "Analyser les Transcripts",
        description: "Examiner les réunions Teams pour évaluer la fréquence et le contexte du problème",
        icon: "📹"
      });
    } else {
      recommendations.push({
        title: "Investiguer la Cause Racine",
        description: "Organiser une rétrospective ciblée pour identifier et documenter les causes fondamentales",
        icon: "🎯"
      });
    }

    // Recommendation 3: Process improvement
    if (workshop === 'daily_scrum' || workshop === 'standup') {
      recommendations.push({
        title: "Améliorer le Daily",
        description: "Réserver 5 min en daily pour explicitement adresser ces blocages et facteurs de friction",
        icon: "✅"
      });
    } else if (workshop === 'retrospective') {
      recommendations.push({
        title: "Créer une Action Retro",
        description: "Générer une action concrète en rétro avec propriétaire et deadline de suivi",
        icon: "📊"
      });
    } else {
      recommendations.push({
        title: "Documenter et Partager",
        description: "Créer une page Confluence avec la solution pour éviter la répétition du problème",
        icon: "📝"
      });
    }

    return recommendations;
  };

  // Get the detail type and period from sessionStorage
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  
  useEffect(() => {
    const stored = sessionStorage.getItem("detailsType");
    if (stored) {
      setDetailType(stored);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
    
    // Load selected period from sessionStorage
    const storedPeriod = sessionStorage.getItem("selectedPeriod");
    if (storedPeriod) {
      setSelectedPeriod(JSON.parse(storedPeriod));
    }
  }, [navigate]);

  // Fetch analysis history
  const { data: historyData = [] } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => base44.entities.AnalysisHistory.list('-created_date', 100),
  });

  // Fetch all markers and separate by source
  const { data: allMarkersData = [] } = useQuery({
    queryKey: ['gdprMarkers'],
    queryFn: () => base44.entities.GDPRMarkers.list('-created_date', 100),
  });

  // Separate Slack (GDPR) and Teams markers
  const gdprMarkersData = allMarkersData.filter(m => 
    m.detection_source === 'slack_hourly' || m.detection_source === 'slack_daily' || m.detection_source === 'manual_trigger'
  );
  
  const teamsInsightsData = allMarkersData.filter(m => 
    m.detection_source === 'teams_daily'
  );

  useEffect(() => {
    // Filter by selected period if available
    let filtered = historyData;
    if (selectedPeriod) {
      const startDate = new Date(selectedPeriod.start);
      const endDate = new Date(selectedPeriod.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = historyData.filter(analysis => {
        const analysisDate = new Date(analysis.created_date);
        return analysisDate >= startDate && analysisDate <= endDate;
      });
    }
    setAnalysisHistory(filtered);
  }, [historyData, selectedPeriod]);

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
      // Analyses blockers + GDPR blockers (critique/haute) + Teams blockers (critique/haute)
      items = analysisHistory.flatMap((analysis, idx) => {
        const blockers = analysis.analysis_data?.blockers || [];
        return blockers.map((blocker, bidx) => ({
          id: `${idx}-${bidx}`,
          ...blocker,
          source: 'analysis',
          analysisTitle: analysis.title,
          analysisDate: analysis.created_date,
        }));
      }).concat(
        gdprMarkersData
          .filter(m => m.criticite === 'critique' || m.criticite === 'haute')
          .map((marker, idx) => ({
            id: `gdpr-blocker-${idx}`,
            issue: marker.probleme,
            description: marker.probleme,
            urgency: marker.criticite === 'critique' ? 'high' : 'medium',
            source: 'gdpr',
            marker_id: marker.id,
            criticite: marker.criticite,
            recurrence: marker.recurrence,
            confidence_score: marker.confidence_score,
            analysisTitle: '#Slack',
            analysisData: { workshop_type: marker.type },
            analysisDate: marker.created_date,
          }))
      ).concat(
        teamsInsightsData
          .filter(i => i.criticite === 'critique' || i.criticite === 'haute')
          .map((marker, idx) => ({
            id: `teams-blocker-${idx}`,
            issue: marker.probleme,
            description: marker.probleme,
            urgency: marker.criticite === 'critique' ? 'high' : 'medium',
            source: 'teams',
            criticite: marker.criticite,
            recurrence: marker.recurrence,
            confidence_score: marker.confidence_score,
            analysisTitle: '#Microsoft Teams',
            analysisData: { workshop_type: marker.type },
            analysisDate: marker.created_date,
          }))
      );
      icon = AlertOctagon;
      color = "text-blue-600";
      title = t('detectedBlockersIssues');
    } else if (detailType === "risks") {
      // Analyses risks + GDPR risks (moyenne) + Teams risks (moyenne)
      items = analysisHistory.flatMap((analysis, idx) => {
        const risks = analysis.analysis_data?.risks || [];
        return risks.map((risk, ridx) => ({
          id: `${idx}-${ridx}`,
          ...risk,
          source: 'analysis',
          analysisTitle: analysis.title,
          analysisDate: analysis.created_date,
        }));
      }).concat(
        gdprMarkersData
          .filter(m => m.criticite === 'moyenne')
          .map((marker, idx) => ({
            id: `gdpr-risk-${idx}`,
            issue: marker.probleme,
            description: marker.probleme,
            urgency: 'medium',
            source: 'gdpr',
            marker_id: marker.id,
            criticite: marker.criticite,
            recurrence: marker.recurrence,
            confidence_score: marker.confidence_score,
            analysisTitle: '#Slack',
            analysisDate: marker.created_date,
          }))
      ).concat(
        teamsInsightsData
          .filter(i => i.criticite === 'moyenne' || i.criticite === 'basse')
          .map((marker, idx) => ({
            id: `teams-risk-${idx}`,
            issue: marker.probleme,
            description: marker.probleme,
            urgency: 'medium',
            source: 'teams',
            criticite: marker.criticite,
            recurrence: marker.recurrence,
            confidence_score: marker.confidence_score,
            analysisTitle: '#Microsoft Teams',
            analysisDate: marker.created_date,
          }))
      );
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

  // Filter and sort items by urgency and date (most recent first)
  const filteredItems = (urgencyFilter 
    ? items.filter(item => item.urgency === urgencyFilter)
    : items
  ).sort((a, b) => new Date(b.analysisDate || b.created_date) - new Date(a.analysisDate || a.created_date));

  // Count items by urgency
  const itemsWithUrgency = items.filter(item => item.urgency);
  const urgencyCounts = itemsWithUrgency.reduce((acc, item) => {
   acc[item.urgency] = (acc[item.urgency] || 0) + 1;
   return acc;
  }, {});

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-opacity-10`}>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                  <p className="text-slate-600 mt-1">
                    {filteredItems.length} {filteredItems.length === 1 ? t('item') : t('items')}
                    {urgencyFilter && ` • ${t(urgencyFilter)}`}
                  </p>
                </div>
              </div>

              {(detailType === "blockers" || detailType === "risks") && Object.keys(urgencyCounts).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setUrgencyFilter(null)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      !urgencyFilter 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tous ({itemsWithUrgency.length})
                  </button>
                  {urgencyCounts.high && (
                    <button
                      onClick={() => setUrgencyFilter("high")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        urgencyFilter === "high"
                          ? "bg-red-600 text-white"
                          : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                      }`}
                    >
                      {t('high')} ({urgencyCounts.high})
                    </button>
                  )}
                  {urgencyCounts.medium && (
                    <button
                      onClick={() => setUrgencyFilter("medium")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        urgencyFilter === "medium"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {t('medium')} ({urgencyCounts.medium})
                    </button>
                  )}
                  {urgencyCounts.low && (
                    <button
                      onClick={() => setUrgencyFilter("low")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        urgencyFilter === "low"
                          ? "bg-slate-600 text-white"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t('low')} ({urgencyCounts.low})
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{t('noItemsFound')}</p>
          </motion.div>
        ) : (
                  <div className="space-y-4">
                    {/* Pagination info */}
                    <div className="text-sm text-slate-500 mb-4">
                      Page {currentPage + 1} / {Math.ceil(filteredItems.length / itemsPerPage)} • {filteredItems.length} total
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                    {filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((item, index) => {
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
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div 
                  onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                  className="p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    item.source === 'gdpr' ? 'bg-blue-100' : 
                    item.source === 'teams' ? 'bg-purple-100' : 
                    'bg-slate-100'
                  }`}>
                    {item.source === 'gdpr' ? (
                      <Shield className={`w-5 h-5 text-blue-600`} />
                    ) : item.source === 'teams' ? (
                      <Shield className={`w-5 h-5 text-purple-600`} />
                    ) : (
                      <Icon className={`w-5 h-5 ${color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {detailType === "analyses" ? (
                      <>
                        <h3 className="font-semibold text-slate-900 truncate">
                          {anonymizeText(item.title)}
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
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {anonymizeText(displayItem.member || displayItem.issue || displayItem.description || "-")}
                          </h3>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {item.urgency && (
                              <Badge
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUrgencyFilter(item.urgency);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`shrink-0 cursor-pointer hover:opacity-80 transition-opacity text-xs ${
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
                              <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                {t('resolved')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.patterns && item.patterns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.patterns.map((pattern, pidx) => (
                              <Badge key={pidx} variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-slate-600 mt-2">
                          {anonymizeNamesInText(anonymizeText(displayItem.issue || displayItem.description || displayItem.action || displayItem.mitigation || "-"))}
                        </p>
                        {displayItem.action && (
                          <p className="text-xs text-slate-500 mt-2">
                            <strong>{t('action')}:</strong> {anonymizeNamesInText(anonymizeText(displayItem.action))}
                          </p>
                        )}
                        {displayItem.impact && (
                          <p className="text-xs text-slate-500 mt-1">
                            <strong>{t('impact')}:</strong> {anonymizeNamesInText(anonymizeText(displayItem.impact))}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className={`text-xs ${
                            item.source === 'gdpr' ? 'text-blue-600 font-medium' : 
                            item.source === 'teams' ? 'text-purple-600 font-medium' : 
                            'text-slate-500'
                          }`}>
                            {item.analysisData?.workshop_type || item.analysisTitle}
                          </span>
                          {item.source === 'gdpr' && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                Récurrence: {item.recurrence}x
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                Confiance: {Math.round(item.confidence_score * 100)}%
                              </span>
                            </>
                          )}
                          <span className={`text-xs ${(item.source === 'gdpr' || item.source === 'teams') ? 'text-slate-400' : ''}`}>
                            {(item.source === 'gdpr' || item.source === 'teams') ? '•' : '•'} {new Date(item.analysisDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <motion.div
                      animate={{ rotate: expandedItemId === item.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>
                  </div>
                  </div>

                  {/* Expanded Details */}
                  <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: expandedItemId === item.id ? "auto" : 0, opacity: expandedItemId === item.id ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-slate-100"
                  >
                  <div className="p-5 bg-slate-50/50 space-y-4">
                  {/* Root Cause Analysis */}
                  {(item.root_cause || item.cause) && (
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">Cause Racine</h4>
                      <p className="text-sm text-slate-600">
                        {anonymizeNamesInText(anonymizeText(item.root_cause || item.cause))}
                      </p>
                    </div>
                  )}

                  {/* System Impact */}
                  {(item.impact || item.system_impact) && (
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">Impact Système</h4>
                      <p className="text-sm text-slate-600">
                        {anonymizeNamesInText(anonymizeText(item.impact || item.system_impact))}
                      </p>
                    </div>
                  )}

                  {/* Mitigation/Action */}
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-3">Recommandations Contextualisées</h4>
                    <div className="space-y-3">
                      {getContextualRecommendations(item).map((rec, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{rec.icon}</span>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-slate-900 text-xs">
                                {rec.title}
                              </h5>
                              <p className="text-xs text-slate-600 mt-1">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Score */}
                  {item.confidence_score && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        Confiance: {Math.round(item.confidence_score * 100)}%
                      </span>
                    </div>
                  )}
                  </div>
                  </motion.div>
                  </motion.div>
                  );
                  })}
              </div>

              {/* Pagination buttons */}
              {Math.ceil(filteredItems.length / itemsPerPage) > 1 && (
              <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Précédent
                </button>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }).map((_, page) => (
                    <motion.button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        currentPage === page
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {page + 1}
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredItems.length / itemsPerPage) - 1, prev + 1))}
                  disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage) - 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Suivant →
                </button>
              </div>
              )}
              </div>
              )}
      </div>
    </div>
  );
}