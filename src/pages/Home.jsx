import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import QuickStats from "@/components/dashboard/QuickStats";
import SprintPerformanceChart from "@/components/dashboard/SprintPerformanceChart";
import RecentAnalyses from "@/components/dashboard/RecentAnalyses";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import KeyRecommendations from "@/components/dashboard/KeyRecommendations";

import { 
  Mic, 
  Sparkles,
  ArrowRight,
  Zap,
  Calendar,
  Clock
} from "lucide-react";

export default function Home() {
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  // Fetch analysis history
  const { data: analysisHistory = [], isLoading } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => base44.entities.AnalysisHistory.list('-created_date', 20),
  });

  // Check for stored analysis from session
  useEffect(() => {
    const stored = sessionStorage.getItem("novaAnalysis");
    if (stored) {
      setLatestAnalysis(JSON.parse(stored));
    }
  }, []);

  // Get current sprint info (simulated)
  const sprintInfo = {
    name: "Sprint 14",
    daysRemaining: 4,
    progress: 65,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered Scrum Master
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-indigo-50 border-indigo-200 text-indigo-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    {sprintInfo.name}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}! 👋
                </h1>
                <p className="text-slate-600 mt-2 text-lg">
                  Here's your sprint overview and latest insights.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{sprintInfo.daysRemaining}</span> days left in sprint
                  </span>
                </div>
                <Link to={createPageUrl("Analysis")}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    New Analysis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats analysisHistory={analysisHistory} />
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sprint Performance Chart */}
            <SprintPerformanceChart analysisHistory={analysisHistory} />
            
            {/* Key Recommendations */}
            <KeyRecommendations latestAnalysis={latestAnalysis} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Analyses */}
            <RecentAnalyses analyses={analysisHistory} />
            
            {/* Integration Status */}
            <IntegrationStatus />
          </div>
        </div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready for your Daily Scrum?
                </h3>
                <p className="text-slate-400 max-w-lg">
                  Import data from Slack, upload meeting transcripts, or paste your notes directly. Nova will analyze and provide actionable insights.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to={createPageUrl("Settings")}>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Zap className="w-4 h-4 mr-2" />
                    Connect Slack
                  </Button>
                </Link>
                <Link to={createPageUrl("Analysis")}>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100">
                    Start Analysis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}