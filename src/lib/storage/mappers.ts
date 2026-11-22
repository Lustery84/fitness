import type {
  ActivityLevel,
  BodyFocusRegion,
  BodyMeasurement,
  DietaryPref,
  EquipmentType,
  FitnessGoal,
  MealLog,
  MealLogItem,
  MealSlot,
  Sex,
  UserProfile,
  WorkoutLog,
} from "@/types/fitsnap";

export interface ProfileRow {
  id: string;
  display_name: string;
  sex: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number | null;
  activity_level: string;
  goal: string;
  weekly_rate_pct: number;
  focus_regions: string[];
  dietary_prefs: string[];
  max_cook_minutes: number;
  equipment: string;
  days_per_week: number;
  bmr_kcal: number;
  tdee_kcal: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  updated_at: string;
}

export interface MealRow {
  id: string;
  logged_date: string;
  meal_slot: string;
  title: string;
  source: string;
  items: MealLogItem[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ai_confidence: number | null;
  provider: string | null;
  created_at: string;
}

export interface WorkoutRow {
  id: string;
  logged_date: string;
  title: string;
  focus_region: string;
  duration_min: number;
  calories_burned: number;
  created_at: string;
}

export interface MeasurementRow {
  id: string;
  measured_date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  thigh_cm: number | null;
  arm_cm: number | null;
}

export function mapProfileToRow(profile: UserProfile): ProfileRow {
  return {
    id: profile.id,
    display_name: profile.displayName,
    sex: profile.sex,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    target_weight_kg: profile.targetWeightKg,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    weekly_rate_pct: profile.weeklyRatePct,
    focus_regions: profile.focusRegions,
    dietary_prefs: profile.dietaryPrefs,
    max_cook_minutes: profile.maxCookMinutes,
    equipment: profile.equipment,
    days_per_week: profile.daysPerWeek,
    bmr_kcal: profile.bmr,
    tdee_kcal: profile.tdee,
    target_calories: profile.targetCalories,
    target_protein_g: profile.targetProteinG,
    target_carbs_g: profile.targetCarbsG,
    target_fat_g: profile.targetFatG,
    updated_at: profile.updatedAt,
  };
}

export function mapProfileFromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    sex: row.sex as Sex,
    age: Number(row.age),
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    targetWeightKg: Number(row.target_weight_kg ?? row.weight_kg),
    activityLevel: row.activity_level as ActivityLevel,
    goal: row.goal as FitnessGoal,
    weeklyRatePct: Number(row.weekly_rate_pct),
    focusRegions: (row.focus_regions ?? ["belly"]) as BodyFocusRegion[],
    dietaryPrefs: (row.dietary_prefs ?? ["high_protein"]) as DietaryPref[],
    maxCookMinutes: Number(row.max_cook_minutes ?? 30),
    equipment: (row.equipment ?? "none") as EquipmentType,
    daysPerWeek: Number(row.days_per_week ?? 4),
    bmr: Number(row.bmr_kcal),
    tdee: Number(row.tdee_kcal),
    targetCalories: Number(row.target_calories),
    targetProteinG: Number(row.target_protein_g),
    targetCarbsG: Number(row.target_carbs_g),
    targetFatG: Number(row.target_fat_g),
    updatedAt: row.updated_at,
  };
}

export function mapMealFromRow(row: MealRow): MealLog {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    mealSlot: row.meal_slot as MealSlot,
    title: row.title,
    source: row.source as MealLog["source"],
    items: Array.isArray(row.items) ? row.items : [],
    calories: Number(row.calories),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    aiConfidence: row.ai_confidence !== null ? Number(row.ai_confidence) : undefined,
    provider: row.provider ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapWorkoutFromRow(row: WorkoutRow): WorkoutLog {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    title: row.title,
    focusRegion: row.focus_region as BodyFocusRegion,
    durationMin: Number(row.duration_min),
    caloriesBurned: Number(row.calories_burned),
    createdAt: row.created_at,
  };
}

export function mapMeasurementFromRow(row: MeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    measuredDate: row.measured_date,
    weightKg: row.weight_kg !== null ? Number(row.weight_kg) : undefined,
    waistCm: row.waist_cm !== null ? Number(row.waist_cm) : undefined,
    hipCm: row.hip_cm !== null ? Number(row.hip_cm) : undefined,
    thighCm: row.thigh_cm !== null ? Number(row.thigh_cm) : undefined,
    armCm: row.arm_cm !== null ? Number(row.arm_cm) : undefined,
  };
}
