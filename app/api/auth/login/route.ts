import { NextResponse } from "next/server";

// এই route হিট করলে ইউজারকে Facebook-এর লগইন/পারমিশন পেজে পাঠানো হয়
// ফ্রন্টএন্ডে ব্যবহার: <a href="/api/auth/login">Connect Facebook</a>

export async function GET() {
  const appId = process.env.FB_APP_ID;
  const redirectUri = process.env.FB_REDIRECT_URI;

  // আপনার App-এ যা যা permission সত্যিকারে যোগ করা আছে, শুধু সেগুলোই এখানে দিন
  const scope = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_manage_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");

  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code`;

  return NextResponse.redirect(authUrl);
}
