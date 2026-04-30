import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPersona } from "@/lib/personas";

const MODEL = "gemini-3-flash-preview";

function toGeminiContents(history) {
  const out = [];
  for (const msg of history) {
    if (!msg?.role || msg.content == null) continue;
    const role = msg.role === "assistant" ? "model" : "user";
    if (role !== "model" && role !== "user") continue;
    out.push({ role, parts: [{ text: String(msg.content) }] });
  }
  return out;
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 }
    );
  }

  const { message, persona, history } = body;
  if (
    typeof message !== "string" ||
    !message.trim() ||
    typeof persona !== "string"
  ) {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 }
    );
  }

  let systemPrompt;
  try {
    systemPrompt = getPersona(persona).systemPrompt;
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 }
    );
  }

  const rawHistory = Array.isArray(history) ? history : [];
  const recent = rawHistory.slice(-20);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 1,
      },
    });

    const contents = [
      ...toGeminiContents(recent),
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    const result = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "stream_failed" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("chat route error", err?.message || err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
