import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    // For now just return success so we can verify route works
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Track API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}