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

    const { categoryId, userKey, userToken, rankingSlugs } = body || {};
    if (!categoryId || !userKey || !userToken || !Array.isArray(rankingSlugs)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const countryCode = req.headers.get("x-vercel-ip-country");

    // Pass country code directly into RPC
    const { error } = await supabase.rpc("submit_final_result_v2", {
      p_category_id: categoryId,
      p_user_key: userKey,
      p_ranking_slugs: rankingSlugs,
      p_user_token: userToken,
      p_country_code: countryCode, // NEW
    });
    
    if (error) {
      console.error("RPC ERROR:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}