import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function SprintPerformanceChart({ analysisHistory = [] }) {
  // Generate chart data from history or use sample data
  const chartData = analysisHistory.length > 0
    ? analysisHistory.slice(-7).map((item, index) => ({
        day: `Day ${index + 1}`,
        blockers: item.blockers_count || 0,
        risks: item.risks_count || 0,
      }))
    : [
        { day: "Mon", blockers: 2, risks: 1 },
        { day: "Tue", blockers: 3, risks: 2 },
        { day: "Wed", blockers: 1, risks: 1 },
        { day: "Thu", blockers: 4, risks: 3 },
        { day: "Fri", blockers: 2, risks: 1 },
        { day: "Today", blockers: 3, risks: 2 },
      ];

  // Calculate trends
  const latestBlockers = chartData[chartData.length - 1]?.blockers || 0;
  const previousBlockers = chartData[chartData.length - 2]?.blockers || 0;
  const blockerTrend = latestBlockers - previousBlockers;

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendText = (trend) => {
    if (trend > 0) return `+${trend} from yesterday`;
    if (trend < 0) return `${trend} from yesterday`;
    return "No change";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Sprint Performance
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon(blockerTrend)}
              <span className={blockerTrend > 0 ? "text-red-600" : blockerTrend < 0 ? "text-emerald-600" : "text-slate-500"}>
                {getTrendText(blockerTrend)}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Blocker and risk trends over the sprint</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="blockerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="blockers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#blockerGradient)"
                  name="Blockers"
                />
                <Area
                  type="monotone"
                  dataKey="risks"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#riskGradient)"
                  name="Risks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Blockers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">Risks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}