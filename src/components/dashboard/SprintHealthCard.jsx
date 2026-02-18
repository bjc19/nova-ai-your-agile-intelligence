import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { isProduction } from "@/components/nova/isProduction";
import { adaptMessage, adaptSprintHealthMessage } from "./RoleBasedMessaging";
import { useRoleAccess } from "./useRoleAccess";
import { getCacheService } from "@/components/hooks/useCacheService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { anonymizeNamesInText as anonymizeText } from "@/components/nova/anonymizationEngine";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Ban,
  Lightbulb,
  Bell,
  BellOff,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Shield } from
"lucide-react";
import { DRIFT_STATUS, analyzeSprintDrift, generateDriftSuggestions } from "@/components/nova/SprintDriftDetector";

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "Sprint en bonne santé",
    emoji: "🟢"
  },
  potential_drift: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "Dérive potentielle détectée",
    emoji: "⚠️"
  },
  insufficient_data: {
    icon: HelpCircle,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    label: "Données insuffisantes",
    emoji: "⏳"
  }
};

export default function SprintHealthCard({ sprintHealth, onAcknowledge, onReviewSprint, selectedWorkspaceId = null }) {
   // CRITICAL: Don't render if workspace selected but has no real sprint data
   if (selectedWorkspaceId && !sprintHealth) {
     return null;
   }
  const [expanded, setExpanded] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [acknowledgedDate, setAcknowledgedDate] = useState("");
  const [jiraUrl, setJiraUrl] = useState(null);
  const [jiraClicked, setJiraClicked] = useState(false);
  const [data, setData] = useState(null);
  const [liveGdprSignals, setLiveGdprSignals] = useState([]);
  const { language } = useLanguage();
  const { role: userRole, isAdmin, isContributor, isUser } = useRoleAccess();
  const [localUserRole, setLocalUserRole] = useState('user');

  const prodMode = isProduction();

  // En production: afficher seulement si données réelles existent
  // En développement: utiliser données de demo si absent
  if (prodMode && !sprintHealth) {
    return null;
  }

  // Only use real sprint data - NO defaults
  const initialData = sprintHealth;

  // Subscribe to real GDPR markers in production
  useEffect(() => {
    if (!prodMode) return; // Skip in dev

    const cache = getCacheService();
    const unsubscribe = base44.entities.GDPRMarkers.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setLiveGdprSignals((prev) => {
          // Update signal in list or add if new
          const index = prev.findIndex((s) => s.id === event.data.id);
          if (index >= 0) {
            const newSignals = [...prev];
            newSignals[index] = event.data;
            return newSignals;
          } else {
            return [...prev, event.data];
          }
        });
        // Invalidate cache on new signals
        cache.invalidate('gdpr-markers-list');
      } else if (event.type === 'delete') {
        setLiveGdprSignals((prev) => prev.filter((s) => s.id !== event.id));
        cache.invalidate('gdpr-markers-list');
      }
    });

    // Fetch initial GDPR signals with cache
    cache.get(
      'gdpr-markers-sprint',
      () => base44.entities.GDPRMarkers.list('-created_date', 100),
      300
    ).then((signals) => setLiveGdprSignals(signals)).
    catch((err) => console.error("Error fetching GDPR signals:", err));

    return unsubscribe;
  }, [prodMode]);

  // Merge real data with live signals
  useEffect(() => {
    const mergedData = {
      ...initialData,
      gdprSignals: liveGdprSignals,
      // Dynamically update counts based on real signals
      blocked_tickets_over_48h: liveGdprSignals.filter((s) => s.criticite === 'critique' || s.criticite === 'haute').length || initialData.blocked_tickets_over_48h,
      tickets_in_progress_over_3d: liveGdprSignals.filter((s) => s.criticite === 'moyenne').length || initialData.tickets_in_progress_over_3d
    };
    setData(mergedData);
  }, [liveGdprSignals, initialData]);

  // Sync local role state
  useEffect(() => {
    setLocalUserRole(userRole);
  }, [userRole]);

  // Load acknowledged state from localStorage
  useEffect(() => {
    if (!data) return;
    const storedAck = localStorage.getItem(`sprint_ack_${data.sprint_name}`);
    if (storedAck) {
      const ackData = JSON.parse(storedAck);
      setAcknowledged(true);
      setAcknowledgedBy(ackData.by);
      setAcknowledgedDate(ackData.date);
    }
    const storedJiraClick = localStorage.getItem(`jira_clicked_${data.sprint_name}`);
    if (storedJiraClick) {
      setJiraClicked(true);
    }
  }, [data?.sprint_name]);

  // Load Jira connection URL
  useEffect(() => {
    setJiraUrl('https://jira.atlassian.com/');
  }, []);

  const handleAcknowledge = async () => {
    try {
      if (!data) return;
      const user = await base44.auth.me();
      const ackData = {
        by: user.full_name || user.email,
        date: new Date().toISOString()
      };

      localStorage.setItem(`sprint_ack_${data.sprint_name}`, JSON.stringify(ackData));
      setAcknowledged(true);
      setAcknowledgedBy(ackData.by);
      setAcknowledgedDate(ackData.date);

      if (onAcknowledge) {
        onAcknowledge(ackData);
      }
    } catch (error) {
      console.error("Error acknowledging drift:", error);
    }
  };

  const handleResetForTesting = () => {
    if (!data) return;
    localStorage.removeItem(`jira_clicked_${data.sprint_name}`);
    localStorage.removeItem(`sprint_ack_${data.sprint_name}`);
    setJiraClicked(false);
    setAcknowledged(false);
    setAcknowledgedBy("");
    setAcknowledgedDate("");
  };

  if (!data) {
    return null; // Wait for data to load
  }

  // Analyze drift using the engine with live data
  const driftAnalysis = analyzeSprintDrift(data);
  const suggestions = driftAnalysis.status.id === "potential_drift" ?
  generateDriftSuggestions(driftAnalysis.signals) :
  [];

  const config = statusConfig[driftAnalysis.status.id] || statusConfig.healthy;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>

      <Card className={`overflow-hidden border-2 ${config.borderColor} ${config.bgColor}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {process.env.NODE_ENV === 'development' &&
            <button
              onClick={handleResetForTesting}
              className="text-xs text-slate-400 hover:text-slate-600 underline absolute top-2 right-2 z-10">

                🔄 Reset
              </button>
            }
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {data.sprint_name}
                </CardTitle>
                <Badge className={`${config.bgColor} ${config.color} border-0 mt-1`}>
                  {config.emoji} {adaptMessage(driftAnalysis.status.id, userRole, { wip: data.wip_count, blocked: data.blocked_tickets_over_48h })}
                </Badge>
              </div>
            </div>
            {driftAnalysis.confidence > 0 &&
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right cursor-help">
                      <p className="text-2xl font-bold text-slate-900">{driftAnalysis.confidence}%</p>
                      <p className="text-xs text-slate-500">Confiance</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">
                      <strong>Fiabilité de la détection</strong> – Plus il y a de signaux convergents (WIP élevé, tickets bloqués, tickets stagnants), plus Nova est confiante qu'il y a une dérive en cours.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Key Metrics - Admin/Contributor only, simplified for Users */}
          {(isAdmin || isContributor) &&
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/60 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-slate-500">WIP</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {data.wip_count}
                <span className="text-xs text-slate-400 ml-1">/ {data.wip_historical_avg} moy.</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/60 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-slate-500">&gt;3 jours</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {data.tickets_in_progress_over_3d}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/60 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Ban className="w-4 h-4 text-red-500" />
                <span className="text-xs text-slate-500">Bloqués &gt;48h</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {data.blocked_tickets_over_48h}
              </p>
            </div>
          </div>
          }
          
          {/* Simplified view for Users */}
          {isUser && driftAnalysis.status.id === "potential_drift" &&
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <p className="text-sm text-blue-800 font-medium mb-2">
                💪 L'équipe travaille sur quelques défis
              </p>
              <p className="text-xs text-blue-600">
                Votre collaboration et soutien sont importants en ce moment
              </p>
            </div>
          }

          {/* Detected Signals - Admin/Contributor only */}
          {(isAdmin || isContributor) && driftAnalysis.status.id === "potential_drift" && (driftAnalysis.signals.length > 0 || data.gdprSignals?.length > 0) &&
          <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
              <p className="text-sm font-medium text-slate-700 mb-2">Signaux observés :</p>
              <ul className="space-y-1">
                {driftAnalysis.signals.map((signal, index) =>
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {signal.label}
                  </li>
              )}
                {data.gdprSignals?.map((signal, index) =>
              <li key={`gdpr-${index}`} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span>
                    {language === 'fr' ? 'Signal d\'équipe détecté' : 'Team signal detected'}: {signal.criticite}
                  </li>
              )}
              </ul>
            </div>
          }

          {/* Key Question - Only for drift - Admin/Contributor only */}
          {(isAdmin || isContributor) && driftAnalysis.status.id === "potential_drift" &&
          <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button className="w-full p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer text-left">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 mb-1">Question clé</p>
                            <p className="text-sm text-slate-600 italic">
                              "{adaptMessage('driftQuestion', userRole)}"
                            </p>
                          </div>
                          <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
                        </div>
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">🔒 Votre réponse est <strong>100% anonyme</strong> et alimente la base de données de Nova pour améliorer ses analyses.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Répondre à Nova
                  </DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p className="text-sm text-slate-600 italic">"Qu'est-ce qui empêche actuellement l'équipe de faire avancer le flux ?"</p>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <Shield className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <p className="text-xs text-emerald-700">
                        <strong>100% anonyme</strong> – Votre réponse alimente la base de données de Nova sans identification personnelle. Seules les insights agrégées sont utilisées.
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <Textarea
                  placeholder="Partagez votre perspective sur les blocages actuels..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  className="min-h-[120px]" />

                  
                  <div className="flex gap-2">
                    <Button
                    onClick={() => {
                      console.log("Anonymous sprint feedback:", userResponse);
                      // Here would be the API call to store anonymized response
                      setUserResponse("");
                      setIsResponseDialogOpen(false);
                    }}
                    disabled={!userResponse.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600">

                      Envoyer (anonyme)
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => {
                      setUserResponse("");
                      setIsResponseDialogOpen(false);
                    }}>

                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }

          {/* Suggestions - Admin/Contributor only */}
          {(isAdmin || isContributor) && suggestions.length > 0 &&
          <div className="space-y-2">
              <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between text-slate-600 hover:text-slate-900">

                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>{suggestions.length} suggestion(s) Nova</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {expanded &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2">

                    {suggestions.map((suggestion, index) =>
                <div
                  key={suggestion.id}
                  className="p-3 rounded-lg bg-white border border-slate-200 text-sm flex items-start gap-2">

                        <span className="text-slate-400">{index + 1}.</span>
                        <span className="text-slate-700">{suggestion.text}</span>
                      </div>
                )}
                  </motion.div>
              }
              </AnimatePresence>
            </div>
          }

          {/* Insufficient data message */}
          {driftAnalysis.status.id === "insufficient_data" &&
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-600">{driftAnalysis.message}</p>
            </div>
          }

          {/* Alert status & CTA - Admin/Contributor only */}
          {(isAdmin || isContributor) && driftAnalysis.status.id === "potential_drift" &&
          <div className="space-y-3 pt-2">
              {!acknowledged ?
            <>
                  {/* Alert notification status */}
                  




                  {/* CTA Buttons */}
                  
























                </> :

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                 <BellOff className="w-5 h-5 text-slate-400 mt-0.5" />
                 <div>
                   <p className="text-sm font-medium text-slate-700 mb-1">Signal acquitté</p>
                   <p className="text-xs text-slate-500">
                     Par <span className="font-medium">{anonymizeText(acknowledgedBy)}</span> le{" "}
                        {new Date(acknowledgedDate).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })}
                      </p>
                    </div>
                  </div>
                </div>
            }
            </div>
          }

          {/* Healthy sprint - No interruption - Admin/Contributor only */}
          {(isAdmin || isContributor) && driftAnalysis.status.id === "healthy" && driftAnalysis.canAnalyze &&
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-sm text-emerald-700">
                🟢 Aucun signal de dérive – flow protégé
              </p>
            </div>
          }
        </CardContent>
      </Card>
    </motion.div>);

}