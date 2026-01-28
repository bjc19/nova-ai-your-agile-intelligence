import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/nova/MetricCard";
import { 
  Mic, 
  AlertOctagon, 
  Clock, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  MessageSquare
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Demo Version – Simulation Mode
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
              Nova
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}AI Scrum Master
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Your intelligent assistant that analyzes Daily Scrums, detects blockers, 
              and provides actionable insights to keep your team moving forward.
            </p>
            
            <Link to={createPageUrl("Analysis")}>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <Mic className="w-5 h-5 mr-2" />
                Simulate a Daily Scrum
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <p className="mt-4 text-sm text-slate-500">
              Experience how Nova analyzes meetings using sample data
            </p>
          </motion.div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Simulated Metrics
          </h2>
          <p className="text-slate-400 text-sm">
            What Nova typically detects in a single sprint
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <MetricCard
            icon={AlertOctagon}
            label="Detected Blockers"
            value="3"
            color="blue"
            delay={0.3}
          />
          <MetricCard
            icon={Clock}
            label="Estimated Time Saved"
            value="5h"
            color="emerald"
            delay={0.4}
          />
          <MetricCard
            icon={ShieldAlert}
            label="Risks Identified"
            value="2"
            color="amber"
            delay={0.5}
          />
        </div>
      </div>

      {/* Features Preview */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            What Nova Does
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Real-Time Analysis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Joins your Daily Scrums via Teams or Zoom and analyzes conversations as they happen.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Instant Insights</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Detects blockers, dependencies, and risks immediately, suggesting actions in real-time.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Continuous Learning</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connects to Jira, Azure DevOps, and Confluence to provide context-aware recommendations.
              </p>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center">
              <span className="font-medium text-slate-700">Coming soon:</span> Direct integrations with Jira, Azure DevOps, Microsoft Teams, and Zoom
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}