import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, projectKey, projectName, projectType, cloudId, action, workspaceIdToReplace } = await req.json();

    // Validate Jira connection
    const jiraConns = await base44.entities.JiraConnection.list();
    if (jiraConns.length === 0) {
      return Response.json({ error: 'Jira not connected' }, { status: 400 });
    }

    const connection = jiraConns[0];
    const accessToken = connection.access_token;

    // Get subscription plan
    const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
    const plan = statusRes.data?.plan || 'starter';

    const quotaLimits = {
      'starter': 1,
      'growth': 3,
      'pro': 10,
      'enterprise': 999
    };

    const quotaLimit = quotaLimits[plan.toLowerCase()] || 1;

    // Get existing workspaces
    const existingWorkspaces = await base44.entities.JiraWorkspace.list();

    // Check quota
    if (action === 'add') {
      if (existingWorkspaces.length >= quotaLimit) {
        return Response.json({
          success: false,
          error: 'quota_exceeded',
          message: `Quota atteint pour le plan ${plan}. Contactez le support pour upgrader.`,
          quota: { limit: quotaLimit, used: existingWorkspaces.length }
        }, { status: 400 });
      }
    } else if (action === 'replace') {
      if (!workspaceIdToReplace) {
        return Response.json({ error: 'workspaceIdToReplace required' }, { status: 400 });
      }
      // Delete old workspace
      await base44.entities.JiraWorkspace.delete(workspaceIdToReplace);
    }

    // Fetch project details and boards
    const projectRes = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${projectId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    let projectDetails = null;
    if (projectRes.ok) {
      projectDetails = await projectRes.json();
    }

    // Fetch boards
    let boards = [];
    try {
      const boardsRes = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/board?projectKeyOrId=${projectKey}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        boards = boardsData.values || [];
      }
    } catch (e) {
      console.error('Error fetching boards:', e);
    }

    // Fetch current sprint
    let currentSprint = null;
    if (boards.length > 0) {
      try {
        const sprintRes = await fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/board/${boards[0].id}/sprint?state=active`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        if (sprintRes.ok) {
          const sprintData = await sprintRes.json();
          const sprints = sprintData.values || [];
          if (sprints.length > 0) {
            currentSprint = {
              sprint_id: sprints[0].id,
              sprint_name: sprints[0].name,
              start_date: sprints[0].startDate,
              end_date: sprints[0].endDate,
              state: sprints[0].state
            };
          }
        }
      } catch (e) {
        console.error('Error fetching sprints:', e);
      }
    }

    // Create workspace
    const workspace = await base44.entities.JiraWorkspace.create({
      project_key: projectKey,
      project_name: projectName,
      project_id: projectId,
      cloud_id: cloudId,
      project_type: projectType,
      status: 'analyzing',
      last_analysis_date: new Date().toISOString(),
      active_boards: boards.map(b => ({
        board_id: b.id,
        board_name: b.name,
        board_type: b.type
      })),
      current_sprint: currentSprint,
      quota_used: 1
    });

    // Trigger initial analysis
    try {
      await base44.functions.invoke('analyzeJiraProject', {
        workspaceId: workspace.id,
        projectKey,
        cloudId,
        boards: boards.map(b => b.id)
      });
    } catch (e) {
      console.error('Error triggering analysis:', e);
    }

    return Response.json({
      success: true,
      workspace: {
        id: workspace.id,
        project_key: workspace.project_key,
        project_name: workspace.project_name,
        status: workspace.status
      }
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});