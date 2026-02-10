import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, fullName, password, invitationId, token } = await req.json();

    if (!email || !fullName || !password || !invitationId || !token) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the invitation by token (more reliable than ID)
    const invitationRecord = await base44.asServiceRole.entities.InvitationToken.filter({
      token: token
    });

    if (!invitationRecord || invitationRecord.length === 0) {
      return Response.json({ success: false, error: 'Invitation invalide' }, { status: 400 });
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
      await base44.auth.register(email, password, fullName);
      console.log('User registered successfully');
    } catch (regErr) {
      console.error('Registration error:', regErr);
      if (regErr.message?.includes('already exists') || regErr.message?.includes('déjà')) {
        return Response.json({ success: false, error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
      }
      return Response.json({ success: false, error: 'Erreur lors de l\'enregistrement: ' + regErr.message }, { status: 400 });
    }

    // Create WorkspaceMember record
    await base44.asServiceRole.entities.WorkspaceMember.create({
      user_email: email,
      user_name: fullName,
      role: inv.role,
      workspace_id: inv.workspace_id,
      invited_by: inv.invited_by,
      invitation_status: 'accepted'
    });

    // Mark invitation as accepted
    await base44.asServiceRole.entities.InvitationToken.update(inv.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: 'Account created successfully',
      email: email
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});