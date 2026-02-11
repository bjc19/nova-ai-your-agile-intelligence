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
import RoleBasedRiskDisplay from "@/components/nova/RoleBasedRiskDisplay";
import { POSTURES } from "@/components/nova/PostureEngine";
import { invokeLLMWithAutoTranslate } from "@/components/nova/LLMTranslator";
import { detectWorkshopType } from "@/components/nova/workshopDetection";
import { transformRisksForRole, transformBlockersForRole, detectViewForUser } from "@/components/nova/RiskPresentationEngine";
import { base44 } from "@/api/base44Client";
import { 
        ArrowLeft, 
        AlertOctagon,
        ShieldAlert,
        FileText,
        CheckCircle2,
        Loader2,
        Zap,
        ArrowRight,
        AlertTriangle,
        Download
      } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Results() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [analysis, setAnalysis] = useState(null);
        const [translationComplete, setTranslationComplete] = useState(language !== 'fr');
        const [expandedSection, setExpandedSection] = useState(null); // "blockers" | "risks" | null
  const [riskUrgencyFilter, setRiskUrgencyFilter] = useState(null);
  const [workshopDetection, setWorkshopDetection] = useState(null);
  const [isOutOfContext, setIsOutOfContext] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [transformedRisks, setTransformedRisks] = useState([]);
  const [transformedBlockers, setTransformedBlockers] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
        const storedAnalysis = sessionStorage.getItem("novaAnalysis");
        const storedTranscript = sessionStorage.getItem("novaTranscript");
        
        // Detect user role automatically
        const detectRole = async () => {
          try {
            const user = await base44.auth.me();
            const detectedRole = detectViewForUser(user);
            setUserRole(detectedRole);
          } catch (error) {
            setUserRole('contributor'); // Défaut sécurisé
          }
        };
        detectRole();
        
        if (storedAnalysis) {
          const parsedAnalysis = JSON.parse(storedAnalysis);
          // Add source info from sessionStorage if available
          const sourceInfo = sessionStorage.getItem("analysisSource");
          if (sourceInfo) {
            const { url, name } = JSON.parse(sourceInfo);
            parsedAnalysis.sourceUrl = url;
            parsedAnalysis.sourceName = name;
          }

          // Detect workshop type if transcript is available
          if (storedTranscript) {
            const detected = detectWorkshopType(storedTranscript);
            setWorkshopDetection(detected);
            
            // Check if out of context
            const isOutOfContext = detected.tags && detected.tags.includes('#HorsContexte');
            setIsOutOfContext(isOutOfContext);
          }

          // Display results immediately
          setAnalysis(parsedAnalysis);
          
          // Transform risks and blockers for role once role is detected
          if (userRole) {
            const riskTransformed = transformRisksForRole(parsedAnalysis.risks || [], userRole);
            const blockerTransformed = transformBlockersForRole(parsedAnalysis.blockers || [], userRole);
            setTransformedRisks(riskTransformed);
            setTransformedBlockers(blockerTransformed);
          }

          // Translate all LLM content if language is French
               if (language === 'fr') {
                 // Only attempt translation if it hasn't already been cached
                 const translationCacheKey = `nova-translation-${JSON.stringify(parsedAnalysis).substring(0, 100)}`;
                 const cachedTranslation = sessionStorage.getItem(translationCacheKey);

                 if (!cachedTranslation) {
                   const translateContentIfNeeded = async () => {
                     // Add longer delay to avoid rate limiting
                     await new Promise(resolve => setTimeout(resolve, 10000));

                     try {
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

                         // Cache translation and update
                         sessionStorage.setItem(translationCacheKey, 'done');
                         setAnalysis(parsedAnalysis);
                       }
                     } catch (error) {
                       // Gracefully handle translation errors (e.g., rate limits)
                       console.log('Background translation skipped:', error?.message);
                     } finally {
                       setTranslationComplete(true);
                     }
                   };

                   translateContentIfNeeded();
                 } else {
                   setTranslationComplete(true);
                 }
               } else {
                 setTranslationComplete(true);
               }
        } else {
          navigate(createPageUrl("Analysis"));
        }
      }, [navigate, language, t, userRole]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('generateAnalysisPDF', {
        analysis: analysis,
        language: language,
        userRole: userRole
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nova-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

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
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Exporter le résultat ?' : 'Export results?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Voulez-vous exporter cette analyse en PDF pour la partager ou l\'archiver ?'
                : 'Would you like to export this analysis as PDF to share or archive it?'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(false)}
            >
              {language === 'fr' ? 'Non' : 'No'}
            </Button>
            <Button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Export...' : 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Oui, exporter' : 'Yes, export'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                {userRole && (
                  <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-slate-100 border-slate-300 text-slate-600">
                    {userRole === 'admin' ? 'Vue Technique' : userRole === 'contributor' ? 'Vue Équipe' : 'Vue Business'}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t('analysisResults')}
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Workshop Type Detection & Out-of-Context Warning */}
        {workshopDetection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            {isOutOfContext ? (
              <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-1">
                      {language === 'fr' ? 'Contenu Hors Contexte' : 'Out of Context Content'}
                    </h3>
                    <p className="text-sm text-red-700">
                      {language === 'fr'
                        ? 'Le contenu analysé n\'apparaît pas être une réunion d\'équipe Agile. Les résultats peuvent être inexacts.'
                        : 'The analyzed content does not appear to be an Agile team meeting. Results may be inaccurate.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                      {language === 'fr' ? 'Type de Réunion Détecté' : 'Detected Meeting Type'}
                    </p>
                    <h3 className="text-xl font-bold text-blue-900 mb-2">
                      {workshopDetection.type}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {workshopDetection.tags && workshopDetection.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {workshopDetection.justifications && workshopDetection.justifications.length > 0 && (
                      <div className="text-sm text-blue-700 space-y-1">
                        {workshopDetection.justifications.slice(0, 2).map((justification, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{justification}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-blue-600 mb-1">{language === 'fr' ? 'Confiance' : 'Confidence'}</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {workshopDetection.confidence}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Posture Context */}
         {analysis.posture && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.15 }}
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

        {/* Expanded Details Inline - Role-Based View */}
        {expandedSection === "blockers" && transformedBlockers && transformedBlockers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-blue-600" />
              {t('blockerDetails')}
            </h3>
            <div className="space-y-4">
              {transformedBlockers.map((blocker, index) => (
                <RoleBasedRiskDisplay key={index} risk={blocker} role={userRole} />
              ))}
            </div>
          </motion.div>
        )}

        {expandedSection === "risks" && transformedRisks && transformedRisks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              {t('riskDetails')}
            </h3>
            <div className="space-y-4">
              {transformedRisks.map((risk, index) => (
                <RoleBasedRiskDisplay key={index} risk={risk} role={userRole} />
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

        {/* Blockers Section - Role-Based View */}
         {transformedBlockers && transformedBlockers.length > 0 && (
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
             <div className="space-y-4">
               {transformedBlockers.map((blocker, index) => (
                 <RoleBasedRiskDisplay key={index} risk={blocker} role={userRole} />
               ))}
             </div>
           </motion.div>
         )}

        {/* Risks Section - Role-Based View */}
         {transformedRisks && transformedRisks.length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.25 }}
             className="mb-8"
           >
             <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
               <ShieldAlert className="w-5 h-5 text-amber-600" />
               {t('identifiedRisks')}
             </h2>
             <div className="space-y-4">
               {transformedRisks.map((risk, index) => (
                 <RoleBasedRiskDisplay key={index} risk={risk} role={userRole} />
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

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
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
      </div>
    </div>
  );
}