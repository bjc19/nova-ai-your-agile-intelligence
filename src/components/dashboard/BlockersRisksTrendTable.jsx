import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function BlockersRisksTrendTable({ gdprSignals = [], analysisHistory = [] }) {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState('table');

  // Build 5-day trend from REAL data
  const trendData = useMemo(() => {
    if (gdprSignals.length === 0 && analysisHistory.length === 0) {
      return [];
    }

    // Get all signals with dates
    const allSignals = [
      ...gdprSignals.map(s => ({
        date: new Date(s.created_date),
        criticite: s.criticite,
        type: 'gdpr'
      })),
      ...analysisHistory.flatMap(a => [
        ...(a.analysis_data?.blockers || []).map(b => ({
          date: new Date(a.created_date),
          criticite: 'critique',
          type: 'analysis_blocker'
        })),
        ...(a.analysis_data?.risks || []).map(r => ({
          date: new Date(a.created_date),
          criticite: 'moyenne',
          type: 'analysis_risk'
        }))
      ])
    ];

    if (allSignals.length === 0) return [];

    // Get last 5 days
    const maxDate = new Date(Math.max(...allSignals.map(s => s.date.getTime())));
    const minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - 4);

    const days = [];
    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(minDate);
      dayDate.setDate(dayDate.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const daySignals = allSignals.filter(s => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === dayDate.getTime();
      });

      const blockers = daySignals.filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
      const risks = daySignals.filter(s => s.criticite === 'moyenne' || s.criticite === 'basse').length;

      days.push({
        date: dayDate,
        dayLabel: dayDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        blockers,
        risks,
        total: blockers + risks
      });
    }

    return days;
  }, [gdprSignals, analysisHistory]);

  if (trendData.length === 0) {
    return null;
  }

  // Calculate trends
  const blockersData = trendData.map(d => d.blockers);
  const risksData = trendData.map(d => d.risks);
  
  const blockersChange = blockersData[blockersData.length - 1] - blockersData[0];
  const risksChange = risksData[risksData.length - 1] - risksData[0];

  const labels = {
    fr: {
      title: "Évolution des Bloquants & Risques",
      day: "Jour",
      blockers: "Bloquants Techniques",
      risks: "Risques Systèmes",
      total: "Total",
      trend: "Tendance",
      tableView: "Vue Tableau",
      chartView: "Vue Courbe"
    },
    en: {
      title: "Blockers & Risks Evolution",
      day: "Day",
      blockers: "Technical Blockers",
      risks: "System Risks",
      total: "Total",
      trend: "Trend",
      tableView: "Table View",
      chartView: "Chart View"
    }
  };

  const l = labels[language];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{l.title}</h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {l.tableView}
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              className="gap-2"
            >
              <LineChart className="w-4 h-4" />
              {l.chartView}
            </Button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">{l.day}</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">{l.blockers}</th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-600">{l.risks}</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">{l.total}</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((day, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-700 font-medium">{day.dayLabel}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                        <span className="font-bold text-blue-700">{day.blockers}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100">
                        <span className="font-bold text-amber-700">{day.risks}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                        <span className="font-bold text-slate-700">{day.total}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="blockers" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name={l.blockers}
                />
                <Line 
                  type="monotone" 
                  dataKey="risks" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name={l.risks}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">{l.blockers}</span>
              <div className="flex items-center gap-1">
                {blockersChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : blockersChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : null}
                <span className={`font-bold ${blockersChange > 0 ? 'text-red-600' : blockersChange < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                  {blockersChange > 0 ? '+' : ''}{blockersChange}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">{l.risks}</span>
              <div className="flex items-center gap-1">
                {risksChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : risksChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : null}
                <span className={`font-bold ${risksChange > 0 ? 'text-red-600' : risksChange < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                  {risksChange > 0 ? '+' : ''}{risksChange}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}