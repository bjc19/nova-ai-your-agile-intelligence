import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Compute situation profile for intelligent dashboard
 * Analyzes latest analyses to determine what matters most
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest analyses
    const analyses = await base44.entities.AnalysisHistory.list('-created_date', 20);
    
    if (analyses.length === 0) {
      return Response.json({
        active_sprint: false,
        blockers_count: 0,
        risks_count: 0,
        analysis_count: 0,
        wip_high: false,
        velocity_unstable: false,
        crisis_mode: false,
        data_points: 0,
        patterns_detected: 0
      });
    }

    const latest = analyses[0];
    const analysisData = latest.analysis_data || {};

    // Compute blockers and risks
    const blockers = analysisData.blockers || [];
    const risks = analysisData.risks || [];
    const patterns = latest.patterns || [];

    // Check sprint context
    const sprintContexts = await base44.entities.SprintContext.filter({ is_active: true });
    const activeSprint = sprintContexts.length > 0;

    // Calculate situation metrics
    const blockersCount = Array.isArray(blockers) ? blockers.length : 0;
    const risksCount = Array.isArray(risks) ? risks.length : 0;
    const recommendationsCount = analysisData.recommendations ? analysisData.recommendations.length : 0;

    // Detect crisis mode (too many blockers)
    const crisisMode = blockersCount > 5 || risksCount > 5;

    // Detect WIP issues
    const wipHigh = blockers.some(b => 
      b.issue && (
        b.issue.toLowerCase().includes('wip') ||
        b.issue.toLowerCase().includes('trop de') ||
        b.issue.toLowerCase().includes('en cours')
      )
    );

    // Detect velocity instability
    const velocityUnstable = risks.some(r =>
      r.description && (
        r.description.toLowerCase().includes('vélocité') ||
        r.description.toLowerCase().includes('velocity') ||
        r.description.toLowerCase().includes('variance')
      )
    );

    // Count patterns by severity
    const criticalPatterns = patterns.filter(p => p.severity === 'critical').length;
    const highPatterns = patterns.filter(p => p.severity === 'high').length;
    const patternsDetected = patterns.length;

    // Flow data availability
    const flowDataAvailable = analysisData.flow_data_available !== false;

    // Systemic issues detection
    const systemicIssues = patterns.filter(p => 
      p.category && ['A', 'B', 'C'].includes(p.category)
    ).length;

    // Compute days since last analysis
    const daysSinceAnalysis = Math.floor(
      (Date.now() - new Date(latest.created_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Detect trend
    let trendNegative = false;
    if (analyses.length > 1) {
      const previous = analyses[1];
      const prevBlockers = (previous.analysis_data?.blockers || []).length;
      trendNegative = blockersCount > prevBlockers;
    }

    const situationProfile = {
      // Core metrics
      active_sprint: activeSprint,
      blockers_count: blockersCount,
      risks_count: risksCount,
      analysis_count: analyses.length,
      recommendations_count: recommendationsCount,
      patterns_detected: patternsDetected,
      critical_patterns: criticalPatterns,
      high_patterns: highPatterns,
      
      // State detection
      wip_high: wipHigh,
      velocity_unstable: velocityUnstable,
      crisis_mode: crisisMode,
      trend_negative: trendNegative,
      
      // Flow & systemic
      flow_data_available: flowDataAvailable,
      systemic_issues: systemicIssues,
      assignee_changes_high: (analysisData.assignee_changes_count || 0) > 3,
      mention_patterns_concerning: (analysisData.concerning_mentions || 0) > 5,
      blocked_resolution_needed: blockersCount > 2 && blockersCount === risksCount,
      
      // Analysis state
      data_points: analyses.length,
      days_since_analysis: daysSinceAnalysis,
      data_collected: analyses.length * 5, // Pseudo-metric
      
      // User intent indicators
      looking_for_improvements: analysisData.workshop_type === 'retrospective',
      sprint_day: sprintContexts[0]?.sprint_day || 3,
      
      // Integration status
      integrations_connected: (analysisData.sources_connected || 0),
      integrations_total: 3,
      integrations_all_connected: (analysisData.sources_connected || 0) >= 3,
      
      // Quick win indicators
      quick_wins_count: analysisData.quick_wins?.length || 0,
      urgent_actions_count: blockers.filter(b => b.urgency === 'high').length,
      
      // Scope creep detection
      scope_creep_detected: blockersCount > 3 && analysisData.goals_misaligned
    };

    return Response.json(situationProfile);
  } catch (error) {
    console.error('Situation profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});