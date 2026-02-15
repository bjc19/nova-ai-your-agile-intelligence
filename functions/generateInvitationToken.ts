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

    const { inviteeEmail, inviteRole, workspaceId } = await req.json();

    if (!inviteeEmail) {
      return Response.json({ error: 'Missing inviteeEmail' }, { status: 400 });
    }

    const workspace = workspaceId || 'default';

    // Vérifier si l'utilisateur est déjà membre de l'espace de travail
    const existingMember = await base44.entities.WorkspaceMember.filter({
      user_email: inviteeEmail,
      workspace_id: workspace
    });

    if (existingMember.length > 0) {
      return Response.json({ 
        error: `L'utilisateur avec l'email ${inviteeEmail} est déjà membre de votre équipe !` 
      }, { status: 400 });
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create invitation record
    await base44.entities.InvitationToken.create({
      token,
      invitee_email: inviteeEmail,
      invited_by: user.email,
      workspace_id: workspace,
      role: inviteRole || 'user',
      status: 'pending',
      expires_at: expiresAt
    });

    // Create invitation link
    const invitationUrl = `https://www.novagile.ca/AcceptInvitation?token=${token}`;
// OU si tu préfères kebab-case :
// const invitationUrl = `https://www.novagile.ca/accept-invitation?token=${token}`;

    // Send email via Resend API using fetch
    const emailBody = `Hi ${inviteeEmail},

${user.full_name || user.email} has invited you to join Nova AI - Agile Intelligence.

About Nova:
Nova is an agile organizational intelligence system that helps teams identify dysfunctions, anticipate risks, and transform processes into actionable insights.

Accept invitation: ${invitationUrl}

This invitation expires in 7 days.`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@novagile.ca',
        to: inviteeEmail,
        subject: 'You\'re invited to join Nova AI - Agile Intelligence',
        html: `<p>Hi ${inviteeEmail},</p><p>${user.full_name || user.email} has invited you to join Nova AI - Agile Intelligence.</p><p><strong>About Nova:</strong><br>Nova is an agile organizational intelligence system that helps teams identify dysfunctions, anticipate risks, and transform processes into actionable insights.</p><p><a href="${invitationUrl}">Accept invitation</a></p><p>This invitation expires in 7 days.</p>`
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Email delivery failed: ${errorData.message || emailResponse.statusText}`);
    }

    return Response.json({ success: true, message: 'Invitation sent successfully', token });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});