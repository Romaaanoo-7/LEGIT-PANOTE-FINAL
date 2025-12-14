
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { image, mimeType } = await req.json();

        if (!image || !mimeType) {
            return NextResponse.json(
                { error: "Image and mimeType are required" },
                { status: 400 }
            );
        }

        // Updated based on available models for the user's key
        const modelNames = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

        let lastError;
        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([
                    "Extract all text from this image. Return the content as natural, continuous paragraphs. Fix any, broken line breaks where a sentence is split across lines. Do not return markdown tables or headers. Just return the clean, readable text.",
                    {
                        inlineData: {
                            data: image,
                            mimeType: mimeType,
                        },
                    },
                ]);

                const response = await result.response;
                const text = response.text();
                return NextResponse.json({ text });
            } catch (error: any) {
                console.warn(`Model ${modelName} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        // If all models fail, return the last error
        throw lastError || new Error("All models failed to generate content");

    } catch (error: any) {
        console.error("Error generating text from image:", error);
        return NextResponse.json(
            {
                error: (error.message || "Failed to process image"),
                details: JSON.stringify(error)
            },
            { status: 500 }
        );
    }
}
