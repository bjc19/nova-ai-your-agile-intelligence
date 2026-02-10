import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, fullName, password, invitationId, token } = await req.json();

    if (!email || !fullName || !password || !invitationId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate invitation token still exists and is valid
    const invitation = await base44.asServiceRole.entities.InvitationToken.filter({
      id: invitationId,
      token: token,
      status: 'pending'
    });

    if (!invitation || invitation.length === 0) {
      return Response.json({ error: 'Invalid invitation' }, { status: 400 });
    }

    const invitationRecord = invitation[0];

    // Check expiration
    if (new Date(invitationRecord.expires_at) < new Date()) {
      await base44.asServiceRole.entities.InvitationToken.update(invitationRecord.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Register user using Base44's registration
    await base44.auth.register(email, password, fullName);

    // Create WorkspaceMember record
    await base44.asServiceRole.entities.WorkspaceMember.create({
      user_email: email,
      user_name: fullName,
      role: invitationRecord.role,
      workspace_id: invitationRecord.workspace_id,
      invited_by: invitationRecord.invited_by,
      invitation_status: 'accepted'
    });

    // Mark invitation as accepted
    await base44.asServiceRole.entities.InvitationToken.update(invitationRecord.id, {
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