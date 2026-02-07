import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Mic,
  Shield,
  Zap,
  TrendingUp,
  Users,
  CheckCircle2,
  Play,
  MessageSquare,
  BarChart3,
  AlertTriangle
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
      
      // Redirect authenticated users to Dashboard
      if (authenticated) {
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: AlertTriangle,
      title: "Blocker Detection",
      description: "Automatically identify blockers and impediments from standup conversations",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Shield,
      title: "Risk Analysis",
      description: "Proactively surface risks before they impact your sprint delivery",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: TrendingUp,
      title: "Sprint Insights",
      description: "Track trends and patterns across your daily standups over time",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: Zap,
      title: "Actionable Recommendations",
      description: "Get AI-powered suggestions to unblock your team and accelerate delivery",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI-Powered Scrum Intelligence
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
              Turn Daily Standups into{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Actionable Insights
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Nova analyzes your team's standup conversations to detect blockers, identify risks, and provide recommendations — so you can focus on delivering value.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl("Demo")}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Now — Free Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="px-8 py-6 text-lg rounded-xl"
              >
                Sign In
              </Button>
            </div>

            <p className="text-sm text-slate-500 mt-4">
              No registration required to try • 2 free demo analyses
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Everything Your Scrum Master Needs
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Nova understands the nuances of agile ceremonies and provides intelligent insights.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-slate-200">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How Nova Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: MessageSquare,
                title: "Import Your Standup",
                description: "Connect Slack, upload transcripts, or paste your standup notes directly.",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "AI Analysis",
                description: "Nova processes the conversation to identify blockers, risks, and dependencies.",
              },
              {
                step: "3",
                icon: BarChart3,
                title: "Get Insights",
                description: "Receive actionable recommendations and track trends across sprints.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="relative text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10 hidden md:block" />
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Standups?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Try Nova for free — no registration required. See how AI can help your team deliver faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={createPageUrl("Demo")}>
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8">
                <Play className="w-4 h-4 mr-2" />
                Start Free Demo
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}