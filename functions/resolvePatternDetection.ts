import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { patternId } = body;

    if (!patternId) {
      return Response.json({ error: 'Missing patternId' }, { status: 400 });
    }

    await base44.asServiceRole.entities.PatternDetection.update(patternId, {
      status: 'resolved',
      resolved_date: new Date().toISOString()
    });

    return Response.json({ success: true, patternId });
  } catch (error) {
    console.error('Error resolving pattern:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});