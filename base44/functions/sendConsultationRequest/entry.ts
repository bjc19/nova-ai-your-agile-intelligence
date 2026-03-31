import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend@4.0.0';

// Simple in-memory rate limiter (per IP, max 3 requests per 10 minutes)
const rateLimitMap = new Map();
const RATE_LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, firstRequest: now };

  if (now - entry.firstRequest > WINDOW_MS) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, email, company, message, honeypot } = body;

    // Anti-spam: honeypot check
    if (honeypot && honeypot.trim() !== "") {
      console.warn("Spam detected via honeypot from IP:", ip);
      return Response.json({ success: true }); // Silently succeed to not tip off bots
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return Response.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || !isValidEmail(email.trim())) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }

    // Sanitize inputs (no HTML)
    const safeName = name.trim().substring(0, 100).replace(/[<>]/g, "");
    const safeEmail = email.trim().substring(0, 200);
    const safeCompany = (company || "").trim().substring(0, 100).replace(/[<>]/g, "");
    const safeMessage = (message || "").trim().substring(0, 1000).replace(/[<>]/g, "");

    const emailBody = `
Nouvelle demande de consultation reçue via Novagile AI

👤 Nom : ${safeName}
📧 Email : ${safeEmail}
🏢 Entreprise : ${safeCompany || "Non renseignée"}

💬 Message :
${safeMessage || "Aucun message fourni."}

---
Reçu le : ${new Date().toLocaleString("fr-CA", { timeZone: "America/Toronto" })}
IP source : ${ip}
    `.trim();

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { error: resendError } = await resend.emails.send({
      from: "Novagile AI <no-reply@novagile.ca>",
      to: ["contact@novagile.ca"],
      subject: `Nouvelle demande de consultation de ${safeName} (${safeEmail})`,
      text: emailBody,
    });
    if (resendError) {
      console.error("Resend error:", resendError);
      throw new Error(resendError.message);
    }

    console.log(`Consultation request sent from ${safeEmail} (${safeName})`);
    return Response.json({ success: true });

  } catch (error) {
    console.error("Error sending consultation request:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});