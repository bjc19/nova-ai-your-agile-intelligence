import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { debugLog } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "@/components/dashboard/WorkspaceChangeAlert";

function determineWorkspaceType(workspace) {
  return workspace.jira_project_id ? 'jira' : 'trello';
}

export default function WorkspaceSelector({ activeWorkspaceId, activeWorkspaceType, onWorkspaceChange, userRole }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertWorkspace, setAlertWorkspace] = useState(null);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const currentUser = await base44.auth.me();
        const role = userRole || currentUser?.role || currentUser?.app_role;

        debugLog('WorkspaceSelector.loadWorkspaces', { role, userRole, currentUser: currentUser?.email });

        if (role === 'admin') {
          // For admins: load all active Jira workspaces
          const jiraWorkspaces = await base44.entities.JiraProjectSelection.filter({ is_active: true });
          debugLog('WorkspaceSelector.jiraWorkspaces', { count: jiraWorkspaces.length });

          const mapped = jiraWorkspaces.map(ws => ({
            ...ws,
            _type: 'jira',
            _displayName: ws.workspace_name || ws.jira_project_name || ws.id
          }));
          setWorkspaces(mapped);
        } else {
          // For users/contributors: load both Jira and Trello filtered by assigned workspace memberships
          const members = await base44.entities.WorkspaceMember.filter({ user_email: currentUser?.email });
          const assignedIds = new Set(members.map(m => m.workspace_id));

          debugLog('WorkspaceSelector.members', { count: members.length, assignedIds: [...assignedIds] });

          const [jiraWorkspaces, trelloWorkspaces] = await Promise.all([
            base44.entities.JiraProjectSelection.filter({ is_active: true }),
            base44.entities.TrelloProjectSelection.filter({ is_active: true })
          ]);

          debugLog('WorkspaceSelector.allWorkspaces', {
            jiraCount: jiraWorkspaces.length,
            trelloCount: trelloWorkspaces.length
          });

          const jiraMapped = jiraWorkspaces
            .filter(ws => assignedIds.has(ws.id))
            .map(ws => ({
              ...ws,
              _type: 'jira',
              _displayName: ws.workspace_name || ws.jira_project_name || ws.id
            }));

          const trelloMapped = trelloWorkspaces
            .filter(ws => assignedIds.has(ws.id))
            .map(ws => ({
              ...ws,
              _type: 'trello',
              _displayName: ws.board_name || ws.id
            }));

          const combined = [...jiraMapped, ...trelloMapped];
          debugLog('WorkspaceSelector.filteredWorkspaces', { count: combined.length });
          setWorkspaces(combined);
        }
      } catch (error) {
        console.error('WorkspaceSelector: Error loading workspaces:', error);
        debugLog('WorkspaceSelector.error', { error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [userRole]);

  const handleValueChange = (value) => {
    if (value === 'all') {
      debugLog('WorkspaceSelector.handleValueChange', { value: null, type: null });
      onWorkspaceChange?.(null, null);
      setAlertWorkspace(null);
      return;
    }

    const workspace = workspaces.find(ws => ws.id === value);
    if (!workspace) return;

    const wsType = determineWorkspaceType(workspace);

    debugLog('WorkspaceSelector.handleValueChange', { value, wsType, workspace });

    onWorkspaceChange?.(value, wsType);
    setAlertWorkspace({ id: value, type: wsType });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {activeWorkspaceType && (
          <Badge variant="outline" className="text-xs">
            #{activeWorkspaceType}
          </Badge>
        )}
        <Select value={activeWorkspaceId || 'all'} onValueChange={handleValueChange} disabled={loading}>
          <SelectTrigger className="w-[200px]">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tous les espaces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les espaces</SelectItem>
            {workspaces.map(ws => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws._displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {alertWorkspace && (
        <WorkspaceChangeAlert
          newWorkspaceId={alertWorkspace.id}
          newWorkspaceType={alertWorkspace.type}
          onDismiss={() => setAlertWorkspace(null)}
        />
      )}
    </>
  );
}