import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  ExternalLink,
  MessageSquare,
  Clock,
  Sparkles,
  Send,
  Shield
} from "lucide-react";
import { RISK_LEVELS } from "./ProductGoalAlignmentEngine";

const riskConfig = {
  stable: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  partial: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  instability: {
    icon: AlertOctagon,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  misaligned: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  insufficient: {
    icon: HelpCircle,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const effortBadge = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function ProductGoalCard({ 
  alignmentReport, 
  onConfirmGoal, 
  onAdjustGoal,
  onShareStatus 
}) {
  const [expanded, setExpanded] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [response, setResponse] = useState("");
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [questionResponse, setQuestionResponse] = useState("");

  if (!alignmentReport) return null;

  const { risk, message, question, suggestions = [], cta, productGoal, averageAlignment } = alignmentReport;
  const config = riskConfig[risk.id] || riskConfig.insufficient;
  const RiskIcon = config.icon;

  const handleCTAClick = () => {
    if (cta?.action === "confirm_goal") {
      setShowResponseInput(true);
    } else if (cta?.action === "adjust_sprint_goal") {
      onAdjustGoal?.();
    } else if (cta?.action === "share_status") {
      onShareStatus?.();
    }
  };

  const handleSubmitResponse = () => {
    onConfirmGoal?.(response);
    setShowResponseInput(false);
    setResponse("");
  };

  const handleSubmitQuestionResponse = () => {
    // Save the response to feed Nova's learning
    console.log("Question response:", questionResponse);
    // TODO: Save to database or call API to feed AI learning
    setShowQuestionDialog(false);
    setQuestionResponse("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`overflow-hidden border-2 ${config.borderColor} ${config.bgColor}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                <RiskIcon className={`w-5 h-5 ${config.textColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Alignement Product Goal
                  </CardTitle>
                  <Badge className={config.badgeClass}>
                    {risk.label}
                  </Badge>
                </div>
                {productGoal && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Target className="w-4 h-4" />
                    <span className="font-medium">{productGoal.title}</span>
                    {productGoal.version && (
                      <span className="text-xs text-slate-400">v{productGoal.version}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {averageAlignment !== undefined && (
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{averageAlignment}%</p>
                <p className="text-xs text-slate-500">Score moyen</p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Message */}
          <div className={`p-3 rounded-xl bg-white/60 border ${config.borderColor}`}>
            <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
          </div>

          {/* Question for PO */}
          {question && (
            <div 
              className="p-4 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
              onClick={() => setShowQuestionDialog(true)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-700">Question pour le Product Owner</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">Vos réponses sont anonymes et servent uniquement à améliorer les recommandations de Nova</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-slate-600 italic group-hover:text-slate-900 transition-colors">"{question}"</p>
                  <p className="text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Cliquez pour répondre →
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Response Input */}
          <AnimatePresence>
            {showResponseInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Textarea
                  placeholder="Décrivez les apprentissages et votre décision concernant le cap..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="min-h-[100px] bg-white"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitResponse}
                    disabled={!response.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Confirmer le cap
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowResponseInput(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          {suggestions.length > 0 && !showResponseInput && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>{suggestions.length} suggestion(s) Nova</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-medium text-slate-900">{suggestion.title}</span>
                              {suggestion.effort && (
                                <Badge variant="outline" className={`text-xs ${effortBadge[suggestion.effort]}`}>
                                  {suggestion.effort === "low" ? "Rapide" : suggestion.effort === "medium" ? "Moyen" : "Long"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{suggestion.description}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* CTA Button */}
          {cta && !showResponseInput && (
            <Button
              onClick={handleCTAClick}
              className={`w-full ${
                cta.urgent 
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              } text-white`}
            >
              {cta.label}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Confirmation status */}
          {productGoal?.confirmed_date && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Dernière confirmation: {new Date(productGoal.confirmed_date).toLocaleDateString('fr-FR')} 
                {productGoal.confirmed_by && ` par ${productGoal.confirmed_by}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Response Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">Réponse du Product Owner</DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">Réservé exclusivement au PO</p>
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-600">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-3">
                <p className="italic">"{question}"</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Identifié.</strong> Votre nom sera enregistré avec cette réponse pour tracer les décisions du Product Owner 
                  et maintenir la cohérence du Product Goal.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Partagez votre perspective, vos observations, ou tout contexte pertinent..."
              value={questionResponse}
              onChange={(e) => setQuestionResponse(e.target.value)}
              className="min-h-[150px]"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 p-3 rounded-lg bg-blue-50/50">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <p>
                Nova utilise vos réponses pour apprendre et s'améliorer. Plus vous partagez, plus ses recommandations deviennent pertinentes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitQuestionResponse}
              disabled={!questionResponse.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer ma réponse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}