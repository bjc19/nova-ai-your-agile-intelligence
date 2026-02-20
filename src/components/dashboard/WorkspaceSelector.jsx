import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Folder, Trello } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { debugLog } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "./WorkspaceChangeAlert";

const WorkspaceSelector = ({ onWorkspaceChange, activeWorkspaceId }) => {
    const [selectedValue, setSelectedValue] = useState(activeWorkspaceId || null);
    const [jiraWorkspaces, setJiraWorkspaces] = useState([]);
    const [trelloWorkspaces, setTrelloWorkspaces] = useState([]);
    const [activeSource, setActiveSource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertWorkspace, setAlertWorkspace] = useState(null);
    const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('Sélectionner un workspace');

    const getWorkspaceIcon = (type) => {
        return type === 'jira' ? '🔷' : '🔵';
    };

    const getWorkspaceName = (ws, type) => {
        return type === 'jira' ? ws.jira_project_name : ws.board_name || 'Unnamed Workspace';
    };

    const handleValueChange = (value) => {
        debugLog('handleValueChange', { value, activeSource });
        setSelectedValue(value);
        
        if (value === 'all-projects') {
            setSelectedWorkspaceName('Tous les projets');
            setAlertWorkspace(null);
            if (onWorkspaceChange) {
                onWorkspaceChange(null, null);
            }
        } else {
            const ws = activeSource === 'jira' 
                ? jiraWorkspaces.find((w) => w.id === value)
                : trelloWorkspaces.find((w) => w.id === value);
            
            if (ws) {
                const name = getWorkspaceName(ws, activeSource);
                setSelectedWorkspaceName(name);
                setAlertWorkspace({ id: value, type: activeSource });
                if (onWorkspaceChange) {
                    onWorkspaceChange(value, activeSource);
                }
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
                
                setJiraWorkspaces(jiraProjects || []);
                setTrelloWorkspaces(trelloProjects || []);
                debugLog('WorkspaceSelector', { step: 'workspaces loaded', jira: jiraProjects.length, trello: trelloProjects.length });
                
                // Détermine la source active en fonction de ce qui est connecté
                let sourceActive = null;
                if (jiraProjects && jiraProjects.length > 0) {
                    sourceActive = 'jira';
                } else if (trelloProjects && trelloProjects.length > 0) {
                    sourceActive = 'trello';
                }
                
                setActiveSource(sourceActive);
                
                // Set initial workspace name basé sur la source active
                if (activeWorkspaceId && sourceActive) {
                    const workspaces = sourceActive === 'jira' ? jiraProjects : trelloProjects;
                    const initialWs = workspaces.find((w) => w.id === activeWorkspaceId);
                    if (initialWs) {
                        setSelectedWorkspaceName(getWorkspaceName(initialWs, sourceActive));
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
                    {activeSource === 'jira' ? '🔷 Jira' : activeSource === 'trello' ? '🔵 Trello' : 'Workspace'}
                </Badge>
                
                {loading ? (
                    <div className="w-[280px] h-10 bg-slate-100 rounded-md animate-pulse" />
                ) : activeSource === null ? (
                    <div className="text-sm text-slate-500">
                        Aucune source connectée
                    </div>
                ) : (
                    <Select value={selectedValue || ''} onValueChange={handleValueChange}>
                        <SelectTrigger className="w-[280px] bg-white border-slate-200">
                            <SelectValue 
                                placeholder={`Sélectionner un projet ${activeSource}`}
                                defaultValue={selectedValue}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {(activeSource === 'jira' ? jiraWorkspaces : trelloWorkspaces).length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-slate-500 text-center">
                                    Aucun projet disponible
                                </div>
                            ) : (
                                (activeSource === 'jira' ? jiraWorkspaces : trelloWorkspaces).map((ws) => (
                                    <SelectItem key={ws.id} value={ws.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getWorkspaceIcon(activeSource)}</span>
                                            <span>{getWorkspaceName(ws, activeSource)}</span>
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