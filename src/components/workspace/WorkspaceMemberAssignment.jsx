import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Search } from "lucide-react";

export default function WorkspaceMemberAssignment() {
  const [workspaces, setWorkspaces] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // Fetch workspaces and team members on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUserEmail(user?.email);

        // Check which connection is active (Jira OR Trello, never both)
        const [jiraConns, trelloConns, usersData, wmData] = await Promise.all([
          base44.entities.JiraConnection.filter({ user_email: user?.email, is_active: true }),
          base44.entities.TrelloConnection.filter({ user_email: user?.email, is_active: true }),
          base44.entities.User.list(),
          base44.entities.WorkspaceMember.list()
        ]);

        let workspacesData = [];
        
        // Load ONLY Jira projects if Jira is connected
        if (jiraConns.length > 0) {
          const jiraData = await base44.entities.JiraProjectSelection.filter({ 
            user_email: user?.email,
            is_active: true 
          });
          workspacesData = jiraData.map(ws => ({ ...ws, source: 'jira' }));
        } 
        // Otherwise, load ONLY Trello boards if Trello is connected
        else if (trelloConns.length > 0) {
          const trelloData = await base44.entities.TrelloProjectSelection.filter({ 
            user_email: user?.email,
            is_active: true 
          });
          workspacesData = trelloData.map(ws => ({ 
            ...ws, 
            source: 'trello',
            workspace_name: ws.board_name,
            jira_project_name: ws.board_name 
          }));
        }
        
        setWorkspaces(workspacesData);
        setTeamMembers(usersData);
        setWorkspaceMembers(wmData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddMember = async () => {
    if (!selectedWorkspace || !selectedMember) return;

    setIsAdding(true);
    try {
      // Check if member already exists in workspace
      const existing = workspaceMembers.find(
        wm => wm.workspace_id === selectedWorkspace && wm.user_email === selectedMember.email
      );

      if (existing) {
        alert("Cet utilisateur est déjà dans ce workspace");
        setIsAdding(false);
        return;
      }

      // Add new workspace member
      await base44.entities.WorkspaceMember.create({
        user_email: selectedMember.email,
        user_name: selectedMember.full_name,
        workspace_id: selectedWorkspace,
        role: selectedRole,
        invited_by: (await base44.auth.me()).email,
        invitation_status: "accepted"
      });

      // Refresh data
      const updated = await base44.entities.WorkspaceMember.list();
      setWorkspaceMembers(updated);

      // Reset form
      setSelectedMember(null);
      setSelectedRole("user");
      alert("Utilisateur ajouté avec succès");
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Erreur lors de l'ajout de l'utilisateur");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer cet utilisateur du workspace ?")) return;

    try {
      await base44.entities.WorkspaceMember.delete(memberId);
      const updated = await base44.entities.WorkspaceMember.list();
      setWorkspaceMembers(updated);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Filter members in selected workspace
  const membersInWorkspace = selectedWorkspace
    ? workspaceMembers.filter(wm => wm.workspace_id === selectedWorkspace)
    : [];

  // Filter available members (not in workspace and not current user)
  const availableMembers = selectedWorkspace
    ? teamMembers.filter(user => 
        user.email !== currentUserEmail &&
        !workspaceMembers.find(wm => wm.workspace_id === selectedWorkspace && wm.user_email === user.email)
      )
    : [];

  const filteredAvailable = availableMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentWorkspace = workspaces.find(ws => ws.id === selectedWorkspace);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Gestion des Membres du Workspace</CardTitle>
              <CardDescription className="text-xs">
                Assignez les utilisateurs de votre équipe à des workspaces spécifiques
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workspace Selection */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Sélectionner un Workspace
            </label>
            <Select value={selectedWorkspace || ""} onValueChange={setSelectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(ws => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.workspace_name} ({ws.jira_project_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkspace && (
            <>
              {/* Add Member Section */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Ajouter un Utilisateur</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                      Rechercher un utilisateur
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {filteredAvailable.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filteredAvailable.map(member => (
                        <div
                          key={member.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-all ${
                            selectedMember?.id === member.id
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <p className="text-sm font-medium text-slate-900">{member.full_name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-sm text-slate-500">
                      {teamMembers.length === 0 ? "Aucun utilisateur dans l'équipe" : "Tous les utilisateurs disponibles sont déjà assignés"}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Rôle</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="contributor">Contributeur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedMember || isAdding}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isAdding ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Membres du Workspace ({membersInWorkspace.length})
                </h3>

                {membersInWorkspace.length > 0 ? (
                  <div className="space-y-2">
                    {membersInWorkspace.map(member => (
                      <div
                        key={member.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{member.user_name}</p>
                          <p className="text-xs text-slate-500">{member.user_email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {member.role === "admin" ? "🔑 Admin" : member.role === "contributor" ? "👤 Contributeur" : "👁️ Utilisateur"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.invitation_status === "accepted" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                                Accepté
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1 text-amber-600" />
                                En attente
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Aucun utilisateur dans ce workspace</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}