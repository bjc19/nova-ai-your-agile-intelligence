import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { debugLog } from "@/components/hooks/useDebugWorkspaceFlow";
import WorkspaceChangeAlert from "./WorkspaceChangeAlert";

const WorkspaceSelector = ({ onWorkspaceChange, activeWorkspaceId }) => {
    const [selectedValue, setSelectedValue] = useState(activeWorkspaceId || null);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertWorkspace, setAlertWorkspace] = useState(null);

    const determineWorkspaceType = (workspace) => {
        // Debug Logging
        debugLog('determineWorkspaceType', { workspace });
        if (workspace?.jira_project_id) {
            return 'jira';
        }
        return 'trello';
    };

    const handleValueChange = (value) => {
        // Debug Logging
        debugLog('handleValueChange', { value });
        setSelectedValue(value);
        const ws = workspaces.find((w) => w.id === value);
        const wsType = determineWorkspaceType(ws);
        setAlertWorkspace({ id: value, type: wsType });
        if (onWorkspaceChange) {
            onWorkspaceChange(value, wsType);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            debugLog('WorkspaceSelector', { step: 'loading workspaces' });
            try {
                const configs = await base44.entities.TeamConfiguration.list();
                setWorkspaces(configs);
                debugLog('WorkspaceSelector', { step: 'workspaces loaded', count: configs.length });
                // Validate that activeWorkspaceId exists in the loaded workspaces
                if (activeWorkspaceId && !configs.find((w) => w.id === activeWorkspaceId)) {
                    setSelectedValue(null);
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
            {loading ? (
                <p>Loading workspaces...</p>
            ) : (
                <Select value={selectedValue} onValueChange={handleValueChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        {workspaces.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                                {ws.project_name || ws.team_name || 'Unnamed Workspace'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
};

export default WorkspaceSelector;
