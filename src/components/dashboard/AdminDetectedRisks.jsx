import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDetectedRisks() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        const detectedPatterns = await base44.entities.PatternDetection.filter({
          status: ["detected", "acknowledged", "in_progress"]
        }, '-created_date');
        
        setPatterns(detectedPatterns || []);
      } catch (err) {
        console.error("Erreur chargement patterns:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatterns();
  }, []);

  const handleResolve = async (patternId) => {
    try {
      await base44.entities.PatternDetection.update(patternId, {
        status: "resolved",
        resolved_date: new Date().toISOString()
      });
      
      setPatterns(prev => prev.filter(p => p.id !== patternId));
    } catch (err) {
      console.error("Erreur résolution pattern:", err);
      setError(err.message);
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
          {patterns.map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-slate-400">
                      {getStatusIcon(pattern.status)}
                    </div>
                    <h4 className="font-medium text-slate-900">{pattern.pattern_name}</h4>
                    <Badge className={`${getSeverityColor(pattern.severity)} border`}>
                      {pattern.severity}
                    </Badge>
                  </div>
                  
                  {pattern.context && (
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {pattern.context}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Score: {Math.round(pattern.confidence_score || 0)}%</span>
                    {pattern.category && (
                      <>
                        <span>•</span>
                        <span>Catégorie: {pattern.category}</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleResolve(pattern.id)}
                  size="sm"
                  variant="outline"
                  className="whitespace-nowrap text-green-600 hover:bg-green-50 border-green-200"
                >
                  Résolu
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}