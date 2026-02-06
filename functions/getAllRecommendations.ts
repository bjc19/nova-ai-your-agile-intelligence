import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch from all known sources
    const allRecommendations = [];

    // Source 1: GDPR Markers (Slack & Teams)
    try {
      const gdprMarkers = await base44.entities.GDPRMarkers.list('-created_date', 100);
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

    // Source 2: Teams Insights (legacy, if still exists)
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

    // ADD NEW SOURCES HERE - JIRA, ZOOM, AZURE, etc
    // Example for future Jira integration:
    // try {
    //   const jiraInsights = await base44.entities.JiraInsight.list('-created_date', 100);
    //   jiraInsights.forEach(insight => {
    //     if (insight.recommendations && Array.isArray(insight.recommendations)) {
    //       insight.recommendations.forEach(rec => {
    //         allRecommendations.push({
    //           source: 'jira',
    //           text: rec.text || rec,
    //           priority: rec.priority || 'medium',
    //           criticite: rec.criticite,
    //           createdDate: insight.created_date,
    //           entityType: 'JiraInsight'
    //         });
    //       });
    //     }
    //   });
    // } catch (e) {
    //   console.log('Jira Insights fetch skipped:', e.message);
    // }

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