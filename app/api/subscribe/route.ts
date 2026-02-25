import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeEmail(raw: string) {
  return String(raw ?? "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  // simple, safe check (not perfect, but good enough for capture)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const email = normalizeEmail(body.email);
    const userKey = typeof body.userKey === "string" ? body.userKey : null;
    const source = typeof body.source === "string" ? body.source : "unknown";
    const context = (body.context && typeof body.context === "object") ? body.context : {};

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Upsert by unique email so repeat signups don't error
    const { error } = await supabase
      .from("email_signups")
      .upsert(
        { email, user_key: userKey, source, context },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}