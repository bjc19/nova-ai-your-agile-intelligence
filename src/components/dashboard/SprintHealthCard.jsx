import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Ban,
  Lightbulb,
  Bell,
  BellOff
} from "lucide-react";
import { RISK_THRESHOLDS } from "@/components/nova/SprintDriftDetector";

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "En bonne santé",
    progressColor: "bg-emerald-500"
  },
  at_risk: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "À risque",
    progressColor: "bg-amber-500"
  },
  critical: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Critique",
    progressColor: "bg-red-500"
  }
};

export default function SprintHealthCard({ sprintHealth, onAcknowledgeAlert }) {
  const [expanded, setExpanded] = useState(false);

  // Default/demo data if none provided
  const data = sprintHealth || {
    sprint_name: "Sprint 12",
    risk_score: 45,
    status: "healthy",
    wip_count: 6,
    wip_historical_avg: 5,
    tickets_in_progress_over_3d: 1,
    blocked_tickets_over_48h: 0,
    recommendations: [],
    problematic_tickets: []
  };

  const config = statusConfig[data.status] || statusConfig.healthy;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`overflow-hidden border-2 ${config.borderColor} ${config.bgColor}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${config.bgColor}`}>
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {data.sprint_name}
                </CardTitle>
                <Badge className={`${config.bgColor} ${config.color} border-0 mt-1`}>
                  {config.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{data.risk_score}%</p>
              <p className="text-xs text-slate-500">Score de risque</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Risk Score Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>0%</span>
              <span className="text-amber-600">{RISK_THRESHOLDS.AT_RISK}%</span>
              <span className="text-red-600">{RISK_THRESHOLDS.CRITICAL}%</span>
              <span>100%</span>
            </div>
            <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.risk_score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`absolute h-full ${config.progressColor} rounded-full`}
              />
              {/* Threshold markers */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400" 
                style={{ left: `${RISK_THRESHOLDS.AT_RISK}%` }} 
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-400" 
                style={{ left: `${RISK_THRESHOLDS.CRITICAL}%` }} 
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
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
                <span className="text-xs text-slate-500">Bloqués</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {data.blocked_tickets_over_48h}
              </p>
            </div>
          </div>

          {/* Alert Status */}
          {data.status !== "healthy" && (
            <div className={`p-3 rounded-xl ${config.bgColor} border ${config.borderColor} mb-4`}>
              <div className="flex items-start gap-3">
                {data.alert_sent ? (
                  <BellOff className="w-5 h-5 text-slate-400 mt-0.5" />
                ) : (
                  <Bell className={`w-5 h-5 ${config.color} mt-0.5`} />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${config.color}`}>
                    {data.alert_sent 
                      ? "Alerte envoyée au SM et PO" 
                      : "Alerte en attente d'envoi (J3-J5)"}
                  </p>
                  {data.alert_sent_date && (
                    <p className="text-xs text-slate-500">
                      Envoyée le {new Date(data.alert_sent_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {!data.alert_sent && onAcknowledgeAlert && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onAcknowledgeAlert}
                    className="text-xs"
                  >
                    Acquitter
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">Recommandation Nova</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <p className="text-sm text-slate-700">{data.recommendations[0]}</p>
              </div>
            </div>
          )}

          {/* Expand for problematic tickets */}
          {data.problematic_tickets && data.problematic_tickets.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3 text-slate-500"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Masquer les détails
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Voir les {data.problematic_tickets.length} tickets problématiques
                  </>
                )}
              </Button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {data.problematic_tickets.map((ticket, index) => (
                      <div 
                        key={index}
                        className="p-3 rounded-lg bg-white border border-slate-200 text-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs text-slate-500">{ticket.ticket_id}</span>
                            <p className="font-medium text-slate-900">{ticket.title}</p>
                          </div>
                          <Badge variant="outline" className={
                            ticket.status === "blocked" ? "text-red-600 border-red-200" : "text-amber-600 border-amber-200"
                          }>
                            {ticket.days_in_status}j
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {ticket.assignee} • {ticket.status}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}