import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteeEmail, inviteRole } = await req.json();

    if (!inviteeEmail) {
      return Response.json({ error: 'Missing inviteeEmail' }, { status: 400 });
    }

    // 1. ✅ VÉRIFIER SI L'UTILISATEUR EXISTE DÉJÀ
    const existingUsers = await base44.asServiceRole.entities.User.filter({
      email: inviteeEmail
    });

    if (existingUsers && existingUsers.length > 0) {
      // L'utilisateur existe déjà - pas de token d'invitation, juste un email d'info
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'noreply@novagile.ca',
          to: inviteeEmail,
          subject: 'Vous avez été ajouté à Nova AI',
          html: `<p>Bonjour,</p><p>${user.full_name || user.email} vous a ajouté à son équipe Nova AI.</p><p>Connectez-vous à votre compte pour accéder à Nova.</p>`
        })
      });

      if (!emailResponse.ok) {
        console.error('Email notification failed:', emailResponse.statusText);
      }

      return Response.json({ 
        success: true, 
        message: 'Utilisateur existant ajouté à l\'équipe',
        isExistingUser: true
      });
    }

    // 2. ✅ GÉNÉRER LE TOKEN D'INVITATION UNIQUE
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 3. ✅ CRÉER L'ENREGISTREMENT D'INVITATION
    await base44.asServiceRole.entities.InvitationToken.create({
      token,
      invitee_email: inviteeEmail,
      invited_by: user.email,
      workspace_id: 'default',
      role: inviteRole || 'user',
      status: 'pending',
      expires_at: expiresAt
    });

    // 4. ✅ ENVOYER L'EMAIL VIA L'INTÉGRATION BASE44 NATIVE
    try {
      await base44.integrations.Core.SendEmail({
        to: inviteeEmail,
        subject: '🎉 Vous avez été invité à rejoindre Nova AI - Agile Intelligence',
        body: `Bonjour,\n\n${user.full_name || user.email} vous a invité à rejoindre Nova AI, votre expert Agile propulsé par l'intelligence artificielle.\n\nAcceptez l'invitation : https://www.novagile.ca/AcceptInvitation?token=${token}\n\nCe lien d'invitation expire dans 7 jours.\n\nSi vous n'avez pas demandé cette invitation, ignorez cet email.`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      throw new Error(`Erreur lors de l'envoi de l'email: ${emailError.message}`);
    }

    return Response.json({ 
      success: true, 
      message: 'Invitation sent successfully', 
      token,
      isExistingUser: false
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});