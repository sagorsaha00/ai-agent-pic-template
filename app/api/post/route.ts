import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pageId, pageAccessToken, imageBase64, caption } = await req.json();

    if (!pageId || !pageAccessToken || !imageBase64) {
      return NextResponse.json(
        {
          error: "pageId, pageAccessToken এবং imageBase64 required",
        },
        { status: 400 },
      );
    }

    const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);

    if (!match) {
      return NextResponse.json(
        {
          error: "Image format ভুল। data:image/...;base64,... লাগবে।",
        },
        { status: 400 },
      );
    }

    const [, mimeType, base64Data] = match;

    const buffer = Buffer.from(base64Data, "base64");

    const form = new FormData();

    form.append("caption", caption || "");
    form.append("access_token", pageAccessToken);

    form.append(
      "source",
      new Blob([buffer], {
        type: mimeType,
      }),
      "image.png",
    );

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/photos`,
      {
        method: "POST",
        body: form,
      },
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      postId: data.post_id || data.id,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Facebook post failed",
      },
      { status: 500 },
    );
  }
}
