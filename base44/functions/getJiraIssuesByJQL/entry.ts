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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jiraProjectKey, jqlFilter = 'all' } = await req.json();

    if (!jiraProjectKey) {
      return Response.json({ error: 'Missing jiraProjectKey' }, { status: 400 });
    }

    // Récupérer la connexion Jira active de l'utilisateur
    const connections = await base44.asServiceRole.entities.JiraConnection.filter({
      user_email: user.email,
      is_active: true
    });

    if (!connections || connections.length === 0) {
      return Response.json({ error: 'No active Jira connection' }, { status: 400 });
    }

    let connection = connections[0];

    // Vérifier et rafraîchir le token si expiré
    if (new Date(connection.expires_at) <= new Date()) {
      console.log('Jira token expired, refreshing...');
      try {
        const newTokenData = await refreshJiraToken(connection);
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

    // Construire la requête JQL en fonction du filtre
    let jql = `project = ${jiraProjectKey}`;

    if (jqlFilter === 'blocked') {
      jql += ` AND (status = Blocked OR labels = blocked OR customfield_10036 = Blocker)`;
    } else if (jqlFilter === 'stalled') {
      jql += ` AND updated < -7d AND status != Done`;
    } else if (jqlFilter === 'highPriority') {
      jql += ` AND priority in (High, Highest) AND assignee is EMPTY`;
    } else if (jqlFilter === 'sprint') {
      jql += ` AND sprint in openSprints()`;
    }

    jql += ` ORDER BY updated DESC`;

    console.log('Executing JQL:', jql);

    // Exécuter la requête JQL - utiliser le nouvel endpoint
    const issuesResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=key,summary,status,priority,assignee,updated,created,labels,customfield_10036`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!issuesResponse.ok) {
      const errorData = await issuesResponse.text();
      console.error('Jira API error:', errorData);
      return Response.json({ error: 'Failed to fetch Jira issues', details: errorData }, { status: issuesResponse.status });
    }

    const issuesData = await issuesResponse.json();
    const issues = issuesData.issues || [];

    // Analyser les issues pour identifier les blockers et risques
    const analysisResult = analyzeIssues(issues, jiraProjectKey);

    return Response.json({
      success: true,
      jira_project_key: jiraProjectKey,
      filter: jqlFilter,
      total_issues: issues.length,
      blockers_count: analysisResult.blockers.length,
      risks_count: analysisResult.risks.length,
      stalled_count: analysisResult.stalled.length,
      issues: issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        updated: issue.fields.updated,
        created: issue.fields.created,
        labels: issue.fields.labels || [],
        is_blocker: analysisResult.blockers.some(b => b.key === issue.key),
        is_risk: analysisResult.risks.some(r => r.key === issue.key),
        is_stalled: analysisResult.stalled.some(s => s.key === issue.key),
        days_since_update: calculateDaysSinceUpdate(issue.fields.updated)
      })),
      blockers: analysisResult.blockers,
      risks: analysisResult.risks,
      stalled: analysisResult.stalled,
      statistics: {
        total: issues.length,
        blockers: analysisResult.blockers.length,
        risks: analysisResult.risks.length,
        stalled: analysisResult.stalled.length,
        unassigned_high_priority: analysisResult.unassignedHighPriority
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('getJiraIssuesByJQL error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeIssues(issues, projectKey) {
  const now = new Date();
  const blockers = [];
  const risks = [];
  const stalled = [];
  let unassignedHighPriority = 0;

  issues.forEach(issue => {
    const updatedDate = new Date(issue.fields.updated);
    const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));

    // Blockers: status = Blocked OU labels = blocked OU customfield = Blocker
    if (issue.fields.status?.name === 'Blocked' || 
        (issue.fields.labels && issue.fields.labels.includes('blocked')) ||
        issue.fields.customfield_10036 === 'Blocker') {
      blockers.push({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        days_since_update: daysSinceUpdate
      });
    }

    // Stalled: no update for 7+ days and not done
    if (daysSinceUpdate > 7 && issue.fields.status?.name !== 'Done') {
      stalled.push({
        key: issue.key,
        summary: issue.fields.summary,
        days_since_update: daysSinceUpdate,
        status: issue.fields.status?.name
      });
    }

    // Risks: high priority + unassigned
    if ((issue.fields.priority?.name === 'High' || issue.fields.priority?.name === 'Highest') && 
        !issue.fields.assignee) {
      risks.push({
        key: issue.key,
        summary: issue.fields.summary,
        priority: issue.fields.priority?.name,
        reason: 'High priority unassigned'
      });
      unassignedHighPriority++;
    }
  });

  return {
    blockers,
    risks,
    stalled,
    unassignedHighPriority
  };
}

function calculateDaysSinceUpdate(updatedDate) {
  const now = new Date();
  const update = new Date(updatedDate);
  return Math.floor((now - update) / (1000 * 60 * 60 * 24));
}