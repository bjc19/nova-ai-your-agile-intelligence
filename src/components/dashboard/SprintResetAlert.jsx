import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function SprintResetAlert() {
  const [sprintHealth, setSprintHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSprintHealth = async () => {
      try {
        // Fetch latest sprint health (respects RLS)
        const response = await base44.functions.invoke('getSprintPerformanceData', {});
        if (response.data?.sprintHealth) {
          setSprintHealth(response.data.sprintHealth);
        }
      } catch (error) {
        console.error("Error fetching sprint health:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSprintHealth();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  if (!sprintHealth) {
    return null;
  }

  const statusColor = {
    healthy: { bg: "from-green-50 to-emerald-50", border: "border-green-200", badge: "bg-green-100 text-green-700" },
    at_risk: { bg: "from-amber-50 to-orange-50", border: "border-amber-200", badge: "bg-red-100 text-red-700" },
    critical: { bg: "from-red-50 to-rose-50", border: "border-red-200", badge: "bg-red-100 text-red-700" }
  }[sprintHealth.status] || { bg: "from-amber-50 to-orange-50", border: "border-amber-200", badge: "bg-red-100 text-red-700" };

  const riskPercentage = Math.round((sprintHealth.risk_score || 0) * 100) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-2 ${statusColor.border} bg-gradient-to-br ${statusColor.bg}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <CardTitle className="text-lg text-amber-900">
              {sprintHealth.sprint_name || "Sprint"} Status
            </CardTitle>
          </div>
          <Badge className={`${statusColor.badge} border-0 flex items-center gap-1`}>
            <AlertTriangle className="w-3 h-3" />
            {sprintHealth.status.replace('_', ' ')} {riskPercentage}%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Risk Level</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500" 
                  style={{ width: `${Math.min(riskPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{riskPercentage}%</span>
            </div>
            <p className="text-sm text-amber-800">
              💪 {sprintHealth.recommendations?.[0] || "L'équipe travaille sur quelques défis"}
            </p>
            <p className="text-sm text-amber-700 font-medium">
              Votre collaboration et soutien sont importants en ce moment
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}