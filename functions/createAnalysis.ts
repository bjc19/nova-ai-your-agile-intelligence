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
    const { analysisRecord, patternDetections } = body || {};

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

    // Create analysis record with service role to bypass RLS
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

    return Response.json({ analysis: createdAnalysis });
  } catch (error) {
    console.error('Analysis creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});