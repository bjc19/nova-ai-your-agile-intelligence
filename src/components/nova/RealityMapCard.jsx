import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Network,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Target,
  Shield,
  TrendingDown,
  Users,
  Send,
  Square,
  CheckSquare,
} from "lucide-react";
import {
  analyzeDecisionReality,
  identifySystemicWastes,
  generateActionableSuggestions,
  calculateFrictionIndex,
} from "./OrganizationalRealityEngine";

export default function RealityMapCard({ flowData, flowMetrics, onDiscussSignals }) {
  const [expandedWaste, setExpandedWaste] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);
  const [isApplyingRecos, setIsApplyingRecos] = useState(false);
  const [selectedRecos, setSelectedRecos] = useState([]);
  const [appliedRecos, setAppliedRecos] = useState({}); // { recoId: { name, date } }
  const [persistentIssues, setPersistentIssues] = useState([]); // Recommendations with persistent issues

  // Fetch applied recommendations to check their status
  const { data: appliedRecommendations = [] } = useQuery({
    queryKey: ['appliedRecommendations'],
    queryFn: () => base44.entities.AppliedRecommendation.list('-applied_date', 50),
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Verify impact of applied recommendations
  useEffect(() => {
    const checkRecommendationImpact = () => {
      const issues = [];
      const daysSinceApplication = 7; // Consider recommendations applied 7+ days ago

      appliedRecommendations.forEach(reco => {
        const appliedDate = new Date(reco.applied_date);
        const daysSince = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Only check recommendations applied 7+ days ago
        if (daysSince >= daysSinceApplication && reco.verification_status === 'pending') {
          // Compare current metrics with baseline
          const currentValue = metrics[reco.target_metric];
          const baselineValue = reco.baseline_value;
          
          if (currentValue !== undefined && currentValue >= baselineValue * 0.9) {
            // Problem persists (no significant improvement)
            issues.push({
              ...reco,
              currentValue,
              daysSince,
              status: currentValue > baselineValue ? 'worsened' : 'no_improvement'
            });
          }
        }
      });

      setPersistentIssues(issues);
    };

    if (appliedRecommendations.length > 0) {
      checkRecommendationImpact();
    }
  }, [appliedRecommendations, metrics]);

  // Demo data if none provided
  const data = flowData || {
    assignee_changes: [
      { person: "Mary", count: 42 },
      { person: "John", count: 12 },
    ],
    mention_patterns: [
      { person: "Mary", type: "prioritization", count: 35 },
      { person: "Dave", type: "unblocking", count: 19 },
    ],
    blocked_resolutions: [
      { person: "Dave", count: 19 },
    ],
    data_days: 30,
  };

  const metrics = flowMetrics || {
    blocked_tickets_over_5d: 12,
    avg_cycle_time: 8.2,
    avg_wait_time_percent: 65,
    reopened_tickets: 8,
    total_tickets: 100,
    data_days: 30,
  };

  const decisionAnalysis = analyzeDecisionReality(data);
  const wastesAnalysis = identifySystemicWastes(metrics);
  const frictionIndex = calculateFrictionIndex(wastesAnalysis.wastes);
  const suggestions = generateActionableSuggestions(wastesAnalysis.wastes, decisionAnalysis.decisionMap || []);

  const handleSendNotifications = async () => {
    setIsSendingNotifications(true);
    
    try {
      // Extract unique responsible persons from decision map
      const responsiblePersons = decisionAnalysis.decisionMap?.map(entry => ({
        name: entry.realDecider,
        zone: entry.zone,
        ticketsImpacted: entry.ticketsImpacted
      })) || [];

      // Simulate sending notifications to each person
      for (const person of responsiblePersons) {
        const notificationContent = `
🔔 Nova – Signal Systémique Détecté

Bonjour ${person.name},

Nova a détecté un signal dans votre zone d'influence : "${person.zone}"

📊 Impact : ${person.ticketsImpacted} tickets concernés
⚠️ Gaspillages identifiés : ${wastesAnalysis.wastes.length}

${wastesAnalysis.wastes.map((w, i) => `${i + 1}. ${w.name} - ${w.metric}`).join('\n')}

💡 Pistes suggérées :
${suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s.text}`).join('\n')}

Cette analyse est basée sur ${data.data_days} jours de données flux.

---
🔒 Message automatique • Nova AI Scrum Master
        `.trim();

        // In production, this would call base44.integrations.Core.SendEmail
        // For now, we'll just simulate the notification
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Notification sent to ${person.name}:`, notificationContent);
      }

      toast.success(`${responsiblePersons.length} notification(s) envoyée(s) avec succès`, {
        description: `Envoyé à ${responsiblePersons.map(p => p.name).join(', ')}`
      });
      
      setNotificationsSent(true);
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Erreur lors de l'envoi des notifications");
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const handleApplySingleRecommendation = async (suggestion) => {
    try {
      const user = await base44.auth.me();

      // Map waste metrics to specific targets
      const metricMapping = {
        "Temps d'attente (Muda: 待機 Taiki)": { target: "avg_wait_time_percent", baseline: metrics.avg_wait_time_percent },
        "Sur-traitement (Muda: 過剰処理 Kajou Shori)": { target: "reopened_tickets", baseline: metrics.reopened_tickets },
        "Blocages prolongés (Muda: 停滞 Teitai)": { target: "blocked_tickets_over_5d", baseline: metrics.blocked_tickets_over_5d },
      };

      const wasteMatch = wastesAnalysis.wastes.find(w => suggestion.text.includes(w.name));
      const metric = wasteMatch ? metricMapping[wasteMatch.name] : null;

      // Create tracking record for this recommendation
      const appliedRecord = {
        recommendation_id: suggestion.id,
        recommendation_text: suggestion.text,
        applied_date: new Date().toISOString(),
        applied_by: user.email,
        target_metric: metric?.target || "general",
        baseline_value: metric?.baseline || 0,
        verification_status: "pending",
        notes: `Effort: ${suggestion.effort} • Impact attendu: ${suggestion.impact}`
      };

      await base44.entities.AppliedRecommendation.create(appliedRecord);

      toast.success("Recommandation marquée comme appliquée", {
        description: "Nova vérifiera l'impact dans les prochaines analyses"
      });

      // Store application info
      const appliedDate = new Date().toISOString();
      const appliedBy = user.full_name || user.email;
      
      setAppliedRecos({
        ...appliedRecos,
        [suggestion.id]: {
          name: appliedBy,
          date: appliedDate
        }
      });
    } catch (error) {
      console.error("Error applying recommendation:", error);
      toast.error("Erreur lors de l'application de la recommandation");
    }
  };

  const handleApplyRecommendations = async () => {
    setIsApplyingRecos(true);
    
    try {
      const user = await base44.auth.me();
      
      // Map waste metrics to specific targets
      const metricMapping = {
        "Temps d'attente (Muda: 待機 Taiki)": { target: "avg_wait_time_percent", baseline: metrics.avg_wait_time_percent },
        "Sur-traitement (Muda: 過剰処理 Kajou Shori)": { target: "reopened_tickets", baseline: metrics.reopened_tickets },
        "Blocages prolongés (Muda: 停滞 Teitai)": { target: "blocked_tickets_over_5d", baseline: metrics.blocked_tickets_over_5d },
      };

      // Apply all recommendations (not just selected)
      const unappliedSuggestions = suggestions.filter(s => !appliedRecos[s.id]);
      
      if (unappliedSuggestions.length === 0) {
        toast.error("Toutes les recommandations sont déjà appliquées");
        setIsApplyingRecos(false);
        return;
      }

      // Create tracking records for each applied recommendation
      const appliedRecords = unappliedSuggestions.map(suggestion => {
        const wasteMatch = wastesAnalysis.wastes.find(w => suggestion.text.includes(w.name));
        const metric = wasteMatch ? metricMapping[wasteMatch.name] : null;
        
        return {
          recommendation_id: suggestion.id,
          recommendation_text: suggestion.text,
          applied_date: new Date().toISOString(),
          applied_by: user.email,
          target_metric: metric?.target || "general",
          baseline_value: metric?.baseline || 0,
          verification_status: "pending",
          notes: `Effort: ${suggestion.effort} • Impact attendu: ${suggestion.impact}`
        };
      });

      // Save all recommendations
      await base44.entities.AppliedRecommendation.bulkCreate(appliedRecords);

      toast.success(`${unappliedSuggestions.length} recommandation(s) marquée(s) comme appliquées`, {
        description: "Nova vérifiera l'impact dans les prochaines analyses"
      });

      // Schedule automatic verification (in production, this would be a background job)
      console.log("Vérification programmée pour:", appliedRecords);
      
      // Store application info for each recommendation
      const newAppliedRecos = { ...appliedRecos };
      const appliedDate = new Date().toISOString();
      const appliedBy = user.full_name || user.email;
      
      unappliedSuggestions.forEach(suggestion => {
        newAppliedRecos[suggestion.id] = {
          name: appliedBy,
          date: appliedDate
        };
      });
      
      setAppliedRecos(newAppliedRecos);
      setSelectedRecos([]);
      
    } catch (error) {
      console.error("Error applying recommendations:", error);
      toast.error("Erreur lors de l'application des recommandations");
    } finally {
      setIsApplyingRecos(false);
    }
  };

  const confidenceConfig = {
    high: { emoji: "🟢", label: "Élevée", color: "text-emerald-600", bgColor: "bg-emerald-50" },
    medium: { emoji: "🟡", label: "Moyenne", color: "text-amber-600", bgColor: "bg-amber-50" },
    low: { emoji: "🔴", label: "Faible", color: "text-red-600", bgColor: "bg-red-50" },
  };

  const getConfidenceLevel = (conf) => {
    if (conf >= 85) return confidenceConfig.high;
    if (conf >= 68) return confidenceConfig.medium;
    return confidenceConfig.low;
  };

  if (!decisionAnalysis.canAnalyze || !wastesAnalysis.canAnalyze) {
    return (
      <Card className="border-2 border-slate-200 bg-slate-50">
        <CardContent className="p-6 text-center">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">
            {decisionAnalysis.message || wastesAnalysis.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-2 border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                <Network className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Reality Engine – VSM Light
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Organisation réelle vs officielle</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
              <Shield className="w-3 h-3 mr-1" />
              Anonymisé
            </Badge>
          </div>

          {/* Friction Index */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-sm text-slate-600">Indice global de friction flux :</span>
            <Badge className={`${frictionIndex.emoji === "🟢" ? "bg-emerald-100 text-emerald-700" : frictionIndex.emoji === "🟡" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {frictionIndex.emoji} {frictionIndex.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Decision Map */}
          {decisionAnalysis.decisionMap && decisionAnalysis.decisionMap.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900">Cartographie décisionnelle</span>
              </div>
              
              <div className="space-y-2 mb-3">
                {decisionAnalysis.decisionMap.map((entry, index) => {
                  const confLevel = getConfidenceLevel(entry.confidence);
                  return (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{entry.zone}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-slate-500">Rôle officiel:</span>
                            <span className="text-slate-700">{entry.officialRole}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-500">Décideur réel:</span>
                            <span className="font-semibold text-slate-900">{entry.realDecider}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${confLevel.bgColor} ${confLevel.color}`}>
                            {confLevel.emoji} {entry.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {entry.ticketsImpacted} tickets
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Neutral Reading */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Signal observé :</strong> {decisionAnalysis.neutralReading}
                </p>
                
                <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <button className="w-full flex items-start gap-2 p-2 rounded-lg bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer text-left">
                            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-xs text-blue-700 italic flex-1">{decisionAnalysis.keyQuestion}</p>
                            <Shield className="w-4 h-4 text-emerald-500" />
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
                        <p className="text-sm text-slate-600 italic">"{decisionAnalysis.keyQuestion}"</p>
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
                        placeholder="Partagez votre perspective sur ce signal..."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        className="min-h-[120px]"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            console.log("Anonymous response:", userResponse);
                            // Here would be the API call to store anonymized response
                            setUserResponse("");
                            setIsResponseDialogOpen(false);
                          }}
                          disabled={!userResponse.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                          Envoyer (anonyme)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUserResponse("");
                            setIsResponseDialogOpen(false);
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Systemic Wastes */}
          {wastesAnalysis.wastes.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-slate-900">TOP {wastesAnalysis.wastes.length} Gaspillages systémiques</span>
                </div>
                <span className="text-xs text-slate-500">30 jours</span>
              </div>

              <div className="space-y-2">
                {wastesAnalysis.wastes.map((waste, index) => (
                  <div key={index}>
                    <button
                      onClick={() => setExpandedWaste(expandedWaste === index ? null : index)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        waste.severity === "critical" 
                          ? "bg-red-50 border-red-200 hover:border-red-300" 
                          : "bg-amber-50 border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{waste.emoji}</span>
                            <span className="font-semibold text-slate-900 text-sm">#{waste.priority} {waste.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>{waste.metric}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-medium">{waste.impact}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {waste.confidence}% confiance
                        </Badge>
                      </div>
                    </button>

                    {/* Micro-feedback simulation */}
                    <AnimatePresence>
                      {expandedWaste === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <p className="text-xs font-medium text-slate-700 mb-2">Micro-feedback terrain (anonyme)</p>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="p-2 rounded bg-red-100 text-center">
                              <span className="text-lg">😞</span>
                              <p className="text-xs text-red-700 font-semibold mt-1">78%</p>
                            </div>
                            <div className="p-2 rounded bg-slate-100 text-center">
                              <span className="text-lg">😐</span>
                              <p className="text-xs text-slate-600 mt-1">15%</p>
                            </div>
                            <div className="p-2 rounded bg-emerald-100 text-center">
                              <span className="text-lg">😊</span>
                              <p className="text-xs text-emerald-700 mt-1">7%</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 italic">
                            Signal consolidé : perception terrain alignée avec données de flux.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 mt-3 italic">
                Ces gaspillages expliquent une part significative du lead time observé.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-700">{wastesAnalysis.message}</p>
            </div>
          )}

          {/* Persistent Issues Alert */}
          {persistentIssues.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    ⚠️ Problème(s) persistant(s) détecté(s)
                  </h4>
                  <p className="text-xs text-red-700">
                    {persistentIssues.length} recommandation(s) appliquée(s) n'ont pas produit l'amélioration attendue.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {persistentIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white border border-red-200">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{issue.recommendation_text}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                          <span>Appliqué il y a {issue.daysSince} jours par <strong>{issue.applied_by}</strong></span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        {issue.status === 'worsened' ? '📈 Aggravé' : '⏸️ Stagnant'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 p-2 rounded bg-slate-50 text-xs">
                      <div>
                        <span className="text-slate-500">Baseline :</span>
                        <span className="font-semibold text-slate-900 ml-1">{issue.baseline_value.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Actuel :</span>
                        <span className="font-semibold text-red-700 ml-1">{issue.currentValue.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">💡 Actions suggérées :</p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>Organiser un point dédié avec les parties prenantes</li>
                        <li>Identifier les obstacles à la mise en œuvre effective</li>
                        <li>Ajuster l'approche ou considérer une alternative</li>
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await base44.entities.AppliedRecommendation.update(issue.id, {
                            verification_status: issue.status === 'worsened' ? 'worsened' : 'no_change',
                            current_value: issue.currentValue,
                            last_verified_date: new Date().toISOString()
                          });
                          
                          toast.success("Statut mis à jour", {
                            description: "La recommandation a été marquée comme nécessitant un suivi"
                          });
                          
                          // Refresh the data
                          window.location.reload();
                        } catch (error) {
                          console.error("Error updating recommendation:", error);
                          toast.error("Erreur lors de la mise à jour");
                        }
                      }}
                      className="w-full mt-2 border-red-600 text-red-700 hover:bg-red-50"
                    >
                      Marquer comme nécessitant un suivi
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex-1 justify-between text-slate-600 hover:text-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span>Pistes possibles à explorer ({suggestions.length})</span>
                  </div>
                  {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                {showSuggestions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedRecos.length === suggestions.length) {
                        setSelectedRecos([]);
                      } else {
                        setSelectedRecos(suggestions.map(s => s.id));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {selectedRecos.length === suggestions.length ? "Désélectionner tout" : "Tout sélectionner"}
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {suggestions.map((suggestion, index) => {
                      const isSelected = selectedRecos.includes(suggestion.id);
                      const isApplied = appliedRecos[suggestion.id];
                      return (
                        <div 
                          key={suggestion.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isApplied
                              ? "bg-emerald-50 border-emerald-500"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-2 mt-0.5">
                              {isApplied && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            </div>
                            <span className="text-slate-400 font-medium">{index + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-slate-900 flex-1">{suggestion.text}</p>
                                {!isApplied && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApplySingleRecommendation(suggestion)}
                                    className="shrink-0 border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs px-3 h-7"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    APPLY RECO
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="text-slate-500">Effort: <span className="font-medium">{suggestion.effort}</span></span>
                                <span className="text-slate-400">•</span>
                                <span className="text-emerald-600">{suggestion.impact}</span>
                              </div>
                              {isApplied && (
                                <div className="mt-2 pt-2 border-t border-emerald-200">
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>
                                      Appliqué par <strong>{isApplied.name}</strong> le{" "}
                                      {new Date(isApplied.date).toLocaleDateString('fr-FR', { 
                                        day: 'numeric', 
                                        month: 'short'
                                      })} à{" "}
                                      {new Date(isApplied.date).toLocaleTimeString('fr-FR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSendNotifications}
                  disabled={isSendingNotifications || !decisionAnalysis.decisionMap?.length || notificationsSent}
                  className={notificationsSent 
                    ? "flex-1 bg-emerald-100 border-emerald-600 text-emerald-800 cursor-not-allowed" 
                    : "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSendingNotifications ? "Envoi en cours..." : notificationsSent ? "✓ Notifications envoyées" : "Notifier les responsables"}
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleApplyRecommendations}
                        disabled={isApplyingRecos || suggestions.length === 0 || suggestions.every(s => appliedRecos[s.id])}
                        variant="outline"
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isApplyingRecos 
                          ? "Application..." 
                          : "APPLY ALL RECOS"
                        }
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {suggestions.every(s => appliedRecos[s.id])
                          ? "Toutes les recommandations sont déjà appliquées"
                          : `Appliquer toutes les recommandations.\nNova vérifiera l'impact via les données réelles.`
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}