import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            );
        }

        // List of models to try in order. 
        // fallback to 1.5 if 2.0 is rate limited or unavailable.
        const modelNames = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-flash-latest"
        ];

        let lastError;
        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Respond in plain text only. Do not use Markdown formatting (no bold **, no italics *, no headers #, no bullet points). Use standard spacing and paragraphs for structure."
                });

                const chat = model.startChat({
                    history: messages.slice(0, -1).map((m: any) => ({
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: [{ text: m.content }]
                    })),
                });

                const lastMessage = messages[messages.length - 1];
                const result = await chat.sendMessage(lastMessage.content);
                const response = await result.response;
                const text = response.text();

                return NextResponse.json({ text });
            } catch (error: any) {
                console.warn(`Model ${modelName} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        throw lastError || new Error("All models failed to generate response");
    } catch (error: any) {
        console.error("Error generating chat response:", error);
        return NextResponse.json(
            {
                error: (error.message || "Failed to generate response"),
                details: JSON.stringify(error)
            },
            { status: 500 }
        );
    }
}
