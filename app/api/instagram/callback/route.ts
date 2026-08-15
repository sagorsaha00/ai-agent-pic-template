import { NextResponse } from "next/server";

// এই route ইউজারকে সরাসরি Instagram-এর লগইন পেজে পাঠায়
// Facebook-এর কোনো সম্পর্ক নেই এখানে, একদম আলাদা ফ্লো

export async function GET() {
  const igAppId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  const scope = [
    "instagram_business_basic",
    "instagram_business_content_publish",
  ].join(",");

  const authUrl =
    `https://www.instagram.com/oauth/authorize?` +
    `client_id=${igAppId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}
