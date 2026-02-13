import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Layers } from "lucide-react";

export default function WorkspaceSelector({ onWorkspaceChange, activeWorkspaceId }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const selections = await base44.entities.JiraProjectSelection.filter({
          is_active: true
        });
        setWorkspaces(selections);
      } catch (error) {
        console.error("Error loading workspaces:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  if (loading || workspaces.length === 0) {
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
                {workspace.jira_project_name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}