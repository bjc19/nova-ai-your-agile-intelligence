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
        // Check 5-min session cache to avoid redundant calls
        const cacheKey = `_wsCache_${userRole || 'admin'}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < 5 * 60 * 1000) {
            setWorkspaces(data);
            setLoading(false);
            return;
          }
        }

        const user = await base44.auth.me();
        let selections = [];

        if (userRole === 'user') {
          // For regular users: load both in parallel (RLS filters automatically)
          const [jiraData, trelloData] = await Promise.all([
            base44.entities.JiraProjectSelection.filter({ is_active: true }),
            base44.entities.TrelloProjectSelection.filter({ is_active: true })
          ]);
          selections.push(...jiraData.map(ws => ({ ...ws, display_name: ws.jira_project_name || 'Jira Project (Unnamed)' })));
          selections.push(...trelloData.map(ws => ({ ...ws, display_name: ws.board_name || 'Trello Board (Unnamed)' })));
        } else {
          // For admin/contributor: check connections in parallel first
          const [jiraConns, trelloConns] = await Promise.all([
            base44.entities.JiraConnection.filter({ is_active: true }),
            base44.entities.TrelloConnection.filter({ is_active: true })
          ]);

          if (jiraConns.length > 0) {
            const jiraData = await base44.entities.JiraProjectSelection.filter({ is_active: true });
            selections = jiraData.map(ws => ({ ...ws, display_name: ws.jira_project_name || 'Jira Project (Unnamed)' }));
          } else if (trelloConns.length > 0) {
            const trelloData = await base44.entities.TrelloProjectSelection.filter({ is_active: true });
            selections = trelloData.map(ws => ({ ...ws, display_name: ws.board_name || 'Trello Board (Unnamed)' }));
          }
        }

        sessionStorage.setItem(cacheKey, JSON.stringify({ data: selections, ts: Date.now() }));
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