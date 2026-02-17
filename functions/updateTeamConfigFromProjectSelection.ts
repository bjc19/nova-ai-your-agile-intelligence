import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Synchronise le mode projet avec le nombre réel de projets sélectionnés
 * Si l'utilisateur sélectionne plusieurs projets, passe automatiquement en multi-projets
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Compter les projets Jira actifs
    const jiraSelections = await base44.entities.JiraProjectSelection.filter({
      is_active: true
    });

    // Compter les projets Trello actifs
    const trelloSelections = await base44.entities.TrelloProjectSelection.filter({
      is_active: true
    });

    const totalProjects = (jiraSelections?.length || 0) + (trelloSelections?.length || 0);

    // Récupérer config existante
    const configs = await base44.entities.TeamConfiguration.list();
    const currentConfig = configs.length > 0 ? configs[0] : null;

    // Si plus d'un projet sélectionné ET config pas manuellement confirmée
    if (totalProjects > 1 && (!currentConfig?.confirmed_by_admin || currentConfig.project_mode === "auto_detect")) {
      if (currentConfig) {
        await base44.entities.TeamConfiguration.update(currentConfig.id, {
          project_mode: "multi_projects",
          confirmed_by_admin: false,
          project_count: totalProjects,
          user_email: user.email
        });
      } else {
        await base44.entities.TeamConfiguration.create({
          project_mode: "multi_projects",
          confirmed_by_admin: false,
          project_count: totalProjects,
          user_email: user.email
        });
      }

      return Response.json({
        updated: true,
        mode: "multi_projects",
        total_projects: totalProjects,
        message: "Mode automatiquement basculé en multi-projets"
      });
    } else if (totalProjects === 1 && currentConfig && currentConfig.project_mode === "auto_detect") {
      // Si un seul projet et auto_detect, rester en auto_detect mais mettre à jour le count
      await base44.entities.TeamConfiguration.update(currentConfig.id, {
        project_count: 1,
        user_email: user.email
      });
    }

    return Response.json({
      updated: false,
      total_projects: totalProjects,
      current_mode: currentConfig?.project_mode || "auto_detect"
    });

  } catch (error) {
    console.error("Erreur synchronisation config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});