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

    // 2. Fetch Project Context & Jira Connection
    const jiraProjectSelection = await base44.entities.JiraProjectSelection.get(jiraProjectSelectionId);

    if (!jiraProjectSelection) {
      return new Response(JSON.stringify({ error: 'Jira project selection not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { jira_board_id, jira_project_key } = jiraProjectSelection;

    const jiraConns = await base44.entities.JiraConnection.filter({
      is_active: true
    }, '-created_date', 1);

    if (!jiraConns || jiraConns.length === 0) {
      return new Response(JSON.stringify({ error: 'No active Jira connection found' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const finalCloudId = jiraConns[0].cloud_id;
    const accessToken = jiraConns[0].access_token;

    if (!finalCloudId || !jira_board_id) {
      return new Response(JSON.stringify({ error: 'Missing Jira cloud_id or board_id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Detect board type and fetch issues — supports Scrum, Kanban, and Hybrid
    let activeSprintId = null;
    let sprintName = null;
    let boardType = 'kanban'; // default assumption
    let issues = [];

    // 3a. Try to get board config to detect type
    try {
      const boardConfigUrl = `https://api.atlassian.com/site/${finalCloudId}/agile/1.0/board/${jira_board_id}/configuration`;
      const boardConfigRes = await fetch(boardConfigUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (boardConfigRes.ok) {
        const boardConfig = await boardConfigRes.json();
        boardType = boardConfig.type || 'kanban';
      }
    } catch (e) {
      console.log('Could not detect board type, defaulting to kanban fallback:', e.message);
    }

    // 3b. Try Scrum sprint endpoint (works for Scrum and some Hybrid boards)
    try {
      const sprintUrl = `https://api.atlassian.com/site/${finalCloudId}/agile/1.0/board/${jira_board_id}/sprint?state=active`;
      const sprintRes = await fetch(sprintUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (sprintRes.ok) {
        const sprintData = await sprintRes.json();
        if (sprintData.values && sprintData.values.length > 0) {
          activeSprintId = sprintData.values[0].id;
          sprintName = sprintData.values[0].name;
        }
      }
    } catch (e) {
      console.log('Sprint endpoint failed (likely Kanban board):', e.message);
    }

    // 3c. Fetch issues — strategy depends on board type and sprint availability
    if (activeSprintId) {
      // SCRUM or HYBRID: fetch issues from active sprint
      try {
        const issuesUrl = `https://api.atlassian.com/site/${finalCloudId}/agile/1.0/sprint/${activeSprintId}/issue?maxResults=100&fields=summary,status,priority,assignee,issuetype,labels,created,updated`;
        const issuesRes = await fetch(issuesUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          issues = issuesData.issues || [];
        }
      } catch (e) {
        console.log('Error fetching sprint issues:', e.message);
      }
    } else {
      // KANBAN or no active sprint: fetch In Progress issues from board directly
      sprintName = 'Kanban Board (En cours)';
      try {
        const boardIssuesUrl = `https://api.atlassian.com/site/${finalCloudId}/agile/1.0/board/${jira_board_id}/issue?jql=status%3D%22In+Progress%22&maxResults=100&fields=summary,status,priority,assignee,issuetype,labels,created,updated`;
        const boardIssuesRes = await fetch(boardIssuesUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (boardIssuesRes.ok) {
          const boardIssuesData = await boardIssuesRes.json();
          issues = boardIssuesData.issues || [];
        }
      } catch (e) {
        console.log('Error fetching kanban board issues:', e.message);
      }

      // Also fetch "To Do" issues for full picture
      if (issues.length === 0) {
        try {
          const allBoardIssuesUrl = `https://api.atlassian.com/site/${finalCloudId}/agile/1.0/board/${jira_board_id}/issue?jql=statusCategory+in+(%22In+Progress%22%2C%22To+Do%22)&maxResults=100&fields=summary,status,priority,assignee,issuetype,labels,created,updated`;
          const allIssuesRes = await fetch(allBoardIssuesUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (allIssuesRes.ok) {
            const allData = await allIssuesRes.json();
            issues = allData.issues || [];
          }
        } catch (e) {
          console.log('Error fetching all board issues:', e.message);
        }
      }
    }

    // 4. Format & analyze issues
    const now = new Date();
    let formattedIssues = [];
    let stats = { blockers: 0, risks: 0, stagnant: 0, high_priority: 0 };

    formattedIssues = issues.map(issue => {
      const fields = issue.fields || {};
      const statusName = fields.status?.name || '';
      const priority = fields.priority?.name || 'Medium';
      const updatedAt = fields.updated ? new Date(fields.updated) : null;
      const daysSinceUpdate = updatedAt ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)) : null;
      
      const isBlocked = (fields.labels || []).some(l => l.toLowerCase().includes('block'));
      const isStagnant = daysSinceUpdate !== null && daysSinceUpdate > 3 && statusName === 'In Progress';
      const isHighPriority = priority === 'Highest' || priority === 'High';

      let category = 'task';
      if (isBlocked) { category = 'blocker'; stats.blockers++; }
      else if (isStagnant) { category = 'stagnant'; stats.stagnant++; }
      else if (isHighPriority) { category = 'high_priority'; stats.high_priority++; }
      else { stats.risks++; }

      return {
        key: issue.key,
        summary: fields.summary,
        status: statusName,
        priority,
        assignee: fields.assignee?.displayName || null,
        type: fields.issuetype?.name || 'Task',
        days_since_update: daysSinceUpdate,
        category,
        url: `https://bengajeanclaude1988.atlassian.net/browse/${issue.key}`
      };
    });

    return new Response(JSON.stringify({
      sprint_name: sprintName,
      sprint_id: activeSprintId,
      board_type: boardType,
      issues: formattedIssues,
      stats,
      total_issues: formattedIssues.length,
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