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
    const { plan, email } = await req.json();

    if (!plan || !PLANS[plan]) {
      console.error('[Stripe Public] Invalid plan:', plan);
      return Response.json({ error: 'Invalid plan', status: 'invalid_plan' }, { status: 400 });
    }

    if (!email) {
      console.error('[Stripe Public] Email required for unauthenticated checkout');
      return Response.json({ error: 'Email required', status: 'email_missing' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const appUrl = Deno.env.get("APP_URL");

    if (!appUrl) {
      console.error('[Stripe Public] APP_URL not set');
      return Response.json({ error: 'APP_URL not configured', status: 'app_url_missing' }, { status: 500 });
    }

    console.log('[Stripe Public] Creating checkout session for unauthenticated user:', email);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${appUrl}/register?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&email=${encodeURIComponent(email)}`,
      cancel_url: `${appUrl}/home`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        plan: plan,
        user_email: email,
        checkout_type: 'public_signup'
      }
    });

    console.log('[Stripe Public] Checkout session created:', session.id);
    return Response.json({ url: session.url, status: 'success' });
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    console.error('[Stripe Public] Checkout error:', {
      message: errorMsg,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    });
    return Response.json(
      { 
        error: errorMsg,
        status: error.code || 'stripe_error',
        details: {
          type: error.type,
          code: error.code
        }
      },
      { status: error.statusCode || 500 }
    );
  }
});