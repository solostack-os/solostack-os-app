import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  ExportTemplate,
  type ExportWorkspaceData,
} from "@/components/pdf/export-template";

// React-PDF needs Node APIs (Buffer, stream, native modules), so this route
// must run on the Node runtime rather than edge.
export const runtime = "nodejs";

interface ExportBody {
  content?: string;
  content_type?: string;
}

/**
 * Build a safe filename from a human-ish content type, e.g.
 *   "cold_email" → "cold-email-2026-04-08.pdf"
 */
function buildFilename(contentType: string): string {
  const slug = (contentType || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "document";
  const today = new Date().toISOString().slice(0, 10);
  return `${slug}-${today}.pdf`;
}

export async function POST(request: Request) {
  // 1. Auth
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Body
  let body: ExportBody;
  try {
    body = (await request.json()) as ExportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = (body.content ?? "").toString().trim();
  const contentType = (body.content_type ?? "document").toString().trim();

  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  // 3. Fetch workspace. Use a tiered fallback so pre-migration workspaces
  //    still get a valid (if barer) PDF instead of a 500.
  let workspaceRow:
    | {
        logo_url?: string | null;
        brand_color_primary?: string | null;
        brand_color_secondary?: string | null;
        legal_name?: string | null;
        cui?: string | null;
        registration_number?: string | null;
        include_company_details?: boolean | null;
      }
    | null = null;

  const { data: wsFull } = await supabase
    .from("workspaces")
    .select(
      "logo_url, brand_color_primary, brand_color_secondary, legal_name, cui, registration_number, include_company_details"
    )
    .eq("owner_user_id", user.id)
    .single();

  if (wsFull) {
    workspaceRow = wsFull;
  } else {
    const { data: wsBasic } = await supabase
      .from("workspaces")
      .select("logo_url, brand_color_primary, brand_color_secondary")
      .eq("owner_user_id", user.id)
      .single();
    if (wsBasic) workspaceRow = wsBasic;
  }

  const workspace: ExportWorkspaceData = {
    logo_url: workspaceRow?.logo_url ?? null,
    primary_color: workspaceRow?.brand_color_primary ?? null,
    secondary_color: workspaceRow?.brand_color_secondary ?? null,
    legal_name: workspaceRow?.legal_name ?? null,
    cui: workspaceRow?.cui ?? null,
    registration_number: workspaceRow?.registration_number ?? null,
    include_company_details: workspaceRow?.include_company_details ?? true,
  };

  // 4. Render the PDF to a buffer. We use React.createElement rather than
  //    JSX so this file can stay as route.ts (matches the convention used by
  //    every other API route in this app). The cast is needed because TS
  //    can't narrow the return type of a function component down to the
  //    specific <Document> element react-pdf's renderToBuffer requires.
  let pdfBuffer: Buffer;
  try {
    const element = React.createElement(ExportTemplate, {
      content,
      contentType,
      workspace,
    }) as unknown as React.ReactElement<DocumentProps>;
    pdfBuffer = await renderToBuffer(element);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF render failed";
    return NextResponse.json(
      { error: "Failed to generate PDF", detail: message },
      { status: 500 }
    );
  }

  // 5. Stream it back as a download.
  const filename = buildFilename(contentType);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
