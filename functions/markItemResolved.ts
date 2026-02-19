import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role (handle both 'role' and 'app_role')
    const userRole = user.app_role || user.role;
    console.log(`User: ${user.email}, Role: ${userRole}`);

    const { itemId, source, itemType, title, urgency, analysisDate } = await req.json();

    if (!itemId || !source) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
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