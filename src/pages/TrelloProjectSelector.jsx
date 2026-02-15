import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAccessControl } from "@/components/dashboard/useAccessControl";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Layers, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TrelloProjectSelector() {
  useAccessControl();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [savingSelection, setSavingSelection] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [maxProjects, setMaxProjects] = useState(10);

  // Load available projects and existing selections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProjects(true);

        // Get current user
        const user = await base44.auth.me();

        // Fetch available Trello projects
        const projectsRes = await base44.functions.invoke('trelloGetProjects', {});
        console.log('Fetched projects:', projectsRes.data.boards?.length, projectsRes.data.boards);
        setProjects(projectsRes.data.boards || []);

        // Fetch existing selections
        const selections = await base44.entities.TrelloProjectSelection.filter({
          user_email: user.email,
          is_active: true
        });
        console.log('Existing selections:', selections.length, selections);

        const selectedIds = new Set(selections.map(s => s.board_id));
        console.log('Selected IDs:', Array.from(selectedIds));
        setSelectedProjects(selectedIds);

        // Fetch user's subscription status for quota info
        try {
          const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
          setUserPlan(statusRes.data.plan || 'starter');
          setMaxProjects(statusRes.data.maxProjectsAllowed || 10);
        } catch (e) {
          console.log('Could not fetch plan info, using defaults');
          setMaxProjects(10);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des projets Trello');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadData();
  }, []);

  const handleProjectToggle = (projectId) => {
    const newSelected = new Set(selectedProjects);
    
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      if (newSelected.size >= maxProjects) {
        toast.error(`Quota atteint. Maximum ${maxProjects} projets autorisés.`);
        return;
      }
      newSelected.add(projectId);
    }
    
    setSelectedProjects(newSelected);
  };

  const handleConfirmSelection = async () => {
    try {
      setSavingSelection(true);
      
      const selectedIds = Array.from(selectedProjects);
      const selectedBoards = projects.filter(p => selectedIds.includes(p.id));
      
      const response = await base44.functions.invoke('trelloSaveProjectSelection', {
        selected_board_ids: selectedIds,
        boards: selectedBoards
      });

      if (response.data.success) {
        toast.success('Sélection sauvegardée avec succès');
        setTimeout(() => {
          navigate(createPageUrl("Settings"));
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Erreur lors de la sauvegarde de la sélection');
    } finally {
      setSavingSelection(false);
    }
  };

  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des projets Trello...</p>
        </div>
      </div>
    );
  }

  const availableSlots = maxProjects - selectedProjects.size;
  const quotaPercentage = (selectedProjects.size / maxProjects) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(createPageUrl("Settings"))}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour aux paramètres
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-100">
              <Layers className="w-5 h-5 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Sélectionner vos projets Trello
            </h1>
          </div>
          <p className="text-slate-600">
            Choisissez les tableaux Trello à analyser avec Nova.
          </p>
        </motion.div>

        {/* Plan & Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Plan actuel
                  </p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {userPlan || 'Starter'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Quota total
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {maxProjects} projet{maxProjects > 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Disponible
                  </p>
                  <p className={`text-lg font-semibold ${availableSlots > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {availableSlots} slot{availableSlots !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Utilisation du quota
                  </span>
                  <span className="text-sm text-slate-600">
                    {selectedProjects.size} / {maxProjects}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quotaPercentage > 90
                        ? 'bg-red-500'
                        : quotaPercentage > 70
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${quotaPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            Tableaux disponibles ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">Aucun tableau Trello trouvé.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assurez-vous que votre connexion Trello est active.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedProjects.has(project.id)
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-sky-200'
                  }`}
                  onClick={() => handleProjectToggle(project.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={selectedProjects.has(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {project.id}</p>
                    </div>
                    {selectedProjects.has(project.id) && (
                      <Badge className="bg-sky-100 text-sky-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Sélectionné
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4 justify-end"
        >
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Settings"))}
            className="px-6"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={savingSelection || selectedProjects.size === 0}
            className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white px-8"
          >
            {savingSelection ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmer la sélection ({selectedProjects.size})
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}