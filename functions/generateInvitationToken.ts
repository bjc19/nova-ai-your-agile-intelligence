import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seuls admin/contributor peuvent inviter
    if (user.role !== 'admin' && user.role !== 'contributor') {
      return Response.json({ error: 'Forbidden: Only admin/contributor can invite' }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Vérifier si l'utilisateur n'existe pas déjà
    const existingUsers = await base44.asServiceRole.entities.User.filter({
      email: email
    });

    if (existingUsers.length > 0) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    // Créer le token d'activation
    const activationToken = await base44.asServiceRole.entities.ActivationToken.create({
      token: token,
      email: email,
      client_id: user.id,
      expires_at: expiresAt.toISOString(),
      used: false
    });

    const invitationUrl = `${Deno.env.get('APP_URL') || 'https://novagile.ca'}/register?token=${token}`;

    return Response.json({
      success: true,
      token: token,
      email: email,
      expires_at: expiresAt.toISOString(),
      invitation_url: invitationUrl
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});