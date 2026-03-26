import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { board_id } = await req.json();

    if (!board_id) {
      return Response.json({ error: 'Missing board_id' }, { status: 400 });
    }

    // Get Jira connection
    const jiraConnections = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!jiraConnections || jiraConnections.length === 0) {
      return Response.json({ error: 'No active Jira connection' }, { status: 400 });
    }

    const jiraConn = jiraConnections[0];
    const cloudId = jiraConn.cloud_id;
    const accessToken = jiraConn.access_token;

    // Fetch board info
    const boardUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${board_id}`;
    const boardResponse = await fetch(boardUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!boardResponse.ok) {
      const errorText = await boardResponse.text();
      return Response.json({ 
        error: 'Failed to fetch board', 
        status: boardResponse.status,
        details: errorText 
      }, { status: 500 });
    }

    const boardData = await boardResponse.json();
    const projectKey = boardData.location?.projectKey;

    if (!projectKey) {
      return Response.json({ error: 'Could not determine project key from board' }, { status: 400 });
    }

    console.log('Board found:', boardData.name, 'Project Key:', projectKey);

    // Fetch all issues from the board
    const issuesUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${board_id}/issue?maxResults=100`;
    const issuesResponse = await fetch(issuesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!issuesResponse.ok) {
      const errorText = await issuesResponse.text();
      return Response.json({ 
        error: 'Failed to fetch board issues', 
        status: issuesResponse.status,
        details: errorText 
      }, { status: 500 });
    }

    const issuesData = await issuesResponse.json();
    const allIssues = issuesData.issues || [];

    console.log('Total issues on board:', allIssues.length);

    // Fetch sprints
    const sprintsUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${board_id}/sprint`;
    const sprintsResponse = await fetch(sprintsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    let sprints = [];
    if (sprintsResponse.ok) {
      const sprintsData = await sprintsResponse.json();
      sprints = sprintsData.values || [];
      console.log('Total sprints:', sprints.length);
    }

    // Find active sprint
    const activeSprint = sprints.find(s => s.state === 'active');
    let activeSprintIssues = [];

    if (activeSprint) {
      const sprintIssuesUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/sprint/${activeSprint.id}/issue?maxResults=100`;
      const sprintIssuesResponse = await fetch(sprintIssuesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (sprintIssuesResponse.ok) {
        const sprintIssuesData = await sprintIssuesResponse.json();
        activeSprintIssues = sprintIssuesData.issues || [];
        console.log('Active sprint issues:', activeSprintIssues.length);
      }
    }

    // Analyze data
    const analysis = {
      total_issues: allIssues.length,
      blockers: 0,
      risks: 0,
      issues_by_status: {},
      issues_by_priority: {},
      active_sprint: activeSprint ? { id: activeSprint.id, name: activeSprint.name } : null,
      active_sprint_issue_count: activeSprintIssues.length
    };

    allIssues.forEach(issue => {
      const status = issue.fields?.status?.name || 'Unknown';
      const priority = issue.fields?.priority?.name || 'None';

      analysis.issues_by_status[status] = (analysis.issues_by_status[status] || 0) + 1;
      analysis.issues_by_priority[priority] = (analysis.issues_by_priority[priority] || 0) + 1;

      // Detect blockers
      if (issue.fields?.labels?.includes('blocked') || status === 'Blocked') {
        analysis.blockers++;
      }

      // Detect risks
      if (priority === 'High' || priority === 'Highest') {
        analysis.risks++;
      }
    });

    return Response.json({
      success: true,
      board_id,
      board_name: boardData.name,
      project_key: projectKey,
      analysis,
      sample_issues: allIssues.slice(0, 5).map(i => ({
        key: i.key,
        summary: i.fields?.summary,
        status: i.fields?.status?.name,
        priority: i.fields?.priority?.name,
        assignee: i.fields?.assignee?.displayName || 'Unassigned'
      }))
    });

  } catch (error) {
    console.error('Capture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});