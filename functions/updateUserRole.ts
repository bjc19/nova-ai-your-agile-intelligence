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

    // Super user (dev/creator) bypass - if user is admin, allow all
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only admins can update roles' }, { status: 403 });
    }

    // Update the User entity directly
    await base44.asServiceRole.entities.User.update(userId, { role: newRole });

    return Response.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});