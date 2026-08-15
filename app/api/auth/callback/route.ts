import { NextResponse } from "next/server";

// Facebook ইউজারকে এখানে ফেরত পাঠায় একটা 'code' সহ, এই code দিয়ে
// আমরা Access Token নিয়ে সেটাকে long-lived (৬০ দিন) টোকেনে বদলাই,
// তারপর httpOnly কুকিতে সেভ করি

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "কোনো authorization code পাওয়া যায়নি।" },
      { status: 400 },
    );
  }

  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const redirectUri = process.env.FB_REDIRECT_URI;

  try {
    // ধাপ ১: code দিয়ে short-lived User Access Token নেওয়া
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri!)}` +
        `&client_secret=${appSecret}&code=${code}`,
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return NextResponse.json(
        { error: tokenData.error.message },
        { status: 400 },
      );
    }

    const shortLivedToken = tokenData.access_token;

    // ধাপ ২: long-lived (৬০ দিন) টোকেনে বদলানো
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&client_id=${appId}` +
        `&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
    );
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("Long-lived token error:", longLivedData.error);
      return NextResponse.json(
        { error: longLivedData.error.message },
        { status: 400 },
      );
    }

    const longLivedToken = longLivedData.access_token;

    // ধাপ ৩: কুকিতে সেভ করে হোমপেজে ফেরত পাঠানো
    const response = NextResponse.redirect(`${origin}/?connected=true`);
    response.cookies.set("fb_user_token", longLivedToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60, // ৬০ দিন
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
