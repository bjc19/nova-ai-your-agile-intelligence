import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const PLAN_PRICES = {
  starter: { 
    priceId: 'price_1SzunGRUBY8YrkzQw1bsWlUi', 
    name: 'Starter', 
    max_users: 10 
  },
  growth: { 
    priceId: 'price_1SzunGRUBY8YrkzQwkXxGFFC', 
    name: 'Growth', 
    max_users: 25 
  },
  pro: { 
    priceId: 'price_1SzunGRUBY8YrkzQMtaYaPxP', 
    name: 'Pro', 
    max_users: 50 
  }
};

Deno.serve(async (req) => {
  try {
    const { plan } = await req.json();
    
    // Get user email from request body or session (for public app)
    let userEmail = null;
    if (req.body) {
      const body = await req.json();
      userEmail = body.userEmail;
    }

    const base44 = createClientFromRequest(req);
    
    // Try to get authenticated user first
    try {
      const user = await base44.auth.me();
      if (user) {
        userEmail = user.email;
      }
    } catch (e) {
      // User not authenticated - will use userEmail from body
    }

    if (!userEmail) {
      return Response.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!plan || !PLAN_PRICES[plan]) {
      return Response.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const existingSub = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
    if (existingSub.length > 0) {
      return Response.json({ error: 'Vous avez déjà un abonnement actif' }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe non configuré' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

    const appUrl = Deno.env.get('APP_URL') || 'https://novagile.ca';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: PLAN_PRICES[plan].priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${appUrl}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Dashboard`,
      customer_email: userEmail,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: userEmail,
        plan: plan,
        max_users: PLAN_PRICES[plan].max_users.toString()
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});