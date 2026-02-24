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

    if (body.type === "event") {
      const { eventName, userKey, props, experimentKey, variantKey } = body;

      if (!eventName || !userKey) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      const h = req.headers;
      const countryCode =
        h.get("x-vercel-ip-country") ||
        h.get("cf-ipcountry") ||
        null;

      const mergedProps = {
        ...(props ?? {}),
        country_code: countryCode,
      };

      const { error } = await supabase
        .from("events")
        .insert({
          event_name: eventName,
          user_key: userKey,
          props: mergedProps,
          experiment_key: experimentKey ?? null,
          variant_key: variantKey ?? null,
        });

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (err) {
    console.error("Track API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}