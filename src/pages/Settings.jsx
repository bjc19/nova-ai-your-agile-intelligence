import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
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
  Languages
} from "lucide-react";

export default function Settings() {
  const [slackConnected, setSlackConnected] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const integrations = [
    {
      id: "slack",
      name: "Slack",
      description: "Capture standup messages from Slack channels. Nova will analyze conversations from your #standup or #daily-scrum channels.",
      icon: MessageSquare,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      available: true,
      connected: slackConnected,
      onConnect: () => {
        // This will work once backend functions are enabled
        window.open(base44.agents.getWhatsAppConnectURL('slack'), '_blank');
      }
    },
    {
      id: "jira",
      name: "Jira",
      description: "Import sprint data, issues, and blockers directly from your Jira boards.",
      icon: FileSpreadsheet,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      available: false,
      requiresBackend: true
    },
    {
      id: "azure",
      name: "Azure DevOps",
      description: "Sync work items, sprints, and team velocity from Azure DevOps.",
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
      description: "Join and analyze Daily Scrum meetings conducted via Teams.",
      icon: MessageSquare,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
      available: false,
      comingSoon: true
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Connect to Zoom meetings and analyze transcripts in real-time.",
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      available: false,
      comingSoon: true
    }
  ];

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
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-slate-100">
              <SettingsIcon className="w-5 h-5 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t('integrations')}
            </h1>
          </div>
          <p className="text-slate-600">
            {t('integrationsDescription')}
          </p>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">
                      <div className="flex items-center gap-2">
                        <span>🇫🇷</span>
                        <span>Français</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇬🇧</span>
                        <span>English</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Backend Functions Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {t('backendRequired')}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    {t('backendRequiredDescription')}
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Go to App Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Integration - Slack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Available Integration
          </h2>
          
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
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      Capture standup messages from Slack channels. Nova will analyze conversations from your #standup or #daily-scrum channels as an alternative to Teams/Zoom.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Read channel messages
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Post summaries
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {slackConnected ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      onClick={() => setSlackConnected(true)}
                    >
                      Connect Slack
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coming Soon Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            Coming Soon
          </h2>
          
          <div className="grid gap-4">
            {integrations.filter(i => !i.available).map((integration, index) => (
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
                          {integration.requiresBackend && (
                            <Badge variant="outline" className="text-xs">
                              Requires Backend
                            </Badge>
                          )}
                          {integration.comingSoon && (
                            <Badge variant="outline" className="text-xs bg-slate-100">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Manual Data Import */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-500" />
            Manual Data Import
          </h2>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Don't have integrations enabled? You can still use Nova by manually importing data:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Link to={createPageUrl("Analysis")}>
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <MessageSquare className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Paste Transcript</p>
                        <p className="text-xs text-slate-500">Copy/paste meeting notes</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link to={createPageUrl("Analysis")}>
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Upload File</p>
                        <p className="text-xs text-slate-500">CSV, JSON, or TXT files</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}