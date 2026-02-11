import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { checkOnly = false } = await req.json();

    // Get client IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
               || req.headers.get('x-real-ip') 
               || 'unknown';

    // Hash IP for privacy (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedIP = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if record exists
    const existing = await base44.asServiceRole.entities.DemoAttempt.filter({ ip_address: hashedIP });

    const now = new Date();
    let record = existing[0];

    if (!record) {
      // Create new record (2 tries per 24h)
      if (!checkOnly) {
        record = await base44.asServiceRole.entities.DemoAttempt.create({
          ip_address: hashedIP,
          attempt_count: 1,
          last_reset: now.toISOString(),
          last_attempt: now.toISOString(),
          is_blocked: false
        });
      }
      return Response.json({
        allowed: true,
        remaining: checkOnly ? 2 : 1,
        blocked: false,
        message: 'Demo attempt allowed'
      });
    }

    // Check if 24h passed since last reset
    const lastReset = new Date(record.last_reset);
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      // Reset counter
      if (!checkOnly) {
        record = await base44.asServiceRole.entities.DemoAttempt.update(record.id, {
          attempt_count: 1,
          last_reset: now.toISOString(),
          last_attempt: now.toISOString(),
          is_blocked: false
        });
      }
      return Response.json({
        allowed: true,
        remaining: checkOnly ? 2 : 1,
        blocked: false,
        message: 'Demo attempt allowed (counter reset)'
      });
    }

    // Check if blocked or limit reached
    if (record.is_blocked || record.attempt_count >= 2) {
      const hoursRemaining = Math.ceil(24 - hoursSinceReset);
      return Response.json({
        allowed: false,
        remaining: 0,
        blocked: true,
        message: `Limite atteinte. Réessayez dans ${hoursRemaining}h ou choisissez un plan.`
      });
    }

    // Allow attempt and decrement
    if (!checkOnly) {
      const newCount = record.attempt_count + 1;
      record = await base44.asServiceRole.entities.DemoAttempt.update(record.id, {
        attempt_count: newCount,
        last_attempt: now.toISOString(),
        is_blocked: newCount >= 2
      });
    }

    return Response.json({
      allowed: true,
      remaining: 2 - (checkOnly ? record.attempt_count : record.attempt_count + 1),
      blocked: false,
      message: 'Demo attempt allowed'
    });

  } catch (error) {
    console.error('trackDemoAttempt error:', error);
    return Response.json({ 
      error: error.message,
      allowed: true,
      remaining: 2,
      blocked: false
    }, { status: 500 });
  }
});