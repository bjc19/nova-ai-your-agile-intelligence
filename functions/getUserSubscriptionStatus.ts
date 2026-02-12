import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const ownSubscription = await base44.entities.Subscription.filter({ user_email: user.email });
    
    if (ownSubscription.length > 0) {
      const sub = ownSubscription[0];
      return Response.json({
        hasAccess: true,
        type: 'owner',
        subscription: sub,
        canInvite: sub.is_admin
      });
    }

    const teamMembership = await base44.entities.TeamMember.filter({ user_email: user.email });
    
    if (teamMembership.length > 0) {
      const membership = teamMembership[0];
      const adminSub = await base44.asServiceRole.entities.Subscription.filter({ 
        user_email: membership.admin_email 
      });

      return Response.json({
        hasAccess: true,
        type: 'member',
        membership: membership,
        subscription: adminSub[0] || null,
        canInvite: membership.role === 'contributor'
      });
    }

    const pendingRequests = await base44.entities.JoinTeamRequest.filter({
      requester_email: user.email,
      status: 'pending'
    });

    return Response.json({
      hasAccess: false,
      type: 'none',
      pendingRequests: pendingRequests.length > 0
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});