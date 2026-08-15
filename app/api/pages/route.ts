import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ইউজারের সব Facebook Page এর লিস্ট এনে দেয়, প্রতিটার সাথে
// তার নিজস্ব Page Access Token এবং (থাকলে) লিংক করা Instagram Account ID সহ

export async function GET() {
  const cookieStore = await cookies();
  const userToken = cookieStore.get("fb_user_token")?.value;

  if (!userToken) {
    return NextResponse.json(
      { error: "লগইন করা নেই, প্রথমে Connect Facebook করুন।" },
      { status: 401 },
    );
  }

  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userToken}`,
    );
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return NextResponse.json(
        { error: pagesData.error.message },
        { status: 400 },
      );
    }

    // প্রতিটা Page-এর সাথে Instagram Business Account লিংক আছে কিনা চেক করা
    const pagesWithIG = await Promise.all(
      pagesData.data.map(async (page: any) => {
        const igRes = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        );
        const igData = await igRes.json();
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          instagram_id: igData.instagram_business_account
            ? igData.instagram_business_account.id
            : null,
        };
      }),
    );

    return NextResponse.json({ pages: pagesWithIG });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "সার্ভার ত্রুটি হয়েছে।" },
      { status: 500 },
    );
  }
}
