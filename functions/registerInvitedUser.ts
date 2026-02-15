import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, fullName, password, invitationId, token } = await req.json();

    if (!email || !fullName || !password || !token) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the invitation by token
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

    // Register user using Base44's NATIVE registration (this triggers email verification code)
    try {
      console.log('Registering user via Base44 native auth:', email);
      await base44.auth.register({
        email: email,
        password: password,
        full_name: fullName
      });
      console.log('User registered - verification code sent to:', email);
    } catch (regErr) {
      console.error('Registration error:', regErr);
      if (regErr.message?.includes('already exists') || regErr.message?.includes('déjà')) {
        return Response.json({ success: false, error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
      }
      const errorMsg = regErr.data?.message || regErr.message || 'Unknown registration error';
      return Response.json({ success: false, error: 'Erreur lors de l\'enregistrement: ' + errorMsg }, { status: 400 });
    }

    // Mark invitation as pending_email_verification (will complete after email verification)
    await base44.asServiceRole.entities.InvitationToken.update(inv.id, {
      status: 'pending_email_verification'
    });

    // Store role and workspace info in sessionStorage for later use after email verification
    console.log('Invitation updated to pending_email_verification for:', email, 'with role:', inv.role, 'workspace:', inv.workspace_id);

    return Response.json({
      success: true,
      message: 'Registration initiated. Please verify your email.',
      email: email,
      requires_verification: true,
      role: inv.role,
      workspace_id: inv.workspace_id
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});