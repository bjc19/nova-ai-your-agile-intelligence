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
    const invitationUrl = `https://www.novagile.ca/accept-invitation?token=${token}`;

    // Send email via Base44 integration
    await base44.integrations.Core.SendEmail({
      to: inviteeEmail,
      subject: 'You\'re invited to join Nova AI - Agile Intelligence',
      body: `Hi ${inviteeEmail},\n\n${user.full_name || user.email} has invited you to join Nova AI - Agile Intelligence.\n\nAbout Nova:\nNova is an agile organizational intelligence system that helps teams identify dysfunctions, anticipate risks, and transform processes into actionable insights.\n\nAccept invitation: ${invitationUrl}\n\nThis invitation expires in 7 days.`
    });

    return Response.json({ success: true, message: 'Invitation sent successfully', token });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});