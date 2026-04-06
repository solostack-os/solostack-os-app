import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the run belongs to this user's workspace
  const { data: run } = await admin
    .from("runs")
    .select("id")
    .eq("id", params.id)
    .eq("workspace_id", workspace.id)
    .single();

  if (!run) {
    return NextResponse.json({ error: "Credit not found" }, { status: 404 });
  }

  // Delete outputs first (FK), then the run
  await admin.from("outputs").delete().eq("run_id", run.id);
  await admin.from("runs").delete().eq("id", run.id);

  return NextResponse.json({ ok: true });
}
