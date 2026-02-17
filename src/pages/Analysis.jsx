import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useAccessControl } from "@/components/dashboard/useAccessControl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TranscriptInput from "@/components/nova/TranscriptInput";
import FileUpload from "@/components/nova/FileUpload";
import SlackChannelSelector from "@/components/nova/SlackChannelSelector";
import PostureIndicator from "@/components/nova/PostureIndicator";
import OutOfContextResult from "@/components/nova/OutOfContextResult";
import { determinePosture, analyzeTranscriptForContext, getPosturePrompt, POSTURES } from "@/components/nova/PostureEngine";
import ProductGoalCard from "@/components/nova/ProductGoalCard";
import { generateAlignmentReport } from "@/components/nova/ProductGoalAlignmentEngine";
import { detectWorkshopType } from "@/components/nova/workshopDetectionV2";
import { detectOutOfContext } from "@/components/nova/outOfContextDetection";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { anonymizeAnalysisData } from "@/components/nova/anonymizationEngine";
import { usePlanLimitations } from "@/components/hooks/usePlanLimitations";
import { 
  Sparkles, 
  ArrowLeft, 
  Loader2,
  Wand2,
  AlertCircle,
  MessageSquare,
  Upload,
  FileText,
  Settings,
  AlertTriangle,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Analysis() {
   useAccessControl();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const { planLimitations, loading: limitationsLoading, canCreateManualAnalysis, user } = usePlanLimitations();
   const [transcript, setTranscript] = useState("");
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [error, setError] = useState(null);
   const [analysisLimitError, setAnalysisLimitError] = useState(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [selectedSlackChannel, setSelectedSlackChannel] = useState(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [detectedContext, setDetectedContext] = useState(null);
  const [currentPosture, setCurrentPosture] = useState(POSTURES.agile_coach);
  const [alignmentReport, setAlignmentReport] = useState(null);
  const [workshopType, setWorkshopType] = useState("");
  const [workshopDetection, setWorkshopDetection] = useState(null);
  const [isOutOfContext, setIsOutOfContext] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showOutOfContextResult, setShowOutOfContextResult] = useState(false);
  const [outOfContextData, setOutOfContextData] = useState(null);
  const [canCreateAnalysis, setCanCreateAnalysis] = useState(false);
  const [productGoalValidated, setProductGoalValidated] = useState(() => {
    return localStorage.getItem("productGoalValidated") === "true";
  });
  const [hasActiveScopeCreep, setHasActiveScopeCreep] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // Check user permissions & load workspaces
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const hasPermission = currentUser.role === 'admin' || currentUser.role === 'contributor';
        setCanCreateAnalysis(hasPermission);

        // Load available workspaces (JiraProjectSelection)
        const userWorkspaces = await base44.entities.JiraProjectSelection.filter({
          is_active: true
        });
        setWorkspaces(userWorkspaces);
        
        // Auto-select first workspace if available
        if (userWorkspaces.length > 0) {
          setSelectedWorkspaceId(userWorkspaces[0].id);
          setSelectedWorkspaceName(userWorkspaces[0].workspace_name);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    checkPermissions();
  }, []);

  // Generate alignment report on mount
  useEffect(() => {
    const report = generateAlignmentReport(productGoalData, sprintGoalsData);
    setAlignmentReport(report);
  }, []);

  // Analyze transcript to detect context, workshop type, and determine posture
  useEffect(() => {
    if (transcript && transcript.length > 50) {
      // Count words
      const words = transcript.trim().split(/\s+/).length;
      setWordCount(words);
      
      const context = analyzeTranscriptForContext(transcript);
      setDetectedContext(context);
      const posture = determinePosture(context);
      setCurrentPosture(posture);
      
      // Check out of context FIRST
      const outOfContextCheck = detectOutOfContext(transcript);
      setIsOutOfContext(outOfContextCheck.isOutOfContext);
      setOutOfContextData(outOfContextCheck);
      setShowOutOfContextResult(outOfContextCheck.isOutOfContext);
      
      // Only proceed with workshop detection if not out of context
      if (!outOfContextCheck.isOutOfContext) {
        const detected = detectWorkshopType(transcript);
        setWorkshopDetection(detected);
        
        // Map detected type to form value
        const typeMapping = {
          'Daily Scrum': 'daily_scrum',
          'Sprint Planning': 'sprint_planning',
          'Sprint Review': 'sprint_review',
          'Retrospective': 'retrospective'
        };
        
        if (typeMapping[detected.type]) {
          setWorkshopType(typeMapping[detected.type]);
        } else {
          setWorkshopType('other');
        }
      } else {
        setWorkshopDetection(null);
        setWorkshopType('');
      }
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
    setAnalysisLimitError(null);

    if (!transcript.trim()) {
      setError("Aucun texte détecté. Collez le contenu de votre atelier Scrum pour analyse.");
      return;
    }

    if (isOutOfContext) {
      setShowOutOfContextResult(true);
      return;
    }

    if (wordCount < 500) {
      setError(`Texte insuffisant (${wordCount} mots). Minimum 500 mots requis pour une analyse fiable.`);
      return;
    }

    if (!workshopType) {
      setError("Veuillez sélectionner un type d'atelier avant d'analyser.");
      return;
    }

    if (!selectedWorkspaceId) {
      setError("Veuillez sélectionner un workspace.");
      return;
    }

    // Check plan limitations for manual analysis
    const limitCheck = await canCreateManualAnalysis();
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'manual_analysis_admin_only') {
        setAnalysisLimitError("Les analyses manuelles sont réservées aux administrateurs sur votre plan.");
      } else if (limitCheck.reason === 'max_manual_analyses_reached') {
        setAnalysisLimitError(`Limite atteinte: ${limitCheck.limit} analyses manuelles maximum par plan.`);
      }
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmAnalysis = async () => {
    setShowConfirmDialog(false);
    setIsAnalyzing(true);
    setError(null);
    
    try {

    // Fetch active sprint context to get delivery mode
    const sprintContexts = await base44.entities.SprintContext.filter({ is_active: true });
    const activeSprintContext = sprintContexts[0] || { delivery_mode: "scrum" };
    const deliveryMode = activeSprintContext.delivery_mode;

    // Map workshop type to ceremony context
    const workshopContextMap = {
      daily_scrum: "daily_scrum",
      retrospective: "retrospective", 
      sprint_planning: "sprint_planning",
      sprint_review: "sprint_review",
      other: "daily_scrum"
    };
    const ceremonyType = workshopContextMap[workshopType] || "daily_scrum";

    // Detect context and get appropriate posture
    const context = { ...analyzeTranscriptForContext(transcript), current_ceremony: ceremonyType };
    const posture = determinePosture(context);
    setCurrentPosture(posture);

    // Define analysis focus based on workshop type
    const workshopFocusMap = {
      daily_scrum: "Participation, blocages, répétitions, points opérationnels, signaux de communication",
      retrospective: "Thèmes récurrents, actions suivies, sentiment général, tendances d'amélioration, engagement équipe",
      sprint_planning: "Cohérence backlog, alignement priorités, dépendances, risques, estimations, capacité",
      sprint_review: "Valeur délivrée, feedback stakeholders, démos effectuées, ajustements backlog, satisfaction",
      other: "Points saillants du contenu, thèmes clés, alertes potentielles, insights génériques"
    };
    const analysisFocus = workshopFocusMap[workshopType] || workshopFocusMap.other;

    // Define urgency evaluation criteria based on delivery mode
    const urgencyCriteria = deliveryMode === "kanban" 
      ? `
URGENCY EVALUATION (Kanban mode - Flow continuous):
- HIGH: Bloque le flow, crée un goulot d'étranglement, menace le throughput/semaine, WIP critique
- MEDIUM: Ralentit le cycle time, affecte plusieurs tickets, risque d'accumulation
- LOW: Impact limité, peut être résolu progressivement, n'affecte pas le flow immédiat`
      : `
URGENCY EVALUATION (Scrum mode - Sprint timeboxé):
- HIGH: Bloque le Sprint Goal, empêche la complétion avant la fin du sprint, bloquant critique
- MEDIUM: Ralentit la vélocité, risque de déborder du sprint, dépendance non résolue
- LOW: Impact mineur, peut attendre le prochain sprint, pas critique pour le goal actuel`;

    // Load anti-patterns for canonical detection
    const antiPatterns = await base44.entities.AntiPattern.filter({ is_active: true });
    const patternContext = antiPatterns
      .filter(p => p.ceremony_type?.includes(workshopType) || !p.ceremony_type)
      .map(p => `${p.pattern_id} - ${p.name}: Marqueurs [${p.markers?.join(', ')}]`)
      .join('\n');

    const basePrompt = `You are Nova, an AI Scrum Master analyzing a meeting transcript using canonical anti-patterns.

Workshop type: ${workshopType.replace('_', ' ').toUpperCase()}
Analysis focus: ${analysisFocus}
Delivery mode: ${deliveryMode.toUpperCase()}

${urgencyCriteria}

ANTI-PATTERNS CANONIQUES (du Gist):
${patternContext}

Analyze the following transcript and identify:

1. Blockers - issues preventing team members from making progress (with urgency level, first names, and detected pattern_ids)
2. Risks - potential problems that could impact delivery (with urgency level, first names, and detected pattern_ids)
3. Dependencies - tasks that depend on other team members or external factors
4. Recommended actions for each issue WITH FIRST NAMES

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
              member: { type: "string", description: "First name" },
              issue: { type: "string" },
              urgency: { type: "string", enum: ["high", "medium", "low"] },
              action: { type: "string", description: "With first names" },
              blocked_by: { type: "string", description: "First name if applicable" },
              pattern_ids: {
                type: "array",
                items: { type: "string" },
                description: "Detected pattern IDs (e.g., A1, B2)"
              }
            }
          }
        },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "With first names" },
              impact: { type: "string" },
              urgency: { type: "string", enum: ["high", "medium", "low"] },
              mitigation: { type: "string", description: "With first names" },
              affected_members: {
                type: "array",
                items: { type: "string" },
                description: "First names"
              },
              pattern_ids: {
                type: "array",
                items: { type: "string" },
                description: "Detected pattern IDs (e.g., C3, D1)"
              }
            }
          }
        },
        recommendations: {
          type: "array",
          items: { type: "string", description: "With first names" }
        },
        summary: { type: "string" }
      }
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema
    });

    // ===== CORRECTION APPROFONDIE DU TYPE D'ATELIER =====
    // Relancer la détection avec plus de contexte (résultats LLM + transcript)
    // Pour corriger les faux-positifs de la pré-détection
    const deepDetection = detectWorkshopType(transcript);
    
    // Logique de correction : PRIORITÉ ABSOLUE À DAILY si détecté
    // - Daily doit toujours gagne si marqueurs présents (hier/aujourd'hui/blocages)
    // - Seuil baissé à 65% pour corriger les faux-positifs Review/Retro
    let finalWorkshopType = workshopType;

    const deepTypeMap = {
      'Daily Scrum': 'daily_scrum',
      'Sprint Review': 'sprint_review',
      'Sprint Rétrospective': 'retrospective',
      'Sprint Planning': 'sprint_planning'
    };

    // RÈGLE PRIORITAIRE: Si Daily détecté avec confiance >= 65%, toujours utiliser Daily
    // C'est l'override maximal pour éviter les faux-positifs
    if (deepDetection.type === 'Daily Scrum' && deepDetection.confidence >= 65) {
      finalWorkshopType = 'daily_scrum';
      console.log(`✅ DAILY PRIORITAIRE: Confiance ${deepDetection.confidence}% > Seuil 65% → Daily confirmé`);
    } else if (deepDetection.confidence >= 75) {
      // Confiance normale pour les autres types
      if (deepTypeMap[deepDetection.type]) {
        finalWorkshopType = deepTypeMap[deepDetection.type];
        console.log(`✅ Type corrigé: ${workshopType} → ${finalWorkshopType} (confiance: ${deepDetection.confidence}%)`);
      }
    }

    // Determine title based on corrected workshop type
    const workshopTypeLabels = {
      daily_scrum: "Daily Scrum",
      retrospective: "Rétrospective",
      sprint_planning: "Sprint Planning",
      sprint_review: "Sprint Review",
      other: "Atelier"
    };
    const title = `[${workshopTypeLabels[finalWorkshopType]}] ${new Date().toLocaleDateString(language)}`;

    // Save to database for history tracking
    const blockersArray = Array.isArray(result.blockers) ? result.blockers : [];
    const risksArray = Array.isArray(result.risks) ? result.risks : [];
    
    const analysisRecord = {
      title,
      source: activeTab === "slack" ? "slack" : activeTab === "upload" ? "file_upload" : "transcript",
      blockers_count: blockersArray.length,
      risks_count: risksArray.length,
      analysis_data: { 
        ...result, 
        posture: posture.id, 
        context,
        workshop_type: finalWorkshopType,
        workshop_focus: analysisFocus,
        initial_detection: workshopType,
        corrected_detection: finalWorkshopType !== workshopType ? deepDetection.type : null,
        detection_confidence: deepDetection.confidence,
        inserted_at: new Date().toISOString()
      },
      transcript_preview: transcript.substring(0, 200),
      analysis_time: new Date().toISOString()
    };
    
    // Prepare pattern detection records
    const allDetectedPatterns = new Set();
    blockersArray.forEach(b => b.pattern_ids?.forEach(p => allDetectedPatterns.add(p)));
    risksArray.forEach(r => r.pattern_ids?.forEach(p => allDetectedPatterns.add(p)));

    const patternDetections = [];
    for (const patternId of allDetectedPatterns) {
      const pattern = antiPatterns.find(p => p.pattern_id === patternId);
      if (pattern) {
        const relatedBlockers = blockersArray.filter(b => b.pattern_ids?.includes(patternId));
        const relatedRisks = risksArray.filter(r => r.pattern_ids?.includes(patternId));
        const contextText = [
          ...relatedBlockers.map(b => `${b.member}: ${b.issue}`),
          ...relatedRisks.map(r => r.description)
        ].join(' | ');

        patternDetections.push({
          pattern_id: patternId,
          pattern_name: pattern.name,
          category: pattern.category,
          confidence_score: 75,
          detected_markers: pattern.markers || [],
          context: contextText.substring(0, 500),
          severity: pattern.severity || 'medium',
          recommended_actions: [...relatedBlockers.map(b => b.action), ...relatedRisks.map(r => r.mitigation)],
          status: 'detected'
        });
      }
    }

    // Check if workspace selected for multi-source fusion
    if (!selectedWorkspaceId) {
      setError("Veuillez sélectionner un workspace pour l'analyse cross-source.");
      setIsAnalyzing(false);
      return;
    }

    // Call createAnalysis with workspace_id for multi-source fusion
    const response = await base44.functions.invoke('createAnalysis', {
      analysisRecord: {
        ...analysisRecord,
        jira_project_selection_id: selectedWorkspaceId,
        workspace_name: selectedWorkspaceName
      },
      patternDetections,
      workspace_id: selectedWorkspaceId,
      workspace_name: selectedWorkspaceName
    });
    
    const createdAnalysis = response.data.analysis;
    
    // Invalidate query to force refetch from database
    await queryClient.invalidateQueries({ queryKey: ['analysisHistory'] });
    
    // Clear all caches to force fresh data fetch
    sessionStorage.removeItem('gdpr_markers_stats');
    sessionStorage.removeItem('gdpr_markers_stats_timestamp');

    // Anonymize analysis data before storing
    const anonymizedAnalysis = anonymizeAnalysisData({ ...result, posture: posture.id, context });

    // Store result in sessionStorage and navigate
    sessionStorage.setItem("novaAnalysis", JSON.stringify(anonymizedAnalysis));
    sessionStorage.setItem("novaTranscript", transcript);
    
    // Store the corrected workshop detection for display in Results
    sessionStorage.setItem("workshopDetectionCorrected", JSON.stringify({
      type: deepDetection.type,
      confidence: deepDetection.confidence,
      tags: deepDetection.tags,
      justifications: deepDetection.justifications,
      scores: deepDetection.scores,
      corrected: finalWorkshopType !== workshopType
    }));

    // Store source info for external CTA redirection
    const sourceInfo = {
      url: selectedSlackChannel 
        ? `https://slack.com/app_redirect?channel=${selectedSlackChannel.id}`
        : null,
      name: selectedSlackChannel 
        ? `Slack (#${selectedSlackChannel.name})`
        : activeTab === "upload" ? (language === 'fr' ? "Fichier importé" : "Imported File") : (language === 'fr' ? "Transcription" : "Transcript")
    };
    sessionStorage.setItem("analysisSource", JSON.stringify(sourceInfo));

    navigate(createPageUrl("Results"));
    } catch (error) {
      console.error("Analysis error:", error);
      setError(`Erreur lors de l'analyse: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showOutOfContextResult) {
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
            <button 
              onClick={() => setShowOutOfContextResult(false)}
              className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour à l'analyse
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {t('analyzeTitle')}
            </h1>
          </motion.div>

          {/* Out of Context Result */}
          <OutOfContextResult data={outOfContextData} onClose={() => setShowOutOfContextResult(false)} />
        </div>
      </div>
    );
  }

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
            <PostureIndicator postureId={currentPosture.id} size="compact" />
          </div>
          
          {/* Product Goal Alignment Card - Only if not validated OR scope creep detected */}
          {alignmentReport && alignmentReport.risk.id !== "insufficient" && (!productGoalValidated || hasActiveScopeCreep) && (
            <div className="mt-6">
              <ProductGoalCard 
                alignmentReport={alignmentReport}
                onConfirmGoal={(response) => {
                  console.log("Goal confirmed:", response);
                  localStorage.setItem("productGoalValidated", "true");
                  setProductGoalValidated(true);
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
          
          <div className="flex items-center justify-between mb-6">
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
                {t('integrations')}
              </Button>
            </Link>
          </div>

          {/* Workspace Selector for Multi-Source Analysis */}
          {workspaces.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">Workspace pour analyse cross-source</p>
                  <p className="text-xs text-blue-700">Cette analyse fusionnera avec vos données Slack, Teams , Jira/ Trello du workspace</p>
                </div>
                <Select value={selectedWorkspaceId} onValueChange={(val) => {
                  setSelectedWorkspaceId(val);
                  const ws = workspaces.find(w => w.id === val);
                  setSelectedWorkspaceName(ws?.workspace_name);
                }}>
                  <SelectTrigger className="w-64 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.workspace_name} ({ws.jira_project_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Workshop Type Auto-Detection with Full Details */}
        {workshopDetection && transcript && transcript.length > 50 && (
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
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                      {language === 'fr' ? 'Type de Réunion Détecté' : 'Detected Meeting Type'}
                    </p>
                    <h3 className="text-2xl font-bold text-blue-900 mb-3">
                      {workshopDetection.type}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
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
                        {workshopDetection.justifications.slice(0, 3).map((justification, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>{justification}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-blue-600 mb-1 uppercase font-semibold">{language === 'fr' ? 'Confiance' : 'Confidence'}</p>
                    <p className="text-4xl font-bold text-blue-900">
                      {workshopDetection.confidence}%
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-blue-200">
                  <p className="text-xs text-blue-700 italic">
                    💡 {language === 'fr' 
                      ? 'Bien que Nova AI soit très performant, la pré-détection peut se tromper de type d\'atelier si son contenu semble mixé avec d\'autres pratiques, mais l\'analyse approfondie une fois lancée corrigera ce faux-positif.'
                      : 'Although Nova AI is highly accurate, pre-detection may incorrectly classify the workshop type if its content appears mixed with other practices, but the detailed analysis once launched will correct this false positive.'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Input Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full bg-slate-100 p-1 rounded-xl">
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

          <TabsContent value="upload" className="mt-6">
            <FileUpload onDataExtracted={handleFileDataExtracted} />
            <p className="text-xs text-slate-500 mt-3">
              {t('fileUploadDescription')}
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
              className={`p-4 rounded-xl border ${isOutOfContext ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{t('dataReady')}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${wordCount >= 500 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    {wordCount} mots
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {transcript.length.toLocaleString()} {t('characters')}
                  </Badge>
                </div>
              </div>
              {wordCount < 500 && (
                <div className="text-xs text-amber-700 mb-2">
                  ⚠️ Minimum 500 mots requis ({500 - wordCount} mots manquants)
                </div>
              )}
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

          {analysisLimitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">{analysisLimitError}</span>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcript.trim() || isOutOfContext || !selectedWorkspaceId || analysisLimitError}
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

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Confirmer l'analyse
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Veuillez vérifier les détails avant de procéder
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-6">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type d'atelier</p>
                <p className="text-lg font-semibold text-slate-900">
                  {workshopType === 'daily_scrum' && 'Daily Scrum'}
                  {workshopType === 'retrospective' && 'Rétrospective'}
                  {workshopType === 'sprint_planning' && 'Sprint Planning'}
                  {workshopType === 'sprint_review' && 'Sprint Review'}
                  {workshopType === 'other' && 'Autre atelier'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Workspace cible</p>
                <p className="text-lg font-semibold text-blue-900">{selectedWorkspaceName}</p>
                <p className="text-sm text-blue-700 mt-1">L'analyse sera fusionnée avec vos données Slack, Teams et Jira</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Données à analyser</p>
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{wordCount}</span> mots • <span className="font-semibold">{transcript.length}</span> caractères
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmAnalysis}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Lancer l'analyse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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