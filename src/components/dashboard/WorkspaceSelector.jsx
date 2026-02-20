import React, { useState, useEffect } from 'react';
import { Select } from 'antd';

const WorkspaceSelector = ({ onWorkspaceChange }) => {
    const [selectedValue, setSelectedValue] = useState(null);
    const [workspaceType, setWorkspaceType] = useState('');
    const [loading, setLoading] = useState(true);

    const determineWorkspaceType = (value) => {
        // Debug Logging
        console.log('Determining workspace type for:', value);
        if (value.startsWith('jira')) {
            setWorkspaceType('jira');
        } else if (value.startsWith('trello')) {
            setWorkspaceType('trello');
        } else {
            setWorkspaceType('unknown');
        }
    };

    const handleValueChange = (value) => {
        // Debug Logging
        console.log('Selected value:', value);
        setSelectedValue(value);
        determineWorkspaceType(value);
        onWorkspaceChange(value, workspaceType);
    };

    useEffect(() => {
        // Simulated loading logic for Jira & Trello
        const fetchData = async () => {
            setLoading(true);
            console.log('Loading workspaces...');
            // Simulate API call
            setTimeout(() => {
                setLoading(false);
                console.log('Finished loading workspaces.');
            }, 1000);
        };

        fetchData();
    }, []);

    return (
        <div>
            {loading ? ( 
                <p>Loading workspaces...</p>
            ) : (
                <Select
                    placeholder="Select a workspace"
                    onChange={handleValueChange}
                    value={selectedValue}
                >
                    <Select.Option value="jira-1">Jira Workspace 1</Select.Option>
                    <Select.Option value="trello-1">Trello Workspace 1</Select.Option>
                </Select>
            )}
        </div>
    );
};

export default WorkspaceSelector;
