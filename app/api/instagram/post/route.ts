import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// এই route Page ছাড়াই, সরাসরি Instagram Login token দিয়ে পোস্ট করে
// body: { imageBase64, caption }

export async function POST(req: Request) {
  try {
    const { imageBase64, caption } = await req.json();
    const cookieStore = await cookies();
    const igToken = cookieStore.get("ig_user_token")?.value;
    const igUserId = cookieStore.get("ig_user_id")?.value;

    if (!igToken || !igUserId) {
      return NextResponse.json(
        { error: "Instagram এ লগইন করা নেই, প্রথমে Connect Instagram করুন।" },
        { status: 401 },
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 আবশ্যক।" },
        { status: 400 },
      );
    }

    const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Image format ভুল। data:image/...;base64,... লাগবে।" },
        { status: 400 },
      );
    }
    const [, , base64Data] = match;

    // base64 → পাবলিক URL (imgbb দিয়ে, Instagram raw upload নেয় না)
    const imageUrl = await uploadToImgbb(base64Data);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "পাবলিক URL বানানো যায়নি। IMGBB_API_KEY চেক করুন।" },
        { status: 500 },
      );
    }

    // ধাপ ১: media container বানানো — লক্ষ্য করুন এখানে graph.instagram.com ব্যবহার হচ্ছে
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || "",
          access_token: igToken,
        }),
      },
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      return NextResponse.json(
        { error: mediaData.error.message },
        { status: 400 },
      );
    }

    // ধাপ ২: পাবলিশ করা
    const publishRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: igToken,
        }),
      },
    );
    const publishData = await publishRes.json();

    if (publishData.error) {
      return NextResponse.json(
        { error: publishData.error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, postId: publishData.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "সার্ভার ত্রুটি হয়েছে।" },
      { status: 500 },
    );
  }
}

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
