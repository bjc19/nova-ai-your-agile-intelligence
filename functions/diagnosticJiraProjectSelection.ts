import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les projets Jira actuellement visibles via l'API
    const jiraProjectsRes = await base44.functions.invoke('jiraGetProjects', {});
    const currentJiraProjects = jiraProjectsRes.data?.projects || [];
    const currentProjectIds = new Set(currentJiraProjects.map(p => p.id));

    // Récupérer tous les projets Jira marqués comme is_active: true dans la base de données
    const activeSelections = await base44.entities.JiraProjectSelection.filter({
      is_active: true
    });

    // Identifier les projets obsolètes (en base mais pas visibles via l'API)
    const obsoleteProjects = activeSelections.filter(
      selection => !currentProjectIds.has(selection.jira_project_id)
    );

    // Identifier les projets valides (présents à la fois en base et via l'API)
    const validProjects = activeSelections.filter(
      selection => currentProjectIds.has(selection.jira_project_id)
    );

    return Response.json({
      diagnostic: {
        total_active_in_database: activeSelections.length,
        visible_via_jira_api: currentJiraProjects.length,
        valid_projects: validProjects.length,
        obsolete_projects: obsoleteProjects.length
      },
      valid_projects: validProjects.map(p => ({
        id: p.id,
        jira_project_id: p.jira_project_id,
        jira_project_name: p.jira_project_name,
        is_active: p.is_active
      })),
      obsolete_projects: obsoleteProjects.map(p => ({
        id: p.id,
        jira_project_id: p.jira_project_id,
        jira_project_name: p.jira_project_name,
        is_active: p.is_active,
        created_date: p.created_date
      })),
      message: obsoleteProjects.length > 0 
        ? `${obsoleteProjects.length} projet(s) obsolète(s) détecté(s). Veuillez confirmer la suppression.`
        : 'Aucun projet obsolète trouvé. Votre sélection est cohérente.'
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});