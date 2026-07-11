import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const supabase = getSupabaseServerClient();
    let query = supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ prospects: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
