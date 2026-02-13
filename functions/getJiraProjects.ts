import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    if (jiraConns.length === 0) {
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    const connection = jiraConns[0];
    const accessToken = connection.access_token;
    const cloudId = connection.cloud_id;

    // Fetch projects from Jira
    console.log('Fetching Jira projects for cloud:', cloudId);
    
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', response.status, errorText);
      return Response.json({ 
        error: 'Failed to fetch Jira projects',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }

    const projects = await response.json();
    console.log('Found projects:', projects.length);

    // Get existing workspaces to calculate quota
    const existingWorkspaces = await base44.entities.JiraWorkspace.list();

    // Get user subscription plan
    const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
    const plan = statusRes.data?.plan || 'starter';
    console.log('User plan:', plan);

    const quotaLimits = {
      'starter': 1,
      'growth': 3,
      'pro': 10,
      'enterprise': 999
    };

    const quotaLimit = quotaLimits[plan.toLowerCase()] || 1;
    const quotaUsed = existingWorkspaces.length;
    const quotaRemaining = Math.max(0, quotaLimit - quotaUsed);

    return Response.json({
      projects: projects.map(p => ({
        id: p.id,
        key: p.key,
        name: p.name,
        type: p.projectTypeKey,
        avatarUrl: p.avatarUrls?.['48x48']
      })),
      quota: {
        plan,
        limit: quotaLimit,
        used: quotaUsed,
        remaining: quotaRemaining
      },
      existingWorkspaces: existingWorkspaces.map(w => ({
        id: w.id,
        project_key: w.project_key,
        project_name: w.project_name
      }))
    });
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});