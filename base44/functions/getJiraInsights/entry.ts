import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Jira-based GDPR markers (anonymized insights only)
    const jiraMarkers = await base44.entities.GDPRMarkers.filter(
      { detection_source: 'jira_backlog' },
      '-created_date',
      100
    );

    // Aggregate insights WITHOUT any PII
    const insights = {
      total_issues_analyzed: jiraMarkers.length,
      issues_by_criticality: {
        critique: jiraMarkers.filter(m => m.criticite === 'critique').length,
        haute: jiraMarkers.filter(m => m.criticite === 'haute').length,
        moyenne: jiraMarkers.filter(m => m.criticite === 'moyenne').length,
        basse: jiraMarkers.filter(m => m.criticite === 'basse').length,
      },
      common_patterns: getCommonPatterns(jiraMarkers),
      recommendations: getAggregatedRecommendations(jiraMarkers),
      last_analysis: jiraMarkers.length > 0 ? jiraMarkers[0].created_date : null,
      confidence_average: jiraMarkers.length > 0 
        ? (jiraMarkers.reduce((sum, m) => sum + m.confidence_score, 0) / jiraMarkers.length).toFixed(2)
        : 0
    };

    return Response.json({
      success: true,
      insights: insights,
      pii_status: 'NO_PERSONAL_DATA_STORED'
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

function getCommonPatterns(markers) {
  const patterns = {};
  
  markers.forEach(marker => {
    if (marker.probleme) {
      patterns[marker.probleme] = (patterns[marker.probleme] || 0) + 1;
    }
  });

  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({ pattern, occurrences: count }));
}

function getAggregatedRecommendations(markers) {
  const recommendations = {};
  
  markers.forEach(marker => {
    if (marker.recos && Array.isArray(marker.recos)) {
      marker.recos.forEach(reco => {
        recommendations[reco] = (recommendations[reco] || 0) + 1;
      });
    }
  });

  return Object.entries(recommendations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reco, count]) => ({ recommendation: reco, frequency: count }));
}