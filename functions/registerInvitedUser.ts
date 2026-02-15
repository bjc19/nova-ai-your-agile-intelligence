import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

      // Mark the user as verified immediately (bypass the 6-digit code requirement)
        // This prevents the verification email from becoming mandatory for invited users
        const newUsers = await base44.asServiceRole.entities.User.filter({
          email: email
        });

        if (newUsers && newUsers.length > 0) {
          const newUser = newUsers[0];
          // Mark OTP as already verified to bypass email verification screen
          const verificationCode = await base44.asServiceRole.entities.EmailVerificationCode.filter({
            email: email,
            verified: false
          });
          
          if (verificationCode && verificationCode.length > 0) {
            await base44.asServiceRole.entities.EmailVerificationCode.update(verificationCode[0].id, {
              verified: true,
              verified_at: new Date().toISOString()
            });
          }
          
          console.log('User verification bypassed for invited user:', email);
        }
    } catch (regErr) {
      console.error('Registration error:', regErr);
      if (regErr.message?.includes('already exists') || regErr.message?.includes('déjà')) {
        return Response.json({ success: false, error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
      }
      const errorMsg = regErr.data?.message || regErr.message || 'Unknown registration error';
      return Response.json({ success: false, error: 'Erreur lors de l\'enregistrement: ' + errorMsg }, { status: 400 });
    }

    // Get subscription of the inviter
    const subscription = await base44.asServiceRole.entities.Subscription.filter({
     user_email: inv.invited_by
    });

    // Create WorkspaceMember record
    await base44.asServiceRole.entities.WorkspaceMember.create({
     user_email: email,
     user_name: fullName,
     role: inv.role,
     workspace_id: inv.workspace_id,
     invited_by: inv.invited_by,
     invitation_status: 'accepted'
    });

    // Create TeamMember record
    if (subscription && subscription.length > 0) {
     await base44.asServiceRole.entities.TeamMember.create({
       user_email: email,
       user_name: fullName,
       subscription_id: subscription[0].id,
       manager_email: inv.invited_by,
       role: inv.role,
       joined_at: new Date().toISOString()
     });
    }

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