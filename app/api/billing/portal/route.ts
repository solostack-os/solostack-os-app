import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: workspace } = await admin
    .from("workspaces")
    .select("stripe_customer_id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    // billing_updated=1 tells Settings to re-fetch billing data on return,
    // so changes made in the portal (cancel, update card, etc.) are reflected
    // immediately without the user having to manually refresh.
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?billing_updated=1`,
  });

  return NextResponse.json({ url: session.url });
}
