import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteeEmail, senderEmail, senderName } = await req.json();

    if (!inviteeEmail || !senderEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send invitation email
    await base44.integrations.Core.SendEmail({
      to: inviteeEmail,
      subject: 'Rejoignez Nova - Agile Intelligence',
      body: `Hi ${inviteeEmail},\n\n${senderName || senderEmail} vous a invité à rejoindre Nova AI - Agile Intelligence. Nous sommes ravis de vous accueillir!\n\n- À propos de Nova\nNova est un système d'intelligence organisationnelle agile qui aide les équipes à identifier les dysfonctionnements, anticiper les risques et transformer les processus en insights actionnables. Il permet aux organisations d'accélérer la création de valeur, d'augmenter la productivité, de réduire les coûts liés aux erreurs et de prendre des décisions plus intelligentes en temps réel.\n\nPrêt à commencer? Connectez-vous à Nova pour accepter votre invitation et commencer à collaborer avec votre équipe.\n\nRejoignez Nova - Agile Intelligence maintenant!\n\nCordialement,\nL'équipe Nova`,
      from_name: 'Nova AI - Agile Intelligence'
    });

    return Response.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});