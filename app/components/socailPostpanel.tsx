"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/store";

type Page = {
    id: string;
    name: string;
    access_token: string;
};

export default function SocialPostPanel() {
    const { Image } = useStore(); // আপনার store থেকে base64 ছবি নেওয়া হচ্ছে

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [caption, setCaption] = useState("");
    const [status, setStatus] = useState("");
    const [loadingFb, setLoadingFb] = useState(false);
    const [loadingIg, setLoadingIg] = useState(false);
    const [connected, setConnected] = useState(false);

    // ?connected=true থাকলে বুঝব লগইন সফল হয়েছে, তখন Page লিস্ট আনব
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("connected") === "true") {
            setConnected(true);
            fetchPages();
        }
    }, []);

    async function fetchPages() {
        setStatus("Page লোড হচ্ছে...");
        const res = await fetch("/api/pages");
        const data = await res.json();
        if (data.error) {
            setStatus("ত্রুটি: " + data.error);
        } else {
            setPages(data.pages);
            setConnected(true);
            setStatus(`${data.pages.length}টা Page পাওয়া গেছে।`);
        }
    }

    // ===== শুধু Facebook Page-এ পোস্ট করার বাটন =====
    async function handlePostToFacebook() {
        if (!Image) {
            setStatus("প্রথমে একটা ছবি জেনারেট/আপলোড করুন।");
            return;
        }
        if (!selectedPage) {
            setStatus("একটা Page সিলেক্ট করুন।");
            return;
        }

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
        } catch (err) {
            setStatus("Facebook পোস্ট করতে ব্যর্থ হয়েছে।");
        } finally {
            setLoadingFb(false);
        }
    }

    // ===== শুধু Instagram-এ পোস্ট করার বাটন =====
    async function handlePostToInstagram() {
        if (!Image) {
            setStatus("প্রথমে একটা ছবি জেনারেট/আপলোড করুন।");
            return;
        }
        if (!selectedPage) {
            setStatus("একটা Page সিলেক্ট করুন।");
            return;
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
        } catch (err) {
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
                        onChange={(e) =>
                            setSelectedPage(pages[Number(e.target.value)])
                        }
                        defaultValue=""
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                    >
                        <option value="" disabled>
                            -- Page সিলেক্ট করুন --
                        </option>
                        {pages.map((page, i) => (
                            <option key={page.id} value={i}>
                                {page.name}
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

                    {/* ===== দুইটা আলাদা বাটন — একটা Facebook, একটা Instagram ===== */}
                    <div className="flex gap-3">
                        <button
                            onClick={handlePostToFacebook}
                            disabled={loadingFb}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loadingFb ? "পোস্ট হচ্ছে..." : "Facebook-এ পোস্ট করুন"}
                        </button>

                        <button
                            onClick={handlePostToInstagram}
                            disabled={loadingIg}
                            className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
                        >
                            {loadingIg ? "পোস্ট হচ্ছে..." : "Instagram-এ পোস্ট করুন"}
                        </button>
                    </div>
                </div>
            )}

            {status && (
                <p className="mt-3 text-sm text-neutral-300">{status}</p>
            )}
        </div>
    );
}