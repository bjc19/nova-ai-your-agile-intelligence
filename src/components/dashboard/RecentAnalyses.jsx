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

  const fetchSignals = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [allMarkers, allPatterns] = await Promise.all([
        base44.entities.GDPRMarkers.list('-created_date', 50),
        base44.entities.AntiPattern.filter({ is_active: true })
      ]);
      
      const slackMarkers = allMarkers.filter(m => 
        m.detection_source === 'slack_hourly' || m.detection_source === 'slack_daily' || m.detection_source === 'manual_trigger'
      ).filter(m => new Date(m.created_date) >= sevenDaysAgo);
      
      const teamsMarkers = allMarkers.filter(m => 
        m.detection_source === 'teams_daily'
      ).filter(m => new Date(m.created_date) >= sevenDaysAgo);

      const jiraMarkers = allMarkers.filter(m => 
        m.detection_source === 'jira_backlog'
      ).filter(m => new Date(m.created_date) >= sevenDaysAgo);

      const enrichMarkers = (markers) => 
        markers.map(m => ({
          ...m,
          patternDetails: allPatterns.find(p => p.pattern_id === m.pattern_id)
        }));

      setGdprSignals(enrichMarkers(slackMarkers));
      setTeamsInsights([...enrichMarkers(teamsMarkers), ...enrichMarkers(jiraMarkers)]);
      console.log('Signals fetched and updated');
    } catch (error) {
      console.error("Erreur chargement signaux:", error);
    }
  };

  useEffect(() => {
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

  return null;
        <CardHeader className="pb-3 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            {language === 'fr' ? 'Analyses & Signaux' : 'Analyses & Signals'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setIsRefreshing(true);
              console.log('Refresh clicked');
              try {
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['analysisHistory'] }),
                  fetchSignals()
                ]);
                // Wait for React Query to refetch
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('Refresh complete');
              } catch (error) {
                console.error('Refresh error:', error);
              }
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="text-slate-500 hover:text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          }