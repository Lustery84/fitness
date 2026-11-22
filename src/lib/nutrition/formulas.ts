import type { ActivityLevel, FitnessGoal, Sex } from "@/types/fitsnap";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface BmrInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}

export interface TargetInput extends BmrInput {
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  weeklyRatePct: number;
}

export interface TargetOutput {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  hitSafetyFloor: boolean;
  sources: string[];
}

export interface SafetyWarning {
  code:
    | "UNDER_18"
    | "PREGNANT_OR_NURSING"
    | "MEDICAL_CONDITION"
    | "EXTREME_RATE"
    | "BMR_FLOOR_APPLIED";
  severity: "block" | "caution";
  message: string;
}

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation.
 */
export function calculateBMR({ sex, weightKg, heightCm, age }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

/**
 * Calculates Total Daily Energy Expenditure from BMR and activity level.
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Computes daily calorie and macro targets with BMR safety floor and ISSN protein guidelines (1.6-2.2 g/kg).
 */
export function calculateTargets(input: TargetInput): TargetOutput {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);

  let rawCalories = tdee;
  if (input.goal === "lose_fat") {
    // 1 kg body fat ~ 7700 kcal; cap daily deficit between 15% and 25% of TDEE
    const dailyDeficitFromRate = (input.weightKg * (input.weeklyRatePct / 100) * 7700) / 7;
    const clampedDeficit = Math.min(Math.max(dailyDeficitFromRate, tdee * 0.15), tdee * 0.25);
    rawCalories = Math.round(tdee - clampedDeficit);
  } else if (input.goal === "recomp") {
    rawCalories = Math.round(tdee * 0.9);
  } else if (input.goal === "build_muscle") {
    rawCalories = Math.round(tdee * 1.12);
  }

  const hitSafetyFloor = rawCalories < bmr;
  const targetCalories = Math.max(rawCalories, bmr);

  // Protein: 2.0 g/kg for fat loss/recomp, 1.8 g/kg for muscle/maintain (within 1.6-2.2 g/kg ISSN range)
  const proteinPerKg = input.goal === "lose_fat" || input.goal === "recomp" ? 2.0 : 1.8;
  const proteinG = Math.round(input.weightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;

  // Fat: ~0.8 g/kg or at least 22% of target calories, capped so carbs don't go negative
  const minFatKcal = targetCalories * 0.22;
  const desiredFatG = Math.max(Math.round(input.weightKg * 0.8), Math.round(minFatKcal / 9));
  const maxFatG = Math.max(20, Math.floor((targetCalories - proteinKcal) / 9));
  const fatG = Math.min(desiredFatG, maxFatG);
  const fatKcal = fatG * 9;

  const remainingKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const carbsG = Math.round(remainingKcal / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    hitSafetyFloor,
    sources: [
      "Mifflin-St Jeor (1990) — Phương trình ước tính BMR",
      "ISSN Position Stand (2017) — Khuyến nghị 1.6–2.2 g protein/kg khi giảm mỡ & giữ cơ",
      "WHO / CDC — Tốc độ giảm cân an toàn 0.5–1% cân nặng/tuần",
    ],
  };
}

/**
 * Evaluates health and safety guardrails before applying nutrition targets.
 */
export function evaluateSafetyWarnings(params: {
  age: number;
  isPregnantOrNursing?: boolean;
  hasMedicalCondition?: boolean;
  weeklyRatePct: number;
  hitSafetyFloor: boolean;
}): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  if (params.age < 18) {
    warnings.push({
      code: "UNDER_18",
      severity: "block",
      message:
        "Ứng dụng chỉ dành cho người từ 18 tuổi trở lên. Người dưới 18 tuổi đang phát triển cần tư vấn bác sĩ hoặc chuyên gia dinh dưỡng.",
    });
  }
  if (params.isPregnantOrNursing) {
    warnings.push({
      code: "PREGNANT_OR_NURSING",
      severity: "block",
      message:
        "Phụ nữ mang thai hoặc cho con bú không nên áp dụng thâm hụt calo tự động. Vui lòng tham khảo ý kiến bác sĩ sản khoa/dinh dưỡng.",
    });
  }
  if (params.hasMedicalCondition) {
    warnings.push({
      code: "MEDICAL_CONDITION",
      severity: "caution",
      message:
        "Bạn có bệnh lý nền (tiểu đường, tim mạch, thận, rối loạn ăn uống...): hãy trao đổi với bác sĩ trước khi thay đổi chế độ ăn hoặc tập nặng.",
    });
  }
  if (params.weeklyRatePct > 1.0) {
    warnings.push({
      code: "EXTREME_RATE",
      severity: "caution",
      message:
        "Tốc độ giảm trên 1% cân nặng/tuần dễ gây mất cơ, mệt mỏi và rối loạn chuyển hóa. Hệ thống khuyến nghị giữ ở mức 0.5–1%/tuần.",
    });
  }
  if (params.hitSafetyFloor) {
    warnings.push({
      code: "BMR_FLOOR_APPLIED",
      severity: "caution",
      message:
        "Mức calo thâm hụt thấp hơn BMR đã được tự động nâng lên bằng sàn an toàn (BMR) để bảo vệ sức khỏe chuyển hóa.",
    });
  }

  return warnings;
}
