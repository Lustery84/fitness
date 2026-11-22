export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type FitnessGoal =
  | "lose_fat"
  | "recomp"
  | "maintain"
  | "build_muscle";

export type BodyFocusRegion =
  | "belly"
  | "thighs"
  | "arms"
  | "glutes"
  | "chest_back"
  | "full_body";

export type DietaryPref =
  | "high_protein"
  | "balanced"
  | "low_carb"
  | "vegetarian"
  | "no_dairy"
  | "no_seafood";

export type EquipmentType = "none" | "dumbbells" | "gym";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface UserProfile {
  id: string;
  displayName: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  weeklyRatePct: number;
  focusRegions: BodyFocusRegion[];
  dietaryPrefs: DietaryPref[];
  maxCookMinutes: number;
  equipment: EquipmentType;
  daysPerWeek: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  nameEn: string;
  category: "vietnamese" | "protein" | "carb" | "vegetable" | "snack" | "drink";
  servingLabel: string;
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: string;
}

export interface MealLogItem {
  name: string;
  grams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealLog {
  id: string;
  loggedDate: string; // YYYY-MM-DD
  mealSlot: MealSlot;
  title: string;
  source: "photo_ai" | "manual" | "barcode" | "meal_plan";
  items: MealLogItem[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  aiConfidence?: number;
  provider?: string;
  createdAt: string;
}

export interface WorkoutLog {
  id: string;
  loggedDate: string;
  title: string;
  focusRegion: BodyFocusRegion;
  durationMin: number;
  caloriesBurned: number;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  measuredDate: string;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  thighCm?: number;
  armCm?: number;
}
