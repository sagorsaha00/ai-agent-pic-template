import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { profileKey } = await request.json(); // Retrieve the user's profileKey from DB

    const response = await fetch(
      "https://app.ayrshare.com/api/profiles/generateJWT",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
          "Profile-Key": profileKey, // Attach user's Profile Key
        },
        body: JSON.stringify({
          domain: "yourdomain.com", // Your app domain
        }),
      },
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      url: data.url, // Redirect user to this URL to connect their social accounts
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
