import { useState } from "react";
import { AlertCircle, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

export default function SlackPermissionsAlert({ 
  missingScopes, 
  onReauthorize, 
  isLoading = false 
}) {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!missingScopes || missingScopes.length === 0) {
    return null;
  }

  const scopeLabels = {
    'channels:history': 'Lire les messages des canaux publics',
    'groups:history': 'Lire les messages des canaux privés',
  };

  const handleReauthorize = async () => {
    setIsRefreshing(true);
    await onReauthorize();
    setIsRefreshing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert className="border-orange-200 bg-orange-50 mb-6">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="ml-3">
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="font-semibold text-orange-900 mb-2">
                ⚠️ Permissions Slack insuffisantes
              </h4>
              <p className="text-sm text-orange-800 mb-3">
                Pour lire les messages Slack, nous avons besoin de permissions supplémentaires :
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {missingScopes.map((scope) => (
                  <Badge 
                    key={scope}
                    variant="outline"
                    className="border-orange-300 bg-white text-orange-900"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {scopeLabels[scope] || scope}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleReauthorize}
                disabled={isLoading || isRefreshing}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reconnexion...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Réautoriser Slack
                  </>
                )}
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}