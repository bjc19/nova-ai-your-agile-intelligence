import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { Zap, Loader2 } from "lucide-react";

export default function PatternDetectionWordCloud({ selectedWorkspaceId = null, selectedWorkspaceType = null }) {
  const { t, language } = useLanguage();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        // Fetch detected patterns (status: detected, acknowledged, in_progress)
        const patternData = await base44.entities.PatternDetection.filter({
          status: ["detected", "acknowledged", "in_progress"]
        }, '-created_date', 30);

        // If workspace is selected, filter by workspace
        let filtered = patternData || [];
        
        if (selectedWorkspaceId && selectedWorkspaceType) {
          filtered = filtered.filter(p => {
            if (selectedWorkspaceType === 'jira') {
              return p.jira_project_selection_id === selectedWorkspaceId;
            } else if (selectedWorkspaceType === 'trello') {
              return p.trello_project_selection_id === selectedWorkspaceId;
            }
            return true;
          });
        }

        setPatterns(filtered);
      } catch (error) {
        console.error("Error fetching pattern detections:", error);
        setPatterns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, [selectedWorkspaceId, selectedWorkspaceType]);

  // Calculate word cloud sizes based on confidence and frequency
  const getCloudData = () => {
    const patternMap = {};
    
    patterns.forEach(p => {
      const name = p.pattern_name || p.category || 'Unknown';
      if (!patternMap[name]) {
        patternMap[name] = { count: 0, totalConfidence: 0, severity: p.severity };
      }
      patternMap[name].count += 1;
      patternMap[name].totalConfidence += p.confidence_score || 0;
    });

    // Convert to array and calculate sizes
    const cloudItems = Object.entries(patternMap).map(([name, data]) => {
      const avgConfidence = data.totalConfidence / data.count;
      const size = Math.min(32, 12 + (avgConfidence * 20)); // size between 12px and 32px
      
      return {
        name,
        count: data.count,
        avgConfidence: Math.round(avgConfidence * 100),
        severity: data.severity,
        size
      };
    });

    return cloudItems.sort((a, b) => b.count - a.count).slice(0, 20);
  };

  const cloudData = getCloudData();

  const severityColors = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-700"
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            {language === 'fr' ? 'Signaux Faibles Détectés' : 'Detected Weak Signals'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!cloudData || cloudData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {language === 'fr' ? 'Signaux Faibles Détectés' : 'Detected Weak Signals'}
              </CardTitle>
              <p className="text-sm text-slate-500">
                {language === 'fr' ? `${patterns.length} pattern(s) identifié(s)` : `${patterns.length} pattern(s) identified`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-wrap gap-3 items-center justify-center min-h-32">
            {cloudData.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
              >
                <div
                  className={`px-4 py-2 rounded-full cursor-pointer transition-all hover:shadow-md ${
                    severityColors[item.severity] || severityColors.low
                  }`}
                  style={{ fontSize: `${item.size}px` }}
                  title={`${item.name} - ${item.count} occurrence(s) - Confidence: ${item.avgConfidence}%`}
                >
                  {item.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-3">
            {['critical', 'high', 'medium', 'low'].map(sev => (
              <div key={sev} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  sev === 'critical' ? 'bg-red-500' : 
                  sev === 'high' ? 'bg-orange-500' : 
                  sev === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <span className="text-xs text-slate-600 capitalize">
                  {language === 'fr' 
                    ? (sev === 'critical' ? 'Critique' : sev === 'high' ? 'Élevée' : sev === 'medium' ? 'Moyenne' : 'Basse')
                    : sev}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}