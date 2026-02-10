import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, token } = await req.json();

    if (!user_email || !token) {
      return Response.json({ error: 'Email and token required' }, { status: 400 });
    }

    // Vérifier si le token est valide et non utilisé
    const activationTokens = await base44.asServiceRole.entities.ActivationToken.filter({
      token: token,
      used: false,
      email: user_email
    });

    if (activationTokens.length === 0) {
      // Token invalide/utilisé - supprimer l'utilisateur créé
      const users = await base44.asServiceRole.entities.User.filter({
        email: user_email
      });

      if (users.length > 0) {
        await base44.asServiceRole.entities.User.delete(users[0].id);
      }

      return Response.json({ 
        valid: false, 
        error: 'Inscription non autorisée - token d\'invitation invalide ou expirée' 
      }, { status: 403 });
    }

    const activationToken = activationTokens[0];

    // Vérifier l'expiration
    const expiresAt = new Date(activationToken.expires_at);
    if (new Date() > expiresAt) {
      // Token expiré - supprimer l'utilisateur
      const users = await base44.asServiceRole.entities.User.filter({
        email: user_email
      });

      if (users.length > 0) {
        await base44.asServiceRole.entities.User.delete(users[0].id);
      }

      return Response.json({ 
        valid: false, 
        error: 'Invitation expirée' 
      }, { status: 403 });
    }

    // Token valide - marquer comme utilisé
    await base44.asServiceRole.entities.ActivationToken.update(activationToken.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    // Mettre à jour l'utilisateur avec le token d'invitation
    const users = await base44.asServiceRole.entities.User.filter({
      email: user_email
    });

    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, {
        invitation_token_id: activationToken.id,
        verified_at: new Date().toISOString()
      });
    }

    return Response.json({
      valid: true,
      message: 'Inscription validée avec succès'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});