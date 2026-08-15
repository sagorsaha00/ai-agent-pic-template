import { NextResponse } from "next/server";

// Instagram ইউজারকে এখানে ফেরত পাঠায় একটা 'code' সহ
// এই code দিয়ে Access Token নিয়ে long-lived টোকেনে বদলানো হয়

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "কোনো authorization code পাওয়া যায়নি।" },
      { status: 400 },
    );
  }

  const igAppId = process.env.INSTAGRAM_APP_ID!;
  const igAppSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI!;

  try {
    // ধাপ ১: code দিয়ে short-lived token নেওয়া
    const form = new FormData();
    form.append("client_id", igAppId);
    form.append("client_secret", igAppSecret);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", redirectUri);
    form.append("code", code);

    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: form,
      },
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error_message) {
      console.error("IG token error:", tokenData);
      return NextResponse.json(
        { error: tokenData.error_message },
        { status: 400 },
      );
    }

    const shortLivedToken = tokenData.access_token;
    const igUserId = tokenData.user_id; // এটাই আপনার Instagram User ID, পোস্ট করার সময় লাগবে

    // ধাপ ২: long-lived (৬০ দিন) token-এ বদলানো
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&client_secret=${igAppSecret}&access_token=${shortLivedToken}`,
    );
    const longLivedData = await longLivedRes.json();
    const longLivedToken = longLivedData.access_token || shortLivedToken;

    // ধাপ ৩: কুকিতে সেভ করা
    const response = NextResponse.redirect(`${origin}/?ig_connected=true`);
    response.cookies.set("ig_user_token", longLivedToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
    });
    response.cookies.set("ig_user_id", String(igUserId), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "সার্ভার ত্রুটি হয়েছে।" },
      { status: 500 },
    );
  }
}
