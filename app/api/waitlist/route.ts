import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamail.info",
  "grr.la",
  "dispostable.com",
  "temp-mail.org",
]);

const BLOCKED_WORDS = ["fuck", "shit", "ass", "dick", "cunt", "bitch", "nigger", "faggot"];

// In-memory rate limiting: IP -> array of timestamps
const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  rateMap.set(ip, timestamps);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  return false;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Turnstile verification — first check
  const turnstileToken = body.turnstileToken;
  if (!turnstileToken || typeof turnstileToken !== "string") {
    return NextResponse.json({ error: "Bot verification failed. Please try again." }, { status: 400 });
  }
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: turnstileToken,
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return NextResponse.json({ error: "Bot verification failed. Please try again." }, { status: 400 });
  }

  // Honeypot — fake success for bots
  if (body.website) {
    return NextResponse.json({ message: "success" });
  }

  const email = body.email.trim().toLowerCase().replace(/<[^>]*>/g, "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please use a valid email address." }, { status: 400 });
  }

  const domain = email.split("@")[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json({ error: "Please use a non-disposable email address." }, { status: 400 });
  }

  const localPart = email.split("@")[0];
  if (BLOCKED_WORDS.some((w) => localPart.includes(w))) {
    return NextResponse.json({ error: "Please use a valid email address." }, { status: 400 });
  }

  // DNS MX record verification
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return NextResponse.json({ error: "This email domain doesn't appear to accept emails. Please use a valid email address." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "This email domain doesn't appear to exist. Please use a valid email address." }, { status: 400 });
  }

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "duplicate" });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Send confirmation email (non-blocking)
  try {
    await resend.emails.send({
      from: "SoloStack <noreply@solostack.io>",
      replyTo: "SoloStack Support <support@solostack.io>",
      to: email,
      subject: "You're on the SoloStack waitlist! \ud83c\udf89",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">SoloStack OS</h1>
    <p style="color:#6c8cff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 32px;">Beta Waitlist</p>
    <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">You're on the list!</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Thanks for joining the SoloStack OS waitlist. You're one of the first to get access to the AI workspace built for freelancers, consultants, and small service teams.
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      We'll reach out when it's your turn to get early access and founding member pricing.
    </p>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;margin-top:32px;">
      <p style="color:#475569;font-size:13px;margin:0;">&copy; 2026 SoloStack OS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (emailErr) {
    console.error("Failed to send waitlist confirmation email:", emailErr);
  }

  return NextResponse.json({ message: "success" });
}
