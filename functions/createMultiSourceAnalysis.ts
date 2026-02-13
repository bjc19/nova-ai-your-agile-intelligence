import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      workspace_id,
      workspace_name,
      primary_source,
      title,
      analysis_data,
      blockers_count,
      risks_count,
      transcript_preview
    } = await req.json();

    if (!workspace_id || !primary_source || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analysisTime = new Date().toISOString();

    // Résoudre sources contributives
    const { contributing_sources, merged_analysis, cross_source_confidence } = 
      await base44.functions.invoke('resolveMultiSourceAnalysis', {
        workspace_id,
        primary_source,
        analysis_time: analysisTime,
        analysis_data
      });

    // Créer AnalysisHistory unifiée
    const analysisHistory = await base44.entities.AnalysisHistory.create({
      title: contributing_sources.length > 1 
        ? `${title} (Multi-source)` 
        : title,
      source: contributing_sources.length > 1 ? 'multi_source' : primary_source,
      jira_project_selection_id: workspace_id,
      workspace_name,
      blockers_count: merged_analysis.aggregated?.total_blockers || blockers_count || 0,
      risks_count: merged_analysis.aggregated?.total_risks || risks_count || 0,
      analysis_data: merged_analysis,
      transcript_preview,
      contributing_sources: contributing_sources.map(s => ({
        source: s.source,
        confidence: s.confidence,
        metadata: s.metadata
      })),
      cross_source_confidence,
      analysis_time: analysisTime
    });

    return Response.json({
      success: true,
      analysis_id: analysisHistory.id,
      workspace_id,
      source_count: contributing_sources.length,
      contributing_sources: contributing_sources.map(s => s.source),
      cross_source_confidence,
      blockers: merged_analysis.aggregated?.total_blockers || 0,
      risks: merged_analysis.aggregated?.total_risks || 0
    });
  } catch (error) {
    console.error('Create multi-source analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});