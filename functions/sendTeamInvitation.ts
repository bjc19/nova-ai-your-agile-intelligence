import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur peut inviter
    const statusRes = await base44.functions.invoke('getUserSubscriptionStatus', {});
    if (!statusRes.data.canInvite) {
      return Response.json({ error: 'Vous n\'avez pas la permission d\'inviter des membres' }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return Response.json({ error: 'Email et rôle requis' }, { status: 400 });
    }

    // Vérifier la limite d'utilisateurs
    const subscription = statusRes.data.subscription;
    const teamMembers = await base44.entities.TeamMember.filter({ 
      admin_email: user.email 
    });

    if (teamMembers.length >= subscription.max_users) {
      return Response.json({ 
        error: 'Limite d\'utilisateurs atteinte pour votre plan' 
      }, { status: 400 });
    }

    // Créer l'invitation avec InvitationToken (pas de TeamMember encore)
    const invitationToken = await base44.asServiceRole.entities.InvitationToken.create({
      invitee_email: email,
      invited_by: user.email,
      role: role,
      workspace_id: 'default',
      status: 'pending',
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Email personnalisé
    const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://novagile.ca';

    await base44.integrations.Core.SendEmail({
      to: email,
      from_name: 'Nova AI',
      subject: `🎉 Vous avez été invité à rejoindre Nova AI`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✨ Bienvenue sur Nova AI</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Bonjour,
            </p>
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              <strong>${user.full_name}</strong> vous a invité à rejoindre son équipe sur <strong>Nova AI</strong>, votre expert Agile propulsé par l'intelligence artificielle.
            </p>

            <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">📋 Votre rôle</p>
              <p style="margin: 10px 0 5px 0; color: #1e293b; font-weight: bold;">
                ${role === 'contributor' ? 'Contributeur' : 'Utilisateur'}
              </p>
              <p style="margin: 5px 0; color: #64748b; font-size: 13px;">
                ${role === 'contributor' 
                  ? 'Vous pourrez analyser les données et créer des insights' 
                  : 'Vous pourrez consulter les analyses et recommandations'}
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/Dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Accéder à Nova AI
              </a>
            </div>

            <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
              Vous recevrez un email séparé pour créer votre mot de passe et finaliser votre compte.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Si vous n'avez pas demandé cette invitation, ignorez cet email.
            </p>
          </div>
        </div>
      `
    });
  
    return Response.json({ 
      success: true, 
      message: 'Invitation envoyée avec succès' 
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});