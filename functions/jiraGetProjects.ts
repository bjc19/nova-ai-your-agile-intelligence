import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    if (jiraConns.length === 0) {
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    const connection = jiraConns[0];

    // Fetch projects from Jira API
    const jiraResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${connection.cloud_id}/rest/api/3/project/search?expand=description,isArchived&maxResults=100`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!jiraResponse.ok) {
      console.error('Jira API error:', jiraResponse.status, jiraResponse.statusText);
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

    // Get user's current selections to show which ones are already selected
    const userSelections = await base44.entities.JiraProjectSelection.list();
    const selectedKeys = userSelections.map(s => s.jira_project_key);

    // Get subscription plan to determine quota
    const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
    const plan = statusRes.data?.plan || 'starter';

    const quotas = {
      'starter': 1,
      'growth': 3,
      'pro': 10,
      'enterprise': 999
    };

    const quota = quotas[plan.toLowerCase()] || 1;
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
    console.error('Error fetching Jira projects:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});