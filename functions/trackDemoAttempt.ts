import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'crypto';

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const ip = getClientIP(req);
    const hashedIP = hashIP(ip);
    
    // Check if attempt record exists
    let attempt = await base44.entities.DemoAttempt.filter(
      { ip_address: hashedIP },
      '-created_date',
      1
    );
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (attempt.length === 0) {
      // First attempt - create new record with 1 remaining (user is about to use 1)
      const newAttempt = await base44.entities.DemoAttempt.create({
        ip_address: hashedIP,
        attempt_count: 1,
        last_reset: now.toISOString(),
        last_attempt: now.toISOString(),
        is_blocked: false
      });
      return Response.json({ 
        allowed: true, 
        remaining: 1, 
        message: 'Demo attempt recorded. 1 remaining in 24h window'
      });
    }
    
    attempt = attempt[0];
    const lastReset = new Date(attempt.last_reset);
    
    // Reset counter if 24h has passed
    if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
      await base44.entities.DemoAttempt.update(attempt.id, {
        attempt_count: 1,
        last_reset: now.toISOString(),
        last_attempt: now.toISOString(),
        is_blocked: false
      });
      return Response.json({ 
        allowed: true, 
        remaining: 1, 
        message: 'Counter reset - Demo attempt recorded. 1 remaining in 24h window'
      });
    }
    
    // Check if blocked
    if (attempt.is_blocked) {
      return Response.json({ 
        allowed: false, 
        remaining: 0, 
        message: 'This IP is temporarily blocked. Try again in 24 hours.',
        blocked: true
      }, { status: 429 });
    }
    
    // Check if attempts exhausted
    if (attempt.attempt_count <= 0) {
      await base44.entities.DemoAttempt.update(attempt.id, {
        is_blocked: true
      });
      return Response.json({ 
        allowed: false, 
        remaining: 0, 
        message: 'Demo attempts exhausted for this IP. Try again in 24 hours.',
        blocked: true
      }, { status: 429 });
    }
    
    // Decrement attempt count
    const newCount = attempt.attempt_count - 1;
    await base44.entities.DemoAttempt.update(attempt.id, {
      attempt_count: newCount,
      last_attempt: now.toISOString()
    });
    
    return Response.json({ 
      allowed: true, 
      remaining: newCount, 
      message: `Demo attempt recorded. ${newCount} remaining in 24h window`
    });
    
  } catch (error) {
    console.error('Demo attempt tracking error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});