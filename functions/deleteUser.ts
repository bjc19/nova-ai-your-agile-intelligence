import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'contributor')) {
      return Response.json({ error: 'Only admins and contributors can delete members' }, { status: 403 });
    }

    const { userId, userEmail } = await req.json();

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // Admins can delete anyone
    if (user.role === 'admin') {
      await base44.asServiceRole.entities.User.delete(userId);
      return Response.json({ success: true, message: 'User deleted' });
    }

    // Contributors can only delete members they invited
    if (userEmail) {
      const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: userEmail });
      
      if (teamMembers.length === 0) {
        return Response.json({ error: 'Member not found' }, { status: 404 });
      }

      const teamMember = teamMembers[0];
      if (teamMember.manager_email !== user.email) {
        return Response.json({ error: 'You can only delete members you invited' }, { status: 403 });
      }
    }

    await base44.asServiceRole.entities.User.delete(userId);

    return Response.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});