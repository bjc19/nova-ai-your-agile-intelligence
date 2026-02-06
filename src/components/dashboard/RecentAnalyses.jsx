import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
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

const sourceIcons = {
  slack: MessageSquare,
  file_upload: Upload,
  transcript: FileText,
  jira: AlertOctagon,
};

export default function RecentAnalyses({ analyses = [] }) {
  const { language } = useLanguage();
  const [gdprSignals, setGdprSignals] = useState([]);
  const [teamsInsights, setTeamsInsights] = useState([]);
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const allMarkers = await base44.entities.GDPRMarkers.list('-created_date', 50);
        
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

        setGdprSignals(slackMarkers);
        setTeamsInsights([...teamsMarkers, ...jiraMarkers]);
      } catch (error) {
        console.error("Erreur chargement signaux:", error);
      }
    };

    fetchSignals();
  }, []);

  // Combine and sort analyses and signals chronologically
  useEffect(() => {
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

    const displayAnalyses = analyses.length > 0 ? analyses.map(a => ({ ...a, type: 'analysis' })) : sampleAnalyses;
    
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {language === 'fr' ? 'Analyses & Signaux' : 'Analyses & Signals'}
            </CardTitle>
            <Link to={createPageUrl("Analysis")}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                {language === 'fr' ? 'Nouvelle analyse' : 'New Analysis'}
              </Button>
            </Link>
          </div>
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
                    onClick={() => {
                      if (item.analysis_data) {
                        sessionStorage.setItem("novaAnalysis", JSON.stringify(item.analysis_data));
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
                              {format(new Date(item.created_date), "MMM d, h:mm a")}
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
                   className={`p-4 rounded-xl border transition-all ${bgColor}`}
                 >
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-3">
                       <div className={`p-2 rounded-lg ${iconBg}`}>
                         <Shield className={`w-4 h-4 ${iconColor}`} />
                       </div>
                       <div>
                         <h4 className="font-medium text-slate-900">
                           {item.probleme}
                         </h4>
                         <div className="flex items-center gap-3 mt-1 flex-wrap">
                           <span className="flex items-center gap-1 text-xs text-slate-500">
                             <Clock className="w-3 h-3" />
                             {format(new Date(item.created_date), "MMM d, h:mm a")}
                           </span>
                           <Badge variant="outline" className="text-xs py-0">
                             {isJira ? '#Jira' : isTeams ? '#Microsoft Teams' : '#Slack'}
                           </Badge>
                         </div>
                       </div>
                     </div>
                     <Badge className={`shrink-0 text-xs border ${criticityColor[item.criticite] || criticityColor.basse}`}>
                       {item.criticite}
                     </Badge>
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
    </motion.div>
  );
}