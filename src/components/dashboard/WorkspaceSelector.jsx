import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Layers } from "lucide-react";

export default function WorkspaceSelector({ onWorkspaceChange, activeWorkspaceId, user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        if (!user?.email) {
          console.log("🔍 [WorkspaceSelector] User not available, skipping");
          return;
        }
        console.log("🔍 [WorkspaceSelector] User from props:", user?.email);
        
        let selections = [];
        
        // For regular users, load only assigned workspaces
        if (user?.role === 'user') {
          // Load Jira projects (RLS automatically filters based on WorkspaceMember relation)
          const jiraData = await base44.entities.JiraProjectSelection.filter({ 
            is_active: true 
          });
          console.log("🔍 [WorkspaceSelector] Jira projects loaded for user:", jiraData.length, jiraData);
          selections.push(...jiraData.map(ws => ({
            ...ws,
            display_name: ws.jira_project_name || 'Jira Project (Unnamed)'
          })));

          // Load Trello boards (RLS automatically filters based on WorkspaceMember relation)
          const trelloData = await base44.entities.TrelloProjectSelection.filter({ 
            is_active: true 
          });
          console.log("🔍 [WorkspaceSelector] Trello boards loaded for user:", trelloData.length, trelloData);
          selections.push(...trelloData.map(ws => ({
            ...ws,
            display_name: ws.board_name || 'Trello Board (Unnamed)'
          })));
        } else {
          // For admin/contributor: load all projects (RLS will handle visibility)
          // Check which connection is active (Jira OR Trello, never both)
          const [jiraConns, trelloConns] = await Promise.all([
            base44.entities.JiraConnection.filter({ is_active: true }),
            base44.entities.TrelloConnection.filter({ is_active: true })
          ]);
          console.log("🔍 [WorkspaceSelector] Jira connections:", jiraConns.length);
          console.log("🔍 [WorkspaceSelector] Trello connections:", trelloConns.length);

          // Load ONLY Jira projects if Jira is connected
          if (jiraConns.length > 0) {
            const jiraData = await base44.entities.JiraProjectSelection.filter({ 
              is_active: true,
              created_by: user?.email
            });
            console.log("🔍 [WorkspaceSelector] Admin/Contributor - Jira selections loaded:", jiraData.length, jiraData);
            console.log("🔍 [WorkspaceSelector] Current user role:", user?.role);
            console.log("🔍 [WorkspaceSelector] Current user email:", user?.email);
            selections = jiraData.map(ws => ({
              ...ws,
              display_name: ws.jira_project_name || 'Jira Project (Unnamed)'
            }));
          } 
          // Otherwise, load ONLY Trello boards if Trello is connected
          else if (trelloConns.length > 0) {
            const trelloData = await base44.entities.TrelloProjectSelection.filter({ 
              is_active: true,
              created_by: user?.email
            });
            console.log("🔍 [WorkspaceSelector] Admin/Contributor - Trello selections loaded:", trelloData.length, trelloData);
            selections = trelloData.map(ws => ({
              ...ws,
              display_name: ws.board_name || 'Trello Board (Unnamed)'
            }));
          }
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
  }, [user?.email, user?.role]);

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