import { describe, expect, it } from "vitest";
import {
  mapProfileFromRow,
  mapProfileToRow,
  mapMealFromRow,
  mapWorkoutFromRow,
  mapMeasurementFromRow,
} from "../mappers";

describe("Supabase Row Mappers", () => {
  it("maps UserProfile to DB row and back without losing fields", () => {
    const profile = {
      id: "user-123",
      displayName: "Minh",
      sex: "male" as const,
      age: 26,
      heightCm: 173,
      weightKg: 74,
      targetWeightKg: 68,
      activityLevel: "moderate" as const,
      goal: "lose_fat" as const,
      weeklyRatePct: 0.5,
      focusRegions: ["belly" as const, "thighs" as const],
      dietaryPrefs: ["high_protein" as const],
      maxCookMinutes: 30,
      equipment: "dumbbells" as const,
      daysPerWeek: 4,
      bmr: 1696,
      tdee: 2629,
      targetCalories: 2222,
      targetProteinG: 148,
      targetCarbsG: 275,
      targetFatG: 59,
      updatedAt: "2026-11-23T00:00:00.000Z",
    };

    const row = mapProfileToRow(profile);
    expect(row.id).toBe("user-123");
    expect(row.days_per_week).toBe(4);
    expect(row.bmr_kcal).toBe(1696);

    const roundTrip = mapProfileFromRow(row);
    expect(roundTrip).toEqual(profile);
  });

  it("maps meal, workout, and measurement DB rows accurately", () => {
    const meal = mapMealFromRow({
      id: "m-1",
      logged_date: "2026-11-23",
      meal_slot: "lunch",
      title: "Phở bò",
      source: "manual",
      items: [{ name: "Phở bò", grams: 550, calories: 430, proteinG: 26, carbsG: 54, fatG: 11 }],
      calories: 430,
      protein_g: 26,
      carbs_g: 54,
      fat_g: 11,
      ai_confidence: null,
      provider: null,
      created_at: "2026-11-23T05:00:00Z",
    });
    expect(meal.calories).toBe(430);
    expect(meal.proteinG).toBe(26);

    const workout = mapWorkoutFromRow({
      id: "w-1",
      logged_date: "2026-11-23",
      title: "Plank",
      focus_region: "belly",
      duration_min: 30,
      calories_burned: 180,
      created_at: "2026-11-23T06:00:00Z",
    });
    expect(workout.caloriesBurned).toBe(180);

    const ms = mapMeasurementFromRow({
      id: "ms-1",
      measured_date: "2026-11-23",
      weight_kg: 73.5,
      waist_cm: 80,
      hip_cm: null,
      thigh_cm: null,
      arm_cm: null,
    });
    expect(ms.weightKg).toBe(73.5);
    expect(ms.waistCm).toBe(80);
    expect(ms.hipCm).toBeUndefined();
  });
});
