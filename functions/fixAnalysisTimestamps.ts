import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all analyses
    const analyses = await base44.asServiceRole.entities.AnalysisHistory.list('-created_date', 1000);
    
    let fixed = 0;
    const errors = [];

    for (const analysis of analyses) {
      try {
        // Check if inserted_at exists and needs fixing
        if (analysis.analysis_data?.inserted_at) {
          const storedTime = new Date(analysis.analysis_data.inserted_at);
          
          // If timestamp looks wrong (stored as local time instead of UTC),
          // it will be 5+ hours ahead for Toronto timezone
          // We can't fix it perfectly without knowing exact local time,
          // but we can use created_date as reference since DB auto-sets it correctly
          
          if (analysis.created_date && analysis.analysis_data.inserted_at !== analysis.created_date) {
            // Update with correct created_date (which is properly stored as UTC)
            const updatedData = {
              ...analysis.analysis_data,
              inserted_at: analysis.created_date
            };
            
            await base44.asServiceRole.entities.AnalysisHistory.update(analysis.id, {
              analysis_data: updatedData
            });
            
            fixed++;
          }
        }
      } catch (err) {
        errors.push(`Analysis ${analysis.id}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      fixed,
      total: analyses.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Fix timestamps error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});