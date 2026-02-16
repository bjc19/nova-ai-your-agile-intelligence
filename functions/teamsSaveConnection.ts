import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { access_token, refresh_token, expires_in, tenant_id, scopes } = await req.json();

    if (!access_token || !refresh_token || !tenant_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    console.log('Saving Teams connection for user:', user.email);

    // Create connection with authenticated user context - respects RLS
    const result = await base44.entities.TeamsConnection.create({
      user_email: user.email,
      access_token,
      refresh_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      tenant_id,
      scopes: scopes || [],
      is_active: true
    });

    console.log('Teams connection created:', result?.id);

    // NOUVEAUX LOGS DE DIAGNOSTIC
    console.log('[DIAGNOSTIC - POST-CREATION] User email:', user.email, 'User role:', user.app_role || user.role);

    // Tenter de lire l'enregistrement spécifiquement par son ID
    try {
      if (result?.id) {
        const createdRecord = await base44.entities.TeamsConnection.get(result.id);
        console.log('[DIAGNOSTIC - POST-CREATION] Record read by ID:', createdRecord ? 'Found' : 'Not Found', 'ID:', createdRecord?.id, 'Email:', createdRecord?.user_email);
      } else {
        console.log('[DIAGNOSTIC - POST-CREATION] No ID returned from create operation.');
      }
    } catch (e) {
      console.log('[DIAGNOSTIC - POST-CREATION] Read by ID FAILED:', e.message);
    }

    // Essayer list() pour voir tous les enregistrements
    try {
      const allRecords = await base44.entities.TeamsConnection.list();
      console.log('[DIAGNOSTIC] All TeamsConnection records:', allRecords.length);
      allRecords.forEach((rec, idx) => {
        console.log(`  [${idx}] ID: ${rec.id}, user_email: ${rec.user_email}, is_active: ${rec.is_active}`);
      });
    } catch (e) {
      console.log('[DIAGNOSTIC] list() FAILED:', e.message);
    }

    return new Response(JSON.stringify({ success: true, connection_id: result?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Teams save connection error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});