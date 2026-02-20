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

export default function SprintHealthCard({ sprintHealth, onAcknowledge, onReviewSprint, selectedWorkspaceId = null, selectedWorkspaceType = null }) {
  // GUARD: Never render without real sprint data
  if (!sprintHealth) {
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

  // RULE: Always use only real sprint data — no fallback, no defaults ever
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

    // Fetch initial GDPR signals with cache, filtered by workspace
    const fetchFn = selectedWorkspaceId && selectedWorkspaceType === 'jira'
      ? () => base44.entities.GDPRMarkers.filter({ jira_project_selection_id: selectedWorkspaceId })
      : selectedWorkspaceId && selectedWorkspaceType === 'trello'
      ? () => base44.entities.GDPRMarkers.filter({ trello_project_selection_id: selectedWorkspaceId })
      : () => base44.entities.GDPRMarkers.list('-created_date', 100);

    cache.get(
      `gdpr-markers-sprint-${selectedWorkspaceId || 'all'}`,
      fetchFn,
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

      




















































































































































































































































































































    </motion.div>);

}