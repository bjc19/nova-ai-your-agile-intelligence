import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { selectedWorkspaceId } = body;

    // Fetch from all known sources
    const allRecommendations = [];

    // Source 0: Manual Analysis History - filtered by workspace
    try {
      const analysisHistory = selectedWorkspaceId
        ? await base44.entities.AnalysisHistory.filter({ jira_project_selection_id: selectedWorkspaceId }, '-created_date', 50)
        : await base44.entities.AnalysisHistory.list('-created_date', 50);
      analysisHistory.forEach(analysis => {
        if (analysis.analysis_data?.recommendations && Array.isArray(analysis.analysis_data.recommendations)) {
          analysis.analysis_data.recommendations.forEach(reco => {
            const recoText = typeof reco === 'string' ? reco : reco?.description || reco?.action || JSON.stringify(reco);
            allRecommendations.push({
              source: 'analysis',
              text: recoText,
              priority: 'medium',
              createdDate: analysis.created_date,
              entityType: 'AnalysisHistory'
            });
          });
        }
      });
    } catch (e) {
      console.log('AnalysisHistory fetch skipped:', e.message);
    }

    // Source 1: GDPR Markers (Slack & Teams) - filtered by team_id
    try {
      const gdprMarkers = selectedWorkspaceId
        ? await base44.entities.GDPRMarkers.filter({ team_id: selectedWorkspaceId }, '-created_date', 100)
        : await base44.entities.GDPRMarkers.list('-created_date', 100);
      gdprMarkers.forEach(marker => {
        if (marker.recos && Array.isArray(marker.recos)) {
          marker.recos.forEach(reco => {
            allRecommendations.push({
              source: marker.detection_source?.includes('teams') ? 'teams' : 'slack',
              text: typeof reco === 'string' ? reco : reco,
              priority: marker.criticite === 'critique' || marker.criticite === 'haute' ? 'high' : 'medium',
              criticite: marker.criticite,
              createdDate: marker.created_date,
              entityType: 'GDPRMarkers'
            });
          });
        }
      });
    } catch (e) {
      console.log('GDPR Markers fetch skipped:', e.message);
    }

    // Source 2: Teams Insights (legacy) - not filterable by workspace, exclude if workspace selected
    if (!selectedWorkspaceId) {
      try {
        const teamsInsights = await base44.entities.TeamsInsight.list('-created_date', 100);
        teamsInsights.forEach(insight => {
          if (insight.recos && Array.isArray(insight.recos)) {
            insight.recos.forEach(reco => {
              allRecommendations.push({
                source: 'teams',
                text: typeof reco === 'string' ? reco : reco,
                priority: insight.criticite === 'critique' || insight.criticite === 'haute' ? 'high' : 'medium',
                criticite: insight.criticite,
                createdDate: insight.created_date,
                entityType: 'TeamsInsight'
              });
            });
          }
        });
      } catch (e) {
        console.log('Teams Insights fetch skipped:', e.message);
      }
    }

    // Sort by creation date (newest first)
    allRecommendations.sort((a, b) => 
      new Date(b.createdDate) - new Date(a.createdDate)
    );

    return Response.json({
      success: true,
      recommendations: allRecommendations,
      count: allRecommendations.length,
      sources: [...new Set(allRecommendations.map(r => r.source))]
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});