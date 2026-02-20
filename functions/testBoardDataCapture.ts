import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
    const boardId = "34";

    console.log('Testing board data capture for board:', boardId);
    console.log('Cloud ID:', cloudId);

    // Test 1: Fetch sprints for the board
    console.log('Fetching sprints...');
    const sprintsUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${boardId}/sprint`;
    const sprintsResponse = await fetch(sprintsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    let sprintsData = null;
    if (sprintsResponse.ok) {
      sprintsData = await sprintsResponse.json();
      console.log('Sprints fetched:', sprintsData.values?.length || 0);
    } else {
      console.log('Sprints fetch failed:', sprintsResponse.status);
    }

    // Test 2: Fetch issues from the board
    console.log('Fetching board issues...');
    const issuesUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${boardId}/issue?maxResults=50`;
    const issuesResponse = await fetch(issuesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    let issuesData = null;
    if (issuesResponse.ok) {
      issuesData = await issuesResponse.json();
      console.log('Issues fetched:', issuesData.issues?.length || 0);
    } else {
      console.log('Issues fetch failed:', issuesResponse.status);
    }

    // Test 3: Fetch active sprint issues
    let activeSprint = null;
    let sprintIssues = null;
    
    if (sprintsData && sprintsData.values && sprintsData.values.length > 0) {
      // Find active sprint
      activeSprint = sprintsData.values.find(s => s.state === 'active');
      
      if (activeSprint) {
        console.log('Active sprint found:', activeSprint.name, '(ID:', activeSprint.id, ')');
        
        const sprintIssuesUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/sprint/${activeSprint.id}/issue?maxResults=50`;
        const sprintIssuesResponse = await fetch(sprintIssuesUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (sprintIssuesResponse.ok) {
          sprintIssues = await sprintIssuesResponse.json();
          console.log('Sprint issues fetched:', sprintIssues.issues?.length || 0);
        }
      }
    }

    return Response.json({
      success: true,
      board_id: boardId,
      cloud_id: cloudId,
      data: {
        sprints: sprintsData ? { count: sprintsData.values?.length || 0, sprints: sprintsData.values?.map(s => ({ id: s.id, name: s.name, state: s.state })) } : null,
        board_issues: issuesData ? { count: issuesData.issues?.length || 0, sample: issuesData.issues?.slice(0, 3).map(i => ({ key: i.key, summary: i.fields?.summary, status: i.fields?.status?.name })) } : null,
        active_sprint: activeSprint ? { id: activeSprint.id, name: activeSprint.name, state: activeSprint.state, startDate: activeSprint.startDate, endDate: activeSprint.endDate } : null,
        active_sprint_issues: sprintIssues ? { count: sprintIssues.issues?.length || 0, sample: sprintIssues.issues?.slice(0, 3).map(i => ({ key: i.key, summary: i.fields?.summary, status: i.fields?.status?.name })) } : null
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});