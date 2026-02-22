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

    // Vercel automatically provides this header in production
    const countryCode = req.headers.get("x-vercel-ip-country");

    const { error } = await supabase.rpc("submit_final_result_v2", {
      p_category_id: categoryId,
      p_user_key: userKey,
      p_ranking_slugs: rankingSlugs,
      p_user_token: userToken,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Update country_code if available (will be null locally)
    if (countryCode) {
      await supabase
        .from("final_results")
        .update({ country_code: countryCode })
        .eq("category_id", categoryId)
        .eq("user_key", userKey);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}