import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    if (!adminEmail) {
      return Response.json({ 
        error: 'ADMIN_EMAIL not configured' 
      }, { status: 500 });
    }

    // Send test email using Core.SendEmail integration
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "Nova Test",
      to: adminEmail,
      subject: "Test Resend - Vérification",
      body: `
        <h2>Test de l'intégration Resend</h2>
        <p>Cet email confirme que l'intégration Resend fonctionne correctement.</p>
        <p>Date: ${new Date().toISOString()}</p>
      `
    });

    console.log('Email sent successfully:', result);

    return Response.json({ 
      success: true,
      message: 'Email de test envoyé avec succès',
      sentTo: adminEmail,
      result
    });
  } catch (error) {
    console.error('Resend test error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});