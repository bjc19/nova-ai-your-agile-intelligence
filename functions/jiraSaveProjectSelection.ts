import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selected_projects } = await req.json();

    if (!selected_projects || !Array.isArray(selected_projects)) {
      return Response.json({ error: 'Invalid selected_projects' }, { status: 400 });
    }

    // Get plan info - for now assume a default quota of 10 projects
    const maxProjectsAllowed = 10;

    if (selected_projects.length > maxProjectsAllowed) {
      return Response.json(
        { error: `Quota exceeded. Maximum ${maxProjectsAllowed} projects allowed.` },
        { status: 400 }
      );
    }

    // Get existing selections for this user
    const existingSelections = await base44.entities.JiraProjectSelection.filter({
      created_by: user.email
    });

    // Deactivate selections that are no longer in the new selection
    const selectedKeys = selected_projects.map(p => p.key);
    const toDeactivate = existingSelections.filter(
      sel => !selectedKeys.includes(sel.jira_project_key)
    );

    for (const selection of toDeactivate) {
      await base44.entities.JiraProjectSelection.update(selection.id, {
        is_active: false
      });
    }

    // Create or reactivate selections for new/existing projects
    for (const project of selected_projects) {
      const existing = existingSelections.find(sel => sel.jira_project_key === project.key);
      
      if (existing) {
        // Reactivate if it was deactivated
        if (!existing.is_active) {
          await base44.entities.JiraProjectSelection.update(existing.id, {
            is_active: true
          });
        }
      } else {
        // Create new selection
        await base44.entities.JiraProjectSelection.create({
          jira_project_key: project.key,
          jira_project_id: project.id,
          jira_project_name: project.name,
          jira_project_type: project.type || 'software',
          workspace_name: `${project.name} Workspace`,
          is_active: true,
          selected_date: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      message: `Successfully saved ${selected_projects.length} project(s)`
    });
  } catch (error) {
    console.error('Error saving Jira project selection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});