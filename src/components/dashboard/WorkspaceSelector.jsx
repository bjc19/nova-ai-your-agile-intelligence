import React from 'react';

const WorkspaceSelector = ({
  workspaces,
  selectedWorkspaceId,
  selectedWorkspaceType,
  onWorkspaceChange,
  alertWorkspace,
}) => {

  // Helper function to determine the workspace type
  const determineWorkspaceType = (workspaceId) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    return workspace ? workspace.type : null;
  };

  const handleValueChange = (newWorkspaceId) => {
    const newWorkspaceType = determineWorkspaceType(newWorkspaceId);
    if (newWorkspaceId === null) {
      alertWorkspace(null);
      console.debug('Resetting alertWorkspace for "Toutes les analyses" case.');
    } else {
      console.debug(`Workspace changed: ${newWorkspaceId}, Type: ${newWorkspaceType}`);
    }
    onWorkspaceChange(newWorkspaceId, newWorkspaceType);
  };

  // The rest of your component's code here...

  return (
    <div>
      {/* Render workspaces, e.g. select dropdown */}
    </div>
  );
};

export default WorkspaceSelector;