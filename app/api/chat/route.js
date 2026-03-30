import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Models to try in order — fallback chain
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

export async function POST(req) {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured yet. Add GOOGLE_AI_KEY in Vercel → Settings → Environment Variables. Get a free key at aistudio.google.com/apikey" }, { status: 500 });
  }

  try {
    const { message, financialContext } = await req.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are CashGuard AI — a personal financial advisor for a salaried individual in Pakistan.

FINANCIAL CONTEXT (this is the user's real data):
${financialContext}

YOUR ROLE:
- You are a wise, practical financial advisor who knows the user's complete financial situation.
- Give advice based on their ACTUAL numbers — don't guess.
- Be direct, honest, and practical. Use simple language.
- Mix English and Urdu naturally if the user does.
- When someone asks about lending money, check their remaining budget and savings before advising.
- Always consider: Can they afford it? Will it affect their savings goals? Will they survive the month?
- If they can't afford something, say so clearly but kindly.
- Keep responses concise — 2-3 paragraphs max.
- Use real numbers from their data in your advice.
- Be encouraging about good financial habits.
- Warn firmly (but respectfully) about bad financial decisions.

IMPORTANT: You are NOT a general chatbot. Only discuss financial topics related to the user's budget, expenses, savings, and money decisions.`;

    // Try each model in the fallback chain
    let lastError = null;
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser: " + message }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        });
        const reply = result.response.text();
        return NextResponse.json({ reply, model: modelName });
      } catch (err) {
        lastError = err;
        // If it's not a model-specific error, don't try other models
        if (!err.message?.includes("429") && !err.message?.includes("not found") && !err.message?.includes("not supported")) {
          break;
        }
      }
    }

    // All models failed
    const msg = lastError?.message || "Unknown error";
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json({ error: "AI quota temporarily exceeded. The free tier resets every minute — please try again in a moment." }, { status: 429 });
    }
    if (msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED")) {
      return NextResponse.json({ error: "Invalid API key. Please check your GOOGLE_AI_KEY in Vercel environment variables." }, { status: 401 });
    }
    return NextResponse.json({ error: "AI temporarily unavailable. Try again shortly." }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
