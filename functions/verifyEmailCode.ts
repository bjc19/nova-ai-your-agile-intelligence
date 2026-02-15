import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    // Verify using Base44's native OTP system
    try {
      await base44.auth.verifyOtp({
        email: email,
        otpCode: code
      });
      console.log(`Email ${email} verified successfully via native OTP.`);
    } catch (otpError) {
      console.error(`Native OTP verification failed for ${email}:`, otpError.message);
      let errorMessage = 'Code de vérification invalide ou expiré';
      if (otpError.message && (otpError.message.includes('already') || otpError.message.includes('already used'))) {
        errorMessage = 'Ce code a déjà été utilisé';
      }
      return Response.json({ error: errorMessage }, { status: 400 });
    }

    // Now that email is verified, check if there's a pending invitation
    const pendingInvitations = await base44.asServiceRole.entities.InvitationToken.filter({
      invitee_email: email,
      status: 'pending_email_verification'
    });

    if (pendingInvitations && pendingInvitations.length > 0) {
      const inv = pendingInvitations[0];
      
      try {
        // Get the newly registered user
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

          // Get subscription of the inviter
          const subscription = await base44.asServiceRole.entities.Subscription.filter({
            user_email: inv.invited_by
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
      } catch (invError) {
        console.error('Error processing invitation for', email, ':', invError.message);
        // Don't fail the verification just because invitation processing failed
        // The email is already verified
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