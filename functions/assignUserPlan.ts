import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    // Vérifier que l'utilisateur est un administrateur
    if (currentUser?.app_role !== 'admin' && currentUser?.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { targetEmail, newPlan } = await req.json();

    // Valider le plan
    const validPlans = ['starter', 'growth', 'pro', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      return Response.json(
        { error: 'Invalid plan. Must be: starter, growth, pro, or enterprise' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur cible
    const targetUsers = await base44.entities.User.filter({ email: targetEmail });
    if (!targetUsers || targetUsers.length === 0) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mettre à jour le plan de l'utilisateur cible
    await base44.entities.User.update(targetUsers[0].id, { plan: newPlan });

    console.log(`Plan updated: ${targetEmail} -> ${newPlan}`);

    return Response.json({
      success: true,
      message: `Plan de l'utilisateur ${targetEmail} mis à jour vers ${newPlan}`,
      user: {
        email: targetEmail,
        plan: newPlan
      }
    });
  } catch (error) {
    console.error('Error assigning user plan:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});