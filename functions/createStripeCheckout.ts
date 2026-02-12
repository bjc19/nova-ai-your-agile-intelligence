import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PLANS = {
  starter: {
    name: "Starter",
    priceId: "price_1T04VYJwNnYYgxKr1rn4r7t7"
  },
  growth: {
    name: "Growth",
    priceId: "price_1T04VYJwNnYYgxKrq8HH7cw7"
  },
  pro: {
    name: "Pro",
    priceId: "price_1T04VYJwNnYYgxKrdGllbnqy"
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('[Stripe] Auth failed - no user');
      return Response.json({ error: 'Unauthorized', status: 'auth_failed' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !PLANS[plan]) {
      console.error('[Stripe] Invalid plan:', plan);
      return Response.json({ error: 'Invalid plan', status: 'invalid_plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const appUrl = Deno.env.get("APP_URL");

    if (!appUrl) {
      console.error('[Stripe] APP_URL not set');
      return Response.json({ error: 'APP_URL not configured', status: 'app_url_missing' }, { status: 500 });
    }

    // Create or get Stripe customer
    console.log('[Stripe] Creating/fetching customer for:', user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('[Stripe] Found existing customer:', customerId);
    } else {
      console.log('[Stripe] Creating new customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('[Stripe] Created customer:', customerId);
    }

    // Create checkout session
    console.log('[Stripe] Creating checkout session for plan:', plan, 'priceId:', planConfig.priceId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/plans`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        plan: plan,
        user_id: user.id,
        user_email: user.email
      }
    });

    console.log('[Stripe] Checkout session created:', session.id);
    return Response.json({ url: session.url, status: 'success' });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
});