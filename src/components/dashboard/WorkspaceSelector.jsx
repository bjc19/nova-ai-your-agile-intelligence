import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Folder, Trello } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { debugLog } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "./WorkspaceChangeAlert";

const WorkspaceSelector = ({ onWorkspaceChange, activeWorkspaceId }) => {
    const [selectedValue, setSelectedValue] = useState(activeWorkspaceId || null);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertWorkspace, setAlertWorkspace] = useState(null);
    const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('Sélectionner un workspace');

    const getWorkspaceIcon = (type) => {
        return type === 'jira' ? '🔷' : '🔵';
    };

    const getWorkspaceName = (ws) => {
        return ws.type === 'jira' ? ws.jira_project_name : ws.board_name || 'Unnamed Workspace';
    };

    const handleValueChange = (value) => {
        debugLog('handleValueChange', { value });
        setSelectedValue(value);
        const ws = workspaces.find((w) => w.id === value);
        
        if (ws) {
            setSelectedWorkspaceName(getWorkspaceName(ws));
            setAlertWorkspace({ id: value, type: ws.type });
            if (onWorkspaceChange) {
                onWorkspaceChange(value, ws.type);
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            debugLog('WorkspaceSelector', { step: 'loading workspaces' });
            try {
                const jiraProjects = await base44.entities.JiraProjectSelection.filter({ is_active: true });
                const trelloProjects = await base44.entities.TrelloProjectSelection.filter({ is_active: true });
                
                const allWorkspaces = [
                    ...jiraProjects.map(p => ({ ...p, type: 'jira' })),
                    ...trelloProjects.map(p => ({ ...p, type: 'trello' }))
                ];
                
                setWorkspaces(allWorkspaces);
                debugLog('WorkspaceSelector', { step: 'workspaces loaded', jira: jiraProjects.length, trello: trelloProjects.length });
                
                // Set initial workspace name
                if (activeWorkspaceId) {
                    const initialWs = allWorkspaces.find((w) => w.id === activeWorkspaceId);
                    if (initialWs) {
                        setSelectedWorkspaceName(getWorkspaceName(initialWs));
                    } else {
                        setSelectedValue(null);
                    }
                }
            } catch (err) {
                console.error('WorkspaceSelector: error loading workspaces', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            {alertWorkspace && (
                <WorkspaceChangeAlert
                    newWorkspaceId={alertWorkspace.id}
                    newWorkspaceType={alertWorkspace.type}
                    onDismiss={() => setAlertWorkspace(null)}
                />
            )}
            
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                    Workspace
                </Badge>
                
                {loading ? (
                    <div className="w-[280px] h-10 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                    <Select value={selectedValue || ''} onValueChange={handleValueChange}>
                        <SelectTrigger className="w-[280px] bg-white border-slate-200">
                            <SelectValue 
                                placeholder="Sélectionner un workspace"
                                defaultValue={selectedValue}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {workspaces.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-slate-500 text-center">
                                    Aucun workspace disponible
                                </div>
                            ) : (
                                workspaces.map((ws) => (
                                    <SelectItem key={ws.id} value={ws.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getWorkspaceIcon(ws.type)}</span>
                                            <span>{getWorkspaceName(ws)}</span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
};

export default WorkspaceSelector;