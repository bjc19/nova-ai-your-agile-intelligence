import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate reset token
    const resetToken = crypto.getRandomValues(new Uint8Array(32))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create PasswordReset record without auth requirement
    await base44.entities.PasswordReset.create({
      email: email,
      token: resetToken,
      expires_at: expiresAt,
      used: false
    });

    // Send reset email
    const appUrl = req.headers.get('origin') || new URL(req.url).origin;
    const resetUrl = `${appUrl}/ResetPassword?token=${resetToken}`;
    
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Nova AI - Reset Your Password',
      body: `Hi,\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\nThe Nova AI © team`
    });

    return Response.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});