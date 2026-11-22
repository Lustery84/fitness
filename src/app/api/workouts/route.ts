import { z } from "zod";
import { apiError, apiOk, zodErrorResponse } from "@/lib/api/http";
import {
  createWorkoutLog,
  deleteWorkoutLog,
  loadAppState,
  resolveAuthContext,
} from "@/lib/storage/repository";
import { isSupabaseConfigured } from "@/lib/storage/supabase";
import { estimateWorkoutCalories } from "@/lib/workout/body-focus-planner";

const CreateWorkoutSchema = z.object({
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(160),
  focusRegion: z
    .enum(["belly", "thighs", "arms", "glutes", "chest_back", "full_body"])
    .default("full_body"),
  durationMin: z.number().int().min(1).max(480),
  met: z.number().min(1.5).max(15).default(5.5),
  caloriesBurned: z.number().int().min(0).max(5000).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    if (isSupabaseConfigured() && !auth) {
      return apiError("UNAUTHORIZED", "Vui lòng đăng nhập trước.", 401);
    }

    const raw = await req.json();
    const parsed = CreateWorkoutSchema.safeParse(raw);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const state = await loadAppState(auth);
    const weightKg = state.profile?.weightKg ?? 65;
    const caloriesBurned =
      parsed.data.caloriesBurned ??
      estimateWorkoutCalories({
        met: parsed.data.met,
        weightKg,
        durationMin: parsed.data.durationMin,
      });

    const workout = await createWorkoutLog(auth, {
      loggedDate: parsed.data.loggedDate,
      title: parsed.data.title,
      focusRegion: parsed.data.focusRegion,
      durationMin: parsed.data.durationMin,
      caloriesBurned,
    });

    return apiOk({ workout }, 201);
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể lưu buổi tập.", 500);
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
    if (!id) return apiError("MISSING_ID", "Thiếu id buổi tập.", 400);

    await deleteWorkoutLog(auth, id);
    return apiOk({ deleted: id });
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể xóa buổi tập.", 500);
  }
}
