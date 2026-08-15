import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Store {
  Image: string | null;
  Prompt: string | null;
  setImage: (image: string | null) => void;
  setPrompt: (prompt: string | null) => void;
  generateImage: (prompt: string) => Promise<void>;
}

export const useStore = create<Store>()(
  devtools((set, get) => ({
    Image: null,
    Prompt: null,
    setImage: (image: string | null) => set({ Image: image }),
    setPrompt: (prompt: string | null) => set({ Prompt: prompt }),
    generateImage: async (prompt: string) => {
        console.log("Generating image with prompt:", prompt);
      const images = get().Image;
      const finalPrompt = `You are a professional social media creative director and visual designer with expertise in food photography, product advertising, and brand content creation.

TASK: Transform the uploaded image into a polished, publish-ready visual for social media promotion.

USER INSTRUCTION (highest priority — follow this closely):
"${prompt}"

CREATIVE DIRECTION:

1. IDENTITY PRESERVATION
   - Keep the subject 100% recognizable — same food item, product, or person.
   - Do not alter facial features, body shape, product shape/branding, or core identity.
   - Only enhance presentation, never replace the subject.

2. INSTRUCTION PRIORITY
   - Interpret the user's instruction as the creative brief.
   - If the instruction specifies a mood, platform, color palette, or campaign style, that overrides default styling choices below.

3. COMPOSITION & FRAMING
   - Apply professional composition principles: rule of thirds, clear focal point, balanced negative space.
   - Frame for social-first formats (square 1:1 or vertical 4:5/9:16) unless instructed otherwise.
   - Add depth using foreground/background separation, soft blur, or layered elements.

4. LIGHTING & COLOR GRADING
   - Apply studio-quality lighting: soft key light, subtle rim light, controlled shadows.
   - Boost contrast, sharpness, and color vibrancy without looking oversaturated or artificial.
   - Use a cohesive color grade that feels premium and brand-consistent.

5. CATEGORY-SPECIFIC TREATMENT
   - FOOD: Make it look fresh, appetizing, and premium — enhance texture, steam/moisture, glossy highlights, garnish detail, warm inviting tones.
   - PRODUCT: Clean commercial studio presentation — neutral or gradient backdrop, soft shadow/reflection, sharp edges, e-commerce/ad-ready finish.
   - PERSON: Keep natural skin tone and proportions, subtle retouching only, integrate them naturally into the background/design (no distortion, no face-swapping).

6. DESIGN ENHANCEMENTS
   - Add tasteful supporting elements where appropriate: soft gradients, subtle bokeh, minimal props, light shadows/highlights, or backdrop texture.
   - Design should feel like a real brand campaign — not cluttered, not generic stock-photo style.

7. TEXT & BRANDING RULES
   - Do NOT add any text, logos, or watermarks unless explicitly requested in the user instruction.
   - Never fabricate celebrity endorsements, brand names, logos, or claims not present in the original image.

8. FINAL QUALITY BAR
   - Output must look like it was shot and edited by a professional brand/content studio.
   - Ready to post as-is on Instagram, Facebook, or TikTok — polished, modern, scroll-stopping.

Return only the final edited image.`;
      try {
        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imagesBase64: images,
            prompt: finalPrompt,
          }),
        });
        const data = await response.json();
        set({ Image: data.image });
      } catch (error) {
        console.error("Error generating image:", error);
      }
    },
  })),
);
