function determineWorkspaceType(workspace) {
    return workspace.jira_project_id ? 'jira' : 'trello';
}

handleValueChange(value, workspace) {
    const wsType = determineWorkspaceType(workspace);
    onWorkspaceChange(value, wsType);
    setAlertWorkspace({ id: value, type: wsType });
    // Existing workspace loading logic for users and admins/contributors
}
// ...rest of the existing code remains unchanged...