import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";

import QuickStats from "@/components/dashboard/QuickStats";
import SprintPerformanceChart from "@/components/dashboard/SprintPerformanceChart";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import KeyRecommendations from "@/components/dashboard/KeyRecommendations";
import TimePeriodSelector from "@/components/dashboard/TimePeriodSelector";
import WorkspaceSelector from "@/components/dashboard/WorkspaceSelector";

import {
  Mic,
  Sparkles,
  ArrowRight,
  Calendar,
  Clock,
  Loader2
} from "lucide-react";

export default function DashboardCommonUsers() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [sprintContext, setSprintContext] = useState(null);
  const [allAnalysisHistory, setAllAnalysisHistory] = useState([]);

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        navigate(createPageUrl("Home"));
        return;
      }

      const currentUser = await base44.auth.me();
      
      // Role verification - only 'user' can access
      if (currentUser?.role !== 'user') {
        navigate(createPageUrl("Home"));
        return;
      }

      setUser(currentUser);

      // Load sprint context
      const activeSprints = await base44.entities.SprintContext.filter({ is_active: true });
      if (activeSprints.length > 0) {
        setSprintContext(activeSprints[0]);
      }

      // Load analysis history
      const analyses = await base44.entities.AnalysisHistory.list('-created_date', 100);
      setAllAnalysisHistory(analyses);
      
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Filter analysis history based on selected period and workspace
  const analysisHistory = allAnalysisHistory.filter((analysis) => {
    const analysisDate = new Date(analysis.created_date);
    const matchesPeriod = selectedPeriod ? (analysisDate >= new Date(selectedPeriod.start) && analysisDate <= new Date(new Date(selectedPeriod.end).setHours(23, 59, 59, 999))) : true;
    const matchesWorkspace = selectedWorkspaceId ? (analysis.jira_project_selection_id === selectedWorkspaceId) : true;
    return matchesPeriod && matchesWorkspace;
  });

  const sprintInfo = sprintContext ? {
    name: sprintContext.sprint_name,
    daysRemaining: Math.max(0, Math.ceil((new Date(sprintContext.end_date) - new Date()) / (1000 * 60 * 60 * 24))),
    deliveryMode: sprintContext.delivery_mode,
    throughputPerWeek: sprintContext.throughput_per_week
  } : {
    name: "Sprint en cours",
    daysRemaining: 4,
    deliveryMode: "scrum",
    throughputPerWeek: null
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        
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
                    {t('sprintOverview')}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {sprintInfo.deliveryMode === "scrum" && sprintInfo.daysRemaining > 0 && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{sprintInfo.daysRemaining}</span> {t('daysLeftInSprint')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Workspace and Period Selectors */}
              <div className="flex justify-end gap-3">
                <WorkspaceSelector 
                  activeWorkspaceId={selectedWorkspaceId}
                  onWorkspaceChange={(id) => setSelectedWorkspaceId(id)}
                />
                <TimePeriodSelector
                  deliveryMode={sprintInfo.deliveryMode}
                  onPeriodChange={(period) => {
                    setSelectedPeriod(period);
                    sessionStorage.setItem("selectedPeriod", JSON.stringify(period));
                  }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            {(!selectedPeriod || analysisHistory.length > 0) && (
              <QuickStats analysisHistory={analysisHistory} />
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Empty State */}
        {selectedPeriod && analysisHistory.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Aucune analyse pour cette période
            </h3>
            <p className="text-slate-600">
              Aucune donnée disponible du {new Date(selectedPeriod.start).toLocaleDateString('fr-FR')} au {new Date(selectedPeriod.end).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        {/* Content */}
        {(!selectedPeriod || analysisHistory.length > 0) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <SprintPerformanceChart analysisHistory={analysisHistory} />
              <KeyRecommendations analysisHistory={analysisHistory} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <IntegrationStatus />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}