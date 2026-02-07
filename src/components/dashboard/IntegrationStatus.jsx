import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
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
  Database
} from "lucide-react";

export default function IntegrationStatus({ integrations = {} }) {
  const { t } = useLanguage();
  const [slackConnected, setSlackConnected] = useState(false);
  const [teamsConnected, setTeamsConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  
  const checkConnections = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const user = await base44.auth.me();
        
        const [slackConns, teamsConns, jiraConns] = await Promise.all([
          base44.entities.SlackConnection.filter({ 
            user_email: user.email,
            is_active: true
          }),
          base44.entities.TeamsConnection.filter({ 
            user_email: user.email,
            is_active: true
          }),
          base44.entities.JiraConnection.filter({ 
            user_email: user.email,
            is_active: true
          })
        ]);
        
        setSlackConnected(slackConns.length > 0);
        setTeamsConnected(teamsConns.length > 0);
        setJiraConnected(jiraConns.length > 0);
      }
    } catch (error) {
      console.error("Error checking connections:", error);
    }
  };

  useEffect(() => {
    checkConnections();
    
    // Listen for connection updates from Settings page
    const handleStorageChange = () => {
      checkConnections();
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
    azure: { connected: false, label: "Azure DevOps", status: "coming_soon" },
    trello: { connected: false, label: "Trello", status: "coming_soon" },
    confluence: { connected: false, label: "Confluence", status: "coming_soon" },
    zoom: { connected: false, label: "Zoom", status: "coming_soon" },
  };

  const displayIntegrations = { ...defaultIntegrations, ...integrations };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
      label: t('connected'),
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    disconnected: {
      icon: XCircle,
      color: "text-slate-400",
      bgColor: "bg-slate-100",
      label: t('notConnected'),
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    },
    unavailable: {
      icon: AlertCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      label: t('requiresBackend'),
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    },
    coming_soon: {
      icon: Zap,
      color: "text-slate-500",
      bgColor: "bg-slate-100",
      label: t('comingSoon'),
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const connectedCount = Object.values(displayIntegrations).filter(i => i.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {t('integrationStatus')}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {connectedCount} {t('connectedOf')} {Object.keys(displayIntegrations).length} {t('connected').toLowerCase()}
              </p>
            </div>
            <Link to={createPageUrl("Settings")}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                {t('manage')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {Object.entries(displayIntegrations).map(([key, integration], index) => {
              const status = statusConfig[integration.status] || statusConfig.disconnected;
              const StatusIcon = status.icon;

              const icon = key === 'jira' ? Database : MessageSquare;
              const IconComponent = icon;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${status.bgColor}`}>
                      <IconComponent className={`w-4 h-4 ${status.color}`} />
                    </div>
                    <span className="font-medium text-slate-700">{integration.label}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${status.badgeClass}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t('lastSyncCheck')}</span>
              <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                {t('refresh')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}