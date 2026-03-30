import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured. Set GOOGLE_AI_KEY in Vercel environment variables." }, { status: 500 });
  }

  try {
    const { message, financialContext } = await req.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUser: " + message }] },
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "AI request failed: " + err.message }, { status: 500 });
  }
}
