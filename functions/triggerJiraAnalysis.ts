import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    // Déclenché par automation entity sur JiraProjectSelection creation
    if (event.type !== 'create' || event.entity_name !== 'JiraProjectSelection') {
      return Response.json({ error: 'Invalid trigger' }, { status: 400 });
    }

    const workspaceData = event.data;
    const workspaceId = event.entity_id;

    // Récupérer la connexion Jira
    const jiraConns = await base44.asServiceRole.entities.JiraConnection.list();
    if (jiraConns.length === 0) {
      return Response.json({ error: 'No Jira connection found' }, { status: 400 });
    }

    const jiraConn = jiraConns[0];

    // Analyser le backlog du projet
    const backlogAnalysis = await analyzeJiraProjectBacklog(
      jiraConn,
      workspaceData.jira_project_key,
      workspaceData.jira_project_id
    );

    // Créer AnalysisHistory pour le backlog
    if (backlogAnalysis.blockers_count > 0 || backlogAnalysis.risks_count > 0) {
      await base44.asServiceRole.entities.AnalysisHistory.create({
        title: `Jira Backlog Analysis - ${workspaceData.jira_project_name}`,
        source: 'jira_backlog',
        jira_project_selection_id: workspaceId,
        workspace_name: workspaceData.workspace_name,
        blockers_count: backlogAnalysis.blockers_count,
        risks_count: backlogAnalysis.risks_count,
        analysis_data: backlogAnalysis.insights,
        analysis_time: new Date().toISOString()
      });
    }

    // Analyser les sprints actifs
    const sprintAnalysis = await analyzeJiraActiveSprints(
      jiraConn,
      workspaceData.jira_project_key,
      workspaceData.jira_project_id
    );

    // Créer AnalysisHistory pour les sprints
    if (sprintAnalysis.blockers_count > 0 || sprintAnalysis.risks_count > 0) {
      await base44.asServiceRole.entities.AnalysisHistory.create({
        title: `Jira Sprint Analysis - ${workspaceData.jira_project_name}`,
        source: 'jira_agile',
        jira_project_selection_id: workspaceId,
        workspace_name: workspaceData.workspace_name,
        blockers_count: sprintAnalysis.blockers_count,
        risks_count: sprintAnalysis.risks_count,
        analysis_data: sprintAnalysis.insights,
        analysis_time: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      workspace_id: workspaceId,
      backlog_analysis_created: backlogAnalysis.blockers_count > 0 || backlogAnalysis.risks_count > 0,
      sprint_analysis_created: sprintAnalysis.blockers_count > 0 || sprintAnalysis.risks_count > 0
    });
  } catch (error) {
    console.error('Jira analysis trigger error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function analyzeJiraProjectBacklog(jiraConn, projectKey, projectId) {
  try {
    const jql = `project = ${projectKey} AND status != Done ORDER BY updated DESC`;
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=key,summary,status,priority,assignee,updated`,
      {
        headers: {
          'Authorization': `Bearer ${jiraConn.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    const issues = data.issues || [];
    const now = new Date();

    let blockers = 0;
    let risks = 0;
    const problems = [];

    issues.forEach(issue => {
      const updatedDate = new Date(issue.fields.updated);
      const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));

      // Blockers: stalled for 7+ days
      if (daysSinceUpdate > 7) {
        blockers++;
        problems.push(`${issue.key}: No update for ${daysSinceUpdate} days`);
      }

      // Risks: high priority without clear assignment
      if ((issue.fields.priority?.name === 'High' || issue.fields.priority?.name === 'Highest') && !issue.fields.assignee) {
        risks++;
        problems.push(`${issue.key}: High priority unassigned`);
      }
    });

    return {
      blockers_count: blockers,
      risks_count: risks,
      insights: {
        total_issues: issues.length,
        blockers,
        risks,
        problems: problems.slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Backlog analysis error:', error);
    return { blockers_count: 0, risks_count: 0, insights: {} };
  }
}

async function analyzeJiraActiveSprints(jiraConn, projectKey, projectId) {
  try {
    // Fetch active sprints
    const sprintsResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${jiraConn.cloud_id}/rest/api/3/search?jql=project = ${projectKey} AND sprint in openSprints()&maxResults=100&fields=key,summary,status,priority,assignee`,
      {
        headers: {
          'Authorization': `Bearer ${jiraConn.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!sprintsResponse.ok) {
      throw new Error(`Jira API error: ${sprintsResponse.status}`);
    }

    const data = await sprintsResponse.json();
    const issues = data.issues || [];

    let blockers = 0;
    let risks = 0;
    const problems = [];

    issues.forEach(issue => {
      // Blockers: status is "Blocked"
      if (issue.fields.status?.name === 'Blocked' || issue.fields.labels?.includes('blocked')) {
        blockers++;
        problems.push(`${issue.key}: ${issue.fields.summary}`);
      }

      // Risks: in progress for too long (infer from priority + status)
      if (issue.fields.status?.name === 'In Progress' && (issue.fields.priority?.name === 'High' || issue.fields.priority?.name === 'Highest')) {
        risks++;
      }
    });

    return {
      blockers_count: blockers,
      risks_count: risks,
      insights: {
        total_issues: issues.length,
        blockers,
        risks,
        problems: problems.slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Sprint analysis error:', error);
    return { blockers_count: 0, risks_count: 0, insights: {} };
  }
}