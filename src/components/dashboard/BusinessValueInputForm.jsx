import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, Calendar, Trash2, Loader2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { differenceInMonths, parseISO } from "date-fns";
import BusinessValueChart from "./BusinessValueChart";

export default function BusinessValueInputForm({ selectedWorkspaceId, onDataSubmitted, onCancel }) {
  const [valueDelivered, setValueDelivered] = useState("");
  const [valuePlanned, setValuePlanned] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [metricsData, setMetricsData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Charger les données existantes
  useEffect(() => {
    const loadMetrics = async () => {
      setDataLoading(true);
      try {
        const user = await base44.auth.me();
        if (!user) {
          setDataLoading(false);
          return;
        }

        const metrics = await base44.entities.BusinessValueMetric.filter({
          workspace_id: selectedWorkspaceId,
          user_email: user.email
        });

        if (metrics && metrics.length > 0) {
          setMetricsData(metrics);
          setShowChart(true);
        } else {
          setShowChart(false);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des métriques:", err);
        setShowChart(false);
      } finally {
        setDataLoading(false);
      }
    };

    if (selectedWorkspaceId) {
      loadMetrics();
    }
  }, [selectedWorkspaceId]);

  const validatePeriod = () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner une période complète");
      return false;
    }
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const monthsDiff = differenceInMonths(end, start);
    if (monthsDiff < 1) {
      setError("La période doit être d'au moins 1 mois");
      return false;
    }
    return true;
  };

  const validateValues = () => {
    if (!valueDelivered || !valuePlanned) {
      setError("Veuillez saisir les deux valeurs");
      return false;
    }
    if (isNaN(parseFloat(valueDelivered)) || isNaN(parseFloat(valuePlanned))) {
      setError("Les valeurs doivent être des nombres");
      return false;
    }
    if (parseFloat(valueDelivered) <= 0 || parseFloat(valuePlanned) <= 0) {
      setError("Les valeurs doivent être supérieures à 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log("🔵 SUBMIT CLICKED", { valueDelivered, valuePlanned, startDate, endDate });
    setError(null);
    
    const valuesValid = validateValues();
    const periodValid = validatePeriod();
    console.log("✅ Validation results:", { valuesValid, periodValid });
    
    if (!valuesValid || !periodValid) {
      console.log("❌ Validation failed, returning");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        setError("Veuillez vous connecter pour continuer");
        setLoading(false);
        return;
      }
      
      const payload = {
        user_email: user.email,
        workspace_id: selectedWorkspaceId,
        value_delivered: parseFloat(valueDelivered),
        value_planned: parseFloat(valuePlanned),
        period_start_date: startDate,
        period_end_date: endDate,
        is_locked: true
      };
      console.log("📦 Payload:", payload);
      
      const result = await base44.entities.BusinessValueMetric.create(payload);
      console.log("✅ Created:", result);
      
      // Réinitialiser le formulaire
      setValueDelivered("");
      setValuePlanned("");
      setStartDate("");
      setEndDate("");
      
      // Appeler le callback avec un petit délai pour laisser l'UI se mettre à jour
      setTimeout(() => {
        onDataSubmitted();
      }, 300);
    } catch (err) {
      console.error("Erreur BusinessValue:", err);
      setError("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const existingMetrics = await base44.entities.BusinessValueMetric.filter({
        workspace_id: selectedWorkspaceId,
        user_email: user.email
      });
      
      if (existingMetrics.length > 0) {
        for (const metric of existingMetrics) {
          await base44.entities.BusinessValueMetric.delete(metric.id);
        }
      }
      
      setValueDelivered("");
      setValuePlanned("");
      setStartDate("");
      setEndDate("");
      setShowResetDialog(false);
      onDataSubmitted();
    } catch (err) {
      setError("Erreur lors de la réinitialisation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 bg-white">
        {showChart && metricsData.length > 0 ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Métriques de Valeur Business</h3>
                  <p className="text-sm text-slate-500">Graphique comparatif des valeurs livrées vs planifiées</p>
                </div>
                <Button
                  onClick={() => setShowChart(false)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ajouter une métrique
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <BusinessValueChart data={metricsData} />
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Saisir la Valeur Business</h3>
              <p className="text-sm text-slate-500">Entrez la valeur livrée et planifiée pour une période minimale de 1 mois</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valeur Livrée ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={valueDelivered}
                      onChange={(e) => setValueDelivered(e.target.value)}
                      className="pl-8"
                      disabled={loading}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valeur Planifiée ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={valuePlanned}
                      onChange={(e) => setValuePlanned(e.target.value)}
                      className="pl-8"
                      disabled={loading}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">Période d'analyse (minimum 1 mois)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date de début</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-8"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date de fin</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-8"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Soumettre
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => setShowResetDialog(true)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réinitialiser les données</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera toutes les données de Business Value saisies pour ce workspace. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                Réinitialiser
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </motion.div>
  );
}