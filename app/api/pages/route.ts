import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const userToken = cookieStore.get("fb_user_token")?.value;

  if (!userToken) {
    return NextResponse.json(
      { error: "প্রথমে Connect Facebook করুন।" },
      { status: 401 },
    );
  }

  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?` +
        `fields=id,name,access_token&` +
        `access_token=${encodeURIComponent(userToken)}`,
    );

    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return NextResponse.json(
        { error: pagesData.error.message },
        { status: 400 },
      );
    }

    // 🔧 প্রতিটা Page-এর সাথে Instagram Business Account লিংক আছে কিনা চেক করা হচ্ছে
    const pagesWithIG = await Promise.all(
      pagesData.data.map(async (page: any) => {
        try {
          const igRes = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?` +
              `fields=instagram_business_account&` +
              `access_token=${encodeURIComponent(page.access_token)}`,
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
        } catch {
          // এই একটা Page-এর IG চেক ব্যর্থ হলেও বাকি সব Page যেন লোড হয়
          return {
            id: page.id,
            name: page.name,
            access_token: page.access_token,
            instagram_id: null,
          };
        }
      }),
    );

    return NextResponse.json({ pages: pagesWithIG });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error হয়েছে।" },
      { status: 500 },
    );
  }
}
