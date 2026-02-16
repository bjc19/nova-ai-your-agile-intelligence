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
      return Response.json({ 
        success: false,
        error: 'Code de vérification invalide ou expiré' 
      }, { status: 400 });
    }

    // Mark user as verified in the User entity
    let userRole = 'user';
    let workspaceId = null;

    try {
      // Get the invitation to retrieve role and workspace_id
      const invitations = await base44.asServiceRole.entities.InvitationToken.filter({
        invitee_email: email,
        status: 'pending_email_verification'
      });

      if (invitations && invitations.length > 0) {
        userRole = invitations[0].role || 'user';
        workspaceId = invitations[0].workspace_id;
      }

      const users = await base44.asServiceRole.entities.User.filter({
        email: email
      });
      if (users && users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          verified_at: new Date().toISOString(),
          app_role: userRole,
          workspace_id: workspaceId
        });
        console.log(`User ${email} marked as verified with role: ${userRole}`);
      }
    } catch (updateError) {
      console.error('Error updating user verified_at:', updateError.message);
    }

    // Finalize the invitation (create workspace member, etc)
    try {
      await base44.asServiceRole.functions.invoke('finalizeInvitation', {
        email: email
      });
    } catch (finError) {
      console.error('Error finalizing invitation:', finError.message);
      // Don't fail verification - email is already verified
    }

    return Response.json({ 
      success: true,
      message: 'Email verified successfully',
      userRole: userRole
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});