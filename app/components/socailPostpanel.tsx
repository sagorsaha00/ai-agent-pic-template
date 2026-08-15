"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/store";

type Page = {
    id: string;
    name: string;
    access_token: string;
    instagram_id: string | null; // 🔧 আগে এটা ছিল না, তাই IG লিংক আছে কিনা চেক করা যাচ্ছিল না
};

export default function SocialPostPanel() {
    const { Image } = useStore();

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [caption, setCaption] = useState("");
    const [status, setStatus] = useState("");
    const [loadingFb, setLoadingFb] = useState(false);
    const [loadingIg, setLoadingIg] = useState(false);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("connected") === "true") {
            setConnected(true);
            fetchPages();
        }
    }, []);

    async function fetchPages() {
        setStatus("Page লোড হচ্ছে...");
        try {
            const res = await fetch("/api/pages");
            const data = await res.json();
            if (data.error) {
                setStatus("ত্রুটি: " + data.error);
            } else {
                setPages(data.pages);
                setConnected(true);
                setStatus(`${data.pages.length}টা Page পাওয়া গেছে।`);
            }
        } catch {
            setStatus("Page লোড করতে ব্যর্থ হয়েছে।");
        }
    }

    // 🔧 Page বদলালে আগের status মুছে ফেলা হচ্ছে
    function handlePageChange(index: number) {
        setSelectedPage(pages[index]);
        setStatus("");
    }

    async function handlePostToFacebook() {
        if (!Image) return setStatus("প্রথমে একটা ছবি জেনারেট/আপলোড করুন।");
        if (!selectedPage) return setStatus("একটা Page সিলেক্ট করুন।");

        setLoadingFb(true);
        setStatus("Facebook-এ পোস্ট হচ্ছে...");

        try {
            const res = await fetch("/api/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId: selectedPage.id,
                    pageAccessToken: selectedPage.access_token,
                    imageBase64: Image,
                    caption,
                }),
            });
            const data = await res.json();

            setStatus(
                data.success
                    ? `Facebook: পোস্ট সফল ✓ (Post ID: ${data.postId})`
                    : `Facebook: ব্যর্থ — ${data.error}`
            );
        } catch {
            setStatus("Facebook পোস্ট করতে ব্যর্থ হয়েছে।");
        } finally {
            setLoadingFb(false);
        }
    }

    async function handlePostToInstagram() {
        if (!Image) return setStatus("প্রথমে একটা ছবি জেনারেট/আপলোড করুন।");
        if (!selectedPage) return setStatus("একটা Page সিলেক্ট করুন।");
        // 🔧 আগে থেকেই চেক করে জানিয়ে দেওয়া হচ্ছে, backend error-এর অপেক্ষা না করে
        if (!selectedPage.instagram_id) {
            return setStatus("এই Page-এর সাথে কোনো Instagram Business অ্যাকাউন্ট লিংক নেই।");
        }

        setLoadingIg(true);
        setStatus("Instagram-এ পোস্ট হচ্ছে...");

        try {
            const res = await fetch("/api/instagram/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId: selectedPage.id,
                    pageAccessToken: selectedPage.access_token,
                    imageBase64: Image,
                    caption,
                }),
            });
            const data = await res.json();

            setStatus(
                data.success
                    ? `Instagram: পোস্ট সফল ✓ (Post ID: ${data.postId})`
                    : `Instagram: ব্যর্থ — ${data.error}`
            );
        } catch {
            setStatus("Instagram পোস্ট করতে ব্যর্থ হয়েছে।");
        } finally {
            setLoadingIg(false);
        }
    }

    return (
        <div className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-white">
            <h2 className="mb-3 text-lg font-semibold">Facebook / Instagram এ পোস্ট করুন</h2>

            {!connected && (
                <a href="/api/auth/login">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700">
                        Connect Facebook
                    </button>
                </a>
            )}

            {connected && pages.length === 0 && (
                <button
                    onClick={fetchPages}
                    className="rounded-lg bg-neutral-700 px-4 py-2 text-sm"
                >
                    Page লিস্ট আবার লোড করুন
                </button>
            )}

            {pages.length > 0 && (
                <div className="space-y-3">
                    <select
                        onChange={(e) => handlePageChange(Number(e.target.value))}
                        defaultValue=""
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                    >
                        <option value="" disabled>
                            -- Page সিলেক্ট করুন --
                        </option>
                        {pages.map((page, i) => (
                            <option key={page.id} value={i}>
                                {page.name} {page.instagram_id ? "(IG লিংক আছে)" : "(শুধু Facebook)"}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="ক্যাপশন লিখুন"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={handlePostToFacebook}
                            disabled={loadingFb}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loadingFb ? "পোস্ট হচ্ছে..." : "Facebook-এ পোস্ট করুন"}
                        </button>

                        {/* 🔧 IG লিংক না থাকলে বাটন disable */}
                        <button
                            onClick={handlePostToInstagram}
                            disabled={loadingIg || !selectedPage?.instagram_id}
                            className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
                        >
                            {loadingIg ? "পোস্ট হচ্ছে..." : "Instagram-এ পোস্ট করুন"}
                        </button>
                    </div>
                </div>
            )}

            {status && <p className="mt-3 text-sm text-neutral-300">{status}</p>}
        </div>
    );
}