import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    // Find verification code record
    const codeRecords = await base44.asServiceRole.entities.EmailVerificationCode.filter({
      email: email
    });

    if (codeRecords.length === 0) {
      return Response.json({ error: 'No verification code found' }, { status: 404 });
    }

    const codeRecord = codeRecords[0];

    // Check expiration
    if (new Date(codeRecord.expires_at) < new Date()) {
      return Response.json({ error: 'Code expired' }, { status: 400 });
    }

    // Check if already verified
    if (codeRecord.verified) {
      return Response.json({ error: 'Code already used' }, { status: 400 });
    }

    // Check code match
    if (codeRecord.code !== code) {
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Mark as verified
    await base44.asServiceRole.entities.EmailVerificationCode.update(codeRecord.id, {
      verified: true,
      verified_at: new Date().toISOString()
    });

    // Check if this user has a pending invitation
    const pendingInvitations = await base44.asServiceRole.entities.InvitationToken.filter({
      invitee_email: email,
      status: 'pending_email_verification'
    });

    if (pendingInvitations && pendingInvitations.length > 0) {
      const inv = pendingInvitations[0];
      
      // Get subscription of the inviter
      const subscription = await base44.asServiceRole.entities.Subscription.filter({
        user_email: inv.invited_by
      });

      // Get user info
      const users = await base44.asServiceRole.entities.User.filter({
        email: email
      });
      
      if (users && users.length > 0) {
        const user = users[0];

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

        // Mark invitation as accepted
        await base44.asServiceRole.entities.InvitationToken.update(inv.id, {
          status: 'accepted',
          accepted_at: new Date().toISOString()
        });

        console.log('Invitation completed for:', email);
      }
    }

    return Response.json({ 
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});