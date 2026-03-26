import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { Resend } from 'npm:resend@4.0.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // Update TeamConfiguration with new plan
      const configs = await base44.asServiceRole.entities.TeamConfiguration.filter({});
      const planValue = session.metadata.plan;
      
      if (configs.length > 0) {
        await base44.asServiceRole.entities.TeamConfiguration.update(configs[0].id, {
          plan: planValue
        });
      } else {
        await base44.asServiceRole.entities.TeamConfiguration.create({
          plan: planValue
        });
      }

      await base44.asServiceRole.entities.Subscription.create({
        user_email: session.metadata.user_email,
        plan: planValue,
        status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        max_users: parseInt(session.metadata.max_users),
        is_admin: true
      });

      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const planNames = {starter: 'Starter', growth: 'Growth', pro: 'Pro'};

      await resend.emails.send({
        from: 'Nova AI <contact@novagile.ca>',
        to: session.metadata.user_email,
        subject: `🎉 Bienvenue dans Nova ${planNames[session.metadata.plan]}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✨ Bienvenue dans Nova AI</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px;">
              <p style="font-size: 16px; color: #334155;">Votre abonnement ${planNames[session.metadata.plan]} est maintenant actif !</p>
              <p style="font-size: 16px; color: #334155;">Vous pouvez inviter jusqu'à ${session.metadata.max_users} utilisateurs dans votre équipe.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('APP_URL')}/Dashboard" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  🚀 Accéder au Dashboard
                </a>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">© 2026 Nova AI - Tous droits réservés</p>
            </div>
          </div>
        `
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: subscription.id
      });

      if (subs.length > 0) {
        const newPlan = subscription.metadata?.plan;
        const maxUsers = subscription.metadata?.max_users;
        
        const updateData = {
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        };

        if (newPlan) {
          updateData.plan = newPlan;
          updateData.max_users = parseInt(maxUsers);

          // Update TeamConfiguration
          const configs = await base44.asServiceRole.entities.TeamConfiguration.filter({});
          if (configs.length > 0) {
            await base44.asServiceRole.entities.TeamConfiguration.update(configs[0].id, {
              plan: newPlan
            });
          }
        }

        await base44.asServiceRole.entities.Subscription.update(subs[0].id, updateData);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: subscription.id
      });

      if (subs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'cancelled'
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});