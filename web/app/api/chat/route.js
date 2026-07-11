import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase.js";
import { runChat } from "../../../lib/gemini.js";

export async function POST(request) {
  try {
    const { message, history } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message manquant" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const result = await runChat(history || [], message);

    await supabase.from("chat_messages").insert([
      { role: "user", content: message },
      { role: "model", content: result.text },
    ]);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
