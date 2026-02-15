import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.5';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { inviteeEmail, inviteRole } = await req.json();

    if (!inviteeEmail) {
      return Response.json({ error: 'Missing inviteeEmail' }, { status: 400 });
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create invitation record
    await base44.asServiceRole.entities.InvitationToken.create({
      token,
      invitee_email: inviteeEmail,
      invited_by: user.email,
      workspace_id: 'default',
      role: inviteRole || 'user',
      status: 'pending',
      expires_at: expiresAt
    });

    // Create invitation link
    const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://novagile.ca';
    const invitationUrl = `${appUrl}/AcceptInvitation?token=${token}`;

    // Send email via Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Nova AI <noreply@novagile.ca>',
      to: inviteeEmail,
      subject: `🎉 Vous avez été invité à rejoindre Nova AI`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✨ Bienvenue sur Nova AI</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Bonjour,
            </p>
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              <strong>${user.full_name || user.email}</strong> vous a invité à rejoindre son équipe sur <strong>Nova AI</strong>, votre expert Agile propulsé par l'intelligence artificielle.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Accepter l'invitation
              </a>
            </div>

            <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
              En cliquant sur "Accepter l'invitation", vous pourrez créer votre compte et rejoindre l'équipe. 
              Cette invitation est valide pendant 7 jours.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Si vous n'avez pas demandé cette invitation, ignorez cet email.
            </p>
          </div>
        </div>
      `
    });

    return Response.json({ success: true, message: 'Invitation envoyée avec succès', token });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});