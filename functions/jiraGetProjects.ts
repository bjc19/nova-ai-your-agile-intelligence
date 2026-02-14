import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const JIRA_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';

async function refreshJiraToken(connection) {
  if (connection.refresh_token === 'none') {
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

    // Get user's Jira connection
    let jiraConns = await base44.entities.JiraConnection.filter({
      created_by: user.email,
      is_active: true
    });
    if (jiraConns.length === 0) {
      console.error('No Jira connection found for user');
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    let connection = jiraConns[0];
    let accessToken = connection.access_token;

    // Check if token is expired and refresh if needed
    if (new Date(connection.expires_at) <= new Date()) {
      console.log('Token expired, refreshing...');
      try {
        const newTokenData = await refreshJiraToken(connection);
        
        // Update connection with new token
        await base44.entities.JiraConnection.update(connection.id, {
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_at: newTokenData.expires_at
        });
        
        accessToken = newTokenData.access_token;
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return Response.json({ error: 'Failed to refresh Jira token' }, { status: 401 });
      }
    }

    // Fetch projects from Jira API
    const jiraResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/project/search?expand=description,isArchived&maxResults=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!jiraResponse.ok) {
      const errorText = await jiraResponse.text();
      console.error('Jira API error:', jiraResponse.status, errorText);
      return Response.json({ error: 'Failed to fetch Jira projects' }, { status: 500 });
    }

    const jiraData = await jiraResponse.json();
    
    // Format projects
    const projects = (jiraData.values || []).map(proj => ({
      id: proj.id,
      key: proj.key,
      name: proj.name,
      type: proj.projectTypeKey,
      isArchived: proj.isArchived || false,
      description: proj.description || ''
    }));

    // Get user's current selections
    const userSelections = await base44.entities.JiraProjectSelection.list();
    const selectedKeys = userSelections.map(s => s.jira_project_key);

    // Get subscription plan
    const user_doc = await base44.auth.me();
    const plan = user_doc.current_plan || 'pro';

    const quotas = {
      'starter': 1,
      'growth': 3,
      'pro': 10,
      'enterprise': 999
    };

    const quota = quotas[plan.toLowerCase()] || 10;
    const currentCount = userSelections.filter(s => s.is_active).length;

    return Response.json({
      projects: projects.filter(p => !p.isArchived),
      selectedProjects: selectedKeys,
      currentPlan: plan,
      quota: quota,
      currentCount: currentCount,
      availableSlots: Math.max(0, quota - currentCount)
    });
  } catch (error) {
    console.error('Error in jiraGetProjects:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});