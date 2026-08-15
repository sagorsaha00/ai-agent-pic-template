import { NextResponse } from "next/server";

// এই route base64 ছবি নিয়ে Facebook Page এবং Instagram-এ পোস্ট করে
// body: { pageId, pageAccessToken, instagramId, imageBase64, caption }
// imageBase64 ফরম্যাট: "data:image/png;base64,...."

export async function POST(req: Request) {
  try {
    const { pageId, pageAccessToken, instagramId, imageBase64, caption } =
      await req.json();

    if (!pageId || !pageAccessToken || !imageBase64) {
      return NextResponse.json(
        { error: "pageId, pageAccessToken, ও imageBase64 আবশ্যক।" },
        { status: 400 },
      );
    }

    // base64 থেকে mimeType ও raw বাইট আলাদা করা
    const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "ছবির ফরম্যাট সঠিক না (data:image/...;base64,... হতে হবে)।" },
        { status: 400 },
      );
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");

    const results: any = { facebook: null, instagram: null };

    // ========== Facebook Page-এ সরাসরি ছবি আপলোড (base64 → binary, public URL লাগে না) ==========
    try {
      const fbForm = new FormData();
      fbForm.append("caption", caption || "");
      fbForm.append("access_token", pageAccessToken);
      fbForm.append(
        "source",
        new Blob([buffer], { type: mimeType }),
        "image.png",
      );

      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        { method: "POST", body: fbForm },
      );
      const fbData = await fbRes.json();

      results.facebook = fbData.error
        ? { success: false, error: fbData.error.message }
        : { success: true, postId: fbData.post_id || fbData.id };
    } catch (err: any) {
      results.facebook = { success: false, error: err.message };
    }

    // ========== Instagram-এ পোস্ট (Instagram-এর জন্য পাবলিক URL বাধ্যতামূলক) ==========
    if (instagramId) {
      try {
        // ধাপ ১: ছবিটা সাময়িকভাবে imgbb তে আপলোড করে একটা পাবলিক URL বানানো
        // (Instagram raw upload সাপোর্ট করে না, শুধু public URL নেয়)
        const publicImageUrl = await uploadToImgbb(base64Data);

        if (!publicImageUrl) {
          results.instagram = {
            success: false,
            error: "ছবির পাবলিক URL বানানো যায়নি (IMGBB_API_KEY চেক করুন)।",
          };
        } else {
          // ধাপ ২: media container বানানো
          const mediaRes = await fetch(
            `https://graph.facebook.com/v21.0/${instagramId}/media`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_url: publicImageUrl,
                caption: caption || "",
                access_token: pageAccessToken,
              }),
            },
          );
          const mediaData = await mediaRes.json();

          if (mediaData.error) {
            results.instagram = {
              success: false,
              error: mediaData.error.message,
            };
          } else {
            // ধাপ ৩: container পাবলিশ করা
            const publishRes = await fetch(
              `https://graph.facebook.com/v21.0/${instagramId}/media_publish`,
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

            results.instagram = publishData.error
              ? { success: false, error: publishData.error.message }
              : { success: true, postId: publishData.id };
          }
        }
      } catch (err: any) {
        results.instagram = { success: false, error: err.message };
      }
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "সার্ভার ত্রুটি হয়েছে।" },
      { status: 500 },
    );
  }
}

// base64 ছবি imgbb.com তে আপলোড করে একটা পাবলিক URL ফেরত দেয়
// imgbb.com এ ফ্রি অ্যাকাউন্ট বানিয়ে API Key নিন: https://api.imgbb.com/
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
