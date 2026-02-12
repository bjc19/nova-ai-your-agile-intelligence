import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return Response.json({ error: 'requestId requis' }, { status: 400 });
    }

    // Récupérer la demande
    const pendingRequest = await base44.asServiceRole.entities.PendingRequest.get(requestId);
    
    if (!pendingRequest) {
      return Response.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (pendingRequest.status === 'approved') {
      return Response.json({ error: 'Demande déjà approuvée' }, { status: 400 });
    }

    // Créer le client
    const client = await base44.asServiceRole.entities.Client.create({
      name: pendingRequest.name,
      email: pendingRequest.email,
      company: pendingRequest.company,
      plan: pendingRequest.plan,
      max_users: pendingRequest.users_count,
      status: 'pending_activation',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
      admin_email: pendingRequest.email
    });

    // Générer token d'activation (valide 7 jours)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.ActivationToken.create({
      token,
      client_id: client.id,
      email: pendingRequest.email,
      expires_at: expiresAt,
      used: false
    });

    // Mettre à jour la demande
    await base44.asServiceRole.entities.PendingRequest.update(requestId, {
      status: 'approved',
      approved_by: user.email
    });

    // Envoyer email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = new Resend(resendApiKey);

    const planNames = {
      starter: 'Starter',
      growth: 'Growth',
      pro: 'Pro',
      enterprise: 'Enterprise'
    };

    const activationUrl = `${Deno.env.get('APP_URL') || 'https://yourapp.com'}/Register?token=${token}`;

    await resend.emails.send({
      from: 'Nova AI <contact@novagile.ca>',
      to: pendingRequest.email,
      subject: `🎉 Votre accès Nova ${planNames[pendingRequest.plan]} est validé`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✨ Bienvenue chez Nova AI</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Bonjour <strong>${pendingRequest.name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Excellente nouvelle ! Votre demande d'accès au <strong>plan ${planNames[pendingRequest.plan]}</strong> a été validée par notre équipe.
            </p>

            <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">📋 Détails de votre compte</p>
              <p style="margin: 10px 0 5px 0; color: #1e293b;"><strong>Plan:</strong> ${planNames[pendingRequest.plan]}</p>
              <p style="margin: 5px 0; color: #1e293b;"><strong>Utilisateurs:</strong> Jusqu'à ${pendingRequest.users_count} membres</p>
              <p style="margin: 5px 0; color: #1e293b;"><strong>Entreprise:</strong> ${pendingRequest.company}</p>
            </div>

            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Pour activer votre compte et commencer à utiliser Nova, cliquez sur le bouton ci-dessous :
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Créer mon compte
              </a>
            </div>

            <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
              Ce lien est valide pendant <strong>7 jours</strong>. Après activation, vous pourrez inviter vos collaborateurs selon les limites de votre plan.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Si vous n'avez pas fait cette demande, ignorez cet email ou contactez-nous à contact@novagile.ca
            </p>
          </div>
        </div>
      `
    });

    // Log d'audit
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'APPROVE_REQUEST',
      entity_type: 'PendingRequest',
      entity_id: requestId,
      performed_by: user.email,
      details: `Approved request for ${pendingRequest.email} - Plan ${pendingRequest.plan}`
    });

    return Response.json({
      success: true,
      message: 'Demande approuvée et email envoyé',
      clientId: client.id,
      activationToken: token
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});