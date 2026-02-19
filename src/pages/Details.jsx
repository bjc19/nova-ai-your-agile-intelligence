import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowLeft, AlertOctagon, ShieldAlert, CheckCircle2, TrendingUp, Filter, ChevronDown } from "lucide-react";
import { anonymizeNamesInText as anonymizeText } from "@/components/nova/anonymizationEngine";

const anonymizeNamesInText = (text) => {
  if (!text) return text;
  const namePattern = /\b([A-ZÀ-ÿ][a-zà-ÿ]+)\b/g;
  return text.replace(namePattern, (match) => {
    const commonWords = ['Vous', 'Excellent', 'À', 'Continuez', 'Priorisez', 'You', 'Needs', 'Keep', 'Prioritize', 'Resolved', 'Blockers', 'Risks', 'IST'];
    if (commonWords.includes(match)) return match;
    return anonymizeText(match);
  });
};

export default function Details() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [detailType, setDetailType] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [urgencyFilter, setUrgencyFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [resolvingItemId, setResolvingItemId] = useState(null);
  const [localResolvedIds, setLocalResolvedIds] = useState(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("detailsType");
    if (stored) {
      setDetailType(stored);
    } else {
      navigate(createPageUrl("Dashboard"));
    }

    const storedPeriod = sessionStorage.getItem("selectedPeriod");
    if (storedPeriod) setSelectedPeriod(JSON.parse(storedPeriod));

    const storedWorkspace = sessionStorage.getItem("selectedWorkspaceId");
    if (storedWorkspace) setSelectedWorkspaceId(storedWorkspace);
  }, [navigate]);

  // Fetch analysis history and markers - scoped by workspace if set
  const { data: historyData = [] } = useQuery({
    queryKey: ['analysisHistory', selectedWorkspaceId],
    queryFn: () => selectedWorkspaceId
      ? base44.entities.AnalysisHistory.filter({ jira_project_selection_id: selectedWorkspaceId }, '-created_date', 100)
      : base44.entities.AnalysisHistory.list('-created_date', 100),
    enabled: detailType !== null,
  });

  // Fetch GDPRMarkers and TeamsInsights filtered by workspace
  const { data: gdprMarkersData = [] } = useQuery({
    queryKey: ['gdprMarkers', selectedWorkspaceId],
    queryFn: () => selectedWorkspaceId
      ? base44.entities.GDPRMarkers.filter({
          $or: [
            { jira_project_selection_id: selectedWorkspaceId },
            { trello_project_selection_id: selectedWorkspaceId }
          ]
        }, '-created_date', 1000)
      : base44.entities.GDPRMarkers.list('-created_date', 1000),
    enabled: detailType !== null,
  });

  const { data: teamsInsightsData = [] } = useQuery({
    queryKey: ['teamsInsights', selectedWorkspaceId],
    queryFn: () => selectedWorkspaceId
      ? base44.entities.TeamsInsight.filter({
          $or: [
            { jira_project_selection_id: selectedWorkspaceId },
            { trello_project_selection_id: selectedWorkspaceId }
          ]
        }, '-created_date', 1000)
      : base44.entities.TeamsInsight.list('-created_date', 1000),
    enabled: detailType !== null,
  });

  // Fetch resolved items
  const { data: resolvedItemsData = [], refetch: refetchResolvedItems } = useQuery({
    queryKey: ['resolvedItems'],
    queryFn: () => base44.entities.ResolvedItem.list('-resolved_date', 100),
  });

  // Apply period filter to history
  useEffect(() => {
    let filtered = historyData;
    if (selectedPeriod) {
      const startDate = new Date(selectedPeriod.start);
      const endDate = new Date(selectedPeriod.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = historyData.filter(a => {
        const d = new Date(a.created_date);
        return d >= startDate && d <= endDate;
      });
    }
    setAnalysisHistory(filtered);
  }, [historyData, selectedPeriod]);

  const getDetailsData = () => {
    let items = [];
    let icon, color, title;

    if (detailType === "blockers") {
      // From analysis data
      const analysisBlockers = analysisHistory.flatMap((analysis, idx) =>
        (analysis.analysis_data?.blockers || [])
          .filter(b => b.urgency)
          .map((blocker, bidx) => ({
            id: `analysis-${idx}-${bidx}`,
            ...blocker,
            source: 'analysis',
            analysisTitle: analysis.title,
            analysisDate: analysis.created_date,
          }))
      ).filter(item => !resolvedItemsData.some(r => r.item_id === item.id));

      // From GDPRMarkers (critique/haute = blockers)
      const gdprBlockers = gdprMarkersData
        .filter(m => m.criticite === 'critique' || m.criticite === 'haute')
        .map((marker, idx) => ({
          id: `gdpr-${idx}`,
          issue: marker.probleme,
          description: marker.probleme,
          action: marker.recos?.[0] || '',
          urgency: marker.criticite === 'critique' ? 'high' : 'medium',
          source: 'gdpr',
          analysisTitle: marker.detection_source,
          analysisDate: marker.created_date,
        }))
        .filter(item => !resolvedItemsData.some(r => r.item_id === item.id));

      items = [...analysisBlockers, ...gdprBlockers];
      icon = AlertOctagon;
      color = "text-blue-600";
      title = t('detectedBlockersIssues');

    } else if (detailType === "risks") {
      // From analysis data
      const analysisRisks = analysisHistory.flatMap((analysis, idx) =>
        (analysis.analysis_data?.risks || [])
          .map((risk, ridx) => ({
            id: `analysis-${idx}-${ridx}`,
            ...risk,
            source: 'analysis',
            analysisTitle: analysis.title,
            analysisDate: analysis.created_date,
          }))
      ).filter(item =>
        !resolvedItemsData.some(r => r.item_id === item.id) &&
        (item.urgency === 'high' || item.urgency === 'medium')
      );

      // From GDPRMarkers (moyenne/basse = risks)
      const gdprRisks = gdprMarkersData
        .filter(m => m.criticite === 'moyenne' || m.criticite === 'basse')
        .map((marker, idx) => ({
          id: `gdpr-risk-${idx}`,
          description: marker.probleme,
          impact: marker.recos?.[0] || '',
          urgency: marker.criticite === 'moyenne' ? 'medium' : 'low',
          source: 'gdpr',
          analysisTitle: marker.detection_source,
          analysisDate: marker.created_date,
        }))
        .filter(item => !resolvedItemsData.some(r => r.item_id === item.id));

      items = [...analysisRisks, ...gdprRisks];
      icon = ShieldAlert;
      color = "text-amber-600";
      title = t('identifiedRisks');

    } else if (detailType === "analyses") {
      items = analysisHistory.map(a => ({ id: a.id, ...a }));
      icon = TrendingUp;
      color = "text-indigo-600";
      title = t('recentAnalyses');

    } else if (detailType === "resolved") {
      items = resolvedItemsData.map(item => ({
        id: item.id,
        issue: item.title || item.item_id,
        description: item.title,
        status: "resolved",
        urgency: item.urgency,
        analysisTitle: item.source,
        analysisDate: item.resolved_date || item.created_date,
        source: item.source,
      }));
      icon = CheckCircle2;
      color = "text-emerald-600";
      title = t('resolved');
    }

    return { items, icon: icon || AlertOctagon, color, title };
  };

  const { items, icon: Icon, color, title } = getDetailsData();

  const filteredItems = (urgencyFilter
    ? items.filter(item => item.urgency === urgencyFilter)
    : items
  ).filter(item => !localResolvedIds.has(item.id))
   .sort((a, b) => new Date(b.analysisDate || b.created_date) - new Date(a.analysisDate || a.created_date));

  const handleMarkResolved = async (item) => {
    setResolvingItemId(item.id);
    setLocalResolvedIds(prev => new Set([...prev, item.id]));
    try {
      await base44.functions.invoke('markItemResolved', {
        itemId: item.id,
        source: item.source,
        itemType: detailType === 'blockers' ? 'blocker' : 'risk',
        title: item.issue || item.description || '-',
        urgency: item.urgency || 'medium',
        analysisDate: item.analysisDate || item.created_date,
      });
      const resolvedCount = parseInt(sessionStorage.getItem('resolvedCount') || '0');
      sessionStorage.setItem('resolvedCount', String(resolvedCount + 1));
      toast.success('Item marqué comme résolu');
      refetchResolvedItems();
    } catch (error) {
      console.error('Erreur résolution:', error);
      toast.error('Erreur lors de la mise à jour');
      setLocalResolvedIds(prev => {
        const updated = new Set(prev);
        updated.delete(item.id);
        return updated;
      });
    } finally {
      setResolvingItemId(null);
    }
  };

  const itemsWithUrgency = filteredItems.filter(item => item.urgency);
  const urgencyCounts = itemsWithUrgency.reduce((acc, item) => {
    acc[item.urgency] = (acc[item.urgency] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Button
              variant="ghost"
              onClick={() => {
                const previousDashboard = sessionStorage.getItem("previousDashboard") || "Dashboard";
                navigate(createPageUrl(previousDashboard));
              }}
              className="mb-6 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToDashboard')}
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100">
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
                  <button onClick={() => setUrgencyFilter(null)} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!urgencyFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    Tous ({itemsWithUrgency.length})
                  </button>
                  {urgencyCounts.high && (
                    <button onClick={() => setUrgencyFilter("high")} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${urgencyFilter === "high" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"}`}>
                      {t('high')} ({urgencyCounts.high})
                    </button>
                  )}
                  {urgencyCounts.medium && (
                    <button onClick={() => setUrgencyFilter("medium")} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${urgencyFilter === "medium" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}>
                      {t('medium')} ({urgencyCounts.medium})
                    </button>
                  )}
                  {urgencyCounts.low && (
                    <button onClick={() => setUrgencyFilter("low")} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${urgencyFilter === "low" ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
                      {t('low')} ({urgencyCounts.low})
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{t('noItemsFound')}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 mb-4">
              Page {currentPage + 1} / {Math.ceil(filteredItems.length / itemsPerPage)} • {filteredItems.length} total
            </div>

            <div className="space-y-3">
              {filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((item, index) => (
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
                      <div className="p-2 rounded-lg bg-slate-100">
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {detailType === "analyses" ? (
                          <>
                            <h3 className="font-semibold text-slate-900 truncate">{anonymizeText(item.title)}</h3>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{item.blockers_count} {t('blockers')}</Badge>
                              <Badge variant="outline" className="text-xs">{item.risks_count} {t('risks')}</Badge>
                              <span className="text-xs text-slate-500">{new Date(item.created_date).toLocaleDateString()}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">
                                {anonymizeText(item.member || item.issue || item.description || "-")}
                              </h3>
                              <div className="flex gap-2 flex-wrap justify-end items-center">
                                {item.urgency && (
                                  <Badge
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); setUrgencyFilter(item.urgency); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className={`shrink-0 cursor-pointer text-xs ${item.urgency === "high" ? "bg-red-50 text-red-700 border-red-200" : item.urgency === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                                  >
                                    {t(item.urgency)}
                                  </Badge>
                                )}
                                {item.status === "resolved" && (
                                  <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">{t('resolved')}</Badge>
                                )}
                                {item.status !== "resolved" && (item.urgency === 'high' || item.urgency === 'medium') && (
                                  <Button
                                    size="sm" variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleMarkResolved(item); }}
                                    disabled={resolvingItemId === item.id}
                                    className="text-xs h-7 px-2 shrink-0"
                                  >
                                    {resolvingItemId === item.id ? 'Mise à jour...' : 'Marquer résolu'}
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                              {anonymizeNamesInText(anonymizeText(item.issue || item.description || "-"))}
                            </p>
                            {item.action && (
                              <p className="text-xs text-slate-500 mt-2">
                                <strong>{t('action')}:</strong> {anonymizeNamesInText(anonymizeText(item.action))}
                              </p>
                            )}
                            {item.impact && (
                              <p className="text-xs text-slate-500 mt-1">
                                <strong>{t('impact')}:</strong> {anonymizeNamesInText(anonymizeText(item.impact))}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className="text-xs text-slate-500">{item.analysisTitle}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{new Date(item.analysisDate).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <motion.div animate={{ rotate: expandedItemId === item.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: expandedItemId === item.id ? "auto" : 0, opacity: expandedItemId === item.id ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-5 bg-slate-50/50 space-y-4">
                      {(item.root_cause || item.cause) && (
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm mb-2">Cause Racine</h4>
                          <p className="text-sm text-slate-600">{anonymizeNamesInText(anonymizeText(item.root_cause || item.cause))}</p>
                        </div>
                      )}
                      {(item.impact || item.system_impact) && (
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm mb-2">Impact Système</h4>
                          <p className="text-sm text-slate-600">{anonymizeNamesInText(anonymizeText(item.impact || item.system_impact))}</p>
                        </div>
                      )}
                      {(item.action || item.mitigation || item.recommendation) && (
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm mb-2">Recommandations Contextualisées</h4>
                          <ul className="space-y-2">
                            <li className="text-sm text-slate-600 flex gap-2">
                              <span className="text-blue-600 font-semibold">•</span>
                              <span>{anonymizeNamesInText(anonymizeText(item.action || item.mitigation || item.recommendation))}</span>
                            </li>
                          </ul>
                        </div>
                      )}
                      {item.confidence_score && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-500">Confiance: {Math.round(item.confidence_score * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {Math.ceil(filteredItems.length / itemsPerPage) > 1 && (
              <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
                <button onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  ← Précédent
                </button>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }).map((_, page) => (
                    <motion.button key={page} onClick={() => setCurrentPage(page)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`w-8 h-8 rounded-lg transition-all ${currentPage === page ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {page + 1}
                    </motion.button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredItems.length / itemsPerPage) - 1, prev + 1))} disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage) - 1} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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