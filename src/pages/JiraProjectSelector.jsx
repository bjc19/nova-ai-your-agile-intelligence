import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Database, Loader2, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

export default function JiraProjectSelector() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentSelections, setCurrentSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState(1);
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [availableSlots, setAvailableSlots] = useState(1);
  const [error, setError] = useState(null);

  // Load projects and current selections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await base44.functions.invoke('jiraGetProjects', {});
        
        const projectsList = res.data.projects || [];
        const quotaValue = res.data.quota || 10;
        const planValue = res.data.currentPlan || 'pro';
        const availableSlotsValue = res.data.availableSlots || quotaValue;

        setProjects(projectsList);
        setQuota(quotaValue);
        setCurrentPlan(planValue);
        setAvailableSlots(availableSlotsValue);

        // Load current selections
        const selections = await base44.entities.JiraProjectSelection.list();
        const activeSelections = selections.filter(s => s.is_active);
        setCurrentSelections(activeSelections);
        
        // Recalculate available slots
        setAvailableSlots(Math.max(0, quotaValue - activeSelections.length));
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Impossible de charger les projets Jira');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleProject = (projectKey) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectKey)) {
        return prev.filter(k => k !== projectKey);
      } else {
        // Check quota
        if (selectedProjects.length >= availableSlots && !currentSelections.find(s => s.jira_project_key === projectKey)) {
          setError(`Quota atteint. Vous pouvez analyser ${quota} projet(s) avec votre plan ${currentPlan}.`);
          return prev;
        }
        setError(null);
        return [...prev, projectKey];
      }
    });
  };

  const handleSaveSelection = async () => {
    try {
      setSaving(true);
      setError(null);

      // Get projects to add
      const projectsToAdd = projects.filter(p => selectedProjects.includes(p.key) && !currentSelections.find(s => s.jira_project_key === p.key));

      // Save new selections
      for (const project of projectsToAdd) {
        await base44.entities.JiraProjectSelection.create({
          jira_project_key: project.key,
          jira_project_id: project.id,
          jira_project_name: project.name,
          jira_project_type: project.type,
          workspace_name: `${project.name} Workspace`,
          selected_date: new Date().toISOString()
        });
      }

      // Show success and redirect
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1000);
    } catch (err) {
      console.error('Error saving selection:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelection = async (selectionId) => {
    try {
      await base44.entities.JiraProjectSelection.update(selectionId, { is_active: false });
      setCurrentSelections(prev => prev.filter(s => s.id !== selectionId));
      setAvailableSlots(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting selection:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={createPageUrl("Settings")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour aux paramètres
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Sélectionner les projets Jira</h1>
          </div>
          <p className="text-slate-600">
            Choisissez les projets à analyser. Chaque sélection crée un Workspace dédié.
          </p>
        </motion.div>

        {/* Plan Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Plan actuel: <span className="text-emerald-700 font-bold capitalize">{currentPlan}</span></p>
                  <p className="text-xs text-slate-600 mt-1">
                    Quota: {quota} projet(s) | Actuellement: {currentSelections.length} | Disponible: {availableSlots}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white">
                  {availableSlots > 0 ? `${availableSlots} slot${availableSlots > 1 ? 's' : ''} libre${availableSlots > 1 ? 's' : ''}` : 'Quota atteint'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Projets disponibles</h2>
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <p className="text-slate-500">Aucun projet Jira trouvé</p>
                ) : (
                  projects.map((project, idx) => {
                    const isSelected = selectedProjects.includes(project.key);
                    const isCurrentlySelected = currentSelections.find(s => s.jira_project_key === project.key);
                    const canSelect = isSelected || availableSlots > 0 || isCurrentlySelected;

                    return (
                      <motion.div
                        key={project.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className={`cursor-pointer transition-all ${
                          isSelected ? 'border-emerald-300 bg-emerald-50' : 'hover:border-slate-300'
                        } ${!canSelect && !isCurrentlySelected ? 'opacity-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected || !!isCurrentlySelected}
                                onCheckedChange={() => !isCurrentlySelected && handleToggleProject(project.key)}
                                disabled={!canSelect && !isCurrentlySelected}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-slate-900">{project.name}</p>
                                  <Badge variant="outline" className="text-xs">{project.key}</Badge>
                                  {isCurrentlySelected && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Sélectionné</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{project.description || 'Aucune description'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar: Current Selections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workspaces actuels</CardTitle>
                <CardDescription className="text-xs">
                  {currentSelections.length} workspace(s) actif(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentSelections.length === 0 ? (
                  <p className="text-xs text-slate-500">Aucun workspace</p>
                ) : (
                  currentSelections.map((selection, idx) => (
                    <motion.div
                      key={selection.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{selection.jira_project_name}</p>
                          <p className="text-xs text-slate-500">{selection.workspace_name}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSelection(selection.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSaveSelection}
                disabled={selectedProjects.length === 0 || saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmer la sélection
                  </>
                )}
              </Button>
              <Link to={createPageUrl("Dashboard")} className="w-full">
                <Button variant="outline" className="w-full">
                  Retour au Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}