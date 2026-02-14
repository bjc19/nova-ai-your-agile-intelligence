import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function UserContributions() {
  const [metrics, setMetrics] = useState({
    completed: 0,
    contributions: 0,
    progression: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMetrics = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) {
          setLoading(false);
          return;
        }

        // Fetch user contribution metrics (respects RLS)
        const response = await base44.functions.invoke('getUserContributionMetrics', {
          user_email: user.email
        });

        if (response.data?.metrics) {
          setMetrics(response.data.metrics);
        }
      } catch (error) {
        console.error("Error fetching user metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMetrics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Tes Contributions Cette Semaine</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Vois ton impact et ta progression - vue exclusive pour toi
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.completed}
                </div>
                <p className="text-xs text-slate-500 mt-1">Tâches Complétées</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.contributions}
                </div>
                <p className="text-xs text-slate-500 mt-1">Contributions</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(metrics.progression)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">Progression</p>
              </div>
            </div>
            {metrics.completed === 0 && metrics.contributions === 0 ? (
              <p className="text-xs text-slate-500 text-center">
                Aucune donnée pour cette semaine
              </p>
            ) : (
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                  style={{ width: `${metrics.progression}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}