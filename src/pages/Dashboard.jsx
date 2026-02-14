import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";

import QuickStats from "@/components/dashboard/QuickStats";
import SprintPerformanceChart from "@/components/dashboard/SprintPerformanceChart";
import RecentAnalyses from "@/components/dashboard/RecentAnalyses";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import KeyRecommendations from "@/components/dashboard/KeyRecommendations";
import SprintHealthCard from "@/components/dashboard/SprintHealthCard";
import TeamConfigOnboarding from "@/components/onboarding/TeamConfigOnboarding";
import MultiProjectAlert from "@/components/dashboard/MultiProjectAlert";
import MetricsRadarCard from "@/components/nova/MetricsRadarCard";
import RealityMapCard from "@/components/nova/RealityMapCard";
import TimePeriodSelector from "@/components/dashboard/TimePeriodSelector";
import WorkspaceSelector from "@/components/dashboard/WorkspaceSelector";

import {
  Mic,
  Sparkles,
  ArrowRight,
  Zap,
  Calendar,
  Clock,
  Loader2,
  TrendingUp } from
"lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [multiProjectAlert, setMultiProjectAlert] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  const [sprintContext, setSprintContext] = useState(null);
  const [gdprSignals, setGdprSignals] = useState([]);

  // Fetch GDPR signals from last 7 days
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const markers = await base44.entities.GDPRMarkers.list('-created_date', 100);
        const recentMarkers = markers.filter((m) => new Date(m.created_date) >= sevenDaysAgo);
        setGdprSignals(recentMarkers);
      } catch (error) {
        console.error("Erreur chargement signaux GDPR:", error);
      }
    };

    fetchSignals();
  }, []);

  // Check authentication (temporarily disabled for demo)
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Charger contexte sprint actif
        const activeSprints = await base44.entities.SprintContext.filter({ is_active: true });
        if (activeSprints.length > 0) {
          setSprintContext(activeSprints[0]);
        }

        // Vérifier onboarding
        const teamConfigs = await base44.entities.TeamConfiguration.list();
        if (teamConfigs.length === 0 || !teamConfigs[0].onboarding_completed) {
          setShowOnboarding(true);
        }

        // Vérifier alertes multi-projets en attente
        const pendingAlerts = await base44.entities.MultiProjectDetectionLog.filter({
          admin_response: "pending"
        });
        if (pendingAlerts.length > 0) {
          const latest = pendingAlerts[pendingAlerts.length - 1];
          setMultiProjectAlert({
            confidence: latest.detection_score,
            signals: latest.weighted_signals,
            log_id: latest.id
          });
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Fetch analysis history
  const { data: allAnalysisHistory = [] } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => base44.entities.AnalysisHistory.list('-created_date', 100),
    enabled: !isLoading
  });

  // Filter analysis history based on selected period and workspace
  const analysisHistory = allAnalysisHistory.filter((analysis) => {
    // Filter by workspace
    if (selectedWorkspace && analysis.jira_project_selection_id !== selectedWorkspace) {
      return false;
    }
    
    // Filter by period
    if (selectedPeriod) {
      const analysisDate = new Date(analysis.created_date);
      const startDate = new Date(selectedPeriod.start);
      const endDate = new Date(selectedPeriod.end);
      endDate.setHours(23, 59, 59, 999); // Include end of day
      return analysisDate >= startDate && analysisDate <= endDate;
    }
    
    return true;
  });

  // Check for stored analysis from session and filter by period
  useEffect(() => {
    const stored = sessionStorage.getItem("novaAnalysis");
    if (stored) {
      const parsedAnalysis = JSON.parse(stored);
      // Add source info from sessionStorage if available
      const sourceInfo = sessionStorage.getItem("analysisSource");
      if (sourceInfo) {
        const { url, name } = JSON.parse(sourceInfo);
        parsedAnalysis.sourceUrl = url;
        parsedAnalysis.sourceName = name;
      }

      // Filter by selected period if one is set
      if (selectedPeriod && parsedAnalysis.created_date) {
        const analysisDate = new Date(parsedAnalysis.created_date);
        const startDate = new Date(selectedPeriod.start);
        const endDate = new Date(selectedPeriod.end);
        endDate.setHours(23, 59, 59, 999);

        if (analysisDate >= startDate && analysisDate <= endDate) {
          setLatestAnalysis(parsedAnalysis);
        } else {
          setLatestAnalysis(null);
        }
      } else {
        setLatestAnalysis(parsedAnalysis);
      }
    }
  }, [selectedPeriod]);

  // Calculate sprint info from real data
  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const sprintInfo = sprintContext ? {
    name: sprintContext.sprint_name,
    daysRemaining: calculateDaysRemaining(sprintContext.end_date),
    deliveryMode: sprintContext.delivery_mode,
    throughputPerWeek: sprintContext.throughput_per_week
  } : {
    name: null, // Will be set below based on delivery mode
    daysRemaining: 4,
    deliveryMode: "scrum",
    throughputPerWeek: null
  };

  // Set generic name for dummy data based on delivery mode
  if (!sprintContext) {
    sprintInfo.name = sprintInfo.deliveryMode === "kanban" ? "En cours" : "Sprint en cours";
  }

  // Simulated sprint health data (will come from Jira integration)
  // Only show simulated data if there are analyses in the period
  const sprintHealth = !selectedPeriod || analysisHistory.length > 0 ? {
    sprint_name: "Sprint 14",
    sprint_start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    risk_score: analysisHistory.length > 0 ?
    Math.min(100, analysisHistory.reduce((sum, a) => sum + (a.blockers_count || 0), 0) * 15 +
    analysisHistory.reduce((sum, a) => sum + (a.risks_count || 0), 0) * 10) :
    45,
    status: analysisHistory.length > 0 &&
    analysisHistory.reduce((sum, a) => sum + (a.blockers_count || 0), 0) >= 3 ?
    "at_risk" : "healthy",
    wip_count: 6,
    wip_historical_avg: 5,
    tickets_in_progress_over_3d: analysisHistory.length > 0 ? Math.min(3, analysisHistory[0]?.blockers_count || 0) : 1,
    blocked_tickets_over_48h: analysisHistory.length > 0 ? Math.min(2, analysisHistory[0]?.risks_count || 0) : 0,
    alert_sent: false,
    recommendations: latestAnalysis?.recommendations?.slice(0, 1) || ["Réduire le WIP et prioriser les tickets bloqués"],
    problematic_tickets: [
    { ticket_id: "US-123", title: "Intégration API paiement", status: "in_progress", days_in_status: 4, assignee: "Marie D." },
    { ticket_id: "BUG-456", title: "Fix timeout base de données", status: "blocked", days_in_status: 2, assignee: "Jean P." }]

  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Onboarding Modal */}
      <TeamConfigOnboarding
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)} />


      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>

            {/* Welcome Banner */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('Your AI Agile Expert')}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-indigo-50 border-indigo-200 text-indigo-700">
                      <Calendar className="w-3 h-3 mr-1" />
                      {sprintInfo.name}
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    {t('welcomeBackTitle')}, {user?.full_name?.split(' ')[0] || 'there'}! 👋
                  </h1>
                  <p className="text-slate-600 mt-2 text-lg">
                    {sprintInfo.deliveryMode === "kanban" ?
                    "Voici votre vue d'ensemble et vos dernières analyses." :
                    t('sprintOverview')}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                {sprintInfo.deliveryMode === "scrum" && sprintInfo.daysRemaining > 0 &&
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{sprintInfo.daysRemaining}</span> {t('daysLeftInSprint')}
                    </span>
                  </div>
                  }
                {sprintInfo.deliveryMode === "kanban" && sprintInfo.throughputPerWeek &&
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{sprintInfo.throughputPerWeek}</span> tickets/semaine
                    </span>
                  </div>
                  }
                  <Link to={createPageUrl("Analysis")}>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">

                      <Mic className="w-4 h-4 mr-2" />
                      {t('newAnalysis')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Time Period Selector */}
              <div className="flex justify-end gap-3">
              <WorkspaceSelector 
                activeWorkspaceId={selectedWorkspace}
                onWorkspaceChange={(workspaceId) => {
                  setSelectedWorkspace(workspaceId || null);
                }}
              />
              <TimePeriodSelector
                  deliveryMode={sprintInfo.deliveryMode}
                  onPeriodChange={(period) => {
                    setSelectedPeriod(period);
                    sessionStorage.setItem("selectedPeriod", JSON.stringify(period));
                    console.log("Period changed:", period);
                  }} />

              </div>
            </div>

            {/* Quick Stats - Only show if data in period */}
            {(!selectedPeriod || analysisHistory.length > 0) &&
            <QuickStats analysisHistory={analysisHistory} />
            }
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Multi-Project Alert */}
        {multiProjectAlert &&
        <div className="mb-6">
            <MultiProjectAlert
            detectionData={multiProjectAlert}
            onConfirm={() => {
              setMultiProjectAlert(null);
              window.location.reload();
            }}
            onDismiss={() => setMultiProjectAlert(null)} />

          </div>
        }

        {/* Empty State for No Data in Period */}
        {selectedPeriod && analysisHistory.length === 0 &&
        <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Aucune analyse pour cette période
            </h3>
            <p className="text-slate-600 mb-6">
              Aucune donnée disponible du {new Date(selectedPeriod.start).toLocaleDateString('fr-FR')} au {new Date(selectedPeriod.end).toLocaleDateString('fr-FR')}
            </p>
            <Link to={createPageUrl("Analysis")}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Mic className="w-4 h-4 mr-2" />
                Créer une analyse
              </Button>
            </Link>
          </div>
        }

        {/* Show content only if there are analyses in the period */}
        {(!selectedPeriod || analysisHistory.length > 0) &&
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sprint Health Card - Drift Detection */}
              {sprintHealth &&
            <SprintHealthCard
              sprintHealth={{
                sprint_name: "Sprint 14",
                wip_count: 8,
                wip_historical_avg: 5,
                tickets_in_progress_over_3d: 3 + gdprSignals.filter((s) => s.criticite === 'critique' || s.criticite === 'haute').length,
                blocked_tickets_over_48h: 2 + gdprSignals.filter((s) => s.criticite === 'moyenne').length,
                sprint_day: 5,
                historical_sprints_count: 4,
                drift_acknowledged: false,
                problematic_tickets: sprintHealth.problematic_tickets,
                gdprSignals: gdprSignals
              }}
              onAcknowledge={() => console.log("Drift acknowledged")}
              onReviewSprint={() => console.log("Review sprint")} />

            }

              {/* Actionable Metrics Radar */}
              {analysisHistory.length > 0 &&
            <MetricsRadarCard
              metricsData={{
                velocity: { current: 45, trend: "up", change: 20 },
                flow_efficiency: { current: 28, target: 55 },
                cycle_time: { current: 9, target: 4 },
                throughput: { current: 6, variance: 0.3 },
                deployment_frequency: { current: 1, target: 3 },
                data_days: 14
              }}
              historicalData={{
                sprints_count: 1,
                data_days: 7,
                is_audit_phase: false,
                is_new_team: true
              }}
              integrationStatus={{
                jira_connected: true,
                slack_connected: false,
                dora_pipeline: false,
                flow_metrics_available: true
              }}
              onDiscussWithCoach={(lever) => console.log("Discuss lever:", lever)}
              onApplyLever={(lever) => console.log("Apply lever:", lever)} />

            }

              {/* Organizational Reality Engine */}
              {analysisHistory.length > 0 &&
            <RealityMapCard
              flowData={{
                assignee_changes: [
                { person: "Mary", count: 42 },
                { person: "John", count: 12 }],

                mention_patterns: [
                { person: "Mary", type: "prioritization", count: 35 },
                { person: "Dave", type: "unblocking", count: 19 }],

                blocked_resolutions: [
                { person: "Dave", count: 19 }],

                data_days: 30
              }}
              flowMetrics={{
                blocked_tickets_over_5d: 12,
                avg_cycle_time: 8.2,
                avg_wait_time_percent: 65,
                reopened_tickets: 8,
                total_tickets: 100,
                data_days: 30
              }}
              onDiscussSignals={() => console.log("Discuss systemic signals with stakeholders")} />

            }
            
            {/* Sprint Performance Chart */}
            <SprintPerformanceChart analysisHistory={analysisHistory} />
            
            {/* Key Recommendations */}
            <KeyRecommendations
              latestAnalysis={latestAnalysis}
              sourceUrl={latestAnalysis?.sourceUrl}
              sourceName={latestAnalysis?.sourceName} />

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Analyses */}
            <RecentAnalyses analyses={analysisHistory} />
            
            {/* Integration Status */}
            <IntegrationStatus />
          </div>
        </div>
        }

{(userRole === 'admin' || userRole === 'contributor') && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.5 }}
    className="mt-8">

    <div className="bg-blue-800 p-6 rounded-2xl from-slate-900 to-slate-800 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
          </h3>
          <p className="text-slate-400 max-w-lg">
            {t('importDataDescription')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Settings")}>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Zap className="w-4 h-4 mr-2" />
              {t('connectSlack')}
            </Button>
          </Link>
          <Link to={createPageUrl("Analysis")}>
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              {t('startAnalysis')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </motion.div>
)}
      </div>
    </div>);

}