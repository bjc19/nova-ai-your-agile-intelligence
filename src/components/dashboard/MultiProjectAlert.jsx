import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Layers, X, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Notification pour confirmation mode multi-projets (zone grise 0.50-0.70)
 */
export default function MultiProjectAlert({ detectionData, onConfirm, onDismiss }) {
  const [isResponding, setIsResponding] = useState(false);

  if (!detectionData || detectionData.confidence < 0.50 || detectionData.confidence >= 0.70) {
    return null;
  }

  const handleResponse = async (confirmed) => {
    setIsResponding(true);

    try {
      // Mettre à jour le log de détection
      await base44.entities.MultiProjectDetectionLog.update(detectionData.log_id, {
        admin_response: confirmed ? "confirmed" : "rejected",
        admin_notified: true
      });

      // Mettre à jour la config
      const configs = await base44.entities.TeamConfiguration.list();
      if (configs.length > 0) {
        await base44.entities.TeamConfiguration.update(configs[0].id, {
          project_mode: confirmed ? "multi_projects" : "mono_project",
          confirmed_by_admin: true,
          detection_confidence: detectionData.confidence
        });
      }

      // Callback parent
      if (confirmed) {
        onConfirm?.();
      } else {
        onDismiss?.();
      }

    } catch (error) {
      console.error("Erreur confirmation:", error);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Détection potentielle d'équipe multi-projets
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-amber-100 text-amber-800">
                      Confiance: {(detectionData.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Zone de confirmation
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleResponse(false)}
                disabled={isResponding}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Signaux détectés */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Signaux détectés :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {detectionData.signals?.multiple_projects_mentions > 0 && (
                    <div className="p-2 bg-white rounded border border-amber-200 text-xs">
                      <span className="font-medium">Mentions projets :</span>{" "}
                      {(detectionData.signals.multiple_projects_mentions * 100).toFixed(0)}%
                    </div>
                  )}
                  {detectionData.signals?.multiple_backlogs > 0 && (
                    <div className="p-2 bg-white rounded border border-amber-200 text-xs">
                      <span className="font-medium">Backlogs multiples :</span>{" "}
                      {(detectionData.signals.multiple_backlogs * 100).toFixed(0)}%
                    </div>
                  )}
                  {detectionData.signals?.cross_project_impediments > 0 && (
                    <div className="p-2 bg-white rounded border border-amber-200 text-xs">
                      <span className="font-medium">Impediments cross :</span>{" "}
                      {(detectionData.signals.cross_project_impediments * 100).toFixed(0)}%
                    </div>
                  )}
                  {detectionData.signals?.unstable_goals > 0 && (
                    <div className="p-2 bg-white rounded border border-amber-200 text-xs">
                      <span className="font-medium">Goals instables :</span>{" "}
                      {(detectionData.signals.unstable_goals * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Impact */}
              <div className="p-3 bg-white border border-amber-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Impact potentiel :</strong> Cela peut affecter la capacité de l'équipe et son focus. 
                  Nova ajustera ses analyses pour détecter les risques de dispersion et surcharge.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => handleResponse(true)}
                  disabled={isResponding}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Oui - Activer mode multi-projets
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleResponse(false)}
                  disabled={isResponding}
                >
                  Non - Rester mono-projet
                </Button>
                <Button
                  variant="ghost"
                  onClick={onDismiss}
                  disabled={isResponding}
                >
                  Ignorer pour cette analyse
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}