import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useDetectedRisks } from "@/components/hooks/useQueryCache";

export default function AdminDetectedRisks({ workspaceId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAllRisks, setShowAllRisks] = useState(false);

  const INITIAL_DISPLAY_COUNT = 3;

  const { data: patterns = [], isLoading: loading, error } = useDetectedRisks(workspaceId);

  const handleResolve = async (patternId) => {
    try {
      await base44.entities.PatternDetection.update(patternId, {
        status: "resolved",
        resolved_date: new Date().toISOString()
      });
      // React Query invalidate/refetch is automatic via queryClient
    } catch (err) {
      console.error("Erreur résolution pattern:", err);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-green-100 text-green-800 border-green-300"
    };
    return colors[severity] || colors.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      detected: <AlertCircle className="w-4 h-4" />,
      acknowledged: <TrendingUp className="w-4 h-4" />,
      in_progress: <Loader2 className="w-4 h-4 animate-spin" />,
      resolved: <CheckCircle2 className="w-4 h-4" />
    };
    return icons[status];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-slate-900">Risques Détectés</h3>
          <Badge className="ml-auto">{patterns.length}</Badge>
        </div>
        <p className="text-sm text-slate-500">Anti-patterns actifs et en cours de traitement</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {patterns.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-slate-600">Aucun risque détecté</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.slice(0, showAllRisks ? patterns.length : INITIAL_DISPLAY_COUNT).map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <button
                onClick={() => setExpandedId(expandedId === pattern.id ? null : pattern.id)}
                className="w-full p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-slate-400">
                    {getStatusIcon(pattern.status)}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{pattern.pattern_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getSeverityColor(pattern.severity)} border text-xs`}>
                        {pattern.severity}
                      </Badge>
                      <span className="text-xs text-slate-500">Score: {Math.round(pattern.confidence_score || 0)}%</span>
                    </div>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === pattern.id ? 'rotate-180' : ''}`}
                />
              </button>
              
              {expandedId === pattern.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-200 bg-slate-50 p-4"
                >
                  {pattern.context && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-700 mb-1">Contexte</p>
                      <p className="text-sm text-slate-600">{pattern.context}</p>
                    </div>
                  )}
                  
                  {pattern.recommended_actions && pattern.recommended_actions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-700 mb-2">Actions recommandées</p>
                      <ul className="space-y-1">
                        {pattern.recommended_actions.map((action, i) => (
                          <li key={i} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-slate-400">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {pattern.category && (
                    <p className="text-xs text-slate-500 mb-3">Catégorie: {pattern.category}</p>
                  )}
                  
                  <Button
                    onClick={() => handleResolve(pattern.id)}
                    size="sm"
                    className="text-green-600 hover:bg-green-50 border border-green-200 bg-white"
                    variant="outline"
                  >
                    Marquer comme résolu
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}

          {!showAllRisks && patterns.length > INITIAL_DISPLAY_COUNT && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowAllRisks(true)}
              className="w-full p-3 mt-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Afficher tous les risques ({patterns.length - INITIAL_DISPLAY_COUNT} de plus)
            </motion.button>
          )}

          {showAllRisks && patterns.length > INITIAL_DISPLAY_COUNT && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowAllRisks(false)}
              className="w-full p-3 mt-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Afficher moins
            </motion.button>
          )}
        </div>
      )}
    </Card>
  );
}