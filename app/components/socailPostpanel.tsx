"use client";

import { useState } from "react";
import { useStore } from "@/store/store";

interface Props {
    userProfileKey: string; // Dynamic profile key for current logged-in user
}

export default function SocialPostPanel({ userProfileKey }: Props) {
    const { Image } = useStore();
    const [caption, setCaption] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    // Function to let user link their accounts
    async function handleConnectAccounts() {
        try {
            const res = await fetch("/api/user/connect-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileKey: userProfileKey }),
            });
            const data = await res.json();
            if (data.url) {
                window.open(data.url, "_blank"); // Opens Ayrshare connect page in new tab
            }
        } catch {
            setStatus("অ্যাকাউন্ট কানেক্ট লিঙ্ক তৈরি করতে ব্যর্থ হয়েছে।");
        }
    }

    // Function to post image
    async function handlePost(platforms: string[]) {
        if (!Image) {
            setStatus("প্রথমে একটি ছবি আপলোড/জেনারেট করুন।");
            return;
        }

        setLoading(true);
        setStatus("পোস্ট করা হচ্ছে...");

        try {
            const res = await fetch("/api/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: Image,
                    caption,
                    platforms,
                    userProfileKey, // Sending current user's profile key
                }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("পোস্ট সফলভাবে সম্পন্ন হয়েছে! ✓");
                setCaption("");
            } else {
                setStatus(`ব্যর্থ — ${data.error}`);
            }
        } catch {
            setStatus("সার্ভারে সমস্যা দেখা দিয়েছে।");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">সোশ্যাল মিডিয়া প্যানেল</h2>

                {/* Connect Accounts Button */}
                <button
                    onClick={handleConnectAccounts}
                    className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-700"
                >
                    🔗 Connect FB / Instagram
                </button>
            </div>

            <div className="space-y-4">
                <textarea
                    placeholder="আপনার ক্যাপশন লিখুন..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm outline-none placeholder:text-neutral-500 focus:border-blue-500"
                />

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handlePost(["facebook"])}
                        disabled={loading}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        Facebook-এ পোস্ট
                    </button>

                    <button
                        onClick={() => handlePost(["instagram"])}
                        disabled={loading}
                        className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
                    >
                        Instagram-এ পোস্ট
                    </button>

                    <button
                        onClick={() => handlePost(["facebook", "instagram"])}
                        disabled={loading}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-pink-600 px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        উভয় প্ল্যাটফর্মে একসাথে পোস্ট
                    </button>
                </div>
            </div>

            {status && (
                <p className="mt-4 rounded-lg bg-neutral-800 p-3 text-sm text-neutral-200">
                    {status}
                </p>
            )}
        </div>
    );
}