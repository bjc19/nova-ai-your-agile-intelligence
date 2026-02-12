import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { managerEmail } = await req.json();

    if (!managerEmail) {
      return Response.json({ error: 'missing_manager_email', message: 'Email gestionnaire requis' }, { status: 400 });
    }

    if (!user) {
      return Response.json({ error: 'not_authenticated', message: 'Non authentifié' }, { status: 401 });
    }

    // Vérif: l'utilisateur n'a pas déjà un abonnement
    const existingSub = await base44.entities.Subscription.filter({ user_email: user.email });
    if (existingSub.length > 0) {
      return Response.json({ error: 'already_has_subscription', message: 'Vous avez déjà un abonnement' }, { status: 400 });
    }

    // Vérif: pas de demande en cours
    const existingRequest = await base44.entities.JoinTeamRequest.filter({
      requester_email: user.email,
      status: 'pending'
    });

    if (existingRequest.length > 0) {
      return Response.json({ error: 'pending_request_exists', message: 'Vous avez déjà une demande en cours' }, { status: 400 });
    }

    // Chercher l'abonnement du gestionnaire
    const managerSub = await base44.asServiceRole.entities.Subscription.filter({
      user_email: managerEmail,
      status: 'active'
    });

    if (managerSub.length === 0) {
      return Response.json({ success: true, message: 'Demande enregistrée' }, { status: 200 });
    }

    const subscription = managerSub[0];

    // Créer la demande
    const joinRequest = await base44.entities.JoinTeamRequest.create({
      requester_email: user.email,
      requester_name: user.full_name,
      manager_email: managerEmail,
      subscription_id: subscription.id,
      status: 'pending'
    });

    // Envoyer un email au gestionnaire
    const appUrl = Deno.env.get("APP_URL") || "https://nova.app";
    const emailBody = `
Bonjour,

Un nouvel utilisateur demande à rejoindre votre équipe Nova.

Détails:
- Nom: ${user.full_name}
- Email: ${user.email}
- Date: ${new Date().toLocaleDateString('fr-FR')}

Accédez à votre tableau de bord pour approuver ou rejeter cette demande:
${appUrl}/teammanagement

Cordialement,
Nova
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: managerEmail,
        subject: `Nouvelle demande d'adhésion à votre équipe Nova`,
        body: emailBody,
        from_name: 'Nova'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue même si l'email échoue - la demande est créée
    }

    return Response.json({ success: true, message: 'Demande envoyée avec succès' });

  } catch (error) {
    console.error('joinTeamRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});