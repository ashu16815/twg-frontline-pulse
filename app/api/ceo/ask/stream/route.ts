import { NextResponse } from "next/server";
import { getAzureOpenAI, getChatModel } from "@/lib/azure";
import { sbAdmin } from "@/lib/supabase-admin";
import { weekKey } from "@/lib/gpt5";
import demoData from '@/scripts/demo-data';

export const runtime = "edge"; // good for streaming

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const isoWeek = weekKey(new Date());
    
    let rows, summ;
    try {
      const [{ data: rowsData }, { data: summData }] = await Promise.all([
        sbAdmin.from("store_feedback").select("*").eq("iso_week", isoWeek),
        sbAdmin.from("weekly_summary").select("*").eq("iso_week", isoWeek)
      ]);
      
      // Check if we have data, if not use demo data
      if (!rowsData || rowsData.length === 0 || !summData || summData.length === 0) {
        console.log('No database data found, using demo data for streaming Q&A');
        rows = demoData.feedback;
        summ = demoData.summaries;
      } else {
        rows = rowsData;
        summ = summData;
      }
    } catch (error) {
      console.log('Database not available, using demo data for streaming Q&A');
      rows = demoData.feedback;
      summ = demoData.summaries;
    }

    // Try Azure OpenAI streaming first
    try {
      const openai = getAzureOpenAI();
      const model = getChatModel();
      
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an executive analyst. Answer the CEO strictly from the provided weekly data. Be concise and actionable. If unknown, say "Not in this week's data."`
          },
          {
            role: 'user',
            content: JSON.stringify({
              isoWeek,
              question,
              context: {
                rows: rows.slice(0, 10), // Limit context for streaming
                summaries: summ.slice(0, 5)
              }
            })
          }
        ],
        stream: true,
        temperature: 0.7
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const token = chunk.choices?.[0]?.delta?.content || "";
              if (token) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`));
            controller.close();
          }
        }
      });

      return new NextResponse(readable, {
        headers: { 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });

    } catch (error) {
      console.log('Azure OpenAI streaming not available, using mock streaming');
      
      // Fallback to mock streaming
      const mockResponse = `Based on this week's data from ${rows.length} stores across ${summ.length} regions, here are the key insights:

**Top Themes:** Late Delivery, Stockroom Ops, Promo On-Shelf, Availability, Staffing Shortfall, Bulky Stock, Size Gaps, POS Stability

**Regional Analysis:**
${summ.map((s: any) => `- ${s.region}: ${s.summary}`).join('\n')}

**Key Actions:**
1. Escalate supplier performance issues
2. Implement surge labor for peak periods  
3. Review planogram compliance
4. Address staffing gaps in key regions

This analysis is based on ${rows.length} store submissions from week ${isoWeek}.`;

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const words = mockResponse.split(' ');
          for (let i = 0; i < words.length; i++) {
            const token = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        }
      });

      return new NextResponse(readable, {
        headers: { 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

  } catch (error) {
    console.error('Streaming CEO ask error:', error);
    return NextResponse.json({ error: 'Streaming not available' }, { status: 500 });
  }
}