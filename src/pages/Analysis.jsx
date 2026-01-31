import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TranscriptInput, { SAMPLE_TRANSCRIPT } from "@/components/nova/TranscriptInput";
import FileUpload from "@/components/nova/FileUpload";
import SlackChannelSelector from "@/components/nova/SlackChannelSelector";
import PostureIndicator from "@/components/nova/PostureIndicator";
import { determinePosture, analyzeTranscriptForContext, getPosturePrompt, POSTURES } from "@/components/nova/PostureEngine";
import ProductGoalCard from "@/components/nova/ProductGoalCard";
import { generateAlignmentReport } from "@/components/nova/ProductGoalAlignmentEngine";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { 
  Sparkles, 
  ArrowLeft, 
  Loader2,
  Wand2,
  AlertCircle,
  MessageSquare,
  Upload,
  FileText,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Analysis() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [selectedSlackChannel, setSelectedSlackChannel] = useState(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [detectedContext, setDetectedContext] = useState(null);
  const [currentPosture, setCurrentPosture] = useState(POSTURES.agile_coach);
  const [alignmentReport, setAlignmentReport] = useState(null);

  // Simulated Product Goal & Sprint Goals data (will come from Jira/Confluence)
  const productGoalData = {
    title: "Améliorer la rétention utilisateur de 20%",
    description: "Réduire le churn et augmenter l'engagement via onboarding optimisé",
    version: 3,
    status: "active",
    confirmed_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    change_history: [
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), previous_title: "Augmenter acquisition", reason: "Pivot vers rétention" },
      { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), previous_title: "Améliorer onboarding", reason: "Élargissement scope" },
    ],
  };

  const sprintGoalsData = [
    { sprint_name: "Sprint 14", goal_statement: "Implémenter le nouveau flow d'onboarding pour améliorer rétention", alignment_status: "aligned", sprint_number: 14 },
    { sprint_name: "Sprint 13", goal_statement: "Ajouter les analytics de comportement utilisateur", alignment_status: "partial", sprint_number: 13 },
    { sprint_name: "Sprint 12", goal_statement: "Refactoring technique de la base de données", alignment_status: "misaligned", sprint_number: 12 },
    { sprint_name: "Sprint 11", goal_statement: "Optimiser les emails de réengagement", alignment_status: "aligned", sprint_number: 11 },
  ];

  // Generate alignment report on mount
  useEffect(() => {
    const report = generateAlignmentReport(productGoalData, sprintGoalsData);
    setAlignmentReport(report);
  }, []);

  // Analyze transcript to detect context and determine posture
  useEffect(() => {
    if (transcript && transcript.length > 50) {
      const context = analyzeTranscriptForContext(transcript);
      setDetectedContext(context);
      const posture = determinePosture(context);
      setCurrentPosture(posture);
    }
  }, [transcript]);

  const handleFileDataExtracted = (data) => {
    setTranscript(data);
    setActiveTab("transcript");
  };

  const handleSlackChannelSelect = (channel) => {
    setSelectedSlackChannel(channel);
    // In production, this would fetch actual messages from Slack
    const simulatedSlackMessages = `Slack Channel: #${channel.name}

@sarah_dev (9:02 AM):
Good morning! Yesterday I completed the auth module refactoring. Today I'm picking up the dashboard analytics. No blockers.

@mike_backend (9:04 AM):
Morning team. Still working on the database migration. Hit an issue with the legacy data format - need to write a custom transformer. Might need an extra day.

@lisa_qa (9:05 AM):
@mike_backend that might affect my testing timeline. Can we sync after standup?

@tom_fullstack (9:07 AM):
Wrapped up the API endpoints yesterday. Today starting on the mobile responsive fixes. Quick question - @sarah_dev are you changing any of the header components? Want to avoid conflicts.

@sarah_dev (9:08 AM):
@tom_fullstack yes, I'll be updating the nav. Let me share my branch with you.

@emma_pm (9:10 AM):
Thanks team. @mike_backend let's discuss the migration timeline - client demo is Thursday. We need a backup plan.`;
    
    setTranscript(simulatedSlackMessages);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Please enter a transcript to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Detect context and get appropriate posture
    const context = analyzeTranscriptForContext(transcript);
    const posture = determinePosture(context);
    setCurrentPosture(posture);

    const basePrompt = `You are Nova, an AI Scrum Master analyzing a meeting transcript. Analyze the following transcript and identify:

1. Blockers - issues preventing team members from making progress
2. Risks - potential problems that could impact the sprint/project
3. Dependencies - tasks that depend on other team members or external factors
4. Recommended actions for each issue

Detected ceremony: ${context.current_ceremony !== "none" ? context.current_ceremony.replace("_", " ") : "Daily Scrum"}
Communication tone: ${context.communication_tone}
Sprint status: ${context.sprint_status}

Transcript:
${transcript}

Provide a detailed analysis in the following JSON format:`;

    const analysisPrompt = getPosturePrompt(posture, basePrompt);

    const responseSchema = {
      type: "object",
      properties: {
        blockers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              member: { type: "string" },
              issue: { type: "string" },
              urgency: { type: "string", enum: ["high", "medium", "low"] },
              action: { type: "string" }
            }
          }
        },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              impact: { type: "string" },
              mitigation: { type: "string" }
            }
          }
        },
        recommendations: {
          type: "array",
          items: { type: "string" }
        },
        summary: { type: "string" }
      }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema
    });

    // Determine title based on detected ceremony
    const ceremonyTitles = {
      daily_scrum: "Daily Standup",
      sprint_planning: "Sprint Planning",
      backlog_refinement: "Backlog Refinement",
      sprint_review: "Sprint Review",
      retrospective: "Retrospective",
      none: "Team Meeting"
    };
    const title = `${ceremonyTitles[context.current_ceremony] || "Daily Standup"} - ${new Date().toLocaleDateString()}`;

    // Save to database for history tracking
    const analysisRecord = {
      title,
      source: activeTab === "slack" ? "slack" : activeTab === "upload" ? "file_upload" : "transcript",
      blockers_count: result.blockers?.length || 0,
      risks_count: result.risks?.length || 0,
      analysis_data: { ...result, posture: posture.id, context },
      transcript_preview: transcript.substring(0, 200),
    };
    
    await base44.entities.AnalysisHistory.create(analysisRecord);

    // Store result in sessionStorage and navigate
    sessionStorage.setItem("novaAnalysis", JSON.stringify({ ...result, posture: posture.id, context }));

    // Store source info for external CTA redirection
    const sourceInfo = {
      url: selectedSlackChannel 
        ? `https://slack.com/app_redirect?channel=${selectedSlackChannel.id}`
        : null,
      name: selectedSlackChannel 
        ? `Slack (#${selectedSlackChannel.name})`
        : activeTab === "upload" ? "Fichier importé" : "Transcription"
    };
    sessionStorage.setItem("analysisSource", JSON.stringify(sourceInfo));

    navigate(createPageUrl("Results"));
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
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
          
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-blue-50 border-blue-200 text-blue-700">
              <Sparkles className="w-3 h-3 mr-1" />
              {slackConnected ? t('liveMode') : t('simulationMode')}
            </Badge>
            <PostureIndicator postureId={currentPosture.id} size="compact" />
          </div>
          
          {/* Product Goal Alignment Card */}
          {alignmentReport && alignmentReport.risk.id !== "insufficient" && (
            <div className="mt-6">
              <ProductGoalCard 
                alignmentReport={alignmentReport}
                onConfirmGoal={(response) => {
                  console.log("Goal confirmed:", response);
                  setAlignmentReport(prev => ({
                    ...prev,
                    risk: { id: "stable", label: "Cap stable et aligné", severity: 0 },
                    message: "Cap confirmé par le PO – alignement validé 🟢",
                    productGoal: { ...prev.productGoal, confirmed_date: new Date().toISOString() }
                  }));
                }}
                onAdjustGoal={() => console.log("Adjust sprint goal")}
                onShareStatus={() => console.log("Share status")}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {t('analyzeTitle')}
              </h1>
              <p className="text-slate-600">
                {t('analyzeDescription')}
              </p>
            </div>
            <Link to={createPageUrl("Settings")}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Integrations
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Input Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
            <TabsTrigger 
              value="slack" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {t('slackTab')}
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <Upload className="w-4 h-4" />
              {t('uploadTab')}
            </TabsTrigger>
            <TabsTrigger 
              value="transcript" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
            >
              <FileText className="w-4 h-4" />
              {t('pasteTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slack" className="mt-6">
            <SlackChannelSelector 
              onChannelSelect={handleSlackChannelSelect}
              isConnected={slackConnected}
            />
            {!slackConnected && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>{t('demoMode')}:</strong> {t('demoModeDescription')}{" "}
                  <Link to={createPageUrl("Settings")} className="underline">{t('settings')}</Link>
                  {" "}{t('toImportReal')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <FileUpload onDataExtracted={handleFileDataExtracted} />
            <p className="text-xs text-slate-500 mt-3">
              Upload meeting transcripts, exported Jira reports, or any text file with standup notes.
            </p>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <TranscriptInput 
              value={transcript} 
              onChange={setTranscript} 
            />
          </TabsContent>
        </Tabs>

        {/* Analysis Section */}
        <div className="space-y-6 mt-6">
          
          {/* Posture Indicator */}
          {transcript && transcript.length > 50 && (
            <PostureIndicator postureId={currentPosture.id} showDetails={true} />
          )}
          
          {transcript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{t('dataReady')}</span>
                <div className="flex items-center gap-2">
                  {detectedContext && detectedContext.current_ceremony !== "none" && (
                    <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                      {detectedContext.current_ceremony.replace("_", " ")}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {transcript.length.toLocaleString()} {t('characters')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {transcript.substring(0, 150)}...
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcript.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  {t('analyzeButton')}
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Loading State Overlay */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('analyzing')}
              </h3>
              <p className="text-sm text-slate-500">
                {t('analyzing')}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}