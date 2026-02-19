import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false, 
        message: 'Not authenticated',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const testData = {
      user_email: user.email,
      user_role: user.role,
      timestamp: new Date().toISOString()
    };

    // Try to fetch PatternDetection records with status != resolved
    const patterns = await base44.entities.PatternDetection.filter(
      { status: ["detected", "acknowledged", "in_progress"] },
      '-created_date',
      5
    );
    
    if (!patterns || patterns.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No active PatternDetection records found',
        ...testData
      });
    }

    const pattern = patterns[0];
    testData.pattern_id = pattern.id;
    testData.pattern_status = pattern.status;
    testData.pattern_created_by = pattern.created_by;

    // Try to update
    try {
      const updated = await base44.entities.PatternDetection.update(pattern.id, {
        status: 'acknowledged',
        notes: 'Test update from backend'
      });

      return Response.json({
        success: true,
        message: 'Update successful',
        ...testData,
        updated: updated
      });
    } catch (updateErr) {
      return Response.json({
        success: false,
        message: 'Update failed',
        error: updateErr.message,
        ...testData
      });
    }

  } catch (error) {
    return Response.json({ 
      success: false, 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});