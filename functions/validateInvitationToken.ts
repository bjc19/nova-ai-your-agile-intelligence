import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    // Find invitation token
    const invitations = await base44.asServiceRole.entities.InvitationToken.filter({
      token: token
    });

    if (!invitations || invitations.length === 0) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    const invitation = invitations[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await base44.asServiceRole.entities.InvitationToken.update(invitation.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Token expired' }, { status: 400 });
    }

    // Check if already used
    if (invitation.status === 'accepted') {
      return Response.json({ error: 'Invitation already used' }, { status: 400 });
    }

    if (invitation.status === 'rejected') {
      return Response.json({ error: 'Invitation rejected' }, { status: 400 });
    }

    return Response.json({
      valid: true,
      inviteeEmail: invitation.invitee_email,
      role: invitation.role,
      workspace_id: invitation.workspace_id,
      invitationId: invitation.id
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});