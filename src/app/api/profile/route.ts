import { z } from "zod";
import { apiError, apiOk, zodErrorResponse } from "@/lib/api/http";
import {
  calculateTargets,
  evaluateSafetyWarnings,
} from "@/lib/nutrition/formulas";
import { resolveAuthContext, saveUserProfile } from "@/lib/storage/repository";
import { isSupabaseConfigured } from "@/lib/storage/supabase";
import type { UserProfile } from "@/types/fitsnap";

const ProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60).default("Bạn"),
  sex: z.enum(["male", "female"]),
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(30).max(250),
  targetWeightKg: z.number().min(30).max(250),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum(["lose_fat", "recomp", "maintain", "build_muscle"]),
  weeklyRatePct: z.number().min(0).max(1.5).default(0.5),
  focusRegions: z
    .array(
      z.enum(["belly", "thighs", "arms", "glutes", "chest_back", "full_body"]),
    )
    .min(1)
    .max(4),
  dietaryPrefs: z
    .array(
      z.enum([
        "high_protein",
        "balanced",
        "low_carb",
        "vegetarian",
        "no_dairy",
        "no_seafood",
      ]),
    )
    .min(1),
  maxCookMinutes: z.number().int().min(5).max(90).default(30),
  equipment: z.enum(["none", "dumbbells", "gym"]).default("none"),
  daysPerWeek: z.number().int().min(3).max(6).default(4),
  isPregnantOrNursing: z.boolean().optional(),
  hasMedicalCondition: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    if (isSupabaseConfigured() && !auth) {
      return apiError("UNAUTHORIZED", "Vui lòng đăng nhập trước.", 401);
    }

    const raw = await req.json();
    const parsed = ProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const input = parsed.data;
    const targets = calculateTargets({
      sex: input.sex,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      age: input.age,
      activityLevel: input.activityLevel,
      goal: input.goal,
      weeklyRatePct: input.weeklyRatePct,
    });

    const warnings = evaluateSafetyWarnings({
      age: input.age,
      isPregnantOrNursing: input.isPregnantOrNursing,
      hasMedicalCondition: input.hasMedicalCondition,
      weeklyRatePct: input.weeklyRatePct,
      hitSafetyFloor: targets.hitSafetyFloor,
    });

    if (warnings.some((w) => w.severity === "block")) {
      return apiError(
        "SAFETY_BLOCK",
        warnings.find((w) => w.severity === "block")?.message ??
          "Mục tiêu chưa phù hợp điều kiện an toàn.",
        422,
        { warnings },
      );
    }

    const now = new Date().toISOString();
    const profileDraft: UserProfile = {
      id: auth?.userId ?? "local-user",
      displayName: input.displayName,
      sex: input.sex,
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      targetWeightKg: input.targetWeightKg,
      activityLevel: input.activityLevel,
      goal: input.goal,
      weeklyRatePct: input.weeklyRatePct,
      focusRegions: input.focusRegions,
      dietaryPrefs: input.dietaryPrefs,
      maxCookMinutes: input.maxCookMinutes,
      equipment: input.equipment,
      daysPerWeek: input.daysPerWeek,
      bmr: targets.bmr,
      tdee: targets.tdee,
      targetCalories: targets.targetCalories,
      targetProteinG: targets.proteinG,
      targetCarbsG: targets.carbsG,
      targetFatG: targets.fatG,
      updatedAt: now,
    };

    const profile = await saveUserProfile(auth, profileDraft);
    return apiOk({ profile, warnings, sources: targets.sources });
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể lưu hồ sơ.", 500);
  }
}
