import { z } from "zod";
import { apiError, apiOk, zodErrorResponse } from "@/lib/api/http";
import {
  createMealLog,
  deleteMealLog,
  resolveAuthContext,
} from "@/lib/storage/repository";
import { isSupabaseConfigured } from "@/lib/storage/supabase";

const CreateMealSchema = z.object({
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealSlot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  title: z.string().trim().min(1).max(160),
  source: z.enum(["photo_ai", "manual", "barcode", "meal_plan"]).default("manual"),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        grams: z.number().min(1).max(5000),
        calories: z.number().min(0).max(5000),
        proteinG: z.number().min(0).max(500),
        carbsG: z.number().min(0).max(500),
        fatG: z.number().min(0).max(500),
      }),
    )
    .min(1),
  aiConfidence: z.number().min(0).max(1).optional(),
  provider: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    if (isSupabaseConfigured() && !auth) {
      return apiError("UNAUTHORIZED", "Vui lòng đăng nhập trước.", 401);
    }

    const raw = await req.json();
    const parsed = CreateMealSchema.safeParse(raw);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const data = parsed.data;
    const calories = Math.round(data.items.reduce((s, i) => s + i.calories, 0));
    const proteinG = Math.round(data.items.reduce((s, i) => s + i.proteinG, 0) * 10) / 10;
    const carbsG = Math.round(data.items.reduce((s, i) => s + i.carbsG, 0) * 10) / 10;
    const fatG = Math.round(data.items.reduce((s, i) => s + i.fatG, 0) * 10) / 10;

    const meal = await createMealLog(auth, {
      loggedDate: data.loggedDate,
      mealSlot: data.mealSlot,
      title: data.title,
      source: data.source,
      items: data.items,
      calories,
      proteinG,
      carbsG,
      fatG,
      aiConfidence: data.aiConfidence,
      provider: data.provider,
    });

    return apiOk({ meal }, 201);
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể lưu bữa ăn.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    if (isSupabaseConfigured() && !auth) {
      return apiError("UNAUTHORIZED", "Vui lòng đăng nhập trước.", 401);
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return apiError("MISSING_ID", "Thiếu id bữa ăn.", 400);

    await deleteMealLog(auth, id);
    return apiOk({ deleted: id });
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể xóa bữa ăn.", 500);
  }
}
