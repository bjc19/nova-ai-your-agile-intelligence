import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get app context
    const appId = Deno.env.get('BASE44_APP_ID');
    
    // Fetch all analyses
    const analyses = await base44.asServiceRole.entities.AnalysisHistory.list('-created_date', 1000);
    
    let fixed = 0;
    const errors = [];

    for (const analysis of analyses) {
      try {
        // Check if inserted_at exists and needs fixing
        if (analysis.analysis_data?.inserted_at) {
          // Use created_date (which is properly stored as UTC by the DB)
          if (analysis.created_date && analysis.analysis_data.inserted_at !== analysis.created_date) {
            // Update with correct created_date
            const updatedData = {
              ...analysis.analysis_data,
              inserted_at: analysis.created_date
            };
            
            // Update using service role bypass
            const updateUrl = `https://api.base44.io/v1/apps/${appId}/entities/AnalysisHistory/${analysis.id}`;
            const updateResponse = await fetch(updateUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY') || ''}`
              },
              body: JSON.stringify({
                analysis_data: updatedData
              })
            });

            if (updateResponse.ok) {
              fixed++;
            } else {
              const error = await updateResponse.text();
              errors.push(`Analysis ${analysis.id}: ${error}`);
            }
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