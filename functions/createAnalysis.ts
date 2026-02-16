import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or contributor
    if (user.role !== 'admin' && user.role !== 'contributor') {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { analysisRecord, patternDetections, workspace_id, workspace_name } = body || {};

    if (!analysisRecord) {
      console.error('Missing analysisRecord. Body received:', body);
      return Response.json({ error: 'Missing analysisRecord' }, { status: 400 });
    }

    // Ensure analysis_data exists and inserted_at is properly set to UTC ISO string
    if (!analysisRecord.analysis_data) {
      analysisRecord.analysis_data = {};
    }
    
    if (!analysisRecord.analysis_data.inserted_at) {
      analysisRecord.analysis_data.inserted_at = new Date().toISOString();
    }
    
    // Ensure analysis_time is set at the root level
    if (!analysisRecord.analysis_time) {
      analysisRecord.analysis_time = new Date().toISOString();
    }

    // If workspace_id provided, use createMultiSourceAnalysis for cross-source fusion
    if (workspace_id) {
      const multiSourceResult = await base44.functions.invoke('createMultiSourceAnalysis', {
        workspace_id,
        workspace_name: workspace_name || analysisRecord.workspace_name,
        primary_source: analysisRecord.source,
        title: analysisRecord.title,
        analysis_data: analysisRecord.analysis_data,
        blockers_count: analysisRecord.blockers_count,
        risks_count: analysisRecord.risks_count,
        transcript_preview: analysisRecord.transcript_preview
      });

      // Create pattern detection records
      if (patternDetections && patternDetections.length > 0) {
        const limitedPatterns = patternDetections.slice(0, 20);
        await Promise.all(
          limitedPatterns.map(pattern =>
            base44.asServiceRole.entities.PatternDetection.create({
              ...pattern,
              analysis_id: multiSourceResult.data.analysis_id
            })
          )
        );
      }

      return Response.json({ analysis: multiSourceResult.data });
    }

    // Legacy: Create analysis record without workspace (fallback)
    const createdAnalysis = await base44.asServiceRole.entities.AnalysisHistory.create(analysisRecord);

    // Create pattern detection records in parallel (limit to 20 patterns max to avoid CPU timeout)
    if (patternDetections && patternDetections.length > 0) {
      const limitedPatterns = patternDetections.slice(0, 20);
      await Promise.all(
        limitedPatterns.map(pattern =>
          base44.asServiceRole.entities.PatternDetection.create({
            ...pattern,
            analysis_id: createdAnalysis.id
          })
        )
      );
    }

    // Process multi-source patterns if workspace available
    if (workspace_id) {
      try {
        await base44.asServiceRole.functions.invoke('processMultiSourcePatterns', {
          analysisId: createdAnalysis.id,
          analysisData: analysisRecord.analysis_data,
          workspaceId: workspace_id,
          source: analysisRecord.source,
          blockersData: analysisRecord.analysis_data?.blockers || [],
          risksData: analysisRecord.analysis_data?.risks || []
        });
      } catch (e) {
        console.log('Multi-source pattern processing skipped:', e.message);
      }
    }

    return Response.json({ analysis: createdAnalysis });
  } catch (error) {
    console.error('Analysis creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});