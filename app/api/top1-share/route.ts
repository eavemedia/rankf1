import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const topSlug = searchParams.get("topSlug");

    if (!categoryId || !topSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing categoryId or topSlug" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // total submissions for this category
    const totalRes = await supabase
      .from("final_results")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (totalRes.error) {
      return NextResponse.json(
        { ok: false, error: totalRes.error.message },
        { status: 500 }
      );
    }

    // submissions where top_slug == requested slug
    const topRes = await supabase
      .from("final_results")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("top_slug", topSlug);

    if (topRes.error) {
      return NextResponse.json(
        { ok: false, error: topRes.error.message },
        { status: 500 }
      );
    }

    const total = totalRes.count ?? 0;
    const top = topRes.count ?? 0;

    const pct = total === 0 ? 0 : (top / total) * 100;

    return NextResponse.json({
      ok: true,
      categoryId,
      topSlug,
      total,
      top,
      pct,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}