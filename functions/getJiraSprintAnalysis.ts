import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Authentication & Authorization
    const user = await base44.auth.me();
    if (!user?.role || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { jiraProjectSelectionId } = await req.json();
    
    if (!jiraProjectSelectionId) {
      return new Response(JSON.stringify({ error: 'jiraProjectSelectionId is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch Project Context
    const jiraProjectSelection = await base44.asServiceRole.entities.JiraProjectSelection.get(jiraProjectSelectionId);
    
    if (!jiraProjectSelection) {
      return new Response(JSON.stringify({ error: 'Jira project selection not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { jira_cloud_id, jira_board_id, jira_project_key } = jiraProjectSelection;

    if (!jira_cloud_id || !jira_board_id) {
      return new Response(JSON.stringify({ error: 'Missing Jira cloud_id or board_id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Fetch Active Sprint
    const jiraConnection = await base44.asServiceRole.entities.JiraConnection.filter(
      { user_email: user.email, is_active: true },
      '-created_date',
      1
    );

    if (!jiraConnection || jiraConnection.length === 0) {
      return new Response(JSON.stringify({ error: 'No active Jira connection found' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = jiraConnection[0].access_token;
    let activeSprintId = null;
    let sprintName = null;

    try {
      const boardUrl = `https://api.atlassian.com/site/${jira_cloud_id}/agile/1.0/board/${jira_board_id}/sprint?state=active`;
      const sprintResponse = await fetch(boardUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (sprintResponse.ok) {
        const sprintData = await sprintResponse.json();
        if (sprintData.values && sprintData.values.length > 0) {
          activeSprintId = sprintData.values[0].id;
          sprintName = sprintData.values[0].name;
        }
      }
    } catch (e) {
      console.log('Error fetching active sprint:', e.message);
    }

    if (!activeSprintId) {
      return new Response(JSON.stringify({ 
        sprint_name: null,
        issues: [],
        stats: {
          blockers: 0,
          risks: 0,
          stagnant: 0,
          high_priority: 0
        },
        message: 'No active sprint found'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Invoke Existing Analysis
    const analysisResult = await base44.asServiceRole.functions.invoke('analyzeJiraAgile', {
      jira_cloud_id,
      board_id: jira_board_id,
      sprint_id: activeSprintId
    });

    // 5. Process & Format Results
    let formattedIssues = [];
    let stats = {
      blockers: 0,
      risks: 0,
      stagnant: 0,
      high_priority: 0
    };

    if (analysisResult?.data?.problematic_issues) {
      formattedIssues = analysisResult.data.problematic_issues.map(issue => ({
        key: issue.key,
        summary: issue.summary,
        status: issue.status,
        priority: issue.priority,
        assignee: issue.assignee,
        days_in_status: issue.days_in_status,
        issue_type: issue.type,
        url: `https://jira.atlassian.net/browse/${issue.key}`,
        category: issue.blocker ? 'blocker' : issue.risk ? 'risk' : 'stagnant'
      }));

      // Count by category
      formattedIssues.forEach(issue => {
        if (issue.category === 'blocker') stats.blockers++;
        else if (issue.category === 'risk') stats.risks++;
        else if (issue.category === 'stagnant') stats.stagnant++;
        
        if (issue.priority === 'Highest' || issue.priority === 'High') stats.high_priority++;
      });
    }

    return new Response(JSON.stringify({
      sprint_name: sprintName,
      sprint_id: activeSprintId,
      issues: formattedIssues,
      stats,
      last_fetched: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in getJiraSprintAnalysis:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});