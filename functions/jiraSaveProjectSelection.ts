import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { selected_project_ids, projects } = await req.json();

    if (!Array.isArray(selected_project_ids) || !Array.isArray(projects)) {
      return Response.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Fetch user's subscription status to check quota
    let maxProjectsAllowed = 10; // Default for starter
    try {
      const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
      maxProjectsAllowed = statusRes.data.maxProjectsAllowed || 10;
    } catch (e) {
      console.log('Could not fetch subscription status, using default quota');
    }

    // Check quota
    if (selected_project_ids.length > maxProjectsAllowed) {
      return Response.json({ 
        error: `Quota dépassé. Maximum ${maxProjectsAllowed} projets autorisés.`,
        success: false 
      }, { status: 400 });
    }

    // Deactivate all previous Jira project selections for this user
    const existingSelections = await base44.entities.JiraProjectSelection.filter({
      is_active: true
    });

    for (const selection of existingSelections) {
      if (!selected_project_ids.includes(selection.jira_project_id)) {
        await base44.entities.JiraProjectSelection.update(selection.id, {
          is_active: false
        });
      }
    }

    // Create or reactivate selected projects
    for (const projectId of selected_project_ids) {
      const project = projects.find(p => p.id === projectId);
      if (!project) continue;

      const existing = await base44.entities.JiraProjectSelection.filter({
        jira_project_id: projectId
      });

      if (existing.length > 0) {
        // Reactivate if exists
        await base44.entities.JiraProjectSelection.update(existing[0].id, {
          is_active: true
        });
      } else {
        // Create new selection
        await base44.entities.JiraProjectSelection.create({
          jira_project_id: projectId,
          jira_project_key: project.key,
          jira_project_name: project.name,
          workspace_name: project.name,
          is_active: true,
          selected_date: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      message: `${selected_project_ids.length} projet(s) Jira sauvegardé(s)`
    });

  } catch (error) {
    console.error('Error saving Jira project selection:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});