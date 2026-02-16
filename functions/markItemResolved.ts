import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, source, itemType, title, urgency, analysisDate } = await req.json();

    if (!itemId || !source) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If it's a PatternDetection, update it directly with service role
    if (source === 'pattern_detection') {
      try {
        await base44.asServiceRole.entities.PatternDetection.update(itemId, {
          status: 'resolved',
          resolved_date: new Date().toISOString(),
        });
      } catch (patternError) {
        console.error('PatternDetection update error:', patternError);
        // Continue to create ResolvedItem anyway
      }
    }

    // Create ResolvedItem record for tracking
    await base44.entities.ResolvedItem.create({
      item_id: itemId,
      source: source,
      item_type: itemType || 'blocker',
      title: title || 'Unknown',
      urgency: urgency || 'medium',
      resolved_date: new Date().toISOString(),
      resolved_by: user.email,
      original_analysis_date: analysisDate || new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: 'Item marqué comme résolu',
    });
  } catch (error) {
    console.error('Error marking item resolved:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});