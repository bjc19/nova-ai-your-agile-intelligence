import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    // Récupérer le token
    const activationTokens = await base44.asServiceRole.entities.ActivationToken.filter({
      token: token,
      used: false
    });

    if (activationTokens.length === 0) {
      return Response.json({ error: 'Invitation invalide ou expirée' }, { status: 400 });
    }

    const activationToken = activationTokens[0];

    // Vérifier l'expiration
    const expiresAt = new Date(activationToken.expires_at);
    if (new Date() > expiresAt) {
      return Response.json({ error: 'Invitation expirée' }, { status: 400 });
    }

    // Marquer comme utilisé
    await base44.asServiceRole.entities.ActivationToken.update(activationToken.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      email: activationToken.email,
      client_id: activationToken.client_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});