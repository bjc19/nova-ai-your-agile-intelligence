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
  const [businessValueMetric, setBusinessValueMetric] = useState(null);

  // Charger les données Business Value
  useEffect(() => {
    if (!selectedWorkspaceId) return;
    
    const fetchBusinessValueMetric = async () => {
      try {
        const user = await base44.auth.me();
        const metrics = await base44.entities.BusinessValueMetric.filter({
          workspace_id: selectedWorkspaceId,
          user_email: user.email
        });
        if (metrics.length > 0) {
          setBusinessValueMetric(metrics[0]);
        }
      } catch (err) {
        console.error("Erreur chargement Business Value:", err);
      }
    };
    
    fetchBusinessValueMetric();
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

    // Pour Business Value, afficher le formulaire si aucune donnée
    if (chartType === 'business_value') {
      if (!businessValueMetric) {
        setShowBusinessValueForm(true);
        setSelectedChart(chartType);
        return;
      }
      // Si données existent, les utiliser directement
      setLoading(true);
      setSelectedChart(chartType);
      try {
        const chartDataForBusinessValue = [{
          period: `${businessValueMetric.period_start_date} à ${businessValueMetric.period_end_date}`,
          delivered: businessValueMetric.value_delivered,
          planned: businessValueMetric.value_planned
        }];
        setChartData(chartDataForBusinessValue);
        setSuggestion(CHART_TYPES[chartType]);
      } catch (error) {
        console.error("Erreur génération graphique Business Value:", error);
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
    if (!chartData || !selectedChart) return null;

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
      case 'business_value':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis label={{ value: '$ Value', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(val) => `$${val.toLocaleString('fr-FR')}`} />
              <Legend />
              <Bar dataKey="delivered" fill="#10b981" name="Livré" />
              <Bar dataKey="planned" fill="#d1d5db" name="Planifié" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (showBusinessValueForm && selectedChart === 'business_value') {
    return (
      <BusinessValueInputForm
        selectedWorkspaceId={selectedWorkspaceId}
        onDataSubmitted={async () => {
          // Recharger les données Business Value
          try {
            const user = await base44.auth.me();
            const metrics = await base44.entities.BusinessValueMetric.filter({
              workspace_id: selectedWorkspaceId,
              user_email: user.email
            });
            if (metrics.length > 0) {
              setBusinessValueMetric(metrics[0]);
            }
          } catch (err) {
            console.error("Erreur recharge Business Value:", err);
          }
          setShowBusinessValueForm(false);
          // Régénérer le graphique avec les nouvelles données
          await generateChart('business_value');
        }}
        onCancel={() => {
          setShowBusinessValueForm(false);
          setSelectedChart(null);
        }}
      />
    );
  }

  if (!selectedWorkspaceId) {
    return (
      <Card className="p-6 bg-slate-50">
        <p className="text-sm text-slate-500">Sélectionnez un workspace pour générer des graphiques</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <Card className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Générateur de Graphiques Intelligents</h3>
          {bestChartSuggestion && (
            <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
              💡 {bestChartSuggestion.reason}
            </p>
          )}
        </div>

        {!selectedChart ? (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CHART_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              const isRecommended = bestChartSuggestion?.key === key;

              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => generateChart(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isRecommended
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isRecommended ? 'text-blue-600' : 'text-slate-600'}`} />
                  <div className="text-sm font-semibold text-slate-900">{config.name}</div>
                  <div className="text-xs text-slate-500">{config.metric}</div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{suggestion?.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{suggestion?.description}</p>
              </div>
              <div className="flex gap-2">
                {selectedChart === 'business_value' && businessValueMetric && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBusinessValueForm(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedChart(null);
                    setChartData(null);
                  }}
                >
                  Changer
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              renderChart()
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}