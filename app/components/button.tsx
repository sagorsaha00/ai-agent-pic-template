import { useStore } from "@/store/store";

export default function EditButton() {

    const { Image, Prompt, generateImage } = useStore()
    const handleEditImage = () => {
        generateImage(Prompt || "");
    }
    return (
        <div>

            <button
                type="button"
                disabled={!Image || !Prompt?.trim()}
                onClick={() => { handleEditImage() }}
                className="rounded-lg cursor-pointer bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Edit image
            </button>
        </div>
    )
}
