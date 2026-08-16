import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Pass userProfileKey from the frontend or fetch it from session/db
    const { imageBase64, caption, platforms, userProfileKey } =
      await request.json();

    if (!userProfileKey) {
      return NextResponse.json(
        { success: false, error: "ইউজার প্রোফাইল কি (Profile Key) নেই।" },
        { status: 400 },
      );
    }

    const apiKey = process.env.AYRSHARE_API_KEY;

    const response = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Profile-Key": userProfileKey, // Target specific sub-user's social accounts
      },
      body: JSON.stringify({
        post: caption || "",
        platforms: platforms || ["facebook", "instagram"],
        mediaUrls: [imageBase64],
      }),
    });

    const data = await response.json();

    if (data.status === "error" || data.errors) {
      return NextResponse.json({
        success: false,
        error:
          data.message ||
          data.errors?.[0]?.message ||
          "পোস্ট করতে ব্যর্থ হয়েছে।",
      });
    }

    return NextResponse.json({
      success: true,
      postId: data.id || "Success",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "সার্ভার এরর হয়েছে।" },
      { status: 500 },
    );
  }
}
