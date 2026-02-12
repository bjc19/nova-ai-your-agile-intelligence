import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminEmail } = await req.json();

    if (!adminEmail) {
      return Response.json({ error: 'Email admin requis' }, { status: 400 });
    }

    const existingSub = await base44.entities.Subscription.filter({ user_email: user.email });
    if (existingSub.length > 0) {
      return Response.json({ error: 'Vous avez déjà un abonnement' }, { status: 400 });
    }

    const existingRequest = await base44.entities.JoinTeamRequest.filter({
      requester_email: user.email,
      status: 'pending'
    });

    if (existingRequest.length > 0) {
      return Response.json({ error: 'Vous avez déjà une demande en cours' }, { status: 400 });
    }

    const adminSub = await base44.asServiceRole.entities.Subscription.filter({
      user_email: adminEmail,
      is_admin: true,
      status: 'active'
    });

    if (adminSub.length === 0) {
      return Response.json({ success: true, message: 'Si l\'email fourni correspond à un administrateur, il recevra votre demande' });
    }

    const subscription = adminSub[0];

    await base44.entities.JoinTeamRequest.create({
      requester_email: user.email,
      requester_name: user.full_name,
      admin_email: adminEmail,
      subscription_id: subscription.id,
      status: 'pending'
    });

    return Response.json({ success: true, message: 'Demande envoyée avec succès' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});