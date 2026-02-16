import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify user is admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch unresolved pattern detections
    const unresolvedPatterns = await base44.asServiceRole.entities.PatternDetection.filter({
      status: { $in: ['detected', 'acknowledged', 'in_progress'] }
    }, '-created_date', 100);

    if (unresolvedPatterns.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No unresolved patterns to remind about' 
      });
    }

    // Build email
    const subject = 'Rappel: Marquez les risques et blockers résolus';
    const body = `Bonjour,

Vous avez actuellement ${unresolvedPatterns.length} risques/blockers non marqués comme résolus dans Nova.

Marquer les résolutions est crucial pour:
✓ Améliorer la qualité des analyses prospectives
✓ Évaluer l'impact réel des solutions implémentées
✓ Construire un historique fiable pour les recommandations futures

Les patterns non résolus:
${unresolvedPatterns.slice(0, 5).map(p => `• ${p.pattern_name} (Confiance: ${Math.round(p.confidence_score * 100)}%)`).join('\n')}
${unresolvedPatterns.length > 5 ? `\n... et ${unresolvedPatterns.length - 5} autres` : ''}

Allez sur votre dashboard pour marquer les éléments résolus et profiter d'analyses plus pertinentes.

Cordialement,
Nova`;

    // Send email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: subject,
      body: body,
    });

    return Response.json({ 
      success: true, 
      remindersSent: 1,
      unresolvedCount: unresolvedPatterns.length
    });
  } catch (error) {
    console.error('Error sending resolution reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});