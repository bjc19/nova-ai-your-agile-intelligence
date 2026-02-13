import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, projectKey, cloudId, boards } = await req.json();

    // Get Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    if (jiraConns.length === 0) {
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    const connection = jiraConns[0];
    const accessToken = connection.access_token;

    // Analysis data stored in memory (not persisted)
    const analysisData = {
      project_key: projectKey,
      analyzed_at: new Date().toISOString(),
      metrics: {
        total_issues: 0,
        issues_by_status: {},
        issues_by_priority: {},
        blocked_tickets: 0,
        overdue_stories: 0,
        flow_metrics: {
          cycle_time_avg: 0,
          lead_time_avg: 0,
          throughput: 0
        }
      },
      sprint_info: null,
      assignee_count: 0
    };

    try {
      // Fetch issues
      const issuesRes = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=project="${projectKey}"&maxResults=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        const issues = issuesData.issues || [];

        analysisData.metrics.total_issues = issues.length;

        // Count by status
        issues.forEach(issue => {
          const status = issue.fields.status?.name || 'Unknown';
          analysisData.metrics.issues_by_status[status] = (analysisData.metrics.issues_by_status[status] || 0) + 1;

          // Count by priority
          const priority = issue.fields.priority?.name || 'Unknown';
          analysisData.metrics.issues_by_priority[priority] = (analysisData.metrics.issues_by_priority[priority] || 0) + 1;

          // Count blocked
          if (status === 'Blocked' || status === 'In Progress') {
            analysisData.metrics.blocked_tickets++;
          }
        });

        // Count unique assignees
        const assignees = new Set(
          issues
            .map(i => i.fields.assignee?.name)
            .filter(Boolean)
        );
        analysisData.assignee_count = assignees.size;
      }
    } catch (e) {
      console.error('Error fetching issues:', e);
    }

    // Update workspace status
    await base44.entities.JiraWorkspace.update(workspaceId, {
      status: 'active',
      last_analysis_date: new Date().toISOString(),
      analysis_metadata: analysisData
    });

    return Response.json({
      success: true,
      analysis: analysisData
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});