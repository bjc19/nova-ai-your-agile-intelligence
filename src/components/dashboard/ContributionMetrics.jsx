import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, GitPullRequest, CheckCircle2, MessageSquare } from "lucide-react";

export default function ContributionMetrics() {
  const metrics = [
    {
      label: "PRs Créées",
      value: 5,
      change: "+20%",
      trend: "up",
      icon: GitPullRequest,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700"
    },
    {
      label: "PRs Reviewées",
      value: 8,
      change: "+10%",
      trend: "up",
      icon: MessageSquare,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    },
    {
      label: "Tickets Fermés",
      value: 12,
      change: "+35%",
      trend: "up",
      icon: CheckCircle2,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700"
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend) => {
    if (trend === "up") return "text-emerald-600";
    if (trend === "down") return "text-red-600";
    return "text-slate-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg">Tes Contributions Cette Semaine</CardTitle>
            <CardDescription className="text-xs mt-1">
              Vois ton impact et ta progression - vue exclusive pour toi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              const TrendIcon = getTrendIcon(metric.trend);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border ${metric.bgColor} ${metric.borderColor} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-white/50`}>
                      <Icon className={`w-4 h-4 ${metric.textColor}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendIcon className={`w-3 h-3 ${getTrendColor(metric.trend)}`} />
                      <span className={`text-xs font-semibold ${getTrendColor(metric.trend)}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  <p className="text-xs text-slate-600 mt-1">{metric.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Weekly Summary */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-900">Bonne semaine!</span> Tu as fermé 12 tickets, c'est <span className="text-emerald-600 font-semibold">+35% vs la semaine dernière</span>. Continue comme ça! 🚀
            </p>
          </div>

          {/* Monthly Comparison */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-blue-50 text-center">
              <p className="text-slate-600">Ce mois</p>
              <p className="text-lg font-bold text-blue-700 mt-1">47</p>
              <p className="text-slate-500">contributions</p>
            </div>
            <div className="p-2 rounded bg-slate-100 text-center">
              <p className="text-slate-600">Le mois dernier</p>
              <p className="text-lg font-bold text-slate-700 mt-1">34</p>
              <p className="text-slate-500">contributions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}