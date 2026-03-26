if (existing.length > 0) {
  const updateData = {
    is_active: true
  };
  
  // Only update jira_board_id if it was successfully fetched
  if (boardId) {
    updateData.jira_board_id = boardId;
  }
  
  await base44.entities.JiraProjectSelection.update(existing[0].id, updateData);
}