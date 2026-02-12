import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const PLAN_PRICES = {
  starter: { 
    priceId: 'price_1SztiwRUBY8YrkzQkZKFwQ71', 
    name: 'Starter', 
    max_users: 10 
  },
  growth: { 
    priceId: 'price_1SztiwRUBY8YrkzQZzlhEHxF', 
    name: 'Growth', 
    max_users: 25 
  },
  pro: { 
    priceId: 'price_1SztiwRUBY8YrkzQPQZ9Sqkb', 
    name: 'Pro', 
    max_users: 50 
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return Response.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const existingSub = await base44.entities.Subscription.filter({ user_email: user.email });
    if (existingSub.length > 0) {
      return Response.json({ error: 'Vous avez déjà un abonnement actif' }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

    const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://novagile.ca';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: PLAN_PRICES[plan].priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${appUrl}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Dashboard`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
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