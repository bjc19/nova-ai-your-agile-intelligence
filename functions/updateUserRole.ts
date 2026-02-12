import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, userEmail, newRole } = await req.json();

    if (!userEmail || !newRole) {
      return Response.json({ error: 'Email and role required' }, { status: 400 });
    }

    // Get the TeamMember record
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: userEmail });
    
    if (teamMembers.length === 0) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    const teamMember = teamMembers[0];
    
    // Super user (dev/creator) bypass - if user is admin and created the subscription, allow all
    const isDevMode = user.role === 'admin';
    
    // Check if current user can update this member (must be manager or admin or dev mode)
    if (!isDevMode && teamMember.manager_email !== user.email) {
      return Response.json({ error: 'You can only update members you invited' }, { status: 403 });
    }

    // Update the TeamMember entity
    await base44.asServiceRole.entities.TeamMember.update(teamMember.id, { role: newRole });

    return Response.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});