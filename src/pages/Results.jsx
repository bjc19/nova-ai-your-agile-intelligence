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
import GDPRMarkersSection from "@/components/nova/GDPRMarkersSection";
import { POSTURES } from "@/components/nova/PostureEngine";
import { invokeLLMWithAutoTranslate } from "@/components/nova/LLMTranslator";
import { 
        ArrowLeft, 
        RotateCcw,
        AlertOctagon,
        ShieldAlert,
        FileText,
        CheckCircle2,
        Loader2
      } from "lucide-react";

export default function Results() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [analysis, setAnalysis] = useState(null);
        const [translationComplete, setTranslationComplete] = useState(language !== 'fr');
        const [expandedSection, setExpandedSection] = useState(null); // "blockers" | "risks" | null
  const [riskUrgencyFilter, setRiskUrgencyFilter] = useState(null);

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

          // Display results immediately, translate in background if needed
          setAnalysis(parsedAnalysis);

          // Translate all LLM content if language is French
          if (language === 'fr') {
            const translateContentIfNeeded = async () => {
              // Add delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              // Batch translate all texts in one LLM call
              const textsToTranslate = [];

              // Collect all texts
              if (parsedAnalysis.summary) textsToTranslate.push(parsedAnalysis.summary);
              if (parsedAnalysis.blockers) {
                parsedAnalysis.blockers.forEach(b => {
                  textsToTranslate.push(b.issue, b.action);
                });
              }
              if (parsedAnalysis.risks) {
                parsedAnalysis.risks.forEach(r => {
                  textsToTranslate.push(r.description, r.impact, r.mitigation);
                });
              }

              if (textsToTranslate.length > 0) {
                const prompt = `Traduis TOUS ces textes en français de manière concise et naturelle. Réponds EN FRANÇAIS UNIQUEMENT:\n\n${textsToTranslate.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}`;
                const result = await invokeLLMWithAutoTranslate(
                  prompt,
                  {
                    type: "object",
                    properties: {
                      translations: { type: "array", items: { type: "string" } }
                    }
                  },
                  language
                );

                // Map translations back
                let idx = 0;
                if (parsedAnalysis.summary) parsedAnalysis.summary = result.translations[idx++];
                if (parsedAnalysis.blockers) {
                  parsedAnalysis.blockers = parsedAnalysis.blockers.map(b => ({
                    ...b,
                    issue: result.translations[idx++],
                    action: result.translations[idx++]
                  }));
                }
                if (parsedAnalysis.risks) {
                  parsedAnalysis.risks = parsedAnalysis.risks.map(r => ({
                    ...r,
                    description: result.translations[idx++],
                    impact: result.translations[idx++],
                    mitigation: result.translations[idx++]
                  }));
                }

                // Update with translated content
                setAnalysis(parsedAnalysis);
                setTranslationComplete(true);
                }
                };

                translateContentIfNeeded().catch(error => {
                // Gracefully handle translation errors (e.g., rate limits)
                console.log('Background translation skipped:', error?.message);
                setTranslationComplete(true);
                });
                } else {
                setTranslationComplete(true);
                }
        } else {
          navigate(createPageUrl("Analysis"));
        }
      }, [navigate, language, t]);

  if (!analysis || !translationComplete) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-medium">{t('novaAnalyzing')}</p>
          </motion.div>
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
            {t('backToDashboard')}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-emerald-50 border-emerald-200 text-emerald-700">
                   <CheckCircle2 className="w-3 h-3 mr-1" />
                   {t('analysisComplete')}
                </Badge>
                {analysis.posture && (
                  <PostureIndicator postureId={analysis.posture} size="compact" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t('analysisResults')}
              </h1>
            </div>
            
            <Link to={createPageUrl("Analysis")}>
              <Button variant="outline" className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('launchNewSimulation')}
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
              label={t('blockersDetected')}
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
              label={t('risksIdentified')}
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
              {t('blockerDetails')}
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
                  {blocker.patterns && blocker.patterns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {blocker.patterns.map((pattern, pidx) => (
                        <Badge key={pidx} variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">{language === 'fr' ? 'Action :' : 'Action:'}</span> {blocker.action}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                {t('riskDetails')}
              </h3>
              {(() => {
                const urgencyCounts = analysis.risks.reduce((acc, r) => {
                  if (r.urgency) acc[r.urgency] = (acc[r.urgency] || 0) + 1;
                  return acc;
                }, {});
                return Object.keys(urgencyCounts).length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRiskUrgencyFilter(null)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                        !riskUrgencyFilter 
                          ? "bg-slate-900 text-white" 
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Tous
                    </button>
                    {urgencyCounts.high && (
                      <button
                        onClick={() => setRiskUrgencyFilter("high")}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                          riskUrgencyFilter === "high"
                            ? "bg-red-600 text-white"
                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {t('high')} ({urgencyCounts.high})
                      </button>
                    )}
                    {urgencyCounts.medium && (
                      <button
                        onClick={() => setRiskUrgencyFilter("medium")}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                          riskUrgencyFilter === "medium"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {t('medium')} ({urgencyCounts.medium})
                      </button>
                    )}
                    {urgencyCounts.low && (
                      <button
                        onClick={() => setRiskUrgencyFilter("low")}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                          riskUrgencyFilter === "low"
                            ? "bg-slate-600 text-white"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {t('low')} ({urgencyCounts.low})
                      </button>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
            <div className="space-y-3">
              {analysis.risks
                .filter(risk => !riskUrgencyFilter || risk.urgency === riskUrgencyFilter)
                .map((risk, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border border-amber-100">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-900 flex-1">{risk.description}</p>
                    {risk.urgency && (
                      <Badge 
                        onClick={() => setRiskUrgencyFilter(risk.urgency)}
                        className={`shrink-0 ml-3 cursor-pointer hover:opacity-80 transition-opacity ${
                          risk.urgency === "high" ? "bg-red-100 text-red-700 border-red-200" :
                          risk.urgency === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {t(risk.urgency)}
                      </Badge>
                    )}
                  </div>
                  {risk.patterns && risk.patterns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {risk.patterns.map((pattern, pidx) => (
                        <Badge key={pidx} variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 mb-1">
                     <span className="font-medium">{language === 'fr' ? 'Impact :' : 'Impact:'}</span> {risk.impact}
                   </p>
                   <p className="text-sm text-amber-700">
                     <span className="font-medium">{language === 'fr' ? 'Atténuation :' : 'Mitigation:'}</span> {risk.mitigation}
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
              {t('meetingSummary')}
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
               {t('detectedBlockersIssues')}
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
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-amber-600" />
                 {t('identifiedRisks')}
               </h2>
               {(() => {
                 const urgencyCounts = analysis.risks.reduce((acc, r) => {
                   if (r.urgency) acc[r.urgency] = (acc[r.urgency] || 0) + 1;
                   return acc;
                 }, {});
                 return Object.keys(urgencyCounts).length > 0 ? (
                   <div className="flex items-center gap-2 flex-wrap">
                     <button
                       onClick={() => setRiskUrgencyFilter(null)}
                       className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                         !riskUrgencyFilter 
                           ? "bg-slate-900 text-white" 
                           : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                       }`}
                     >
                       Tous
                     </button>
                     {urgencyCounts.high && (
                       <button
                         onClick={() => setRiskUrgencyFilter("high")}
                         className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                           riskUrgencyFilter === "high"
                             ? "bg-red-600 text-white"
                             : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                         }`}
                       >
                         {t('high')} ({urgencyCounts.high})
                       </button>
                     )}
                     {urgencyCounts.medium && (
                       <button
                         onClick={() => setRiskUrgencyFilter("medium")}
                         className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                           riskUrgencyFilter === "medium"
                             ? "bg-amber-600 text-white"
                             : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                         }`}
                       >
                         {t('medium')} ({urgencyCounts.medium})
                       </button>
                     )}
                     {urgencyCounts.low && (
                       <button
                         onClick={() => setRiskUrgencyFilter("low")}
                         className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                           riskUrgencyFilter === "low"
                             ? "bg-slate-600 text-white"
                             : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                         }`}
                       >
                         {t('low')} ({urgencyCounts.low})
                       </button>
                     )}
                   </div>
                 ) : null;
               })()}
             </div>
           <div className="grid md:grid-cols-2 gap-4">
             {analysis.risks
               .filter(risk => !riskUrgencyFilter || risk.urgency === riskUrgencyFilter)
               .map((risk, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                 className="p-5 rounded-xl border border-slate-200 bg-white"
               >
                 <div className="flex items-start justify-between mb-2">
                   <p className="font-medium text-slate-900 flex-1">{risk.description}</p>
                   {risk.urgency && (
                     <Badge 
                       onClick={() => setRiskUrgencyFilter(risk.urgency)}
                       className={`shrink-0 ml-3 cursor-pointer hover:opacity-80 transition-opacity ${
                         risk.urgency === "high" ? "bg-red-100 text-red-700 border-red-200" :
                         risk.urgency === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                         "bg-slate-100 text-slate-700 border-slate-200"
                       }`}
                     >
                       {t(risk.urgency)}
                     </Badge>
                   )}
                   </div>
                   {risk.patterns && risk.patterns.length > 0 && (
                   <div className="flex flex-wrap gap-1 mb-2">
                     {risk.patterns.map((pattern, pidx) => (
                       <Badge key={pidx} variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                         {pattern}
                       </Badge>
                     ))}
                   </div>
                   )}
                   <div className="space-y-2 text-sm">
                   <p className="text-slate-600">
                      <span className="font-medium text-slate-700">{language === 'fr' ? 'Impact :' : 'Impact:'}</span> {risk.impact}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">{language === 'fr' ? 'Atténuation :' : 'Mitigation:'}</span> {risk.mitigation}
                    </p>
                   </div>
               </motion.div>
             ))}
           </div>
         </motion.div>
        )}

        {/* GDPR Markers Section (if from Slack) */}
        {analysis.sourceName === "Slack" && (
          <GDPRMarkersSection 
            sessionId={analysis.sessionId}
            analysisDate={analysis.created_date || new Date().toISOString()}
          />
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
              {t('wantRealTimeAnalysis')}
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              {t('inFullVersion')}
            </p>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              {t('comingSoonIntegrations')}
            </Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
}