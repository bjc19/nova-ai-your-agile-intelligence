import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { projectSelectionId } = await req.json();

    if (!projectSelectionId) {
      return Response.json({ error: 'projectSelectionId requis' }, { status: 400 });
    }

    console.log('🔍 Déclenchement analyse pour project:', projectSelectionId);

    // Vérifier le type de projet (Jira ou Trello)
    let jiraProject = null;
    let trelloProject = null;
    let analysisType = null;

    try {
      const jiraProjects = await base44.asServiceRole.entities.JiraProjectSelection.filter({
        id: projectSelectionId,
        is_active: true
      });
      if (jiraProjects.length > 0) {
        jiraProject = jiraProjects[0];
        analysisType = 'jira';
        console.log('✅ Projet Jira trouvé:', jiraProject.jira_project_key);
      }
    } catch (e) {
      console.warn('⚠️ Erreur lors de la recherche Jira:', e.message);
    }

    if (!analysisType) {
      try {
        const trelloProjects = await base44.asServiceRole.entities.TrelloProjectSelection.filter({
          id: projectSelectionId,
          is_active: true
        });
        if (trelloProjects.length > 0) {
          trelloProject = trelloProjects[0];
          analysisType = 'trello';
          console.log('✅ Projet Trello trouvé:', trelloProject.trello_board_name);
        }
      } catch (e) {
        console.warn('⚠️ Erreur lors de la recherche Trello:', e.message);
      }
    }

    if (!analysisType) {
      return Response.json({
        error: 'Projet non trouvé ou inactif',
        success: false
      }, { status: 404 });
    }

    // Lancer l'analyse appropriée
    let analysisResult = null;

    if (analysisType === 'jira') {
      console.log('🔄 Appel analyzeJiraGDPR pour', jiraProject.jira_project_key);
      analysisResult = await base44.functions.invoke('analyzeJiraGDPR', {
        projectKey: jiraProject.jira_project_key,
        projectSelectionId: projectSelectionId,
        autoTrigger: true
      });
    } else if (analysisType === 'trello') {
      console.log('🔄 Appel analyzeTrelloGDPR pour', trelloProject.trello_board_id);
      analysisResult = await base44.functions.invoke('analyzeTrelloGDPR', {
        boardId: trelloProject.trello_board_id,
        projectSelectionId: projectSelectionId,
        autoTrigger: true
      });
    }

    console.log('✅ Analyse complétée');

    return Response.json({
      success: true,
      message: `Analyse déclenchée pour ${analysisType} - ${analysisType === 'jira' ? jiraProject.jira_project_name : trelloProject.trello_board_name}`,
      analysisResult
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});