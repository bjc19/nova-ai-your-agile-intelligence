import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJiraBacklog(boardId, cloudId, accessToken, attempt = 1) {
  try {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${boardId}/backlog?maxResults=100`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed (${response.status}): Check token and scopes`);
    }

    if (response.status === 404) {
      throw new Error(`Board ${boardId} not found: Invalid board ID`);
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${JSON.stringify(data)}`);
    }

    return await response.json();

  } catch (error) {
    if (attempt < MAX_RETRIES && error.message.includes('401')) {
      console.log(`Retry attempt ${attempt} for board ${boardId}`);
      await delay(RETRY_DELAY * attempt);
      return fetchJiraBacklog(boardId, cloudId, accessToken, attempt + 1);
    }
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { workspace_id } = body;

    if (!workspace_id) {
      return Response.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Get the project selection for this user
    const allSelections = await base44.asServiceRole.entities.JiraProjectSelection.list();
    const selections = allSelections.filter(s =>
      s.id === workspace_id &&
      s.data && s.data.is_active === true &&
      s.created_by === user.email
    );

    if (!selections || selections.length === 0) {
      return Response.json({
        error: 'Project not found or not active',
        suggestion: 'Select a project in Settings'
      }, { status: 404 });
    }

    const selection = selections[0];
    const boardId = selection.data.jira_board_id;
    const projectKey = selection.data.jira_project_key;

    if (!boardId) {
      return Response.json({
        error: 'Board ID not found for this project',
        project_key: projectKey,
        suggestion: 'Run jiraFetchBoardIds to fetch board IDs'
      }, { status: 400 });
    }

    // Get active Jira connection for this user
    const allConnections = await base44.asServiceRole.entities.JiraConnection.list();
    const connections = allConnections.filter(c => 
      c.data && c.data.user_email === user.email && c.data.is_active === true
    );

    if (!connections || connections.length === 0) {
      return Response.json({
        error: 'Jira connection lost',
        suggestion: 'Reconnect Jira in Settings'
      }, { status: 400 });
    }

    const connection = connections[0];
    const accessToken = connection.data.access_token;
    const cloudId = connection.data.cloud_id;

    // Fetch backlog data
    const backlogData = await fetchJiraBacklog(boardId, cloudId, accessToken);

    // Extract issues
    const issues = [
      ...(backlogData.issues || []),
      ...(backlogData.backlog || [])
    ];

    if (issues.length === 0) {
      return Response.json({
        success: true,
        project_key: projectKey,
        board_id: boardId,
        issues: [],
        message: 'No issues found in backlog'
      });
    }

    return Response.json({
      success: true,
      project_key: projectKey,
      board_id: boardId,
      issues_count: issues.length,
      sprints: backlogData.sprints || [],
      issues: issues.slice(0, 50) // Limit to 50 for analysis
    });

  } catch (error) {
    console.error('jiraAnalyzeWithValidation error:', error);
    return Response.json({
      success: false,
      error: error.message,
      action: 'Check Jira connection and project settings'
    }, { status: 400 });
  }
});