import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAccessControl } from "@/components/dashboard/useAccessControl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import WorkspaceAccessManagement from "@/components/settings/WorkspaceAccessManagement";
import WorkspaceMemberAssignment from "@/components/workspace/WorkspaceMemberAssignment";
import AccountDeletionSection from "@/components/settings/AccountDeletionSection";
import JoinTeamRequestsAdmin from "@/components/subscription/JoinTeamRequestsAdmin";
import PlanAssignmentSection from "@/components/settings/PlanAssignmentSection";
import PlanLimitationsDisplay from "@/components/settings/PlanLimitationsDisplay";
import {
  ArrowLeft,
  MessageSquare,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Slack,
  FileSpreadsheet,
  Lock,
  Zap,
  Settings as SettingsIcon,
  Languages,
  Target,
  Layers,
  Database,
  AlertTriangle } from
"lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackTeamName, setSlackTeamName] = useState(null);
  const [connectingSlack, setConnectingSlack] = useState(false);
  const [teamsConnected, setTeamsConnected] = useState(false);
  const [connectingTeams, setConnectingTeams] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [connectingJira, setConnectingJira] = useState(false);
  const [confluenceConnected, setConfluenceConnected] = useState(false);
  const [connectingConfluence, setConnectingConfluence] = useState(false);
  const [trelloConnected, setTrelloConnected] = useState(false);
  const [connectingTrello, setConnectingTrello] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [teamConfig, setTeamConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [currentRole, setCurrentRole] = useState('user');
   const [switchingRole, setSwitchingRole] = useState(false);
   const [jiraDebugInfo, setJiraDebugInfo] = useState(null);
   const [planLimitations, setPlanLimitations] = useState(null);
   const [loadingLimitations, setLoadingLimitations] = useState(true);

  const loadSlackConnection = async () => {
    try {
      const user = await base44.auth.me();
      const slackConns = await base44.entities.SlackConnection.filter({
        user_email: user.email,
        is_active: true
      });

      if (slackConns.length > 0) {
        setSlackConnected(true);
        setSlackTeamName(slackConns[0].team_name);
      } else {
        setSlackConnected(false);
        setSlackTeamName(null);
      }
    } catch (error) {
      console.error('Error loading Slack connection:', error);
      setSlackConnected(false);
      setSlackTeamName(null);
    }
  };

  const handleSlackConnect = async () => {
    try {
      setConnectingSlack(true);
      const { data } = await base44.functions.invoke('slackOAuthStart');

      // Open popup for OAuth
      const popup = window.open(data.authUrl, 'Slack OAuth', 'width=600,height=700');

      // Listen for callback
      const handleMessage = async (event) => {
        if (event.data.type === 'slack_success') {
          // Decode connection data
          const connectionData = JSON.parse(atob(event.data.data));

          // Save connection through authenticated endpoint
          await base44.functions.invoke('slackSaveConnection', connectionData);

          // Reload connection to get fresh data
          await loadSlackConnection();
          window.removeEventListener('message', handleMessage);
          setConnectingSlack(false);
        } else if (event.data.type === 'slack_error') {
          console.error('Slack connection error:', event.data.error);
          window.removeEventListener('message', handleMessage);
          setConnectingSlack(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error starting Slack OAuth:', error);
      setConnectingSlack(false);
    }
  };

  const handleSlackDisconnect = async () => {
    try {
      const { data } = await base44.functions.invoke('slackDisconnect');
      if (data.success) {
        setSlackConnected(false);
        setSlackTeamName(null);
      }
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
      alert('Erreur lors de la déconnexion Slack');
    }
  };

  const loadTeamsConnection = async () => {
    try {
      const user = await base44.auth.me();
      console.log('[Teams] Loading connection for user:', user?.email);
      if (!user) {
        setTeamsConnected(false);
        return;
      }
      const teamsConns = await base44.entities.TeamsConnection.filter({ 
        user_email: user.email,
        is_active: true
      });
      console.log('[Teams] Found connections:', teamsConns.length);
      setTeamsConnected(teamsConns.length > 0);
    } catch (error) {
      console.error('Error loading Teams connection:', error);
      setTeamsConnected(false);
    }
  };

  const handleTeamsConnect = async () => {
    try {
      setConnectingTeams(true);
      console.log('[Teams] Starting connection flow...');
      
      // Setup message listener BEFORE opening popup to avoid race condition
      let messageHandlerActive = true;
      const messageHandler = async (event) => {
        console.log('[Teams] Message received:', event.data?.type, 'from origin:', event.origin);
        
        if (event.data?.type === 'teams-oauth-success' || event.data?.type === 'teams-connected') {
          if (!messageHandlerActive) return;
          messageHandlerActive = false;
          window.removeEventListener('message', messageHandler);

          try {
            // Decode token data from popup
            const tokenData = JSON.parse(atob(event.data.data));
            console.log('[Teams] Token data decoded, saving connection...');

            // Save connection via authenticated endpoint
            const saveResult = await base44.functions.invoke('teamsSaveConnection', {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_in: tokenData.expires_in,
              tenant_id: tokenData.tenant_id,
              scopes: tokenData.scopes
            });

            console.log('[Teams] Connection saved:', saveResult.data);

            // Wait for DB replication before checking
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Reload connection to verify
            await loadTeamsConnection();
            toast.success('Microsoft Teams connecté avec succès');
          } catch (error) {
            console.error('[Teams] Error saving connection:', error);
            toast.error('Erreur lors de la sauvegarde: ' + error.message);
          } finally {
            setConnectingTeams(false);
            console.log('[Teams] Button state reset (success path)');
          }
        } else if (event.data?.type === 'teams-error') {
          if (!messageHandlerActive) return;
          messageHandlerActive = false;
          window.removeEventListener('message', messageHandler);
          console.error('[Teams] OAuth error:', event.data.error);
          toast.error('Erreur Teams: ' + event.data.error);
          setConnectingTeams(false);
          console.log('[Teams] Button state reset (error path)');
        }
      };

      window.addEventListener('message', messageHandler);
      console.log('[Teams] Message listener attached');
      
      // Open popup after listener is ready
      const { data } = await base44.functions.invoke('teamsOAuthStart');
      const popup = window.open(data.authUrl, 'teams-oauth', 'width=600,height=700,scrollbars=yes');
      console.log('[Teams] Popup opened:', !!popup);
      
      // Timeout safety: reset button after 2 minutes if no response
      const timeoutId = setTimeout(() => {
        if (messageHandlerActive) {
          console.warn('[Teams] Timeout reached - no response from popup');
          messageHandlerActive = false;
          window.removeEventListener('message', messageHandler);
          setConnectingTeams(false);
          toast.error('Connexion expirée - veuillez réessayer');
        }
      }, 120000);
      
      // Clear timeout if flow completes
      const originalHandler = messageHandler;
      messageHandler.timeoutId = timeoutId;
      
    } catch (error) {
      console.error('[Teams] Error starting OAuth:', error);
      toast.error('Erreur lors du démarrage: ' + error.message);
      setConnectingTeams(false);
    }
  };

  const handleTeamsDisconnect = async () => {
    try {
      await base44.functions.invoke('teamsDisconnect');
      setTeamsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Teams:', error);
    }
  };

  const handleJiraConnect = async () => {
    try {
      setConnectingJira(true);
      const user = await base44.auth.me();
      const response = await base44.functions.invoke('jiraOAuthStart', {
        customer_id: user.email
      });

      const authUrl = response.data?.authorizationUrl || response.data;

      // Listen for popup message
      const messageHandler = async (event) => {
        if (event.data?.type === 'jira_success') {
          window.removeEventListener('message', messageHandler);

          try {
            // Decode connection data
            const connectionData = JSON.parse(atob(event.data.data));

            // Save connection through authenticated endpoint
            const saveResult = await base44.functions.invoke('jiraSaveConnection', connectionData);

            if (saveResult.data?.success) {
              setJiraConnected(true);
              // Refetch from DB to ensure persistence
              setTimeout(async () => {
                const jiraConns = await base44.entities.JiraConnection.list();
                if (jiraConns.length > 0) {
                  setJiraConnected(true);
                }
              }, 500);
            } else {
              console.error('Failed to save Jira connection:', saveResult.data);
              alert('Erreur: Impossible de sauvegarder la connexion Jira');
            }
          } catch (error) {
            console.error('Error saving Jira connection:', error);
            alert('Erreur lors de la sauvegarde: ' + error.message);
          } finally {
            setConnectingJira(false);
          }
        } else if (event.data?.type === 'jira_error') {
          console.error('Jira connection error:', event.data.error);
          window.removeEventListener('message', messageHandler);
          setConnectingJira(false);
        }
      };

      window.addEventListener('message', messageHandler);
      window.open(authUrl, 'Jira OAuth', 'width=600,height=700');
    } catch (error) {
      console.error('Error starting Jira OAuth:', error);
      setConnectingJira(false);
    }
  };

  const loadJiraConnection = async () => {
    try {
      const jiraConns = await base44.entities.JiraConnection.list();
      setJiraConnected(jiraConns.length > 0);
    } catch (error) {
      console.error('Error loading Jira connection:', error);
    }
  };

  const loadConfluenceConnection = async () => {
    try {
      const confluenceConns = await base44.entities.ConfluenceConnection.list();
      setConfluenceConnected(confluenceConns.length > 0);
    } catch (error) {
      console.error('Error loading Confluence connection:', error);
      setConfluenceConnected(false);
    }
  };

  const loadTrelloConnection = async () => {
    try {
      const user = await base44.auth.me();
      const trelloConns = await base44.entities.TrelloConnection.filter({ user_email: user?.email });
      setTrelloConnected(trelloConns.length > 0);
    } catch (error) {
      console.error('Error loading Trello connection:', error);
      setTrelloConnected(false);
    }
  };

  const handleJiraDisconnect = async () => {
    try {
      const result = await base44.functions.invoke('jiraDisconnect');
      if (result.data?.success || result.status === 200) {
        setJiraConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting Jira:', error);
      console.error('Error response:', error.response?.data);
      // Still update UI if we get a 400 error (no connection found) since that means it's disconnected
      if (error.response?.status === 400 && error.response?.data?.error === 'No Jira connection found') {
        setJiraConnected(false);
      }
    }
  };

  const handleConfluenceConnect = async () => {
    try {
      setConnectingConfluence(true);
      const response = await base44.functions.invoke('confluenceOAuthStart');

      const authUrl = response.data?.authUrl;
      if (!authUrl) {
        throw new Error('No authorization URL received');
      }

      // Listen for callback message
      const messageHandler = async (event) => {
        if (event.data?.type === 'confluence_success') {
          window.removeEventListener('message', messageHandler);

          try {
            // Decode connection data
            const connectionData = JSON.parse(atob(event.data.data));

            // Save connection through authenticated endpoint
            await base44.functions.invoke('confluenceSaveConnection', connectionData);

            setConfluenceConnected(true);
            // Refetch from DB to ensure persistence
            setTimeout(async () => {
              const confluenceConns = await base44.entities.ConfluenceConnection.list();
              if (confluenceConns.length > 0) {
                setConfluenceConnected(true);
              }
            }, 500);
          } catch (error) {
            console.error('Error saving Confluence connection:', error);
            toast.error('Erreur lors de la connexion Confluence');
          } finally {
            setConnectingConfluence(false);
          }
        } else if (event.data?.type === 'confluence_error') {
          window.removeEventListener('message', messageHandler);
          console.error('Confluence connection error:', event.data.error);
          toast.error('Erreur Confluence: ' + event.data.error);
          setConnectingConfluence(false);
        }
      };

      window.addEventListener('message', messageHandler);
      window.open(authUrl, 'Confluence OAuth', 'width=600,height=700');
    } catch (error) {
      console.error('Error starting Confluence OAuth:', error);
      toast.error('Erreur lors du démarrage de la connexion Confluence');
      setConnectingConfluence(false);
    }
  };

  const handleConfluenceDisconnect = async () => {
    try {
      await base44.functions.invoke('confluenceDisconnect');
      setConfluenceConnected(false);
    } catch (error) {
      console.error('Error disconnecting Confluence:', error);
      toast.error('Erreur lors de la déconnexion Confluence');
    }
  };

  const handleTrelloConnect = async () => {
    try {
      setConnectingTrello(true);
      const { data } = await base44.functions.invoke('trelloOAuthStart');

      const messageHandler = async (event) => {
        if (event.data?.type === 'trello_success') {
          window.removeEventListener('message', messageHandler);

          try {
            const connectionData = JSON.parse(atob(event.data.data));
            await base44.functions.invoke('trelloSaveConnection', connectionData);

            setTrelloConnected(true);
            setTimeout(async () => {
              const user = await base44.auth.me();
              const trelloConns = await base44.entities.TrelloConnection.filter({ user_email: user?.email });
              if (trelloConns.length > 0) {
                setTrelloConnected(true);
              } else {
                setTrelloConnected(false);
              }
            }, 500);
          } catch (error) {
            console.error('Error saving Trello connection:', error);
            toast.error('Erreur lors de la connexion Trello');
          } finally {
            setConnectingTrello(false);
          }
        } else if (event.data?.type === 'trello_error') {
          window.removeEventListener('message', messageHandler);
          console.error('Trello connection error:', event.data.error);
          toast.error('Erreur Trello: ' + event.data.error);
          setConnectingTrello(false);
        }
      };

      window.addEventListener('message', messageHandler);
      window.open(data.authUrl, 'Trello OAuth', 'width=600,height=700');
    } catch (error) {
      console.error('Error starting Trello OAuth:', error);
      toast.error('Erreur lors du démarrage de la connexion Trello');
      setConnectingTrello(false);
    }
  };

  const handleTrelloDisconnect = async () => {
    try {
      await base44.functions.invoke('trelloDisconnect');
      setTrelloConnected(false);
    } catch (error) {
      console.error('Error disconnecting Trello:', error);
      toast.error('Erreur lors de la déconnexion Trello');
    }
  };

  const checkJiraDebug = async () => {
    try {
      const result = await base44.functions.invoke('checkJiraStatus', {});
      setJiraDebugInfo(result.data);
      console.log('Jira Debug Info:', result.data);
    } catch (error) {
      console.error('Debug error:', error);
      setJiraDebugInfo({ error: error.message });
    }
  };

  const integrations = [
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    available: true,
    connected: slackConnected,
    onConnect: handleSlackConnect
  },
  {
    id: "jira",
    name: "Jira",
    icon: Database,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    available: true,
    connected: jiraConnected,
    disabled: trelloConnected,
    onConnect: handleJiraConnect
  },
  {
    id: "azure",
    name: "Azure DevOps",
    icon: Zap,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
    available: false,
    requiresBackend: true
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    icon: MessageSquare,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    available: true,
    connected: teamsConnected,
    onConnect: handleTeamsConnect
  },
  {
    id: "zoom",
    name: "Zoom",
    icon: MessageSquare,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    available: false,
    comingSoon: true
  },
  {
    id: "trello",
    name: "Trello",
    icon: Layers,
    color: "from-sky-500 to-sky-600",
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
    available: true,
    connected: trelloConnected,
    disabled: jiraConnected,
    onConnect: handleTrelloConnect
  },
  {
    id: "confluence",
    name: "Confluence",
    icon: FileSpreadsheet,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    available: true,
    connected: confluenceConnected,
    onConnect: handleConfluenceConnect
  }];


  // Load data once on mount only
   useEffect(() => {
     const loadData = async () => {
       try {
         const user = await base44.auth.me();
         setCurrentRole(user?.role || 'user');

         // Load plan limitations for source restrictions
         try {
           const limitationsRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
           setPlanLimitations(limitationsRes.data);
         } catch (e) {
           setPlanLimitations(null);
         }

        // Load team config
        const configs = await base44.entities.TeamConfiguration.list();
        if (configs.length > 0) {
          setTeamConfig(configs[0]);
        }

        // Check connections - filter by user for RLS compliance
        const [slackConns, teamsConns, jiraConns, confluenceConns, trelloConns] = await Promise.all([
        base44.entities.SlackConnection.filter({ user_email: user.email, is_active: true }),
        base44.entities.TeamsConnection.filter({ user_email: user.email, is_active: true }),
        base44.entities.JiraConnection.list(),
        base44.entities.ConfluenceConnection.list(),
        base44.entities.TrelloConnection.filter({ user_email: user?.email })]
        );

        if (slackConns.length > 0) {
          setSlackConnected(true);
          setSlackTeamName(slackConns[0].team_name);
        } else {
          setSlackConnected(false);
          setSlackTeamName(null);
        }

        if (teamsConns.length > 0) {
          setTeamsConnected(true);
        } else {
          setTeamsConnected(false);
        }

        if (jiraConns.length > 0) {
          setJiraConnected(true);
        } else {
          setJiraConnected(false);
        }

        setConfluenceConnected(confluenceConns.length > 0);
          setTrelloConnected(trelloConns.length > 0);
        } catch (error) {
          console.error("Erreur chargement données:", error);
        } finally {
          setLoadingConfig(false);
          setLoadingLimitations(false);
        }
        };
        loadData();
        }, []);

  const handleProjectModeChange = async (newMode) => {
    try {
      if (teamConfig) {
        await base44.entities.TeamConfiguration.update(teamConfig.id, {
          project_mode: newMode,
          confirmed_by_admin: true
        });
        setTeamConfig({ ...teamConfig, project_mode: newMode });
      } else {
        const newConfig = await base44.entities.TeamConfiguration.create({
          project_mode: newMode,
          confirmed_by_admin: true,
          onboarding_completed: true
        });
        setTeamConfig(newConfig);
      }
    } catch (error) {
      console.error("Erreur mise à jour config:", error);
    }
  };

  const handleRoleSwitch = async (newRole) => {
    if (newRole === currentRole) return;

    setSwitchingRole(true);
    try {
      const user = await base44.auth.me();

      // Update the user's role without bypassing RLS
      await base44.auth.updateMe({ role: newRole });

      // Update local state and refresh
      setCurrentRole(newRole);
      toast.success('Rôle mis à jour avec succès');
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Erreur lors du changement de rôle: ' + error.message);
    } finally {
      setSwitchingRole(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>);

  }

  const canManageSettings = currentRole === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8">

          <Link
            to={createPageUrl("Dashboard")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">

            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('backToDashboard')}
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100">
                <SettingsIcon className="w-5 h-5 text-slate-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t('Paramètres')}
              </h1>
            </div>
            <div className="text-right">
              <Badge className={`text-sm px-3 py-1 ${
                currentRole === 'admin' ?
                'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'}`
                }>
                  {currentRole === 'admin' ? '🔑 Admin' : '👁️ Utilisateur'}
                </Badge>
            </div>
          </div>
          <p className="text-slate-600">
            {t('Vos paramètres')}
          </p>
        </motion.div>

        {/* Workspace Member Assignment */}
         {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.03 }}
          className="mb-8">

            <WorkspaceMemberAssignment />
          </motion.div>
        }

        {/* Workspace Access Management */}
         {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8">

            <WorkspaceAccessManagement currentRole={currentRole} />
          </motion.div>
        }

        {/* Join Team Requests */}
        {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.09 }}
          className="mb-8">

            <JoinTeamRequestsAdmin />
          </motion.div>
        }

        {/* Team & Projects Configuration - Admin only */}
        {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8">

          





























































        </motion.div>
        }

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8">

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Languages className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{t('languageSettings')}</CardTitle>
                  <CardDescription className="text-xs">
                    {t('chooseLanguage')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">{t('interfaceLanguage')}</p>
                  <p className="text-xs text-slate-500">{t('languageDescription')}</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sélectionner une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français 🇫🇷</SelectItem>
                    <SelectItem value="en">English 🇬🇧</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Debug Info */}
        {jiraDebugInfo &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-slate-100 rounded-lg border border-slate-200">

            <pre className="text-xs text-slate-700 overflow-auto">
              {JSON.stringify(jiraDebugInfo, null, 2)}
            </pre>
          </motion.div>
        }

        {/* Available Integrations - Admin only */}
        {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-6">

          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {t('availableIntegration')}
          </h2>
          
          <div className="space-y-4">
          {/* Slack */}
          <Card className="overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25`}>
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">Slack</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {t('recommended')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      {t('slackDescription')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {t('readChannelMessages')}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {t('postSummaries')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {slackConnected ?
                    <>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('connected')}
                      </Badge>
                      {slackTeamName &&
                      <p className="text-xs text-slate-500">{slackTeamName}</p>
                      }
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSlackDisconnect}
                        className="text-xs">

                        Déconnecter
                      </Button>
                    </> :

                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      onClick={handleSlackConnect}
                      disabled={connectingSlack}>

                      {connectingSlack ? "Connexion..." : t('connectSlack')}
                    </Button>
                    }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teams */}
           <Card className="overflow-hidden border-2 border-indigo-200 hover:border-indigo-300 transition-colors">
             <CardContent className="p-6">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25`}>
                     <MessageSquare className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-slate-900">Microsoft Teams</h3>
                     </div>
                     <p className="text-sm text-slate-600 mb-3">
                       {t('teamsDescription')}
                     </p>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <span className="flex items-center gap-1">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         Analyse transcripts réunions
                       </span>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   {teamsConnected ?
                    <>
                       <Badge className="bg-emerald-100 text-emerald-700">
                         <CheckCircle2 className="w-3 h-3 mr-1" />
                         {t('connected')}
                       </Badge>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTeamsDisconnect}
                        className="text-xs">

                         Déconnecter
                       </Button>
                     </> :

                    <Button
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                      onClick={handleTeamsConnect}
                      disabled={connectingTeams}>

                       {connectingTeams ? "Connexion..." : "Connecter Teams"}
                     </Button>
                    }
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Jira */}
           <Card className="overflow-hidden border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
             <CardContent className="p-6">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25`}>
                     <Database className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-slate-900">Jira</h3>
                       <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                         {t('recommended')}
                       </Badge>
                     </div>
                     <p className="text-sm text-slate-600 mb-3">
                       {t('jiraDescription')}
                     </p>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <span className="flex items-center gap-1">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         Analyse backlog & issues
                       </span>
                       <span className="flex items-center gap-1">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         GDPR compliant
                       </span>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   {jiraConnected ?
                    <>
                       <Badge className="bg-emerald-100 text-emerald-700">
                         <CheckCircle2 className="w-3 h-3 mr-1" />
                         {t('connected')}
                       </Badge>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={handleJiraDisconnect}
                        className="text-xs">

                         Déconnecter
                       </Button>
                       <Button
                        size="sm"
                        onClick={() => navigate(createPageUrl("JiraProjectSelector"))}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">

                         Sélectionner projets
                       </Button>
                     </> :

                    <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div>
                             <Button
                              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                              onClick={handleJiraConnect}
                              disabled={connectingJira || trelloConnected}>

                               {connectingJira ? "Connexion..." : "Connecter Jira"}
                             </Button>
                           </div>
                         </TooltipTrigger>
                         {trelloConnected &&
                        <TooltipContent className="max-w-xs">
                             <p>{t('jiraTrelloConflictMessage')}</p>
                           </TooltipContent>
                        }
                       </Tooltip>
                     </TooltipProvider>
                    }
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Confluence */}
           <Card className="overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-colors">
             <CardContent className="p-6">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/25`}>
                     <MessageSquare className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-slate-900">Confluence</h3>
                     </div>
                     <p className="text-sm text-slate-600 mb-3">
                       Importez la documentation d'équipe et détectez les écarts avec la réalité.
                     </p>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <span className="flex items-center gap-1">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         Lire pages et espaces
                       </span>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   {confluenceConnected ?
                    <>
                       <Badge className="bg-emerald-100 text-emerald-700">
                         <CheckCircle2 className="w-3 h-3 mr-1" />
                         {t('connected')}
                       </Badge>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConfluenceDisconnect}
                        className="text-xs">

                         Déconnecter
                       </Button>
                     </> :

                    <Button
                      className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                      onClick={handleConfluenceConnect}
                      disabled={connectingConfluence}>

                       {connectingConfluence ? "Connexion..." : "Connecter Confluence"}
                     </Button>
                    }
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Trello */}
           <Card className="overflow-hidden border-2 border-sky-200 hover:border-sky-300 transition-colors">
             <CardContent className="p-6">
               <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/25`}>
                     <Layers className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-slate-900">Trello</h3>
                     </div>
                     <p className="text-sm text-slate-600 mb-3">
                       Synchronisez vos tableaux Trello et analyser l'avancement des tâches.
                     </p>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <span className="flex items-center gap-1">
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                         Accès aux tableaux et cartes
                       </span>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   {trelloConnected ?
                    <>
                       <Badge className="bg-emerald-100 text-emerald-700">
                         <CheckCircle2 className="w-3 h-3 mr-1" />
                         {t('connected')}
                       </Badge>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTrelloDisconnect}
                        className="text-xs">

                         Déconnecter
                       </Button>
                       <Button
                        size="sm"
                        onClick={() => navigate(createPageUrl("TrelloProjectSelector"))}
                        className="text-xs bg-sky-600 hover:bg-sky-700 text-white">

                         Sélectionner projets
                       </Button>
                     </> :

                    <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div>
                             <Button
                              className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800"
                              onClick={handleTrelloConnect}
                              disabled={connectingTrello || jiraConnected}>

                               {connectingTrello ? "Connexion..." : "Connecter Trello"}
                             </Button>
                           </div>
                         </TooltipTrigger>
                         {jiraConnected &&
                        <TooltipContent className="max-w-xs">
                             <p>{t('trelloJiraConflictMessage')}</p>
                           </TooltipContent>
                        }
                       </Tooltip>
                     </TooltipProvider>
                    }
                 </div>
               </div>
             </CardContent>
           </Card>
           </div>
           </motion.div>
        }

        {/* Coming Soon Integrations - Admin only */}
        {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6">

          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            {t('comingSoon')}
          </h2>
          
          <div className="grid gap-4">
            {integrations.filter((i) => !i.available).map((integration, index) =>
            <Card key={integration.id} className="opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${integration.bgColor}`}>
                        <integration.icon className={`w-6 h-6 ${integration.iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                          {integration.requiresBackend &&
                        <Badge variant="outline" className="text-xs">
                              Prochainement
                            </Badge>
                        }
                          {integration.comingSoon &&
                        <Badge variant="outline" className="text-xs bg-slate-100">
                              Prochainement
                            </Badge>
                        }
                        </div>
                        <p className="text-sm text-slate-600">
                          {t(`${integration.id}Description`)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      {t('connect')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
        }

        {/* Plan Assignment - Admin only (Dev Mode) */}
        {currentRole === 'admin' &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.33 }}
          className="mb-8">

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Attribution de Plan (Dev Mode)
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      Dev Only
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Simulez différents plans d'abonnement pour tester les fonctionnalités
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PlanAssignmentSection />
            </CardContent>
          </Card>
        </motion.div>
        }

        {/* Plan Limitations Display - For All Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="mb-8">

          <PlanLimitationsDisplay />
        </motion.div>

        {/* Account Deletion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mb-8">

          <AccountDeletionSection />
        </motion.div>









































      </div>
    </div>);

}