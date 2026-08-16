import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, title } = await request.json(); // Pass user ID or name

    const response = await fetch(
      "https://app.ayrshare.com/api/profiles/generateProfile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
        },
        body: JSON.stringify({
          title: title || `User_${userId}`,
        }),
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return NextResponse.json(
        { success: false, error: data.message },
        { status: 400 },
      );
    }

    // Save data.profileKey into your database for this user (e.g., MongoDB, PostgreSQL, Supabase)
    const profileKey = data.profileKey;

    return NextResponse.json({
      success: true,
      profileKey,
      details: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
