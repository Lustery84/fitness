import { z } from "zod";
import { analyzeMealImage } from "@/lib/ai/meal-vision";
import { apiError, apiOk, zodErrorResponse } from "@/lib/api/http";

const AnalyzeRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(4)
    .max(5_500_000, "Ảnh quá lớn (tối đa ~4MB sau khi nén)."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  hintText: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = AnalyzeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const result = await analyzeMealImage(parsed.data);
    return apiOk(result);
  } catch {
    return apiError("VISION_ERROR", "Không thể phân tích ảnh món ăn.", 500);
  }
}
