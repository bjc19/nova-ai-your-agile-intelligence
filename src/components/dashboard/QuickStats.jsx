import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertOctagon, ShieldAlert, CheckCircle2, BarChart2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { adaptMessage } from "./RoleBasedMessaging";
import QuickStatsDetailDrawer from "./QuickStatsDetailDrawer";
import { useQuery } from "@tanstack/react-query";

export default function QuickStats({ analysisHistory = [], currentPageName = "Dashboard", selectedWorkspaceId = null, gdprSignals: propGdprSignals = null }) {
  if (selectedWorkspaceId && analysisHistory.length === 0) return null;
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState('user');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

   useEffect(() => {
     base44.auth.me().then(u => setUserRole(u?.role || 'user')).catch(() => {});
   }, []);

   const { data: resolvedItems = [] } = useQuery({
     queryKey: ['resolvedItems'],
     queryFn: () => base44.entities.ResolvedItem.list('-resolved_date', 100),
   });

  const handleStatClick = (labelKey) => {
    const typeMap = { totalBlockers: "blockers", risksIdentified: "risks", resolved: "resolved", analysesRun: "analyses" };
    const type = typeMap[labelKey];
    if (type) { setDrawerType(type); setDrawerOpen(true); }
  };

  const handleResolve = async (item) => {
    setResolvingId(item.id);
    try {
      await base44.functions.invoke('markItemResolved', {
        itemId: item.id, source: item.source || 'manual',
        itemType: drawerType === 'blockers' ? 'blocker' : 'risk',
        title: item.issue || item.description || '-',
        urgency: item.urgency || 'medium',
        analysisDate: item.analysisDate || item.created_date,
      });
    } catch (e) { console.error(e); } finally { setResolvingId(null); }
  };

  const totalBlockers = analysisHistory.reduce((sum, a) => sum + (a.blockers_count || 0), 0);
  const totalRisks = analysisHistory.reduce((sum, a) => sum + (a.risks_count || 0), 0);
  const analysesCount = analysisHistory.length;

  // Resolution rate: % of blockers+risks that got resolved
  const totalIssues = totalBlockers + totalRisks;
  const resolvedCount = resolvedItems.length;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / Math.max(totalIssues, resolvedCount)) * 100) : 0;

  const hasRealData = analysisHistory.length > 0 || resolvedItems.length > 0;

  const stats = hasRealData ? [
    { labelKey: "totalBlockers", value: totalBlockers, icon: AlertOctagon, bgColor: "bg-blue-500/10", textColor: "text-blue-600" },
    { labelKey: "risksIdentified", value: totalRisks, icon: ShieldAlert, bgColor: "bg-amber-500/10", textColor: "text-amber-600" },
    { labelKey: "resolved", value: resolvedCount, icon: CheckCircle2, bgColor: "bg-emerald-500/10", textColor: "text-emerald-600" },
    { labelKey: "analysesRun", value: analysesCount, icon: BarChart2, bgColor: "bg-indigo-500/10", textColor: "text-indigo-600", suffix: "" },
  ] : [];




 
  if (!hasRealData) return null;

  const LABELS = {
    totalBlockers: "Blockers détectés",
    risksIdentified: "Risques identifiés",
    resolved: "Éléments résolus",
    analysesRun: "Analyses effectuées",
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            onClick={() => handleStatClick(stat.labelKey)}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${stat.bgColor} -translate-y-1/2 translate-x-1/2`} />
            <div className="relative">
              <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{LABELS[stat.labelKey]}</p>
              <p className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Cliquez pour le détail →</p>
            </div>
          </motion.div>
        ))}
      </div>

      <QuickStatsDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        type={drawerType}
        analysisHistory={analysisHistory}
        resolvedItems={resolvedItems}
        onResolve={handleResolve}
        resolving={resolvingId}
      />
    </>
  );
}