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
import { ArrowLeft, Layers, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function TrelloProjectSelector() {
  useAccessControl();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Sélection projets, 2: Assignation membres, 3: Récapitulatif
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [selectedProjectsData, setSelectedProjectsData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberAssignments, setMemberAssignments] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [savingSelection, setSavingSelection] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [maxProjects, setMaxProjects] = useState(5); // Changed from 10 to 5
  const [currentUser, setCurrentUser] = useState(null);

  // Load available projects and existing selections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProjects(true);

        // Get current user
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Fetch available Trello projects (includes isSelected flag from backend)
        const projectsRes = await base44.functions.invoke('trelloGetProjects', {});
        setProjects(projectsRes.data.boards || []);

        // Extract selected IDs from boards marked as selected
        const selectedIds = new Set(
          (projectsRes.data.boards || [])
            .filter(b => b.isSelected)
            .map(b => b.id)
        );
        setSelectedProjects(selectedIds);

        // Fetch user's subscription status for quota info
        try {
          const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
          setUserPlan(statusRes.data.plan || 'starter');
          setMaxProjects(statusRes.data.maxProjectsAllowed || 5); // Changed fallback from 10 to 5
        } catch (e) {
          setMaxProjects(5); // Changed fallback from 10 to 5
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
    if (selectedProjects.size === 0) {
      toast.error('Veuillez sélectionner au moins un projet avant de continuer');
      return;
    }

    try {
      setSavingSelection(true);
      
      const selectedIds = Array.from(selectedProjects);
      const selectedBoards = projects.filter(p => selectedIds.includes(p.id));
      
      const response = await base44.functions.invoke('trelloSaveProjectSelection', {
        selected_board_ids: selectedIds,
        boards: selectedBoards
      });

      if (response.data.success) {
        // Wait a moment for database to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload selections from database to ensure UI is in sync
        const savedSelections = await base44.entities.TrelloProjectSelection.filter({
          is_active: true
        });
        
        const savedIds = new Set(savedSelections.map(s => s.board_id));
        setSelectedProjects(savedIds);
        
        const selectedBoards = projects.filter(p => savedIds.has(p.id));
        setSelectedProjectsData(selectedBoards);
        
        // Charger les membres de l'équipe et les utilisateurs (exclure l'utilisateur actuel)
        try {
          const currentUserEmail = currentUser?.email;
          const [teamMembers, allUsers] = await Promise.all([
            base44.entities.TeamMember.list(),
            base44.entities.User.list()
          ]);

          // Combiner TeamMember et User, en priorité TeamMember, exclure l'utilisateur actuel
          const memberMap = new Map();

          // D'abord ajouter tous les utilisateurs (sauf l'utilisateur actuel)
          allUsers.forEach(u => {
            if (u.email !== currentUserEmail) {
              memberMap.set(u.email, {
                user_email: u.email,
                user_name: u.full_name || u.email,
                role: u.role || 'user'
              });
            }
          });

          // Puis écraser avec les TeamMember qui ont plus d'infos (sauf l'utilisateur actuel)
          teamMembers.forEach(tm => {
            if (tm.user_email !== currentUserEmail) {
              memberMap.set(tm.user_email, tm);
            }
          });

          setTeamMembers(Array.from(memberMap.values()));
        } catch (error) {
          console.error('Error loading members:', error);
          toast.error('Erreur lors du chargement des membres');
        }
        
        // Charger les assignations existantes depuis la base de données
        const existingAssignments = {};
        for (const board of selectedBoards) {
          try {
            const existingMembers = await base44.entities.WorkspaceMember.filter({
              workspace_id: board.id
            });
            existingAssignments[board.id] = existingMembers.map(m => m.user_email);
          } catch (error) {
            console.error(`Error loading existing assignments for board ${board.id}:`, error);
            existingAssignments[board.id] = [];
          }
        }
        setMemberAssignments(existingAssignments);
        
        toast.success('Projets sauvegardés ! Assignez maintenant les membres.');
        setStep(2);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Erreur lors de la sauvegarde de la sélection');
    } finally {
      setSavingSelection(false);
    }
  };

  const toggleMemberAssignment = (boardId, memberEmail) => {
    setMemberAssignments(prev => {
      const current = prev[boardId] || [];
      const isAssigned = current.includes(memberEmail);
      
      return {
        ...prev,
        [boardId]: isAssigned
          ? current.filter(email => email !== memberEmail)
          : [...current, memberEmail]
      };
    });
  };

  const handleRemoveAssignedMember = async (event, boardId, memberEmail) => {
    event.stopPropagation();
    
    // Optimistic UI update
    setMemberAssignments(prev => {
      const current = prev[boardId] || [];
      return {
        ...prev,
        [boardId]: current.filter(email => email !== memberEmail)
      };
    });
    
    try {
      const existingAssignment = await base44.entities.WorkspaceMember.filter({
        workspace_id: boardId,
        user_email: memberEmail
      });
      
      if (existingAssignment.length > 0) {
        await base44.entities.WorkspaceMember.delete(existingAssignment[0].id);
        toast.success('Membre retiré');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erreur lors du retrait');
      // Rollback on error
      setMemberAssignments(prev => {
        const current = prev[boardId] || [];
        return {
          ...prev,
          [boardId]: [...current, memberEmail]
        };
      });
    }
  };

  const handleFinishAssignment = async () => {
    try {
      setSavingSelection(true);
      
      // Récupérer les assignations existantes pour identifier les nouveaux membres
      const existingAssignmentsMap = {};
      for (const [boardId] of Object.entries(memberAssignments)) {
        const existing = await base44.entities.WorkspaceMember.filter({
          workspace_id: boardId
        });
        existingAssignmentsMap[boardId] = existing.map(m => m.user_email);
      }
      
      // Créer les assignations UNIQUEMENT pour les nouveaux membres
      let newAssignmentsCount = 0;
      for (const [boardId, memberEmails] of Object.entries(memberAssignments)) {
        const board = selectedProjectsData.find(b => b.id === boardId);
        const existingEmails = existingAssignmentsMap[boardId] || [];
        
        for (const memberEmail of memberEmails) {
          // Ne créer que si pas déjà assigné
          if (!existingEmails.includes(memberEmail)) {
            const member = teamMembers.find(m => m.user_email === memberEmail);
            
            await base44.entities.WorkspaceMember.create({
              user_email: memberEmail,
              user_name: member?.user_name || memberEmail,
              role: member?.role || 'user',
              workspace_id: boardId,
              invited_by: currentUser?.email,
              invitation_status: 'accepted'
            });
            
            // Envoyer l'email UNIQUEMENT aux nouveaux membres
            try {
              await base44.integrations.Core.SendEmail({
                to: memberEmail,
                subject: `Vous avez été ajouté au workspace Trello "${board.name}"`,
                body: `Bonjour ${member?.user_name || memberEmail},\n\nVous avez été ajouté au workspace Trello "${board.name}" par ${currentUser?.full_name || currentUser?.email}.\n\nVous pouvez maintenant accéder aux analyses et insights de ce projet.\n\nCordialement,\nL'équipe Nova`,
                from_name: 'Nova'
              });
              newAssignmentsCount++;
            } catch (emailError) {
              console.error(`Erreur lors de l'envoi de l'email à ${memberEmail}:`, emailError);
            }
          }
        }
      }
      
      if (newAssignmentsCount > 0) {
        toast.success(`${newAssignmentsCount} nouveau(x) membre(s) assigné(s) avec succès !`);
      } else {
        toast.success('Assignations mises à jour !');
      }
      setStep(3);
    } catch (error) {
      console.error('Error assigning members:', error);
      toast.error('Erreur lors de l\'assignation des membres');
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
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => {
              if (step === 1) navigate(createPageUrl("Settings"));
              else if (step === 2) setStep(1);
              else setStep(2);
            }}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {step === 1 ? 'Retour aux paramètres' : (step === 2 ? 'Retour à la sélection des projets' : 'Retour aux assignations')}
          </button>

          {/* Stepper */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-500'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                Sélection des projets
              </span>
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-sky-600' : 'bg-slate-300'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 2 ? 'bg-sky-600 text-white' : (step > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500')
              }`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                Assignation des membres
              </span>
            </div>
            <div className={`h-0.5 w-16 ${step >= 3 ? 'bg-sky-600' : 'bg-slate-300'}`} />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 3 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-500'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium ${step === 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                Récapitulatif
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-100">
              <Layers className="w-5 h-5 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              {step === 1 ? 'Sélectionner vos projets Trello' : (step === 2 ? 'Assigner les membres' : 'Récapitulatif des assignations')}
            </h1>
          </div>
          <p className="text-slate-600">
            {step === 1 
              ? 'Choisissez les tableaux Trello à analyser avec Nova.'
              : (step === 2 
                ? 'Assignez les membres de votre équipe aux tableaux sélectionnés.'
                : 'Vos assignations ont été enregistrées et les membres ont été notifiés par email.')
            }
          </p>
        </motion.div>

        {/* Step 1: Plan & Quota Card */}
        {step === 1 && (
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
        )}

        {/* Step 1: Projects List */}
        {step === 1 && (
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
        )}

        {/* Step 2: Member Assignment */}
        {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 space-y-6"
        >
          {/* Selected Projects Summary */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Projets sélectionnés ({selectedProjectsData.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedProjectsData.map(project => (
                  <Badge key={project.id} className="bg-emerald-600 text-white">
                    {project.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Member Assignment per Project */}
          {selectedProjectsData.map((project) => {
            const alreadyAssigned = memberAssignments[project.id] || [];
            const assignedMembers = teamMembers.filter(m => alreadyAssigned.includes(m.user_email));
            const availableMembers = teamMembers.filter(m => !alreadyAssigned.includes(m.user_email));
            
            return (
              <Card key={project.id} className="border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-600" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    Gérez les membres assignés à ce tableau
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Membres déjà assignés */}
                  {assignedMembers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Membres déjà assignés :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assignedMembers.map(member => (
                          <Badge 
                            key={member.user_email} 
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 px-3 py-1.5 flex items-center gap-2" // Removed onClick from Badge
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {member.user_name || member.user_email}
                            <button
                              onClick={(e) => handleRemoveAssignedMember(e, project.id, member.user_email)} // Added event parameter
                              className="ml-1 hover:text-emerald-900 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Membres disponibles à ajouter */}
                  {availableMembers.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Ajouter des membres :
                      </p>
                      <div className="space-y-2">
                        {availableMembers.map((member) => (
                          <Card
                            key={member.id}
                            className="cursor-pointer transition-all border border-slate-200 hover:border-sky-200"
                            onClick={() => toggleMemberAssignment(project.id, member.user_email)}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => toggleMemberAssignment(project.id, member.user_email)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-900">
                                  {member.user_name || member.user_email}
                                </p>
                                <p className="text-xs text-slate-500">{member.user_email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    assignedMembers.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Aucun membre d'équipe disponible
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
        )}

        {/* Step 3: Assignment Summary */}
        {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 space-y-6"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Assignations terminées !
              </h3>
              <p className="text-slate-700">
                Les membres ont été assignés aux tableaux Trello et notifiés par email.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            Récapitulatif des assignations
          </h2>

          {selectedProjectsData.map((project) => (
            <Card key={project.id} className="border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-700 mb-3">Membres assignés :</p>
                {memberAssignments[project.id]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(memberAssignments[project.id])].map(memberEmail => {
                      const member = teamMembers.find(m => m.user_email === memberEmail);
                      return (
                        <Badge key={memberEmail} variant="secondary" className="text-sm">
                          {member?.user_name || memberEmail}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Aucun membre assigné à ce tableau</p>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4 justify-end"
        >
          {step === 1 && (
            <>
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
                    Continuer
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Settings"))}
                className="px-6"
              >
                Terminer plus tard
              </Button>
              <Button
                onClick={handleFinishAssignment}
                disabled={savingSelection}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8"
              >
                {savingSelection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assignation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Terminer l'assignation
                  </>
                )}
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="px-6"
              >
                Modifier les assignations
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Settings"))}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
              >
                Retour aux paramètres
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}