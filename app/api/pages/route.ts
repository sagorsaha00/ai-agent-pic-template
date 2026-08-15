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

    return NextResponse.json({
      pages: pagesData.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
      })),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error হয়েছে।" },
      { status: 500 },
    );
  }
}
