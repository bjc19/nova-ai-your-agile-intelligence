import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Layers } from "lucide-react";

export default function WorkspaceSelector({ onWorkspaceChange, activeWorkspaceId, userRole }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const user = await base44.auth.me();
        console.log("🔍 [WorkspaceSelector] User loaded:", user?.email);
        
        // Check which connection is active (Jira OR Trello, never both)
        const [jiraConns, trelloConns] = await Promise.all([
          base44.entities.JiraConnection.filter({ user_email: user?.email, is_active: true }),
          base44.entities.TrelloConnection.filter({ user_email: user?.email, is_active: true })
        ]);
        console.log("🔍 [WorkspaceSelector] Jira connections:", jiraConns.length);
        console.log("🔍 [WorkspaceSelector] Trello connections:", trelloConns.length);

        let selections = [];
        
        // Load ONLY Jira projects if Jira is connected
        if (jiraConns.length > 0) {
          const jiraData = await base44.entities.JiraProjectSelection.filter({ 
            user_email: user?.email,
            is_active: true 
          });
          console.log("🔍 [WorkspaceSelector] Jira selections loaded:", jiraData.length, jiraData);
          selections = jiraData.map(ws => ({
            ...ws,
            display_name: ws.jira_project_name || 'Jira Project (Unnamed)'
          }));
        } 
        // Otherwise, load ONLY Trello boards if Trello is connected
        else if (trelloConns.length > 0) {
          const trelloData = await base44.entities.TrelloProjectSelection.filter({ 
            user_email: user?.email,
            is_active: true 
          });
          console.log("🔍 [WorkspaceSelector] Trello selections loaded:", trelloData.length, trelloData);
          selections = trelloData.map(ws => ({
            ...ws,
            display_name: ws.board_name || 'Trello Board (Unnamed)'
          }));
        }

        // For regular users, only show workspaces they're assigned to
        if (userRole === 'user') {
          const workspaceMembers = await base44.entities.WorkspaceMember.filter({
            user_email: user?.email
          });
          const assignedWorkspaceIds = workspaceMembers.map(wm => wm.workspace_id);
          console.log("🔍 [WorkspaceSelector] User role filter - assigned IDs:", assignedWorkspaceIds);
          selections = selections.filter(ws => assignedWorkspaceIds.includes(ws.id));
        }

        console.log("🔍 [WorkspaceSelector] Final selections:", selections.length, selections);
        setWorkspaces(selections);
      } catch (error) {
        console.error("❌ [WorkspaceSelector] Error loading workspaces:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [userRole]);

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="w-4 h-4 text-slate-400" />
      <Select value={activeWorkspaceId || ""} onValueChange={onWorkspaceChange}>
        <SelectTrigger className="w-[250px] bg-white border-slate-200">
          <SelectValue placeholder="Sélectionner un workspace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Toutes les analyses
            </div>
          </SelectItem>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                {workspace.display_name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}