import { NextResponse } from "next/server";
import { getAzureOpenAI, getChatModel } from "@/lib/azure";
import { sbAdmin } from "@/lib/supabase-admin";
import { weekKey } from "@/lib/gpt5";

export const runtime = "edge"; // good for streaming

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    const [{ data: rows }, { data: summaries }] = await Promise.all([
      sbAdmin.from("store_feedback").select("*").eq("iso_week", isoWeek),
      sbAdmin.from("weekly_summary").select("*").eq("iso_week", isoWeek)
    ]);

    const client = getAzureOpenAI();
    const model = getChatModel();

    const sys = `You are an executive analyst. Answer strictly from provided data.`;
    const user = JSON.stringify({ isoWeek, question, rows, summaries });

    const stream = await client.chat.completions.create({
      model, 
      stream: true, 
      temperature: 0.2,
      messages: [{ role: "system", content: sys }, { role: "user", content: user }]
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const token = chunk.choices?.[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(token));
        }
        controller.close();
      }
    });

    return new NextResponse(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (error) {
    console.error('Streaming CEO ask error:', error);
    return NextResponse.json({ error: 'Streaming not available' }, { status: 500 });
  }
}
