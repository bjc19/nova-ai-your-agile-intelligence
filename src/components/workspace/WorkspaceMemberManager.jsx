import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkspaceMemberManager() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = await base44.auth.me();
        
        // Load user's workspaces
        const userWorkspaces = await base44.entities.JiraProjectSelection.filter({
          created_by: user.email,
          is_active: true
        });
        setWorkspaces(userWorkspaces);

        // Load all users for invitation
        const allUsers = await base44.entities.User.list();
        setAvailableUsers(allUsers.filter(u => u.email !== user.email));

        if (userWorkspaces.length > 0) {
          setSelectedWorkspaceId(userWorkspaces[0].id);
          await loadMembers(userWorkspaces[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadMembers = async (workspaceId) => {
    try {
      const memberList = await base44.entities.WorkspaceMember.filter({
        workspace_id: workspaceId
      });
      setMembers(memberList);
    } catch (error) {
      console.error("Error loading members:", error);
      setMembers([]);
    }
  };

  const handleWorkspaceChange = async (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    await loadMembers(workspaceId);
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedWorkspaceId) return;

    setAdding(true);
    try {
      await base44.entities.WorkspaceMember.create({
        user_email: selectedUser,
        user_name: availableUsers.find(u => u.email === selectedUser)?.full_name || selectedUser,
        workspace_id: selectedWorkspaceId,
        role: selectedRole,
        invitation_status: "accepted"
      });

      await loadMembers(selectedWorkspaceId);
      setSelectedUser("");
      setSelectedRole("user");
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemoving(memberId);
    try {
      await base44.entities.WorkspaceMember.delete(memberId);
      await loadMembers(selectedWorkspaceId);
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const memberEmails = members.map(m => m.user_email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Gérer les Membres des Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workspace Selector */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Sélectionner un Workspace
            </label>
            <Select value={selectedWorkspaceId || ""} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(workspace => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.jira_project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkspace && (
            <>
              {/* Add Member Section */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Ajouter un Membre</h3>
                <div className="flex gap-2 flex-wrap">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="flex-1 min-w-[200px]">
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(u => !memberEmails.includes(u.email))
                        .map(user => (
                          <SelectItem key={user.id} value={user.email}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="contributor">Contributeur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedUser || adding}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Membres ({members.length})
                </h3>
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun membre pour ce workspace</p>
                ) : (
                  <div className="space-y-2">
                    {members.map(member => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.user_name}
                          </p>
                          <p className="text-xs text-slate-500">{member.user_email}</p>
                          <span className="text-xs text-slate-600 mt-1">
                            Rôle:{" "}
                            <span className="font-semibold">
                              {member.role === "admin"
                                ? "Administrateur"
                                : member.role === "contributor"
                                ? "Contributeur"
                                : "Utilisateur"}
                            </span>
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removing === member.id}
                          className="text-red-600 hover:bg-red-50"
                        >
                          {removing === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </motion.div>
                    ))}
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