import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPlan } = await req.json();

    if (!newPlan || !['starter', 'growth', 'pro'].includes(newPlan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { 
      apiVersion: '2024-12-18.acacia' 
    });

    const PLAN_CONFIG = {
      starter: { 
        priceId: 'price_1Qv5C0LkI1sJJVs0YXBY3XLk', // $49/month
        maxUsers: 5,
        name: 'Starter'
      },
      growth: { 
        priceId: 'price_1Qv5C7LkI1sJJVs0OPaT7XrW', // $99/month
        maxUsers: 10,
        name: 'Growth'
      },
      pro: { 
        priceId: 'price_1Qv5CELkI1sJJVs0GEQQGjE6', // $199/month
        maxUsers: 25,
        name: 'Pro'
      }
    };

    const planConfig = PLAN_CONFIG[newPlan];
    const appUrl = Deno.env.get('APP_URL');

    // Check for existing subscription
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email,
      status: 'active'
    });

    if (subscriptions.length > 0) {
      // Upgrade/Downgrade existing subscription
      const existingSub = subscriptions[0];
      const subscription = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);
      
      // Update subscription with new price
      await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: planConfig.priceId
        }],
        metadata: {
          plan: newPlan,
          max_users: planConfig.maxUsers.toString()
        },
        proration_behavior: 'always_invoice' // Immediate proration
      });

      // Update TeamConfiguration
      const configs = await base44.asServiceRole.entities.TeamConfiguration.list();
      if (configs.length > 0) {
        await base44.asServiceRole.entities.TeamConfiguration.update(configs[0].id, {
          plan: newPlan
        });
      } else {
        await base44.asServiceRole.entities.TeamConfiguration.create({
          plan: newPlan
        });
      }

      // Update Subscription entity
      await base44.asServiceRole.entities.Subscription.update(existingSub.id, {
        plan: newPlan,
        max_users: planConfig.maxUsers
      });

      return Response.json({ 
        success: true,
        message: `Plan changé avec succès vers ${planConfig.name}`,
        requiresPayment: false
      });
    } else {
      // Create new checkout session for first subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price: planConfig.priceId,
          quantity: 1
        }],
        success_url: `${appUrl}/Settings?success=true&plan=${newPlan}`,
        cancel_url: `${appUrl}/Settings?canceled=true`,
        customer_email: user.email,
        metadata: {
          user_email: user.email,
          plan: newPlan,
          max_users: planConfig.maxUsers.toString(),
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });

      return Response.json({ 
        success: true,
        checkoutUrl: session.url,
        requiresPayment: true
      });
    }
  } catch (error) {
    console.error('Change plan error:', error);
    return Response.json({ 
      error: error.message || 'Erreur lors du changement de plan' 
    }, { status: 500 });
  }
});