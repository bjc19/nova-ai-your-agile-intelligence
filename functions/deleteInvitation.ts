import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      return Response.json({ error: 'ID invitation requis' }, { status: 400 });
    }

    await base44.asServiceRole.entities.InvitationToken.delete(invitationId);

    return Response.json({ success: true, message: 'Invitation supprimée' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});