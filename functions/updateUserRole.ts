import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, userEmail, newRole } = await req.json();

    if (!userId || !userEmail || !newRole) {
      return Response.json({ error: 'User ID, email and role required' }, { status: 400 });
    }

    // Check if current user can update this member
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: userEmail });
    if (teamMembers.length > 0) {
      const teamMember = teamMembers[0];
      
      // Check if current user can update this member (must be manager or admin)
      if (user.role !== 'admin' && teamMember.manager_email !== user.email) {
        return Response.json({ error: 'You can only update members you invited' }, { status: 403 });
      }
    }

    // Update the User entity directly so it persists
    await base44.asServiceRole.entities.User.update(userId, { role: newRole });

    return Response.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});