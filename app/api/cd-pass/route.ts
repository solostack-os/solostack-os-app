import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callClaudeStream } from "@/lib/ai/providers/anthropic";
import { runCDPass, type CDPassInput } from "@/lib/workflows/marketing/cd-pass";

/**
 * POST /api/cd-pass
 *
 * Pass 2 creative director review — Pro plan only, Claude Sonnet only.
 * Never deducts credits. Streams the reviewed copy back to the client.
 *
 * Body: { pass1_output: string, platform: string, register: string }
 */
export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const { pass1_output, platform, register } = body as Partial<CDPassInput>;

  if (!pass1_output?.trim()) {
    return NextResponse.json({ error: "pass1_output is required" }, { status: 400 });
  }

  // 3. Verify Pro plan
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_key")
    .eq("workspace_id", workspace.id)
    .single();

  if (subscription?.plan_key !== "pro") {
    return NextResponse.json(
      { error: "CD Pass is a Pro feature. Upgrade to unlock." },
      { status: 403 }
    );
  }

  // 4. Run CD Pass — Claude Sonnet only, no credit deduction
  const stream = runCDPass(
    {
      pass1_output: pass1_output!,
      platform: (platform as string) || "linkedin",
      register: (register as string) || "warm_human",
    },
    callClaudeStream
  );

  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta: string) => {
        try {
          controller.enqueue(encoder.encode(delta));
        } catch {
          // Client disconnected — ignore.
        }
      });

      stream
        .finalMessage()
        .catch((err) => {
          console.error("[api/cd-pass error]", err);
        })
        .finally(() => {
          try {
            controller.close();
          } catch {
            // Already closed.
          }
        });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
