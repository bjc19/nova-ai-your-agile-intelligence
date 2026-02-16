import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const JIRA_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';

async function refreshJiraToken(connection) {
  if (connection.refresh_token === 'none' || !connection.refresh_token) {
    throw new Error('No refresh token available');
  }

  const tokenResponse = await fetch(JIRA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: Deno.env.get('JIRA_CLIENT_ID'),
      client_secret: Deno.env.get('JIRA_CLIENT_SECRET'),
      refresh_token: connection.refresh_token
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to refresh token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || connection.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
  };
}

// Utility functions
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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

    let connection = connections[0];

    // Check and refresh token if expired
    if (new Date(connection.expires_at) <= new Date()) {
      console.log('Jira token expired, refreshing...');
      try {
        const newTokenData = await refreshJiraToken(connection);

        // Update connection with new token
        await base44.asServiceRole.entities.JiraConnection.update(connection.id, {
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_at: newTokenData.expires_at
        });

        connection = { ...connection, ...newTokenData };
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return Response.json({ error: 'Jira token refresh failed' }, { status: 401 });
      }
    }

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

    // Anonymize identifiers
    const tenantHash = await sha256(user.email);
    const teamHash = await sha256(connection.cloud_id);
    const sessionId = generateUUID();

    // Analyze issues for anonymized insights
    const insights = {
      totalIssues: issues.length,
      blockedIssues: 0,
      highPriorityIssues: 0,
      unassignedIssues: 0,
      issuesByStatus: {},
      problems: [],
      recommendations: []
    };

    const now = new Date();

    issues.forEach(issue => {
      const updatedDate = new Date(issue.fields.updated);
      const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 7) {
        insights.blockedIssues++;
      }

      if (issue.fields.priority?.name === 'High' || issue.fields.priority?.name === 'Highest') {
        insights.highPriorityIssues++;
      }

      if (!issue.fields.assignee) {
        insights.unassignedIssues++;
      }

      const status = issue.fields.status?.name || 'Unknown';
      insights.issuesByStatus[status] = (insights.issuesByStatus[status] || 0) + 1;
    });

    // Generate anonymized problems and recommendations
    if (insights.unassignedIssues > insights.totalIssues * 0.2) {
      insights.problems.push('High percentage of unassigned issues in backlog');
      insights.recommendations.push('Improve assignment clarity and team capacity planning');
    }

    if (insights.blockedIssues > insights.totalIssues * 0.15) {
      insights.problems.push('Issues stalled without recent updates');
      insights.recommendations.push('Review blocking dependencies and unblock stalled work');
    }

    if (insights.highPriorityIssues > insights.totalIssues * 0.3) {
      insights.problems.push('Excessive high-priority issues indicating unclear prioritization');
      insights.recommendations.push('Conduct backlog refinement to clarify priorities');
    }

    // Create GDPR markers for each detected problem
    let markersCreated = 0;
    for (const problem of insights.problems) {
      await base44.asServiceRole.entities.GDPRMarkers.create({
        issue_id: generateUUID(),
        tenant_id: tenantHash,
        team_id: teamHash,
        session_id: sessionId,
        date: new Date().toISOString().split('T')[0],
        type: 'other',
        probleme: problem,
        recos: insights.recommendations,
        statut: 'ouvert',
        criticite: insights.highPriorityIssues > insights.totalIssues * 0.3 ? 'haute' : 'moyenne',
        detection_source: 'manual_trigger',
        confidence_score: 0.85
      });
      markersCreated++;
    }

    return Response.json({
      success: true,
      insights,
      markersCreated,
      gdprCompliant: true,
      lastAnalyzed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Jira backlog analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});