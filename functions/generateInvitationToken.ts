import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@3.0.0';

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
    const invitationUrl = `https://www.novagile.ca/accept-invitation?token=${token}`;

    // Send email with HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 40px; border-radius: 0 0 8px 8px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .about-section { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">You're invited!</h1>
      <p style="margin: 10px 0 0 0;">Join Nova AI - Your Agile AI Intelligence</p>
    </div>
    
    <div class="content">
      <p>Hi ${inviteeEmail},</p>
      
      <p><strong>${user.full_name || user.email}</strong> has invited you to join Nova AI - Agile Intelligence.</p>
      
      <div class="about-section">
        <h3 style="margin-top: 0;">About Nova</h3>
        <p>Nova is an agile organizational intelligence system that helps teams identify dysfunctions, anticipate risks, and transform processes into actionable insights. It enables organizations to accelerate value creation, increase productivity, reduce error-related costs, and make smarter decisions in real time.</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${invitationUrl}" class="cta-button">Join Nova AI</a>
      </p>
      
      <p style="text-align: center; color: #666; font-size: 14px;">This invitation expires in 7 days</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via SMTP
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT')),
      secure: Deno.env.get('SMTP_PORT') === '465',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD')
      }
    });

    await transporter.sendMail({
      from: Deno.env.get('SMTP_USER'),
      to: inviteeEmail,
      subject: 'You\'re invited to join Nova AI - Agile Intelligence',
      html: emailHtml
    });

    return Response.json({ success: true, message: 'Invitation sent successfully', token });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});