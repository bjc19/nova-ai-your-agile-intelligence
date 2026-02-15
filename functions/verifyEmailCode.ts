import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    console.log('Verifying email code for:', email);

    // Find the ActivationToken by email and code
    const activationTokens = await base44.asServiceRole.entities.ActivationToken.filter({
      email: email,
      token: code,
      used: false
    });

    if (activationTokens.length === 0) {
      console.error('No valid activation token found for email:', email, 'with code');
      return Response.json({ success: false, error: 'Code de vérification invalide ou expiré' }, { status: 404 });
    }

    const activationToken = activationTokens[0];

    // Check expiration
    if (new Date(activationToken.expires_at) < new Date()) {
      console.error('Activation token expired for:', email);
      return Response.json({ success: false, error: 'Code expiré' }, { status: 400 });
    }

    // Find the corresponding InvitationToken
    const invitationTokens = await base44.asServiceRole.entities.InvitationToken.filter({
      invitee_email: email,
      status: 'pending'
    });

    if (invitationTokens.length === 0) {
      console.error('No pending invitation found for:', email);
      return Response.json({ success: false, error: 'Invitation introuvable ou déjà acceptée' }, { status: 404 });
    }

    const inv = invitationTokens[0];

    // Get the user data
    const users = await base44.asServiceRole.entities.User.filter({
      email: email
    });

    if (users.length === 0) {
      console.error('User not found:', email);
      return Response.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const user = users[0];

    // Get subscription of the inviter
    const subscription = await base44.asServiceRole.entities.Subscription.filter({
      user_email: inv.invited_by
    });

    // Create WorkspaceMember record
    await base44.asServiceRole.entities.WorkspaceMember.create({
      user_email: email,
      user_name: user.full_name,
      role: inv.role,
      workspace_id: inv.workspace_id,
      invited_by: inv.invited_by,
      invitation_status: 'accepted'
    });

    // Create TeamMember record if subscription exists
    if (subscription && subscription.length > 0) {
      await base44.asServiceRole.entities.TeamMember.create({
        user_email: email,
        user_name: user.full_name,
        subscription_id: subscription[0].id,
        manager_email: inv.invited_by,
        role: inv.role,
        joined_at: new Date().toISOString()
      });
    }

    // Mark ActivationToken as used
    await base44.asServiceRole.entities.ActivationToken.update(activationToken.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    // Mark InvitationToken as accepted
    await base44.asServiceRole.entities.InvitationToken.update(inv.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

    console.log('Email verified successfully for:', email);

    return Response.json({
      success: true,
      message: 'Email vérifié avec succès. Bienvenue dans Nova AI!'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});