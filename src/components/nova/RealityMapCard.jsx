import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

          {/* Actionable Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full justify-between text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Pistes possibles à explorer ({suggestions.length})</span>
                </div>
                {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={suggestion.id}
                        className="p-3 rounded-lg bg-white border border-slate-200"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-medium">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-900">{suggestion.text}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                              <span className="text-slate-500">Effort: <span className="font-medium">{suggestion.effort}</span></span>
                              <span className="text-slate-400">•</span>
                              <span className="text-emerald-600">{suggestion.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <div className="flex gap-2">
                <Button
                  onClick={onDiscussSignals}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuter ces signaux avec les acteurs concernés
                </Button>
                <Button
                  disabled
                  variant="outline"
                  className="opacity-50 cursor-not-allowed"
                  title="Validation Coach requise"
                >
                  APPLY RECOS
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}