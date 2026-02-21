import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCountryCodeFromIP(ip: string | null) {
  if (!ip) return null;

  // Use Cloudflare header when deployed, otherwise fallback is null in dev
  // If you’re not on Cloudflare yet, we’ll use a simple external lookup later.
  // For now: return null in local dev.
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { categoryId, userKey, userToken, rankingSlugs } = body || {};
    if (!categoryId || !userKey || !userToken || !Array.isArray(rankingSlugs)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const headers = new Headers(req.headers);
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip");

    const countryCode = await getCountryCodeFromIP(ip);

    const { error } = await supabase.rpc("submit_final_result_v2", {
      p_category_id: categoryId,
      p_user_key: userKey,
      p_ranking_slugs: rankingSlugs,
      p_user_token: userToken,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // store country code (separate update so we don’t touch your trigger)
    if (countryCode) {
      await supabase
        .from("final_results")
        .update({ country_code: countryCode })
        .eq("category_id", categoryId)
        .eq("user_key", userKey);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}