import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteeEmail, inviteRole } = await req.json();

    if (!inviteeEmail) {
      return Response.json({ error: 'Missing inviteeEmail' }, { status: 400 });
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

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
    const invitationUrl = `${Deno.env.get('APP_URL') || 'https://novagile.ca'}/accept-invitation?token=${token}`;

    // Send email
    const emailBody = `Hi ${inviteeEmail},\n\n${user.full_name || user.email} vous a invité à rejoindre Nova AI - Agile Intelligence. Nous sommes ravis de vous accueillir!\n\n- À propos de Nova\nNova est un système d'intelligence organisationnelle agile qui aide les équipes à identifier les dysfonctionnements, anticiper les risques et transformer les processus en insights actionnables. Il permet aux organisations d'accélérer la création de valeur, d'augmenter la productivité, de réduire les coûts liés aux erreurs et de prendre des décisions plus intelligentes en temps réel.\n\nPrêt à commencer? Acceptez votre invitation et créez votre compte Nova:\n\n${invitationUrl}\n\nCette invitation expire dans 7 jours.\n\nCordialement,\nL'équipe Nova`;

    await base44.integrations.Core.SendEmail({
      to: inviteeEmail,
      subject: 'Rejoignez Nova - Agile Intelligence',
      body: emailBody,
      from_name: 'Nova'
    });

    return Response.json({ success: true, message: 'Invitation sent successfully', token });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});