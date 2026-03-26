import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ valid: false, error: 'Token manquant' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Vérifier le token
    const tokens = await base44.asServiceRole.entities.ActivationToken.filter({ token });

    if (!tokens || tokens.length === 0) {
      return Response.json({ valid: false, error: 'Token invalide' });
    }

    const activationToken = tokens[0];

    // Vérifier si déjà utilisé
    if (activationToken.used) {
      return Response.json({ valid: false, error: 'Token déjà utilisé' });
    }

    // Vérifier expiration
    if (new Date(activationToken.expires_at) < new Date()) {
      return Response.json({ valid: false, error: 'Token expiré' });
    }

    // Récupérer les infos client
    const client = await base44.asServiceRole.entities.Client.get(activationToken.client_id);

    return Response.json({
      valid: true,
      email: activationToken.email,
      clientId: client.id,
      plan: client.plan,
      maxUsers: client.max_users
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});