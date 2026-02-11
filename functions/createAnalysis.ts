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

    // Parse body early to catch parsing errors
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('Received body:', JSON.stringify(body).substring(0, 200));
    const { analysisRecord, patternDetections } = body;

    // Validate input
    if (!analysisRecord) {
      return Response.json({ error: 'Missing analysisRecord' }, { status: 400 });
    }

    // Ensure analysis_data exists and inserted_at is properly set to UTC ISO string
    if (!analysisRecord.analysis_data) {
      analysisRecord.analysis_data = {};
    }
    
    if (!analysisRecord.analysis_data.inserted_at) {
      analysisRecord.analysis_data.inserted_at = new Date().toISOString();
    }

    // Create analysis record with service role to bypass RLS
    const createdAnalysis = await base44.asServiceRole.entities.AnalysisHistory.create(analysisRecord);

    // Create pattern detection records
    if (patternDetections && patternDetections.length > 0) {
      for (const pattern of patternDetections) {
        pattern.analysis_id = createdAnalysis.id;
        await base44.asServiceRole.entities.PatternDetection.create(pattern);
      }
    }

    return Response.json({ analysis: createdAnalysis });
  } catch (error) {
    console.error('Analysis creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});