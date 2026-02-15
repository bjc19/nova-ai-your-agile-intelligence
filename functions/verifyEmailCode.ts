import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    // Find verification code record
    const codeRecords = await base44.asServiceRole.entities.EmailVerificationCode.filter({
      email: email
    });

    if (codeRecords.length === 0) {
      return Response.json({ error: 'No verification code found' }, { status: 404 });
    }

    const codeRecord = codeRecords[0];

    // Check expiration
    if (new Date(codeRecord.expires_at) < new Date()) {
      return Response.json({ error: 'Code expired' }, { status: 400 });
    }

    // Check if already verified
    if (codeRecord.verified) {
      return Response.json({ error: 'Code already used' }, { status: 400 });
    }

    // Check code match
    if (codeRecord.code !== code) {
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Mark as verified
    await base44.asServiceRole.entities.EmailVerificationCode.update(codeRecord.id, {
      verified: true,
      verified_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});