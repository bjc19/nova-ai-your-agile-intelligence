import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Non authentifié',
        status: 'not_authenticated'
      }, { status: 401 });
    }

    const { adminEmail } = await req.json();

    if (!adminEmail) {
      return Response.json({ 
        success: false,
        error: 'Email admin requis',
        status: 'missing_admin_email'
      }, { status: 400 });
    }

    // Check existing subscription
    const existingSub = await base44.entities.Subscription.filter({ user_email: user.email });
    if (existingSub.length > 0) {
      return Response.json({ 
        success: false,
        error: 'Vous avez déjà un abonnement',
        status: 'already_subscribed'
      }, { status: 400 });
    }

    // Check existing pending request
    const existingRequest = await base44.entities.JoinTeamRequest.filter({
      requester_email: user.email,
      status: 'pending'
    });

    if (existingRequest.length > 0) {
      return Response.json({ 
        success: false,
        error: 'Vous avez déjà une demande en cours',
        status: 'pending_request_exists'
      }, { status: 400 });
    }

    // Get admin subscription
    const adminSub = await base44.asServiceRole.entities.Subscription.filter({
      user_email: adminEmail,
      is_admin: true,
      status: 'active'
    });

    if (adminSub.length === 0) {
      return Response.json({ 
        success: true,
        message: 'Si l\'email fourni correspond à un administrateur d\'équipe, il recevra votre demande.' 
      });
    }

    const subscription = adminSub[0];

    // Create request
    await base44.entities.JoinTeamRequest.create({
      requester_email: user.email,
      requester_name: user.full_name,
      admin_email: adminEmail,
      subscription_id: subscription.id,
      status: 'pending'
    });

    return Response.json({ 
      success: true,
      message: 'Demande envoyée avec succès',
      status: 'request_created'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message || 'Erreur serveur',
      status: 'server_error'
    }, { status: 500 });
  }
});