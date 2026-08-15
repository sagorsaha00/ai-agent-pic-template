import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imagesBase64, prompt } = await req.json();

    // Validate prompt
    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        {
          status: 400,
        },
      );
    }

    // Validate image
    if (!imagesBase64 || typeof imagesBase64 !== "string") {
      return NextResponse.json(
        {
          error: "imagesBase64 is required",
        },
        {
          status: 400,
        },
      );
    }

    // Extract MIME type and Base64 data
    const match = imagesBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);

    if (!match) {
      return NextResponse.json(
        {
          error: "Invalid Base64 image format",
        },
        {
          status: 400,
        },
      );
    }

    const [, mimeType, base64Data] = match;

    console.log("Image MIME type:", mimeType);

    // Gemini request
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: [
        {
          role: "user",

          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },

            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const parts = response.candidates?.[0]?.content?.parts;

    console.log("IMAGE_EDIT_RESPONSE:", JSON.stringify(parts, null, 2));

    if (!parts) {
      return NextResponse.json(
        {
          error: "No response from Gemini",
        },
        {
          status: 500,
        },
      );
    }

    // Find generated image
    const imagePart = parts.find((part) => part.inlineData?.data);

    // Gemini didn't generate an image
    if (!imagePart?.inlineData?.data) {
      const textPart = parts.find((part) => part.text);

      return NextResponse.json(
        {
          error: "Gemini did not return an image",
          message: textPart?.text || "Unknown error",
        },
        {
          status: 500,
        },
      );
    }

    // Convert Gemini output to Data URL
    const generatedImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    return NextResponse.json({
      success: true,
      image: generatedImage,
    });
  } catch (error) {
    console.error("IMAGE_EDIT_ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
