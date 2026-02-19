import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, Target, Loader2, Edit2, Clock } from "lucide-react";
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import AverageResolutionTimeMetric from "./AverageResolutionTimeMetric";

const CHART_TYPES = {
  flow_efficiency: {
    name: "Flow Efficiency",
    icon: Zap,
    description: "% temps valeur ajoutée / temps total",
    color: "from-blue-500 to-blue-600",
    metric: "Réduire gaspillages & attentes"
  },
  cycle_time: {
    name: "Cycle Time",
    icon: TrendingUp,
    description: "Temps de bout en bout par ticket",
    color: "from-purple-500 to-purple-600",
    metric: "Boucle feedback ultra-courte"
  },
  change_failure_rate: {
    name: "Change Failure Rate",
    icon: Target,
    description: "% déploiements causant incidents",
    color: "from-amber-500 to-amber-600",
    metric: "Vitesse ≠ instabilité"
  },
  average_resolution_time: {
    name: "Temps de Résolution",
    icon: Clock,
    description: "Temps moyen de résolution des anti-patterns",
    color: "from-green-500 to-green-600",
    metric: "Amélioration continue"
  }
};

export default function ChartSuggestionGenerator({ selectedWorkspaceId, gdprSignals = [], analysisHistory = [] }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  // Analyser les données disponibles pour suggérer le meilleur graphique
  const bestChartSuggestion = useMemo(() => {
    if (!selectedWorkspaceId || (gdprSignals.length === 0 && analysisHistory.length === 0)) {
      return null;
    }

    const signals = [...gdprSignals, ...analysisHistory];
    const blockersCount = signals.filter(s => s.criticite === 'critique' || s.criticite === 'haute').length;
    const risksCount = signals.filter(s => s.criticite === 'moyenne').length;
    const analysisCount = analysisHistory.length;

    // Logique de suggestion intelligente
    if (blockersCount > risksCount * 2) {
      return { key: 'change_failure_rate', reason: 'Instabilité détectée - priorisez la stabilité' };
    }
    if (analysisCount > 5) {
      return { key: 'cycle_time', reason: 'Historique suffisant - optimisez le cycle' };
    }
    if (risksCount > blockersCount) {
      return { key: 'flow_efficiency', reason: 'Beaucoup de risques - réduisez les gaspillages' };
    }
    return { key: 'average_resolution_time', reason: 'Mesurez l\'amélioration continue' };
  }, [selectedWorkspaceId, gdprSignals, analysisHistory]);

  const generateChart = async (chartType) => {
    if (!selectedWorkspaceId) return;

    // Pour Average Resolution Time, afficher le composant directement
    if (chartType === 'average_resolution_time') {
      setSelectedChart(chartType);
      setSuggestion(CHART_TYPES[chartType]);
      return;
    }

    setLoading(true);
    setSelectedChart(chartType);
    setSuggestion(CHART_TYPES[chartType]);

    try {
      const mockData = generateMockChartData(chartType);
      setChartData(mockData);
    } catch (error) {
      console.error("Erreur génération graphique:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockChartData = (chartType) => {
    // Grouper les données par jour
    const dataByDay = {};
    const allData = [...gdprSignals, ...analysisHistory];
    
    allData.forEach(item => {
      const date = new Date(item.created_date);
      const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      if (!dataByDay[day]) {
        dataByDay[day] = { blockers: 0, risks: 0, analyses: 0 };
      }
      dataByDay[day].blockers += (item.criticite === 'critique' || item.criticite === 'haute') ? 1 : 0;
      dataByDay[day].risks += (item.criticite === 'moyenne' || item.criticite === 'basse') ? 1 : 0;
      dataByDay[day].analyses += 1;
    });

    const days = Object.keys(dataByDay).slice(-7);
    
    switch (chartType) {
      case 'flow_efficiency':
        return days.map((day) => ({
          day,
          efficiency: Math.max(20, 100 - dataByDay[day].risks * 5),
          target: 70
        }));
      case 'cycle_time':
        return days.map((day) => ({
          day,
          cycleTime: Math.max(1, 5 - dataByDay[day].blockers * 0.5),
          average: 4.5
        }));
      case 'change_failure_rate':
        return days.map((day) => ({
          day,
          cfr: Math.min(30, dataByDay[day].blockers * 3),
          ideal: 8
        }));
      default:
        return [];
    }
  };

  const renderChart = () => {
    if (!selectedChart) return null;

    // Pour Average Resolution Time, afficher le composant dédié
    if (selectedChart === 'average_resolution_time') {
      return <AverageResolutionTimeMetric workspaceId={selectedWorkspaceId} />;
    }

    if (!chartData) return null;

    const config = CHART_TYPES[selectedChart];

    switch (selectedChart) {
      case 'flow_efficiency':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" name="Efficacité %" />
              <Line type="monotone" dataKey="target" stroke="#d1d5db" strokeDasharray="5 5" name="Cible" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'cycle_time':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: 'Jours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cycleTime" fill="#a855f7" name="Cycle Time (jours)" />
              <Bar dataKey="average" fill="#d1d5db" name="Moyenne" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'change_failure_rate':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cfr" fill="#f59e0b" name="Change Failure Rate" />
              <Line type="monotone" dataKey="ideal" stroke="#10b981" strokeDasharray="5 5" name="Idéal" />
            </ComposedChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };



  if (!selectedWorkspaceId) {
    return (
      <Card className="p-6 bg-slate-50">
        <p className="text-sm text-slate-500">Sélectionnez un workspace pour générer des graphiques</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {selectedChart && chartData ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {suggestion && (
                <>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${suggestion.color}`}>
                    {suggestion.icon && <suggestion.icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{suggestion.name}</h3>
                    <p className="text-sm text-slate-500">{suggestion.description}</p>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedChart(null);
                setChartData(null);
              }}
              className="text-slate-500 hover:text-slate-700">
              ✕
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            renderChart()
          )}

          {suggestion && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">💡 Insight:</span> {suggestion.metric}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 mb-2">Générer un graphique</h3>
            <p className="text-sm text-slate-500 mb-4">Visualisez vos métriques clés</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CHART_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              const isBusinessValue = key === 'business_value';
              const hasData = isBusinessValue ? businessValueMetricsHistory.length > 0 : true;

              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateChart(key)}
                  disabled={loading || !hasData}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-blue-500 hover:bg-blue-50 border-slate-200'
                  }`}>
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{type.name}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );
}