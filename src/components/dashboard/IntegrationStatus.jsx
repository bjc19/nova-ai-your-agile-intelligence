import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { getCacheService } from "@/components/hooks/useCacheService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Zap,
  RefreshCw,
  Database } from
"lucide-react";

export default function IntegrationStatus({ integrations = {} }) {
  const { t } = useLanguage();
  const [slackConnected, setSlackConnected] = useState(false);
  const [teamsConnected, setTeamsConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [trelloConnected, setTrelloConnected] = useState(false);
  const [confluenceConnected, setConfluenceConnected] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const checkConnections = async () => {
    try {
      const cache = getCacheService();
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const user = await base44.auth.me();
        setUserRole(user?.app_role || user?.role || 'user');

        // Use cache with 5-minute TTL to prevent 429 errors
        const [slackConns, teamsConns, jiraConns, trelloConns, confluenceConns] = await Promise.all([
        cache.get('slack-conns', () => base44.entities.SlackConnection.filter({ is_active: true }), 300),
        cache.get('teams-conns', () => base44.entities.TeamsConnection.filter({ is_active: true }), 300),
        cache.get('jira-conns', () => base44.entities.JiraConnection.filter({ is_active: true }), 300),
        cache.get('trello-conns', () => base44.entities.TrelloConnection.filter({ is_active: true }), 300),
        cache.get('confluence-conns', () => base44.entities.ConfluenceConnection.filter({ is_active: true }), 300)]
        );

        setSlackConnected(slackConns.length > 0);
        setTeamsConnected(teamsConns.length > 0);
        setJiraConnected(jiraConns.length > 0);
        setTrelloConnected(trelloConns.length > 0);
        setConfluenceConnected(confluenceConns.length > 0);
      }
    } catch (error) {
      console.error("Error checking connections:", error);
    }
  };

  useEffect(() => {
    checkConnections();

    // Debounced focus handler to avoid rate limit (min 60s between focus refetches)
    let lastFetch = Date.now();
    const handleStorageChange = () => {
      const now = Date.now();
      if (now - lastFetch > 60000) {// 60 seconds minimum between fetches
        lastFetch = now;
        // Invalidate cache to force fresh fetch on focus
        const cache = getCacheService();
        cache.invalidate('slack-conns');
        cache.invalidate('teams-conns');
        cache.invalidate('jira-conns');
        cache.invalidate('trello-conns');
        cache.invalidate('confluence-conns');
        checkConnections();
      }
    };
    window.addEventListener('focus', handleStorageChange);
    return () => window.removeEventListener('focus', handleStorageChange);
  }, []);

  const defaultIntegrations = {
    slack: {
      connected: slackConnected,
      label: "Slack",
      status: slackConnected ? "connected" : "disconnected"
    },
    teams: {
      connected: teamsConnected,
      label: "Microsoft Teams",
      status: teamsConnected ? "connected" : "disconnected"
    },
    jira: {
      connected: jiraConnected,
      label: "Jira",
      status: jiraConnected ? "connected" : "disconnected"
    },
    trello: {
      connected: trelloConnected,
      label: "Trello",
      status: trelloConnected ? "connected" : "disconnected"
    },
    confluence: {
      connected: confluenceConnected,
      label: "Confluence",
      status: confluenceConnected ? "connected" : "disconnected"
    },
    azure: { connected: false, label: "Azure DevOps", status: "coming_soon" },
    zoom: { connected: false, label: "Zoom", status: "coming_soon" }
  };

  const displayIntegrations = { ...defaultIntegrations, ...integrations };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
      label: t('connected'),
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200"
    },
    disconnected: {
      icon: XCircle,
      color: "text-slate-400",
      bgColor: "bg-slate-100",
      label: t('notConnected'),
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200"
    },
    unavailable: {
      icon: AlertCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      label: t('requiresBackend'),
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200"
    },
    coming_soon: {
      icon: Zap,
      color: "text-slate-500",
      bgColor: "bg-slate-100",
      label: t('comingSoon'),
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200"
    }
  };

  const connectedCount = Object.values(displayIntegrations).filter((i) => i.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}>

      <Card>
        



















        












































      </Card>
    </motion.div>);

}