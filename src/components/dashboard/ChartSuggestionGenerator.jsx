import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, Target, Loader2, Edit2 } from "lucide-react";
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import BusinessValueInputForm from "./BusinessValueInputForm";

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
  business_value: {
    name: "Business Value",
    icon: BarChart3,
    description: "Valeur livrée vs investissement",
    color: "from-green-500 to-green-600",
    metric: "Justifier ROI agilité"
  }
};

export default function ChartSuggestionGenerator({ selectedWorkspaceId, gdprSignals = [], analysisHistory = [] }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [showBusinessValueForm, setShowBusinessValueForm] = useState(false);
  const [businessValueMetricsHistory, setBusinessValueMetricsHistory] = useState([]);

  // Charger l'historique complet des données Business Value
  useEffect(() => {
    if (!selectedWorkspaceId) return;
    
    const fetchBusinessValueMetricsHistory = async () => {
      try {
        const user = await base44.auth.me();
        const metrics = await base44.entities.BusinessValueMetric.filter({
          workspace_id: selectedWorkspaceId,
          user_email: user.email
        }, '-period_start_date', 100);
        setBusinessValueMetricsHistory(metrics || []);
      } catch (err) {
        console.error("Erreur chargement Business Value historique:", err);
        setBusinessValueMetricsHistory([]);
      }
    };
    
    fetchBusinessValueMetricsHistory();
  }, [selectedWorkspaceId]);

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
    return { key: 'business_value', reason: 'Vue d\'ensemble ROI recommandée' };
  }, [selectedWorkspaceId, gdprSignals, analysisHistory]);

  const generateChart = async (chartType) => {
    if (!selectedWorkspaceId) return;

    console.log("🎯 generateChart clicked:", { chartType, metricsCount: businessValueMetricsHistory.length });

    // Pour Business Value, afficher le formulaire si aucune donnée
    if (chartType === 'business_value') {
      if (businessValueMetricsHistory.length === 0) {
        console.log("✅ No metrics - showing form");
        setShowBusinessValueForm(true);
        setSelectedChart(chartType);
        return;
      }
      // Si données existent, les afficher avec l'historique
      setLoading(true);
      setSelectedChart(chartType);
      try {
        const chartDataForBusinessValue = businessValueMetricsHistory.map(metric => ({
          period: `${metric.period_start_date}`,
          delivered: metric.value_delivered,
          planned: metric.value_planned,
          gap: metric.value_planned - metric.value_delivered
        })).reverse();
        setChartData(chartDataForBusinessValue);
        setSuggestion(CHART_TYPES[chartType]);
      } catch (error) {
        console.error("Erreur génération graphique Business Value historique:", error);
      } finally {
        setLoading(false);
      }
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
    switch (chartType) {
      case 'flow_efficiency':
        return [
          { week: 'S1', efficiency: 65 },
          { week: 'S2', efficiency: 72 },
          { week: 'S3', efficiency: 68 },
          { week: 'S4', efficiency: 81 }
        ];
      case 'cycle_time':
        return [
          { sprint: 'Sprint 1', time: 8 },
          { sprint: 'Sprint 2', time: 7.2 },
          { sprint: 'Sprint 3', time: 6.5 },
          { sprint: 'Sprint 4', time: 5.8 }
        ];
      case 'change_failure_rate':
        return [
          { month: 'Jan', rate: 12 },
          { month: 'Feb', rate: 9 },
          { month: 'Mar', rate: 7 },
          { month: 'Apr', rate: 5 }
        ];
      default:
        return [];
    }
  };

  const renderChart = () => {
    if (!chartData) return null;

    if (selectedChart === 'business_value') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="delivered" fill="#10b981" name="Livrée" />
            <Bar dataKey="planned" fill="#3b82f6" name="Planifiée" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (selectedChart === 'flow_efficiency') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedChart === 'cycle_time') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="time" stroke="#a855f7" strokeWidth={2} name="Cycle Time (jours)" />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedChart === 'change_failure_rate') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#f59e0b" name="CFR %" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  if (!selectedWorkspaceId) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-slate-500 text-sm">Sélectionnez un espace de travail pour commencer</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {showBusinessValueForm ? (
        <BusinessValueInputForm
          selectedWorkspaceId={selectedWorkspaceId}
          onDataSubmitted={() => {
            setShowBusinessValueForm(false);
            setSelectedChart(null);
            setChartData(null);
            // Recharger les metrics
            const refetch = async () => {
              try {
                const user = await base44.auth.me();
                const metrics = await base44.entities.BusinessValueMetric.filter({
                  workspace_id: selectedWorkspaceId,
                  user_email: user.email
                }, '-period_start_date', 100);
                setBusinessValueMetricsHistory(metrics || []);
              } catch (err) {
                console.error("Erreur reloading metrics:", err);
              }
            };
            refetch();
          }}
          onCancel={() => {
            setShowBusinessValueForm(false);
            setSelectedChart(null);
          }}
        />
      ) : selectedChart ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {CHART_TYPES[selectedChart].name}
              </h3>
              <p className="text-sm text-slate-500">{CHART_TYPES[selectedChart].description}</p>
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