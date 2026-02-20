import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { selectedWorkspaceId, selectedWorkspaceType } = body;

    // STRICT: No workspace selected = no recommendations
    if (!selectedWorkspaceId) {
      return Response.json({
        success: true,
        recommendations: [],
        count: 0,
        sources: [],
        message: 'No workspace selected'
      });
    }

    const isJira = selectedWorkspaceType === 'jira' || !selectedWorkspaceType; // default jira for backwards compat
    const isTrello = selectedWorkspaceType === 'trello';

    const allRecommendations = [];

    // Source 0: AnalysisHistory - filter strictly by workspace type
    try {
      const filterKey = isTrello
        ? { trello_project_selection_id: selectedWorkspaceId }
        : { jira_project_selection_id: selectedWorkspaceId };

      const analysisHistory = await base44.entities.AnalysisHistory.filter(filterKey, '-created_date', 50);
      analysisHistory.forEach(analysis => {
        if (analysis.analysis_data?.recommendations && Array.isArray(analysis.analysis_data.recommendations)) {
          analysis.analysis_data.recommendations.forEach(reco => {
            const recoText = typeof reco === 'string' ? reco : reco?.description || reco?.action || JSON.stringify(reco);
            allRecommendations.push({
              source: 'analysis',
              text: recoText,
              priority: 'medium',
              createdDate: analysis.created_date,
              entityType: 'AnalysisHistory',
              workspaceId: selectedWorkspaceId
            });
          });
        }
      });
    } catch (e) {
      console.log('AnalysisHistory fetch skipped:', e.message);
    }

    // Source 1: GDPRMarkers - filter by workspace type
    try {
      const gdprFilterKey = isTrello
        ? { trello_project_selection_id: selectedWorkspaceId }
        : { jira_project_selection_id: selectedWorkspaceId };

      const gdprMarkers = await base44.entities.GDPRMarkers.filter(gdprFilterKey, '-created_date', 100);
      gdprMarkers.forEach(marker => {
        if (marker.recos && Array.isArray(marker.recos)) {
          marker.recos.forEach(reco => {
            allRecommendations.push({
              source: marker.detection_source?.includes('teams') ? 'teams' : 'slack',
              text: typeof reco === 'string' ? reco : reco,
              priority: marker.criticite === 'critique' || marker.criticite === 'haute' ? 'high' : 'medium',
              criticite: marker.criticite,
              createdDate: marker.created_date,
              entityType: 'GDPRMarkers',
              workspaceId: selectedWorkspaceId
            });
          });
        }
      });
    } catch (e) {
      console.log('GDPR Markers fetch skipped:', e.message);
    }

    // Source 2: TeamsInsight - filter by workspace type
    try {
      const teamsFilterKey = isTrello
        ? { trello_project_selection_id: selectedWorkspaceId }
        : { jira_project_selection_id: selectedWorkspaceId };

      const teamsInsights = await base44.entities.TeamsInsight.filter(teamsFilterKey, '-created_date', 100);
      teamsInsights.forEach(insight => {
        if (insight.recos && Array.isArray(insight.recos)) {
          insight.recos.forEach(reco => {
            allRecommendations.push({
              source: 'teams',
              text: typeof reco === 'string' ? reco : reco,
              priority: insight.criticite === 'critique' || insight.criticite === 'haute' ? 'high' : 'medium',
              criticite: insight.criticite,
              createdDate: insight.created_date,
              entityType: 'TeamsInsight',
              workspaceId: selectedWorkspaceId
            });
          });
        }
      });
    } catch (e) {
      console.log('Teams Insights fetch skipped:', e.message);
    }

    // Sort by creation date (newest first)
    allRecommendations.sort((a, b) =>
      new Date(b.createdDate) - new Date(a.createdDate)
    );

    return Response.json({
      success: true,
      recommendations: allRecommendations,
      count: allRecommendations.length,
      sources: [...new Set(allRecommendations.map(r => r.source))],
      workspaceId: selectedWorkspaceId
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});