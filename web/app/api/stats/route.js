import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase.js";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || "30", 10);

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data: prospects } = await supabase.from("prospects").select("status, type");
    const byStatus = {};
    const byType = {};
    for (const p of prospects || []) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sentLast24h } = await supabase
      .from("sent_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", since);

    const { data: lastCronRun } = await supabase
      .from("cron_log")
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      byStatus,
      byType,
      sentLast24h: sentLast24h || 0,
      dailyLimit: DAILY_LIMIT,
      lastCronRun: lastCronRun || null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
