import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Clock, TrendingDown, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AverageResolutionTimeMetric({ workspaceId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await base44.functions.invoke('calculateAverageResolutionTime', {
          workspaceId
        });

        setData(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching resolution time:', err);
        setError('Impossible de charger les données');
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!loading && data && data.resolvedCount === 0) {
      toast.info('Aucun anti-pattern résolu pour le moment');
    }
  }, [loading, data]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data || data.resolvedCount === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Aucun anti-pattern résolu pour le moment</p>
        </div>
      </Card>
    );
  }

  const trend = data.trends.length > 1 
    ? ((data.trends[data.trends.length - 1].average - data.trends[0].average) / data.trends[0].average * 100).toFixed(1)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 bg-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Temps moyen de résolution des anti-patterns
              </h3>
            </div>
            {trend < 0 && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>{Math.abs(trend)}% amélioration</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Durée moyenne entre la détection et la résolution
          </p>
        </div>

        {/* Main Metric */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-600">
              {data.averageResolutionDays}
            </span>
            <span className="text-slate-600">jours</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {data.resolvedCount} anti-pattern{data.resolvedCount > 1 ? 's' : ''} résolu{data.resolvedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Trend Chart */}
        {data.trends.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Évolution dans le temps</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => [`${value} jours`, 'Moyenne']}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Resolutions */}
        {data.details && data.details.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Résolutions récentes</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.details.slice(-5).reverse().map((item) => (
                <button
                  key={item.pattern_id}
                  onClick={() => setSelectedDetail(item)}
                  className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{item.pattern_name}</p>
                    <p className="text-xs text-slate-500">
                      Résolu le {new Date(item.resolved_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      item.days_to_resolve <= 3 ? 'bg-green-100 text-green-700' :
                      item.days_to_resolve <= 7 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.days_to_resolve}j
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{selectedDetail.pattern_name}</h3>
              <p className="text-sm text-slate-500 mt-1">Détails de la résolution</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600 uppercase tracking-wide">Temps de résolution</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{selectedDetail.days_to_resolve} jours</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Sévérité</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{selectedDetail.severity}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Catégorie</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">Anti-pattern</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs text-slate-600 uppercase tracking-wide">Résolu le</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {new Date(selectedDetail.resolved_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

              <button
                onClick={() => setSelectedDetail(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}