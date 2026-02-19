import { motion } from "framer-motion";
import { AlertOctagon, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";

export default function Xstats({ gdprSignals = [], analysisHistory = [] }) {
  const { t } = useLanguage();

  // EXACT same logic as BlockersRisksTrendTable totals row (lines 42-80)
  const getTotalsData = () => {
    if (gdprSignals.length === 0 && analysisHistory.length === 0) {
      return { blockers: 0, risks: 0 };
    }

    const allSignals = [
      ...gdprSignals.map(s => new Date(s.created_date)),
      ...analysisHistory.map(a => new Date(a.created_date))
    ];

    if (allSignals.length === 0) {
      return { blockers: 0, risks: 0 };
    }

    const maxDate = new Date(Math.max(...allSignals.map(d => d.getTime())));
    const minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - 4);
    minDate.setHours(0, 0, 0, 0);

    const last5DaysSignals = gdprSignals.filter(s => {
      const sDate = new Date(s.created_date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() >= minDate.getTime();
    });

    const last5DaysAnalysis = analysisHistory.filter(a => {
      const aDate = new Date(a.created_date);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() >= minDate.getTime();
    });

    // Count by criticite (matching BlockersRisksTrendTable)
    const gdprBlockers = last5DaysSignals.filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
    const gdprRisks = last5DaysSignals.filter(s => s.criticite === 'moyenne' || s.criticite === 'basse').length;

    const analysisBlockers = last5DaysAnalysis.flatMap(a => (a.analysis_data?.blockers || [])).length;
    const analysisRisks = last5DaysAnalysis.flatMap(a => (a.analysis_data?.risks || [])).length;

    return {
      blockers: gdprBlockers + analysisBlockers,
      risks: gdprRisks + analysisRisks
    };
  };

  const totalsData = getTotalsData();
  const totalBlockers = totalsData.blockers;
  const totalRisks = totalsData.risks;

  if (totalBlockers === 0 && totalRisks === 0) {
    return null;
  }

  const stats = [
    {
      label: t('totalBlockers'),
      value: totalBlockers,
      icon: AlertOctagon,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600"
    },
    {
      label: t('risksIdentified'),
      value: totalRisks,
      icon: ShieldAlert,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-600"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5">
              <div className="flex items-center gap-3">
                <div className={`inline-flex p-2 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}