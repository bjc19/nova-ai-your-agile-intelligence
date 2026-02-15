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
        base44.entities.WorkspaceMember.list()]
        );

        let workspacesData = [];

        // Load ONLY Jira projects if Jira is connected
        if (jiraConns.length > 0) {
          const jiraData = await base44.entities.JiraProjectSelection.filter({
            user_email: user?.email,
            is_active: true
          });
          workspacesData = jiraData.map((ws) => ({ ...ws, source: 'jira' }));
        }
        // Otherwise, load ONLY Trello boards if Trello is connected
        else if (trelloConns.length > 0) {
          const trelloData = await base44.entities.TrelloProjectSelection.filter({
            user_email: user?.email,
            is_active: true
          });
          workspacesData = trelloData.map((ws) => ({
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
        (wm) => wm.workspace_id === selectedWorkspace && wm.user_email === selectedMember.email
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
  const membersInWorkspace = selectedWorkspace ?
  workspaceMembers.filter((wm) => wm.workspace_id === selectedWorkspace) :
  [];

  // Filter available members (not in workspace and not current user)
  const availableMembers = selectedWorkspace ?
  teamMembers.filter((user) =>
  user.email !== currentUserEmail &&
  !workspaceMembers.find((wm) => wm.workspace_id === selectedWorkspace && wm.user_email === user.email)
  ) :
  [];

  const filteredAvailable = availableMembers.filter((member) =>
  member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentWorkspace = workspaces.find((ws) => ws.id === selectedWorkspace);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Chargement...</div>
      </div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6">

      




































































































































































    </motion.div>);

}