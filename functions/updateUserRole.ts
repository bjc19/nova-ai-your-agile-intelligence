import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return Response.json({ error: 'User ID and role required' }, { status: 400 });
    }

    // Update TeamMember role instead
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: user.email });
    if (teamMembers.length > 0) {
      await base44.asServiceRole.entities.TeamMember.update(teamMembers[0].id, { role: newRole });
    }

    return Response.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});