import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if there's a pending invitation for this email
    const pendingInvitations = await base44.asServiceRole.entities.InvitationToken.filter({
      invitee_email: email,
      status: 'pending_email_verification'
    });

    if (!pendingInvitations || pendingInvitations.length === 0) {
      console.log('No pending invitation for:', email);
      return Response.json({ success: true, message: 'No invitation to finalize' });
    }

    const inv = pendingInvitations[0];
    
    // Get the newly registered user
    const users = await base44.asServiceRole.entities.User.filter({
      email: email
    });
    
    if (!users || users.length === 0) {
      console.error('User not found for email:', email);
      return Response.json({ error: 'User not found' }, { status: 400 });
    }

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

    console.log('Invitation finalized for:', email);
    return Response.json({ success: true, message: 'Invitation finalized' });
  } catch (error) {
    console.error('Finalization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});