import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('📊 Checking Teams connections for:', user.email);

    // Vérifier avec asServiceRole pour voir tous les enregistrements
    const allTeamsConns = await base44.asServiceRole.entities.TeamsConnection.list();
    console.log('📊 Total Teams connections in DB:', allTeamsConns.length);

    // Vérifier avec l'utilisateur authentifié
    const userTeamsConns = await base44.entities.TeamsConnection.filter({
      user_email: user.email,
      is_active: true
    });

    console.log('📊 User Teams connections:', userTeamsConns.length);

    return Response.json({
      user_email: user.email,
      total_connections: allTeamsConns.length,
      user_connections: userTeamsConns.length,
      user_connection_details: userTeamsConns.length > 0 ? userTeamsConns[0] : null,
      all_connections_sample: allTeamsConns.slice(0, 3)
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});