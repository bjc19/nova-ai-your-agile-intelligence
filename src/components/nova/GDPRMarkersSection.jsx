import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLocalTime } from "@/components/nova/formatLocalTime";

export default function GDPRMarkersSection({ sessionId, analysisDate }) {
  const { t, language } = useLanguage();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkers = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const gdprMarkers = await base44.entities.GDPRMarkers.filter({
          session_id: sessionId
        });
        setMarkers(gdprMarkers);
      } catch (error) {
        console.error("Erreur chargement marqueurs GDPR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkers();
  }, [sessionId]);

  if (loading || markers.length === 0) {
    return null;
  }

  const criticalityColor = {
    critique: "bg-red-100 text-red-700 border-red-200",
    haute: "bg-orange-100 text-orange-700 border-orange-200",
    moyenne: "bg-yellow-100 text-yellow-700 border-yellow-200",
    basse: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const criticalityLabel = {
    critique: "🔴 Critique",
    haute: "🟠 Haute",
    moyenne: "🟡 Moyenne",
    basse: "🔵 Basse",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {t('gdprInsights') || 'GDPR Insights'}
                <Badge className="bg-purple-100 text-purple-700 text-xs">#Slack</Badge>
                <Badge variant="outline" className="text-xs">
                   {formatLocalTime(analysisDate || new Date(), language)}
                 </Badge>
              </CardTitle>
              <p className="text-xs text-slate-600 mt-1">
                {markers.length} {markers.length === 1 ? 'marqueur détecté' : 'marqueurs détectés'} • Anonymisé RGPD
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {markers.map((marker, idx) => (
              <motion.div
                key={marker.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="p-4 rounded-lg bg-white border border-slate-100 hover:border-purple-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">
                      {marker.probleme}
                    </p>
                  </div>
                  <Badge className={`shrink-0 text-xs border ${criticalityColor[marker.criticite] || criticalityColor.basse}`}>
                    {criticalityLabel[marker.criticite] || marker.criticite}
                  </Badge>
                </div>

                {marker.recos && marker.recos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-600">Recommandations:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                      {marker.recos.slice(0, 2).map((reco, i) => (
                        <li key={i}>{reco}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <AlertCircle className="w-3 h-3" />
                  <span>Confiance: {(marker.confidence_score * 100).toFixed(0)}%</span>
                  {marker.recurrence > 1 && (
                    <span>• Récurrence: {marker.recurrence}x</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
            <Shield className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">
              <strong>Conforme RGPD:</strong> Aucun message brut n'est stocké. Seuls les marqueurs anonymisés sont conservés.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}