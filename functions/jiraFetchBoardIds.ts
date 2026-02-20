import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active Jira connection
    const allConnections = await base44.asServiceRole.entities.JiraConnection.list();
    const connections = allConnections.filter(c => 
      c.data.user_email === user.email && 
      c.data.is_active === true
    );

    if (!connections || connections.length === 0) {
      return Response.json({ error: 'No active Jira connection' }, { status: 400 });
    }

    const connection = connections[0];
    const accessToken = connection.data.access_token;
    const cloudId = connection.data.cloud_id;

    if (!accessToken || !cloudId) {
      return Response.json({ error: 'Invalid Jira connection' }, { status: 400 });
    }

    // Get all active project selections
    const allSelections = await base44.asServiceRole.entities.JiraProjectSelection.list();
    const projectSelections = allSelections.filter(s =>
      s.data.is_active === true &&
      s.created_by === user.email
    );

    if (!projectSelections || projectSelections.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No active project selections',
        updated: 0
      });
    }

    const results = [];

    // For each project, fetch its boards
    for (const selection of projectSelections) {
      const projectKey = selection.data.jira_project_key;
      const projectId = selection.data.jira_project_id;

      if (!projectKey) {
        results.push({
          project: projectKey,
          status: 'skipped',
          reason: 'No project key'
        });
        continue;
      }

      try {
        // Fetch boards for this project
        const boardsUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`;
        
        const boardsResponse = await fetch(boardsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (!boardsResponse.ok) {
          const errorData = await boardsResponse.text();
          results.push({
            project: projectKey,
            status: 'failed',
            statusCode: boardsResponse.status,
            error: errorData
          });
          continue;
        }

        const boardsData = await boardsResponse.json();
        const boards = boardsData.values || [];

        if (boards.length === 0) {
          results.push({
            project: projectKey,
            status: 'no_boards',
            message: 'No boards found for project'
          });
          continue;
        }

        // Take first board
        const boardId = boards[0].id;

        // Update JiraProjectSelection with board_id
        await base44.asServiceRole.entities.JiraProjectSelection.update(selection.id, {
          jira_board_id: boardId.toString()
        });

        results.push({
          project: projectKey,
          status: 'success',
          boardId: boardId,
          boardName: boards[0].name
        });

      } catch (error) {
        results.push({
          project: projectKey,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      user_email: user.email,
      cloud_id: cloudId,
      processed: projectSelections.length,
      results: results
    });

  } catch (error) {
    console.error('jiraFetchBoardIds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});