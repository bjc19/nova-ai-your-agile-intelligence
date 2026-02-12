import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminEmail } = await req.json();

    if (!adminEmail) {
      return Response.json({ error: 'Email admin requis' }, { status: 400 });
    }

    const existingSub = await base44.entities.Subscription.filter({ user_email: user.email });
    if (existingSub.length > 0) {
      return Response.json({ error: 'Vous avez déjà un abonnement' }, { status: 400 });
    }

    const existingMember = await base44.entities.TeamMember.filter({ user_email: user.email });
    if (existingMember.length > 0) {
      return Response.json({ error: 'Vous êtes déjà membre d\'une équipe' }, { status: 400 });
    }

    const existingRequest = await base44.entities.JoinTeamRequest.filter({
      requester_email: user.email,
      status: 'pending'
    });

    if (existingRequest.length > 0) {
      return Response.json({ error: 'Vous avez déjà une demande en cours' }, { status: 400 });
    }

    const adminSub = await base44.asServiceRole.entities.Subscription.filter({
      user_email: adminEmail,
      is_admin: true,
      status: 'active'
    });

    if (adminSub.length === 0) {
      return Response.json({ 
        success: true,
        message: 'Si l\'email fourni correspond à un administrateur d\'équipe, il recevra votre demande.' 
      });
    }

    const subscription = adminSub[0];
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({
      subscription_id: subscription.id
    });

    if (teamMembers.length >= subscription.max_users - 1) {
      return Response.json({ 
        success: true,
        message: 'Si l\'email fourni correspond à un administrateur d\'équipe, il recevra votre demande.' 
      });
    }

    await base44.entities.JoinTeamRequest.create({
      requester_email: user.email,
      requester_name: user.full_name,
      admin_email: adminEmail,
      subscription_id: subscription.id,
      status: 'pending'
    });

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const planNames = {starter: 'Starter', growth: 'Growth', pro: 'Pro', custom: 'Custom'};

    await resend.emails.send({
      from: 'Nova AI <contact@novagile.ca>',
      to: adminEmail,
      subject: `🔔 Nouvelle demande pour rejoindre votre équipe Nova`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">👥 Nouvelle demande d'accès</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px;">
            <p style="font-size: 16px; color: #334155;"><strong>${user.full_name}</strong> (${user.email}) souhaite rejoindre votre équipe Nova ${planNames[subscription.plan]}.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('APP_URL')}/Dashboard" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Gérer la demande
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">© 2026 Nova AI - Tous droits réservés</p>
          </div>
        </div>
      `
    });

    return Response.json({ 
      success: true,
      message: 'Si l\'email fourni correspond à un administrateur d\'équipe, il recevra votre demande.' 
    });

  } catch (error) {
    const errorMsg = error.message || 'Erreur inconnue';
    console.error('Join team request error:', {
      message: errorMsg,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return Response.json({ 
      success: false,
      error: errorMsg,
      status: 'error'
    }, { status: 500 });
  }
});