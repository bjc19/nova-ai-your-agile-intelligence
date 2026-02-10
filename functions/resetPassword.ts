import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Get request body
    let token, newPassword;
    try {
      const body = await req.json();
      token = body.token;
      newPassword = body.newPassword;
    } catch (e) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Create client with proper headers
    const base44 = createClientFromRequest(req);

    if (!token || !newPassword) {
      return Response.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find reset token
    const resetRecords = await base44.asServiceRole.entities.PasswordReset.filter({
      token: token,
      used: false
    });

    if (!resetRecords || resetRecords.length === 0) {
      return Response.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const resetRecord = resetRecords[0];

    // Check expiration
    if (new Date(resetRecord.expires_at) < new Date()) {
      return Response.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // Mark reset token as used
    await base44.asServiceRole.entities.PasswordReset.update(resetRecord.id, {
      used: true
    });

    return Response.json({ 
      success: true, 
      message: 'Token validated - user can now reset password',
      email: resetRecord.email
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});