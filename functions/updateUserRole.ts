import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Only admins and contributors can update roles' }, { status: 403 });
    }

    const { userId, userEmail, newRole } = await req.json();

    if (!userId || !userEmail || !newRole) {
      return Response.json({ error: 'User ID, email and role required' }, { status: 400 });
    }

    // Admins can update any role
    if (user.role === 'admin') {
      await base44.asServiceRole.entities.User.update(userId, { role: newRole });
      return Response.json({ success: true, message: 'Role updated' });
    }

    // Contributors can only update members they invited
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: userEmail });
    
    if (teamMembers.length === 0) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    const teamMember = teamMembers[0];
    if (teamMember.manager_email !== user.email) {
      return Response.json({ error: 'You can only update members you invited' }, { status: 403 });
    }

    // Update the User entity
    await base44.asServiceRole.entities.User.update(userId, { role: newRole });

    return Response.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});