import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selected_project_keys, projects } = await req.json();

    if (!selected_project_keys || !Array.isArray(selected_project_keys)) {
      return Response.json({ error: 'Invalid selected_project_keys' }, { status: 400 });
    }

    // Get plan info - for now assume a default quota of 10 projects
    const maxProjectsAllowed = 10;

    if (selected_project_keys.length > maxProjectsAllowed) {
      return Response.json(
        { error: `Quota exceeded. Maximum ${maxProjectsAllowed} projects allowed.` },
        { status: 400 }
      );
    }

    // Get existing selections for this user
    const existingSelections = await base44.entities.JiraProjectSelection.filter({
      user_email: user.email
    });

    // Deactivate selections that are no longer in the new selection
    const toDeactivate = existingSelections.filter(
      sel => !selected_project_keys.includes(sel.project_key)
    );

    for (const selection of toDeactivate) {
      await base44.entities.JiraProjectSelection.update(selection.id, {
        is_active: false
      });
    }

    // Create or reactivate selections for new/existing projects
    const selectedProjectsMap = new Map(projects.map(p => [p.key, p.name]));

    for (const projectKey of selected_project_keys) {
      const existing = existingSelections.find(sel => sel.project_key === projectKey);
      
      if (existing) {
        // Reactivate if it was deactivated
        if (!existing.is_active) {
          await base44.entities.JiraProjectSelection.update(existing.id, {
            is_active: true
          });
        }
      } else {
        // Create new selection
        const projectName = selectedProjectsMap.get(projectKey) || `Project ${projectKey}`;
        await base44.entities.JiraProjectSelection.create({
          user_email: user.email,
          project_key: projectKey,
          project_name: projectName,
          is_active: true,
          connected_at: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      message: `Successfully saved ${selected_project_keys.length} project(s)`
    });
  } catch (error) {
    console.error('Error saving Jira project selection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});