import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { email, fullName, password, token } = await req.json();

    if (!email || !fullName || !password || !token) {
      return Response.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Valider le token
    const tokens = await base44.asServiceRole.entities.ActivationToken.filter({ token });
    
    if (!tokens || tokens.length === 0) {
      return Response.json({ error: 'Token invalide' }, { status: 400 });
    }

    const activationToken = tokens[0];

    if (activationToken.used) {
      return Response.json({ error: 'Token déjà utilisé' }, { status: 400 });
    }

    if (new Date(activationToken.expires_at) < new Date()) {
      return Response.json({ error: 'Token expiré' }, { status: 400 });
    }

    if (activationToken.email !== email) {
      return Response.json({ error: 'Email ne correspond pas au token' }, { status: 400 });
    }

    // Créer l'utilisateur via Base44 auth
    try {
      await base44.asServiceRole.auth.signUp({
        email,
        password,
        full_name: fullName
      });
    } catch (authError) {
      console.error('Auth error:', authError);
      return Response.json({ 
        error: 'Erreur lors de la création du compte. L\'email existe peut-être déjà.' 
      }, { status: 400 });
    }

    // Récupérer le client
    const client = await base44.asServiceRole.entities.Client.get(activationToken.client_id);

    // Mettre à jour le client comme activé
    await base44.asServiceRole.entities.Client.update(client.id, {
      status: 'active',
      admin_email: email
    });

    // Marquer le token comme utilisé
    await base44.asServiceRole.entities.ActivationToken.update(activationToken.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    // Créer workspace pour le client
    await base44.asServiceRole.entities.WorkspaceMember.create({
      user_email: email,
      user_name: fullName,
      role: 'admin',
      workspace_id: client.id,
      invitation_status: 'accepted'
    });

    // Log d'audit
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'CLIENT_ACTIVATION',
      entity_type: 'Client',
      entity_id: client.id,
      performed_by: email,
      details: `Admin account created for plan ${client.plan}`
    });

    return Response.json({
      success: true,
      message: 'Compte créé avec succès',
      clientId: client.id
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});