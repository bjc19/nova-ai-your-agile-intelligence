import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { formatLocalTimeWithTZ } from "@/components/nova/formatLocalTime";
import {
  MessageSquare,
  Upload,
  FileText,
  ArrowRight,
  Clock,
  AlertOctagon,
  ShieldAlert,
  Plus,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, ChevronRight, Lightbulb, RefreshCw } from "lucide-react";

const sourceIcons = {
  slack: MessageSquare,
  file_upload: Upload,
  transcript: FileText,
  jira: AlertOctagon,
};

export default function RecentAnalyses({ analyses = [] }) {
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const [gdprSignals, setGdprSignals] = useState([]);
  const [teamsInsights, setTeamsInsights] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [patternDetails, setPatternDetails] = useState(null);
  const [contextualActions, setContextualActions] = useState(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const [allMarkers, allPatterns] = await Promise.all([
          base44.entities.GDPRMarkers.list('-created_date', 50),
          base44.entities.AntiPattern.filter({ is_active: true })
        ]);
        
        // Separate Slack and Teams markers
        const slackMarkers = allMarkers.filter(m => 
          m.detection_source === 'slack_hourly' || m.detection_source === 'slack_daily' || m.detection_source === 'manual_trigger'
        ).filter(m => new Date(m.created_date) >= sevenDaysAgo);
        
        const teamsMarkers = allMarkers.filter(m => 
          m.detection_source === 'teams_daily'
        ).filter(m => new Date(m.created_date) >= sevenDaysAgo);

        const jiraMarkers = allMarkers.filter(m => 
          m.detection_source === 'jira_backlog'
        ).filter(m => new Date(m.created_date) >= sevenDaysAgo);

        // Attach pattern details to markers
        const enrichMarkers = (markers) => 
          markers.map(m => ({
            ...m,
            patternDetails: allPatterns.find(p => p.pattern_id === m.pattern_id)
          }));

        setGdprSignals(enrichMarkers(slackMarkers));
        setTeamsInsights([...enrichMarkers(teamsMarkers), ...enrichMarkers(jiraMarkers)]);
      } catch (error) {
        console.error("Erreur chargement signaux:", error);
      }
    };

    fetchSignals();
  }, []);

  // Combine and sort analyses and signals chronologically
  useEffect(() => {
    console.log('RecentAnalyses: analyses changed', analyses);
    
    const sampleAnalyses = language === 'fr' ? [
      {
        id: "1",
        title: "Daily Standup - Sprint 14",
        source: "transcript",
        blockers_count: 3,
        risks_count: 2,
        created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
      {
        id: "2",
        title: "Sync Équipe Dev",
        source: "slack",
        blockers_count: 1,
        risks_count: 1,
        created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
      {
        id: "3",
        title: "Notes Sprint Planning",
        source: "file_upload",
        blockers_count: 4,
        risks_count: 3,
        created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
    ] : [
      {
        id: "1",
        title: "Daily Standup - Sprint 14",
        source: "transcript",
        blockers_count: 3,
        risks_count: 2,
        created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
      {
        id: "2",
        title: "Dev Team Sync",
        source: "slack",
        blockers_count: 1,
        risks_count: 1,
        created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
      {
        id: "3",
        title: "Sprint Planning Notes",
        source: "file_upload",
        blockers_count: 4,
        risks_count: 3,
        created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        type: "analysis"
      },
    ];

    const displayAnalyses = Array.isArray(analyses) && analyses.length > 0 
      ? analyses.map(a => ({ ...a, type: 'analysis' })) 
      : sampleAnalyses;
    
    const combined = [
      ...displayAnalyses,
      ...gdprSignals.map(m => ({
        ...m,
        type: 'signal',
        signalSource: 'slack',
        id: m.id || `slack-${m.issue_id}`
      })),
      ...teamsInsights.map(t => ({
        ...t,
        type: 'signal',
        signalSource: t.detection_source === 'jira_backlog' ? 'jira' : 'teams',
        id: t.id || `${t.detection_source}-${t.issue_id}`
      }))
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);

    setAllItems(combined);
  }, [analyses, gdprSignals, teamsInsights, language]);

  const sourceLabels = language === 'fr' ? {
    slack: "Slack",
    file_upload: "Fichier importé",
    transcript: "Saisie manuelle",
  } : {
    slack: "Slack",
    file_upload: "File Upload",
    transcript: "Manual Input",
  };
  // Sample data for demo
  const sampleAnalyses = language === 'fr' ? [
    {
      id: "1",
      title: "Daily Standup - Sprint 14",
      source: "transcript",
      blockers_count: 3,
      risks_count: 2,
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Sync Équipe Dev",
      source: "slack",
      blockers_count: 1,
      risks_count: 1,
      created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Notes Sprint Planning",
      source: "file_upload",
      blockers_count: 4,
      risks_count: 3,
      created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ] : [
    {
      id: "1",
      title: "Daily Standup - Sprint 14",
      source: "transcript",
      blockers_count: 3,
      risks_count: 2,
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Dev Team Sync",
      source: "slack",
      blockers_count: 1,
      risks_count: 1,
      created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Sprint Planning Notes",
      source: "file_upload",
      blockers_count: 4,
      risks_count: 3,
      created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const criticityColor = {
    critique: "bg-red-50 border-red-200 text-red-700",
    haute: "bg-orange-50 border-orange-200 text-orange-700",
    moyenne: "bg-yellow-50 border-yellow-200 text-yellow-700",
    basse: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            {language === 'fr' ? 'Analyses & Signaux' : 'Analyses & Signals'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setIsRefreshing(true);
              await queryClient.invalidateQueries({ queryKey: ['analysisHistory'] });
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="text-slate-500 hover:text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {allItems.map((item, index) => {
              if (item.type === 'analysis') {
                const SourceIcon = sourceIcons[item.source] || FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer"
                    onClick={async () => {
                      sessionStorage.setItem("novaAnalysis", JSON.stringify(item.analysis_data || item));
                      window.location.href = createPageUrl("Results");
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        sessionStorage.setItem("novaAnalysis", JSON.stringify(item.analysis_data || item));
                        window.location.href = createPageUrl("Results");
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                          <SourceIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="flex items-center gap-1 text-xs text-slate-500">
                               <Clock className="w-3 h-3" />
                               {formatLocalTimeWithTZ(item.analysis_time || item.created_date, language === 'fr' ? 'fr-CA' : 'en-US')}
                             </span>
                            <Badge variant="outline" className="text-xs py-0">
                              {sourceLabels[item.source]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <AlertOctagon className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-slate-700">{item.blockers_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-slate-700">{item.risks_count}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                      </div>
                      </motion.div>
                      );
                      } else if (item.type === 'signal') {
               const isTeams = item.signalSource === 'teams';
               const isJira = item.signalSource === 'jira';
               const bgColor = isJira 
                 ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50'
                 : isTeams 
                 ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/50'
                 : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/50';
               const iconBg = isJira ? 'bg-emerald-100' : isTeams ? 'bg-purple-100' : 'bg-blue-100';
               const iconColor = isJira ? 'text-emerald-600' : isTeams ? 'text-purple-600' : 'text-blue-600';

               return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${bgColor}`}
                    onClick={() => {
                      setSelectedSignal(item);
                      setPatternDetails(item.patternDetails);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${iconBg}`}>
                          <Shield className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {item.probleme}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {formatLocalTimeWithTZ(item.created_date, language === 'fr' ? 'fr-CA' : 'en-US')}
                            </span>
                            <Badge variant="outline" className="text-xs py-0">
                              {isJira ? '#Jira' : isTeams ? '#Microsoft Teams' : '#Slack'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <Badge className={`text-xs border ${criticityColor[item.criticite] || criticityColor.basse}`}>
                          {item.criticite}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })}
          </div>

          {allItems.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">
                {language === 'fr' ? 'Aucune analyse pour le moment' : 'No analyses yet'}
              </p>
              <Link to={createPageUrl("Analysis")}>
                <Button variant="link" className="mt-2">
                  {language === 'fr' ? 'Lancer votre première analyse' : 'Run your first analysis'}
                </Button>
              </Link>
            </div>
          )}
          </CardContent>
          </Card>

          {/* Signal Details Modal */}
          <Dialog open={!!selectedSignal} onOpenChange={() => {
            setSelectedSignal(null);
            setContextualActions(null);
          }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  {selectedSignal?.probleme}
                </DialogTitle>
                <DialogDescription>
                  {language === 'fr' ? 'Détails et actions recommandées contextualisées' : 'Details and contextual recommended actions'}
                </DialogDescription>
              </DialogHeader>

              {selectedSignal && (
                <div className="space-y-6">
                  {/* Pattern Information */}
                  {patternDetails && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {language === 'fr' ? 'Pattern détecté' : 'Detected Pattern'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">{language === 'fr' ? 'Nom:' : 'Name:'}</span>{' '}
                          <span className="text-slate-600">{patternDetails.name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">{language === 'fr' ? 'Catégorie:' : 'Category:'}</span>{' '}
                          <Badge variant="outline">{patternDetails.pattern_id}</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contextual Actions - Loading or Display */}
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      {language === 'fr' ? 'Actions contextualisées' : 'Contextual Actions'}
                    </h3>

                    {loadingActions ? (
                      <div className="flex items-center gap-2 text-sm text-green-900">
                        <div className="w-4 h-4 rounded-full border-2 border-green-900 border-t-transparent animate-spin" />
                        {language === 'fr' ? 'Génération des actions...' : 'Generating actions...'}
                      </div>
                    ) : contextualActions ? (
                      <ul className="space-y-2">
                        {contextualActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          setLoadingActions(true);
                          // Add delay to avoid rate limiting
                          await new Promise(resolve => setTimeout(resolve, 5000));
                          try {
                            const prompt = `Tu es un Scrum Master expert. Voici un problème détecté dans l'équipe:

          Problème: ${selectedSignal.probleme}
          Pattern: ${patternDetails?.name || 'N/A'}
          Sévérité: ${selectedSignal.criticite}
          Personnes impliquées: ${[selectedSignal.assignee_first_name, selectedSignal.blocked_by_first_name, ...(selectedSignal.team_members_involved || [])].filter(Boolean).join(', ')}
          ${selectedSignal.jira_ticket_key ? `Ticket Jira: ${selectedSignal.jira_ticket_key}` : ''}

          Génère 3-4 actions spécifiques et contextualisées pour CETTE situation (pas des conseils génériques). Les actions doivent être:
          - Concrètes et immédiatement applicables
          - Basées sur le contexte du problème
          - Avec les prénoms des personnes impliquées si pertinent
          - Realistes et mesurables

          Retourne UNIQUEMENT une liste JSON d'actions, ex: ["Action 1", "Action 2"]`;

                            const result = await base44.integrations.Core.InvokeLLM({
                              prompt,
                              response_json_schema: {
                                type: 'object',
                                properties: {
                                  actions: {
                                    type: 'array',
                                    items: { type: 'string' }
                                  }
                                }
                              }
                            });

                            setContextualActions(result?.actions || []);
                          } catch (error) {
                            console.error('Error generating actions:', error);
                          } finally {
                            setLoadingActions(false);
                          }
                        }}
                      >
                        {language === 'fr' ? '✨ Générer actions contextualisées' : '✨ Generate Contextual Actions'}
                      </Button>
                    )}
                  </div>

                  {/* Quick Win */}
                  {patternDetails?.quick_win && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        {language === 'fr' ? '⚡ Quick Win (≤48h)' : '⚡ Quick Win (≤48h)'}
                      </h3>
                      <p className="text-sm text-blue-900">{patternDetails.quick_win}</p>
                    </div>
                  )}

                  {/* Severity */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-100">
                    <span className="font-medium text-slate-700">
                      {language === 'fr' ? 'Sévérité:' : 'Severity:'}
                    </span>
                    <Badge className={criticityColor[selectedSignal?.criticite] || criticityColor.basse}>
                      {selectedSignal?.criticite}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          </motion.div>
          );
          }