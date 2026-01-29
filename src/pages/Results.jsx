import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AnalysisTable from "@/components/nova/AnalysisTable";
import RecommendationCard from "@/components/nova/RecommendationCard";
import MetricCard from "@/components/nova/MetricCard";
import PostureIndicator from "@/components/nova/PostureIndicator";
import { POSTURES } from "@/components/nova/PostureEngine";
import { 
  ArrowLeft, 
  RotateCcw,
  AlertOctagon,
  ShieldAlert,
  FileText,
  CheckCircle2
} from "lucide-react";

export default function Results() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem("novaAnalysis");
    if (storedAnalysis) {
      setAnalysis(JSON.parse(storedAnalysis));
    } else {
      navigate(createPageUrl("Analysis"));
    }
  }, [navigate]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link 
            to={createPageUrl("Home")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-emerald-50 border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Analysis Complete
                </Badge>
                {analysis.posture && (
                  <PostureIndicator postureId={analysis.posture} size="compact" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Analysis Results
              </h1>
            </div>
            
            <Link to={createPageUrl("Analysis")}>
              <Button variant="outline" className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                Run a New Simulation
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Posture Context */}
        {analysis.posture && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <PostureIndicator postureId={analysis.posture} showDetails={true} />
          </motion.div>
        )}

        {/* Summary Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <MetricCard
            icon={AlertOctagon}
            label="Blockers Detected"
            value={analysis.blockers?.length || 0}
            color="blue"
            delay={0.1}
          />
          <MetricCard
            icon={ShieldAlert}
            label="Risks Identified"
            value={analysis.risks?.length || 0}
            color="amber"
            delay={0.2}
          />
        </div>

        {/* Summary */}
        {analysis.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100"
          >
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">
              Meeting Summary
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {analysis.summary}
            </p>
          </motion.div>
        )}

        {/* Blockers Table */}
        {analysis.blockers && analysis.blockers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-blue-600" />
              Detected Blockers & Issues
            </h2>
            <AnalysisTable data={analysis.blockers} />
          </motion.div>
        )}

        {/* Risks Section */}
        {analysis.risks && analysis.risks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Identified Risks
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.risks.map((risk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="p-5 rounded-xl border border-slate-200 bg-white"
                >
                  <p className="font-medium text-slate-900 mb-2">{risk.description}</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">Impact:</span> {risk.impact}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <RecommendationCard recommendations={analysis.recommendations} />
        )}

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800">
            <h3 className="text-xl font-semibold text-white mb-2">
              Want Real-Time Analysis?
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              In the full version, Nova connects directly to your tools and provides insights automatically, without any manual input.
            </p>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              Coming Soon: Jira · Azure DevOps · Teams · Zoom
            </Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
}