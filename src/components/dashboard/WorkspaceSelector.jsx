import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Folder, Trello } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { debugLog } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "./WorkspaceChangeAlert";

const WorkspaceSelector = ({ onWorkspaceChange, activeWorkspaceId }) => {
    const [selectedValue, setSelectedValue] = useState(activeWorkspaceId || null);
    const [trelloWorkspaces, setTrelloWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertWorkspace, setAlertWorkspace] = useState(null);
    const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('Sélectionner un workspace');

    const handleValueChange = (value) => {
        debugLog('handleValueChange', { value, source: 'trello' });
        setSelectedValue(value);
        
        if (value === 'all-projects') {
            setSelectedWorkspaceName('Tous les projets');
            setAlertWorkspace(null);
            if (onWorkspaceChange) {
                onWorkspaceChange(null, 'trello');
            }
        } else {
            const ws = trelloWorkspaces.find((w) => w.id === value);
            
            if (ws) {
                const name = ws.board_name || 'Unnamed Workspace';
                setSelectedWorkspaceName(name);
                setAlertWorkspace({ id: value, type: 'trello' });
                if (onWorkspaceChange) {
                    onWorkspaceChange(value, 'trello');
                }
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            debugLog('WorkspaceSelector', { step: 'loading trello workspaces only' });
            try {
                const trelloProjects = await base44.entities.TrelloProjectSelection.filter({ is_active: true });
                setTrelloWorkspaces(trelloProjects || []);
                debugLog('WorkspaceSelector', { step: 'trello workspaces loaded', count: trelloProjects?.length || 0 });
                
                // Set initial workspace name
                if (activeWorkspaceId) {
                    const initialWs = trelloProjects?.find((w) => w.id === activeWorkspaceId);
                    if (initialWs) {
                        setSelectedWorkspaceName(initialWs.board_name || 'Unnamed Workspace');
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
                    🔵 Trello
                </Badge>
                
                {loading ? (
                    <div className="w-[280px] h-10 bg-slate-100 rounded-md animate-pulse" />
                ) : trelloWorkspaces.length === 0 ? (
                    <div className="text-sm text-slate-500">
                        Aucun projet Trello connecté
                    </div>
                ) : (
                    <Select value={selectedValue || ''} onValueChange={handleValueChange}>
                        <SelectTrigger className="w-[280px] bg-white border-slate-200">
                            <SelectValue 
                                placeholder="Sélectionner un projet"
                                defaultValue={selectedValue}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {trelloWorkspaces.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-slate-500 text-center">
                                    Aucun projet disponible
                                </div>
                            ) : (
                                <>
                                    <SelectItem value="all-projects">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">📊</span>
                                            <span>Tous les projets</span>
                                        </div>
                                    </SelectItem>
                                    {trelloWorkspaces.map((ws) => (
                                        <SelectItem key={ws.id} value={ws.id}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🔵</span>
                                                <span>{ws.board_name || 'Unnamed Workspace'}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                )}
                
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                    🔷 Jira Coming Soon
                </Badge>
            </div>
        </div>
    );
};

export default WorkspaceSelector;