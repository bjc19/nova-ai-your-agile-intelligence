import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, fullName, password, invitationId, token } = await req.json();

    if (!email || !fullName || !password || !token) {
      return Response.json({ error: 'Missing required fields', received: { email, fullName, password: !!password, token: !!token, invitationId } }, { status: 400 });
    }

    // Find the invitation by token (more reliable than ID)
    const invitationRecord = await base44.asServiceRole.entities.InvitationToken.filter({
      token: token
    });

    if (!invitationRecord || invitationRecord.length === 0) {
      return Response.json({ success: false, error: 'Invitation invalide ou token inexistant' }, { status: 400 });
    }

    const inv = invitationRecord[0];

    // Check status
    if (inv.status !== 'pending') {
      return Response.json({ success: false, error: 'Invitation invalide ou déjà utilisée' }, { status: 400 });
    }

    // Verify email matches
    if (inv.invitee_email !== email) {
      return Response.json({ success: false, error: 'Email ne correspond pas à l\'invitation' }, { status: 400 });
    }

    // Check expiration
    if (new Date(inv.expires_at) < new Date()) {
      await base44.asServiceRole.entities.InvitationToken.update(inv.id, {
        status: 'expired'
      });
      return Response.json({ success: false, error: 'Lien expiré' }, { status: 400 });
    }

    // Register user using Base44's registration
    try {
      console.log('Attempting to register user:', email);
      await base44.auth.register({
        email: email,
        password: password,
        full_name: fullName
      });
      console.log('User registered successfully');

      // Generate a unique activation code for email verification
      const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Create ActivationToken record
      await base44.asServiceRole.entities.ActivationToken.create({
        email: email,
        token: activationCode,
        used: false,
        expires_at: activationExpiresAt
      });

      // Send verification email with the code
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const resend = new Resend(resendApiKey);
      const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://novagile.ca';

      await resend.emails.send({
        from: 'Nova AI <noreply@novagile.ca>',
        to: email,
        subject: 'Vérifiez votre adresse email pour Nova AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">✨ Vérification d'email Nova AI</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">Bonjour ${fullName},</p>
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">Veuillez vérifier votre adresse email en utilisant le code ci-dessous sur la page de vérification.</p>
              <div style="background: white; border: 2px solid #e2e8f0; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Votre code de vérification:</p>
                <p style="margin: 15px 0 0 0; color: #1e293b; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${activationCode}</p>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Ce code expirera dans 24 heures. Si vous n'avez pas demandé cette vérification, veuillez ignorer cet email.</p>
            </div>
          </div>
        `
      });

      console.log('Verification email sent to:', email);
    } catch (regErr) {
      console.error('Registration error:', regErr);
      if (regErr.message?.includes('already exists') || regErr.message?.includes('déjà')) {
        return Response.json({ success: false, error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
      }
      const errorMsg = regErr.data?.message || regErr.message || 'Unknown registration error';
      return Response.json({ success: false, error: 'Erreur lors de l\'enregistrement: ' + errorMsg }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Un email de vérification a été envoyé. Veuillez vérifier votre email pour terminer votre inscription.',
      email: email,
      invitationToken: inv.token
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});