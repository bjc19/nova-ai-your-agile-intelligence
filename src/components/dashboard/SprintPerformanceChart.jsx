import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function SprintPerformanceChart({ analysisHistory = [] }) {
  const { t, language } = useLanguage();
  
  // Generate chart data from history or use sample data
  const chartData = analysisHistory.length > 0
    ? analysisHistory.slice(-7).map((item, index) => ({
        day: language === 'fr' ? `Jour ${index + 1}` : `Day ${index + 1}`,
        blockers: item.blockers_count || 0,
        risks: item.risks_count || 0,
        blockersData: item.analysis_data?.blockers || [],
        risksData: item.analysis_data?.risks || [],
      }))
    : language === 'fr' ? [
        { day: "Lun", blockers: 2, risks: 1, blockersData: [{member: "Marc", issue: "Bloqué sur l'intégration de l'API payment"}], risksData: [{description: "Risque de dépassement de délai pour la release"}] },
        { day: "Mar", blockers: 3, risks: 2, blockersData: [{member: "Sarah", issue: "Problème de performance sur la requête SQL"}, {member: "Thomas", issue: "En attente de revue de code depuis 2 jours"}], risksData: [{description: "Dépendance externe non validée"}] },
        { day: "Mer", blockers: 1, risks: 1, blockersData: [{member: "Julie", issue: "Bug critique en production à corriger"}], risksData: [{description: "Manque de ressources pour la phase de test"}] },
        { day: "Jeu", blockers: 4, risks: 3, blockersData: [{member: "Pierre", issue: "Conflit de merge complexe à résoudre"}], risksData: [{description: "Scope creep détecté sur la feature principale"}] },
        { day: "Ven", blockers: 2, risks: 1, blockersData: [{member: "Emma", issue: "Serveur de staging indisponible"}], risksData: [{description: "Vélocité en baisse ce sprint"}] },
        { day: "Aujourd'hui", blockers: 3, risks: 2, blockersData: [{member: "Lucas", issue: "Besoin d'aide sur l'architecture microservices"}, {member: "Sophie", issue: "Tests e2e qui échouent de manière intermittente"}], risksData: [{description: "Sprint Goal potentiellement en danger"}, {description: "Charge de travail déséquilibrée dans l'équipe"}] },
      ] : [
        { day: "Mon", blockers: 2, risks: 1, blockersData: [{member: "Mike", issue: "Stuck on payment API integration"}], risksData: [{description: "Deadline risk for release"}] },
        { day: "Tue", blockers: 3, risks: 2, blockersData: [{member: "Sarah", issue: "SQL query performance issue"}, {member: "Tom", issue: "Waiting for code review for 2 days"}], risksData: [{description: "External dependency not validated"}] },
        { day: "Wed", blockers: 1, risks: 1, blockersData: [{member: "Julia", issue: "Critical production bug to fix"}], risksData: [{description: "Lack of testing resources"}] },
        { day: "Thu", blockers: 4, risks: 3, blockersData: [{member: "Peter", issue: "Complex merge conflict to resolve"}], risksData: [{description: "Scope creep detected on main feature"}] },
        { day: "Fri", blockers: 2, risks: 1, blockersData: [{member: "Emma", issue: "Staging server unavailable"}], risksData: [{description: "Velocity declining this sprint"}] },
        { day: "Today", blockers: 3, risks: 2, blockersData: [{member: "Luke", issue: "Need help with microservices architecture"}, {member: "Sophie", issue: "E2E tests failing intermittently"}], risksData: [{description: "Sprint Goal potentially at risk"}, {description: "Unbalanced workload in team"}] },
      ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0]?.payload;
    
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 max-w-xs">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-slate-700">{t('blockers')}: {data?.blockers || 0}</span>
            </div>
            {data?.blockersData?.length > 0 && (
              <ul className="ml-4 text-xs text-slate-500 space-y-0.5">
                {data.blockersData.slice(0, 3).map((b, i) => (
                  <li key={i}>• {b.member}: {b.issue?.substring(0, 40)}{b.issue?.length > 40 ? '...' : ''}</li>
                ))}
                {data.blockersData.length > 3 && <li className="text-slate-400">+{data.blockersData.length - 3} {t('more')}</li>}
              </ul>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-slate-700">{t('risks')}: {data?.risks || 0}</span>
            </div>
            {data?.risksData?.length > 0 && (
              <ul className="ml-4 text-xs text-slate-500 space-y-0.5">
                {data.risksData.slice(0, 3).map((r, i) => (
                  <li key={i}>• {r.description?.substring(0, 40)}{r.description?.length > 40 ? '...' : ''}</li>
                ))}
                {data.risksData.length > 3 && <li className="text-slate-400">+{data.risksData.length - 3} {t('more')}</li>}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    if (trend > 0) return `+${trend} ${t('fromYesterday')}`;
    if (trend < 0) return `${trend} ${t('fromYesterday')}`;
    return t('noChange');
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
              {t('sprintPerformance')}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon(blockerTrend)}
              <span className={blockerTrend > 0 ? "text-red-600" : blockerTrend < 0 ? "text-emerald-600" : "text-slate-500"}>
                {getTrendText(blockerTrend)}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500">{t('blockerRiskTrends')}</p>
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
                <Tooltip content={<CustomTooltip />} />
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
              <span className="text-sm text-slate-600">{t('blockers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">{t('risks')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}