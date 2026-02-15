import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: 'Email and code required' }, { status: 400 });
    }

    // Verify using Base44's native OTP system
    try {
      await base44.auth.verifyOtp({
        email: email,
        otpCode: code
      });
      console.log(`Email ${email} verified successfully via native OTP.`);
    } catch (otpError) {
      console.error(`Native OTP verification failed for ${email}:`, otpError.message);
      return Response.json({ 
        success: false,
        error: 'Code de vérification invalide ou expiré' 
      }, { status: 400 });
    }

    // Finalize the invitation (create workspace member, etc)
    try {
      await base44.functions.invoke('finalizeInvitation', {
        email: email
      });
    } catch (finError) {
      console.error('Error finalizing invitation:', finError.message);
      // Don't fail verification - email is already verified
    }

    return Response.json({ 
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});