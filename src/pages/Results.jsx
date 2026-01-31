import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
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
  const { t, language } = useLanguage();
  const [analysis, setAnalysis] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null); // "blockers" | "risks" | null

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem("novaAnalysis");
    if (storedAnalysis) {
      const parsedAnalysis = JSON.parse(storedAnalysis);
      // Add source info from sessionStorage if available
      const sourceInfo = sessionStorage.getItem("analysisSource");
      if (sourceInfo) {
        const { url, name } = JSON.parse(sourceInfo);
        parsedAnalysis.sourceUrl = url;
        parsedAnalysis.sourceName = name;
      }
      setAnalysis(parsedAnalysis);
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
            {language === 'fr' ? 'Retour au Dashboard' : 'Back to Dashboard'}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-emerald-50 border-emerald-200 text-emerald-700">
                   <CheckCircle2 className="w-3 h-3 mr-1" />
                   {language === 'fr' ? 'Analyse Complète' : 'Analysis Complete'}
                </Badge>
                {analysis.posture && (
                  <PostureIndicator postureId={analysis.posture} size="compact" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {language === 'fr' ? 'Résultats de l\'Analyse' : 'Analysis Results'}
              </h1>
            </div>
            
            <Link to={createPageUrl("Analysis")}>
              <Button variant="outline" className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Lancer une nouvelle simulation' : 'Run a New Simulation'}
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

        {/* Summary Stats - Clickable */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div 
            onClick={() => setExpandedSection(expandedSection === "blockers" ? null : "blockers")}
            className="cursor-pointer"
          >
            <MetricCard
              icon={AlertOctagon}
              label="Blockers Detected"
              value={analysis.blockers?.length || 0}
              color="blue"
              delay={0.1}
              active={expandedSection === "blockers"}
            />
          </div>
          <div 
            onClick={() => setExpandedSection(expandedSection === "risks" ? null : "risks")}
            className="cursor-pointer"
          >
            <MetricCard
              icon={ShieldAlert}
              label="Risks Identified"
              value={analysis.risks?.length || 0}
              color="amber"
              delay={0.2}
              active={expandedSection === "risks"}
            />
          </div>
        </div>

        {/* Expanded Details Inline */}
        {expandedSection === "blockers" && analysis.blockers && analysis.blockers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 rounded-2xl bg-blue-50/50 border border-blue-200"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-blue-600" />
              {language === 'fr' ? 'Détails des Blockers' : 'Blocker Details'}
            </h3>
            <div className="space-y-3">
              {analysis.blockers.map((blocker, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border border-blue-100">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-slate-900">{blocker.member}</span>
                    <Badge className={
                      blocker.urgency === "high" ? "bg-red-100 text-red-700" :
                      blocker.urgency === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    }>
                      {blocker.urgency}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{blocker.issue}</p>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Action:</span> {blocker.action}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {expandedSection === "risks" && analysis.risks && analysis.risks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 rounded-2xl bg-amber-50/50 border border-amber-200"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              {language === 'fr' ? 'Détails des Risques' : 'Risk Details'}
            </h3>
            <div className="space-y-3">
              {analysis.risks.map((risk, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border border-amber-100">
                  <p className="font-medium text-slate-900 mb-2">{risk.description}</p>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">Impact:</span> {risk.impact}
                  </p>
                  <p className="text-sm text-amber-700">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100"
          >
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">
              {language === 'fr' ? 'Résumé de la Réunion' : 'Meeting Summary'}
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
               {language === 'fr' ? 'Blockers & Problèmes Détectés' : 'Detected Blockers & Issues'}
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
               {language === 'fr' ? 'Risques Identifiés' : 'Identified Risks'}
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
          <RecommendationCard 
            recommendations={analysis.recommendations}
            sourceUrl={analysis.sourceUrl}
            sourceName={analysis.sourceName}
          />
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
              {language === 'fr' ? 'Veux-tu l\'Analyse en Temps Réel ?' : 'Want Real-Time Analysis?'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              {language === 'fr' ? 'Dans la version complète, Nova se connecte directement à tes outils et fournit des insights automatiquement, sans entrée manuelle.' : 'In the full version, Nova connects directly to your tools and provides insights automatically, without any manual input.'}
            </p>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              {language === 'fr' ? 'Bientôt : Jira · Azure DevOps · Teams · Zoom' : 'Coming Soon: Jira · Azure DevOps · Teams · Zoom'}
            </Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
}