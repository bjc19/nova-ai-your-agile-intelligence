import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLAN_DETAILS = {
  starter: {
    name: "Starter",
    users: 5,
    features: ["Analyses illimitées", "Dashboard basique", "Support email"]
  },
  growth: {
    name: "Growth", 
    users: 15,
    features: ["Tout Starter", "Intégrations Slack/Jira", "Rapports hebdomadaires", "Support prioritaire"]
  },
  pro: {
    name: "Pro",
    users: 50,
    features: ["Tout Growth", "Analyses prédictives", "API access", "Workshops Nova", "Support dédié"]
  },
  enterprise: {
    name: "Enterprise",
    users: "Illimité",
    features: ["Tout Pro", "Déploiement on-premise", "SLA garantis", "Formations équipe", "Account manager"]
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { clientId, newPlan } = await req.json();
    
    if (!clientId || !newPlan) {
      return Response.json({ error: 'Missing clientId or newPlan' }, { status: 400 });
    }

    // Récupérer le client
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    if (clients.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }
    const client = clients[0];
    const oldPlan = client.plan;

    // Mettre à jour le plan
    await base44.asServiceRole.entities.Client.update(clientId, {
      plan: newPlan
    });

    // Envoyer email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const planInfo = PLAN_DETAILS[newPlan];
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .plan-badge { display: inline-block; background: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .feature-item:last-child { border-bottom: none; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Votre plan Nova a été mis à jour</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>${client.name}</strong>,</p>
      
      <p>Votre plan Nova a été ${oldPlan < newPlan ? 'amélioré' : 'modifié'} :</p>
      
      <p style="text-align: center; margin: 20px 0;">
        <span style="color: #94a3b8;">${PLAN_DETAILS[oldPlan].name}</span>
        →
        <span class="plan-badge">${planInfo.name}</span>
      </p>

      <div class="features">
        <h3 style="margin-top: 0;">🎯 Votre nouveau plan inclut :</h3>
        <div style="margin: 15px 0;">
          <strong>👥 Utilisateurs :</strong> ${planInfo.users}
        </div>
        ${planInfo.features.map(f => `<div class="feature-item">✓ ${f}</div>`).join('')}
      </div>

      <p><strong>📌 Prochaines étapes :</strong></p>
      <ul>
        <li>Rafraîchissez votre navigateur pour voir les changements</li>
        <li>Les nouvelles fonctionnalités sont disponibles immédiatement</li>
        <li>Votre équipe peut maintenant profiter de toutes les capacités du plan ${planInfo.name}</li>
      </ul>

      <p>Des questions ? Contactez-nous à <a href="mailto:support@novagile.ca">support@novagile.ca</a></p>

      <div class="footer">
        <p>Nova - Votre expert IA Agile</p>
        <p>© 2026 Nova. Tous droits réservés.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Nova <no-reply@novagile.ca>',
        to: client.email,
        subject: `✨ Votre plan Nova a été mis à jour vers ${planInfo.name}`,
        html: emailHtml
      })
    });

    if (!resendResponse.ok) {
      console.error('Resend error:', await resendResponse.text());
    }

    // Log dans audit
    await base44.asServiceRole.entities.AuditLog.create({
      action: `Plan changé: ${oldPlan} → ${newPlan}`,
      entity_type: 'Client',
      entity_id: clientId,
      performed_by: user.email
    });

    return Response.json({ 
      success: true,
      oldPlan,
      newPlan: planInfo.name 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});