import { motion } from "framer-motion";
import {
  AlertOctagon,
  ShieldAlert,
  Clock,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function QuickStats({ analysisHistory = [] }) {
  const { t } = useLanguage();
  
  // Calculate stats from history or use sample data
  const totalBlockers = analysisHistory.reduce((sum, a) => sum + (a.blockers_count || 0), 0) || 12;
  const totalRisks = analysisHistory.reduce((sum, a) => sum + (a.risks_count || 0), 0) || 8;
  const analysesCount = analysisHistory.length || 6;
  const resolvedBlockers = Math.floor(totalBlockers * 0.6); // Simulated

  const stats = [
    {
      labelKey: "totalBlockers",
      value: totalBlockers,
      icon: AlertOctagon,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
    },
    {
      labelKey: "risksIdentified",
      value: totalRisks,
      icon: ShieldAlert,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-600",
    },
    {
      labelKey: "analysesRun",
      value: analysesCount,
      icon: TrendingUp,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-500/10",
      textColor: "text-indigo-600",
    },
    {
      labelKey: "resolved",
      value: resolvedBlockers,
      icon: CheckCircle2,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.labelKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * index }}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${stat.bgColor} -translate-y-1/2 translate-x-1/2`} />
          <div className="relative">
            <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{t(stat.labelKey)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}