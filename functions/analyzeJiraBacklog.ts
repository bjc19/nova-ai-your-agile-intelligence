import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connection
    const connections = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (connections.length === 0) {
      return Response.json({ error: 'No active Jira connection' }, { status: 400 });
    }

    const connection = connections[0];

    // Fetch Jira issues
    const issuesResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/search?jql=status!=%22Done%22&maxResults=50&fields=key,summary,status,priority,assignee,created,updated,issuetype`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!issuesResponse.ok) {
      return Response.json({ error: 'Failed to fetch Jira issues' }, { status: 500 });
    }

    const issuesData = await issuesResponse.json();
    const issues = issuesData.issues || [];

    // Analyze issues for insights
    const insights = {
      totalIssues: issues.length,
      blockedIssues: 0,
      highPriorityIssues: 0,
      unassignedIssues: 0,
      oldestIssue: null,
      issuesByStatus: {},
      recommendations: []
    };

    const now = new Date();
    let oldestDate = now;

    issues.forEach(issue => {
      // Count blocked issues (issues that haven't been updated in a while)
      const updatedDate = new Date(issue.fields.updated);
      const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 7) {
        insights.blockedIssues++;
      }

      // Count high priority
      if (issue.fields.priority?.name === 'High' || issue.fields.priority?.name === 'Highest') {
        insights.highPriorityIssues++;
      }

      // Count unassigned
      if (!issue.fields.assignee) {
        insights.unassignedIssues++;
      }

      // Track oldest issue
      const createdDate = new Date(issue.fields.created);
      if (createdDate < oldestDate) {
        oldestDate = createdDate;
        const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        insights.oldestIssue = {
          key: issue.key,
          summary: issue.summary,
          daysOld: daysSinceCreation
        };
      }

      // Count by status
      const status = issue.fields.status?.name || 'Unknown';
      insights.issuesByStatus[status] = (insights.issuesByStatus[status] || 0) + 1;
    });

    // Generate recommendations
    if (insights.unassignedIssues > insights.totalIssues * 0.2) {
      insights.recommendations.push('Many issues are unassigned. Consider assigning them to team members.');
    }

    if (insights.blockedIssues > insights.totalIssues * 0.15) {
      insights.recommendations.push('Several issues haven\'t been updated recently. Review them for blockers.');
    }

    if (insights.highPriorityIssues > insights.totalIssues * 0.3) {
      insights.recommendations.push('High number of high-priority issues. Prioritize backlog refinement.');
    }

    return Response.json({
      success: true,
      insights,
      lastAnalyzed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Jira backlog analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});