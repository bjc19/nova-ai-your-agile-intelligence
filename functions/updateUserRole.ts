import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update other users' roles
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return Response.json({ error: 'userId and newRole required' }, { status: 400 });
    }

    // Update user role
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { role: newRole });

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});