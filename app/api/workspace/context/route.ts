import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (wsError || !workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { main_goal, business_type, offer, target_audience, tone } = body;

  // Upsert workspace context (primary key = workspace_id)
  const { error: ctxError } = await supabase
    .from("workspace_context")
    .upsert(
      {
        workspace_id: workspace.id,
        main_goal,
        business_type,
        offer,
        target_audience,
        tone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    );

  if (ctxError) {
    return NextResponse.json(
      { error: "Failed to save context", detail: ctxError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
