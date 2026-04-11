import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.message !== "string" || body.message.trim().length < 3) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").insert({
    email:   typeof body.email   === "string" ? body.email.trim().toLowerCase() : null,
    ref:     typeof body.ref     === "string" ? body.ref   : null,
    reason:  typeof body.reason  === "string" ? body.reason : null,
    message: body.message.trim(),
  });

  if (error) {
    console.error("[feedback] insert error:", error);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
