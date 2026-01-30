import { motion } from "framer-motion";

export default function MetricCard({ icon: Icon, label, value, color = "blue", delay = 0, active = false }) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200/50",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-200/50",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50",
  };

  const activeClasses = {
    blue: "ring-2 ring-blue-500 border-blue-400",
    amber: "ring-2 ring-amber-500 border-amber-400",
    emerald: "ring-2 ring-emerald-500 border-emerald-400",
  };

  const iconColors = {
    blue: "text-blue-600 bg-blue-100",
    amber: "text-amber-600 bg-amber-100",
    emerald: "text-emerald-600 bg-emerald-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-6 backdrop-blur-sm transition-all hover:scale-[1.02] ${active ? activeClasses[color] : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl" />
    </motion.div>
  );
}