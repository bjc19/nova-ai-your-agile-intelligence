import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { requestId, action, role } = await req.json();

    if (!requestId || !action || (action === 'approve' && !role)) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const request = await base44.entities.JoinTeamRequest.get(requestId);

    if (!request || request.admin_email !== user.email) {
      return Response.json({ error: 'Demande introuvable ou non autorisée' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return Response.json({ error: 'Demande déjà traitée' }, { status: 400 });
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    if (action === 'approve') {
      await base44.entities.TeamMember.create({
        user_email: request.requester_email,
        user_name: request.requester_name,
        subscription_id: request.subscription_id,
        admin_email: user.email,
        role: role,
        joined_at: new Date().toISOString()
      });

      await base44.entities.JoinTeamRequest.update(requestId, {
        status: 'approved',
        assigned_role: role,
        processed_at: new Date().toISOString()
      });

      await resend.emails.send({
        from: 'Nova AI <contact@novagile.ca>',
        to: request.requester_email,
        subject: '🎉 Votre demande a été approuvée',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Accès approuvé</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px;">
              <p style="font-size: 16px; color: #334155;">Excellente nouvelle ! Votre demande pour rejoindre l'équipe a été approuvée.</p>
              <p style="font-size: 16px; color: #334155;">Rôle assigné : <strong>${role === 'contributor' ? 'Contributeur' : 'Utilisateur'}</strong></p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('APP_URL')}/Dashboard" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  🚀 Accéder au Dashboard
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">© 2026 Nova AI - Tous droits réservés</p>
            </div>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Demande approuvée' });
    }

    if (action === 'reject') {
      await base44.entities.JoinTeamRequest.update(requestId, {
        status: 'rejected',
        processed_at: new Date().toISOString()
      });

      await resend.emails.send({
        from: 'Nova AI <contact@novagile.ca>',
        to: request.requester_email,
        subject: 'Votre demande n\'a pas été approuvée',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; padding: 30px;">
              <p style="font-size: 16px; color: #334155;">Votre demande pour rejoindre l'équipe n'a pas été approuvée pour le moment.</p>
              <p style="font-size: 16px; color: #334155;">Vous pouvez toujours souscrire à un plan individuel pour accéder à Nova.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('APP_URL')}/Dashboard" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Voir les plans
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">© 2026 Nova AI - Tous droits réservés</p>
            </div>
          </div>
        `
      });

      return Response.json({ success: true, message: 'Demande rejetée' });
    }

    return Response.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    console.error('Process request error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});