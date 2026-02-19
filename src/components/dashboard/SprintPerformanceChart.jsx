import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function SprintPerformanceChart({ analysisHistory = [] }) {
  const { t, language } = useLanguage();
  const [jiraData, setJiraData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Jira backend function
  useEffect(() => {
    const fetchJiraData = async () => {
      try {
        const response = await base44.functions.invoke('getSprintPerformanceData');
        if (response.data?.data) {
          setJiraData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching Jira performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJiraData();
  }, []);

  // Use Jira data if available, otherwise fall back to analysisHistory - NO sample data
  const chartData = jiraData.length > 0 ?
  jiraData :
  analysisHistory.length > 0 ?
  analysisHistory.slice(-7).map((item, index) => ({
    day: language === 'fr' ? `Jour ${index + 1}` : `Day ${index + 1}`,
    blockers: item.blockers_count || 0,
    risks: item.risks_count || 0,
    blockersData: item.analysis_data?.blockers || [],
    risksData: item.analysis_data?.risks || []
  })) :
  [];

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
            {data?.blockersData?.length > 0 &&
            <ul className="ml-4 text-xs text-slate-500 space-y-0.5">
                {data.blockersData.slice(0, 3).map((b, i) =>
              <li key={i}>• {b.member}: {b.issue?.substring(0, 40)}{b.issue?.length > 40 ? '...' : ''}</li>
              )}
                {data.blockersData.length > 3 && <li className="text-slate-400">+{data.blockersData.length - 3} {t('more')}</li>}
              </ul>
            }
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-slate-700">{t('risks')}: {data?.risks || 0}</span>
            </div>
            {data?.risksData?.length > 0 &&
            <ul className="ml-4 text-xs text-slate-500 space-y-0.5">
                {data.risksData.slice(0, 3).map((r, i) =>
              <li key={i}>• {r.description?.substring(0, 40)}{r.description?.length > 40 ? '...' : ''}</li>
              )}
                {data.risksData.length > 3 && <li className="text-slate-400">+{data.risksData.length - 3} {t('more')}</li>}
              </ul>
            }
          </div>
        </div>
      </div>);

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

  // Don't render if no real data
  if (chartData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}>

      








































































    </motion.div>);

}