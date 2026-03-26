import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteeEmail, inviteRole } = await req.json();

    if (!inviteeEmail) {
      return Response.json({ error: 'Missing inviteeEmail' }, { status: 400 });
    }

    // Invite user to the app with Base44's built-in invitation system
    // This will send them an automatic invitation email
    await base44.users.inviteUser(inviteeEmail, inviteRole || 'user');

    return Response.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});