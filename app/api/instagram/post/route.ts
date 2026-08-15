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

    const [, , base64Data] = match;

    // ধাপ ০: base64 ছবিকে imgbb দিয়ে পাবলিক URL বানানো
    // (Instagram Graph API raw upload নেয় না, শুধু public image_url নেয়)
    const imageUrl = await uploadToImgbb(base64Data);

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "Image এর public URL বানানো যায়নি। IMGBB_API_KEY চেক করুন।",
        },
        { status: 500 },
      );
    }

    // ধাপ ১: Page-এর সাথে লিংক করা Instagram Business Account ID বের করা
    const igIdRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`,
    );
    const igIdData = await igIdRes.json();

    if (!igIdData.instagram_business_account) {
      return NextResponse.json(
        {
          error:
            "এই Page-এর সাথে কোনো Instagram Business account লিংক করা নেই।",
        },
        { status: 400 },
      );
    }

    const igUserId = igIdData.instagram_business_account.id;

    // ধাপ ২: Media Container তৈরি করা
    const mediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || "",
          access_token: pageAccessToken,
        }),
      },
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      return NextResponse.json(
        {
          success: false,
          error: mediaData.error.message,
        },
        { status: 400 },
      );
    }

    // ধাপ ৩: Container পাবলিশ করা
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: pageAccessToken,
        }),
      },
    );
    const publishData = await publishRes.json();

    if (publishData.error) {
      return NextResponse.json(
        {
          success: false,
          error: publishData.error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      postId: publishData.id,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Instagram post failed",
      },
      { status: 500 },
    );
  }
}

// base64 ছবি imgbb.com তে আপলোড করে public URL ফেরত দেয়
// ফ্রি API Key নিন: https://api.imgbb.com/
async function uploadToImgbb(base64Data: string): Promise<string | null> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) return null;

  const form = new FormData();
  form.append("image", base64Data);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();

  return data?.data?.url || null;
}
