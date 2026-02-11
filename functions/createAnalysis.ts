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

    const bodyText = await req.text();
    console.log('Raw body received:', bodyText.substring(0, 500));
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    console.log('Body keys:', Object.keys(body));
    const { analysisRecord, patternDetections } = body || {};

    if (!analysisRecord) {
      console.error('Missing analysisRecord. Body keys:', Object.keys(body), 'Body:', JSON.stringify(body).substring(0, 200));
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