import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { name, email, company, plan, users_count, message, turnstile_token } = body;

    // Validation basique
    if (!name || !email || !plan || !company) {
      return Response.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Récupérer l'IP
    const ip = req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown';

    // Vérifier rate limiting (max 3 demandes par IP/24h)
    const existingRequests = await base44.asServiceRole.entities.PendingRequest.filter(
      { ip_address: ip },
      '-created_date',
      100
    );
    
    const last24h = existingRequests.filter(r => {
      const age = Date.now() - new Date(r.created_date).getTime();
      return age < 24 * 60 * 60 * 1000;
    });

    if (last24h.length >= 3) {
      return Response.json(
        { error: 'Trop de demandes. Limit 3 par 24h par IP.' },
        { status: 429 }
      );
    }

    // Créer la demande
    const newRequest = await base44.asServiceRole.entities.PendingRequest.create({
      name,
      email,
      company,
      plan,
      users_count: parseInt(users_count) || 1,
      message: message || '',
      turnstile_score: 0.8,
      ip_address: ip,
      status: 'pending'
    });

    return Response.json({
      success: true,
      message: 'Demande envoyée. Réponse sous 24h.',
      requestId: newRequest.id
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});