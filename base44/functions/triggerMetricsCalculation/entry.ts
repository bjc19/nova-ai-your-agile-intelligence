import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Forbidden: Admin or Contributor access required' }, { status: 403 });
    }

    // Récupérer tous les workspaces (Jira et Trello)
    const jiraProjectSelections = await base44.asServiceRole.entities.JiraProjectSelection.filter({});
    const trelloProjectSelections = await base44.asServiceRole.entities.TrelloProjectSelection.filter({});

    const allWorkspaces = [
      ...(jiraProjectSelections || []).map(ws => ({ id: ws.id, type: 'jira', name: ws.project_name })),
      ...(trelloProjectSelections || []).map(ws => ({ id: ws.id, type: 'trello', name: ws.board_name }))
    ];

    if (allWorkspaces.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No workspaces found to process' 
      });
    }

    // Déclencher les calculs de métriques pour chaque workspace
    const results = [];
    
    for (const workspace of allWorkspaces) {
      try {
        const metricsResponse = await base44.functions.invoke('calculateAndStoreMetrics', {
          workspaceId: workspace.id,
          workspaceType: workspace.type,
          days: 30
        });
        
        results.push({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          workspace_type: workspace.type,
          status: 'success',
          metrics: metricsResponse.data
        });
      } catch (error) {
        console.error(`Error processing workspace ${workspace.id}:`, error);
        results.push({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          workspace_type: workspace.type,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      workspaces_processed: results.length,
      results: results
    });
  } catch (error) {
    console.error('Error in triggerMetricsCalculation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});