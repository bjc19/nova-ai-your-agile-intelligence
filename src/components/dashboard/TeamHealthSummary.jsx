import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamHealthSummary() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch team context
        const teamContext = await base44.entities.TeamContext.list();
        if (teamContext.length > 0) {
          setTeamData(teamContext[0]);
        }

        // Fetch recent patterns for word cloud
        const recentPatterns = await base44.entities.PatternDetection.filter({
          status: ["detected", "acknowledged", "in_progress"]
        }, '-created_date', 15);

        setPatterns(recentPatterns || []);
      } catch (error) {
        console.error("Erreur chargement santé équipe:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </Card>
    );
  }

  const getEngagementColor = (level) => {
    const colors = {
      high: "text-green-600",
      moderate: "text-yellow-600",
      low: "text-red-600"
    };
    return colors[level] || colors.moderate;
  };

  const getToneColor = (tone) => {
    const colors = {
      constructive: "bg-green-100 text-green-800 border-green-300",
      neutral: "bg-slate-100 text-slate-800 border-slate-300",
      tense: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[tone] || colors.neutral;
  };

  // Generate word cloud data - frequency of patterns
  const patternFrequency = {};
  patterns.forEach(p => {
    const name = p.pattern_name;
    patternFrequency[name] = (patternFrequency[name] || 0) + 1;
  });

  const wordCloudItems = Object.entries(patternFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({
      text: name,
      size: Math.min(24 + count * 3, 36),
      count
    }));

  return (
    <div className="space-y-6">
      {/* Team Health Metrics */}
      {teamData && (
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Santé de l'Équipe</h3>
            </div>
            <p className="text-sm text-slate-500">Indicateurs de bien-être et d'engagement</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Engagement Level */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Engagement</p>
              <p className={`text-lg font-bold capitalize ${getEngagementColor(teamData.engagement_level)}`}>
                {teamData.engagement_level || "moderate"}
              </p>
            </motion.div>

            {/* Communication Tone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Ton</p>
              <Badge className={`${getToneColor(teamData.communication_tone)} border`}>
                {teamData.communication_tone || "neutral"}
              </Badge>
            </motion.div>

            {/* Active Incidents */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Incidents</p>
              <p className={`text-lg font-bold ${teamData.active_incidents > 0 ? "text-red-600" : "text-green-600"}`}>
                {teamData.active_incidents || 0}
              </p>
            </motion.div>

            {/* Unreviewed PRs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">PR non revues</p>
              <p className={`text-lg font-bold ${teamData.unreviewed_prs > 0 ? "text-orange-600" : "text-green-600"}`}>
                {teamData.unreviewed_prs || 0}
              </p>
            </motion.div>

            {/* Defects */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Défauts critiques</p>
              <p className={`text-lg font-bold ${teamData.critical_defects > 0 ? "text-red-600" : "text-green-600"}`}>
                {teamData.critical_defects || 0}
              </p>
            </motion.div>

            {/* Retro Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Retro complétées</p>
              <p className="text-lg font-bold text-blue-600">{teamData.retro_actions_completed_rate || 0}%</p>
            </motion.div>
          </div>
        </Card>
      )}

      {/* Pattern Word Cloud */}
      {wordCloudItems.length > 0 && (
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Patterns Fréquents</h3>
            </div>
            <p className="text-sm text-slate-500">Anti-patterns les plus détectés cette période</p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center min-h-40">
            {wordCloudItems.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <span
                  className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-default"
                  style={{
                    fontSize: `${item.size}px`,
                    fontWeight: item.count > 2 ? "600" : "500"
                  }}
                  title={`Détecté ${item.count} fois`}
                >
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}