import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role?.includes('admin')) {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[TEST] Tentative d\'accès en service role...');
    
    // Essayer avec service role pour contourner RLS
    try {
      const allRecords = await base44.asServiceRole.entities.TeamsConnection.list();
      console.log('[TEST] Service role list() retourné:', allRecords.length, 'enregistrements');
      return Response.json({
        success: true,
        message: 'Service role peut lister',
        count: allRecords.length,
        records: allRecords.slice(0, 3)
      });

    } catch (e) {
      console.log('[TEST] Service role échoué:', e.message);
      return Response.json({
        success: false,
        error: e.message,
        type: 'service_role_failed'
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});