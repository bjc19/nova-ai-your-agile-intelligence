import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import nodemailer from 'npm:nodemailer@6.9.7';

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

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: 465,
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD')
      }
    });

    const emailBody = `Hi ${inviteeEmail},

${user.full_name || user.email} has invited you to join Nova AI - Agile Intelligence.

About Nova:
Nova is an agile organizational intelligence system that helps teams identify dysfunctions, anticipate risks, and transform processes into actionable insights.

Accept invitation: ${invitationUrl}

This invitation expires in 7 days.`;

    await transporter.sendMail({
      from: 'noreply@novagile.ca',
      to: inviteeEmail,
      subject: 'You\'re invited to join Nova AI - Agile Intelligence',
      text: emailBody
    });

    return Response.json({ success: true, message: 'Invitation sent successfully', token });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});