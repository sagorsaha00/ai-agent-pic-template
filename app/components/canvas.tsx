"use client";

import { useStore } from "@/store/store";
import EditButton from "./button";
import SocialPostPanel from "./socailPostpanel";

export default function Canvas() {
    const { Image, setImage, setPrompt } = useStore();

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const base64String = reader.result;

            if (typeof base64String !== "string") return;

            console.log("Uploaded image:", base64String);

            // Keep data:image/png;base64,...
            setImage(base64String);
        };

        reader.readAsDataURL(file);
    };

    return (
        <main className="bg-neutral-950 text-white">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-2xl font-semibold">
                        Image Editor
                    </h1>

                    <p className="mt-1 text-sm text-neutral-400">
                        Upload an image and describe what you want to change.
                    </p>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-3xl">

                        {!Image ? (
                            <label
                                htmlFor="image-upload"
                                className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 transition hover:border-neutral-500"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-2xl">
                                    +
                                </div>

                                <p className="text-sm font-medium">
                                    Upload an image
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                    PNG, JPG or WEBP
                                </p>

                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                                <img
                                    src={Image}
                                    alt="Uploaded image"
                                    className="mx-auto max-h-[600px] w-auto max-w-full object-contain"
                                />

                                <label
                                    htmlFor="image-upload"
                                    className="absolute bottom-4 right-4 cursor-pointer rounded-lg bg-black/70 px-4 py-2 text-sm backdrop-blur transition hover:bg-black"
                                >
                                    Change image

                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mx-auto mt-8 w-full max-w-3xl">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">

                        <textarea
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you want to change..."
                            rows={3}
                            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500"
                        />

                        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                            <span className="px-3 text-xs text-neutral-500">
                                characters
                            </span>

                            <EditButton />
                        </div>

                    </div>
                </div>

            </div>
            <SocialPostPanel />
        </main>
    );
}