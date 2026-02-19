import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = body;

    // Récupérer tous les PatternDetection résolus
    const resolvedPatterns = await base44.entities.PatternDetection.filter({
      status: 'resolved'
    });

    if (!resolvedPatterns || resolvedPatterns.length === 0) {
      return Response.json({
        averageResolutionDays: 0,
        resolvedCount: 0,
        trends: []
      });
    }

    // Calculer la durée de résolution pour chaque pattern
    const resolutionTimes = [];
    const dailyData = {};

    resolvedPatterns.forEach((pattern) => {
      if (pattern.resolved_date) {
        const createdDate = new Date(pattern.created_date || pattern.resolved_date);
        const resolvedDate = new Date(pattern.resolved_date);
        const daysToResolve = Math.max(0, Math.round(
          (resolvedDate - createdDate) / (1000 * 60 * 60 * 24)
        ));

        resolutionTimes.push({
          pattern_id: pattern.id,
          pattern_name: pattern.pattern_name,
          days_to_resolve: daysToResolve,
          severity: pattern.severity,
          resolved_date: resolvedDate.toISOString().split('T')[0]
        });

        // Grouper par jour pour les tendances
        const dateKey = resolvedDate.toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = [];
        }
        dailyData[dateKey].push(daysToResolve);
      }
    });

    // Calculer la moyenne
    const averageResolutionDays = 
      resolutionTimes.length > 0
        ? Math.round(
            resolutionTimes.reduce((sum, p) => sum + p.days_to_resolve, 0) /
              resolutionTimes.length
          )
        : 0;

    // Préparer les tendances (moyenne par jour)
    const trends = Object.entries(dailyData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, times]) => ({
        date,
        average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        count: times.length
      }));

    return Response.json({
      averageResolutionDays,
      resolvedCount: resolutionTimes.length,
      trends,
      details: resolutionTimes
    });
  } catch (error) {
    console.error('Error calculating resolution time:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});