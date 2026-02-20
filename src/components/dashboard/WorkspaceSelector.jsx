import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Layers } from "lucide-react";
import { debugLog, useDebugWorkspaceFlow } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "@/components/dashboard/WorkspaceChangeAlert";

export default function WorkspaceSelector({ onWorkspaceChange, activeWorkspaceId, userRole }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertWorkspace, setAlertWorkspace] = useState(null); // { id, type }
  const { logStateChange, logCallback, logRenderCycle } = useDebugWorkspaceFlow('WorkspaceSelector');


  useEffect(() => {
    debugLog('WorkspaceSelector.useEffect', { 
      userRole, 
      activeWorkspaceId,
      callbackExists: !!onWorkspaceChange 
    });

    const loadWorkspaces = async () => {
      try {
        const user = await base44.auth.me();
        debugLog('User fetched', { 
          email: user?.email, 
          role: user?.role,
          app_role: user?.app_role
        });
        
        let selections = [];
        
        // For regular users, load only assigned workspaces
         if (userRole?.toLowerCase?.() === 'user') {
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
               is_active: true 
             });
             console.log("🔍 [WorkspaceSelector] Admin/Contributor - Jira selections loaded:", jiraData.length, jiraData);
             console.log("DEBUG: Jira selections loaded in WorkspaceSelector:", jiraData);
            console.log("🔍 [WorkspaceSelector] Current user role:", userRole);
            console.log("🔍 [WorkspaceSelector] Current user email:", user?.email);
            selections = jiraData.map(ws => ({
              ...ws,
              display_name: ws.jira_project_name || 'Jira Project (Unnamed)'
            }));
          } 
          // Otherwise, load ONLY Trello boards if Trello is connected
          else if (trelloConns.length > 0) {
            const trelloData = await base44.entities.TrelloProjectSelection.filter({ 
              is_active: true 
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
  }, [userRole]);

  if (loading) {
    return null;
  }

  return (
    <>
    {alertWorkspace && (
      <WorkspaceChangeAlert
        newWorkspaceId={alertWorkspace.id}
        newWorkspaceType={alertWorkspace.type}
        onDismiss={() => setAlertWorkspace(null)}
      />
    )}
    <div className="flex items-center gap-2">
      <Layers className="w-4 h-4 text-slate-400" />
      <Select 
        value={activeWorkspaceId || ""} 
        onValueChange={(value) => {
          logCallback('onValueChange', { 
            selectedValue: value,
            previousValue: activeWorkspaceId,
            callbackFunctionExists: !!onWorkspaceChange 
          });
          
          if (onWorkspaceChange) {
            try {
              debugLog('Before calling onWorkspaceChange', { 
                value,
                onWorkspaceChangeType: typeof onWorkspaceChange 
              });
              const result = onWorkspaceChange(value);
              debugLog('After calling onWorkspaceChange', { 
                value,
                resultType: typeof result,
                isPromise: result instanceof Promise 
              });

              // Trigger reconciliation alert when a specific workspace is selected
              if (value) {
                const selectedWs = workspaces.find(ws => ws.id === value);
                if (selectedWs) {
                  const wsType = selectedWs.jira_project_id ? 'jira' : 'trello';
                  setAlertWorkspace({ id: value, type: wsType });
                }
              }
            } catch (err) {
              debugLog('ERROR in onWorkspaceChange callback', { 
                error: err.message,
                stack: err.stack,
                value
              });
            }
          } else {
            debugLog('ERROR: onWorkspaceChange is not defined', { 
              value,
              props: { onWorkspaceChange, activeWorkspaceId, userRole }
            });
          }
        }}>
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
    </>
  );
}