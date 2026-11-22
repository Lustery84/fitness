import { describe, expect, it } from "vitest";
import {
  calculateBMR,
  calculateTDEE,
  calculateTargets,
  evaluateSafetyWarnings,
} from "../formulas";

describe("Mifflin-St Jeor BMR & TDEE", () => {
  it("calculates BMR accurately for adult male", () => {
    // 10*70 + 6.25*175 - 5*28 + 5 = 700 + 1093.75 - 140 + 5 = 1658.75 -> 1659
    expect(
      calculateBMR({ sex: "male", weightKg: 70, heightCm: 175, age: 28 }),
    ).toBe(1659);
  });

  it("calculates BMR accurately for adult female", () => {
    // 10*58 + 6.25*162 - 5*26 - 161 = 580 + 1012.5 - 130 - 161 = 1301.5 -> 1302
    expect(
      calculateBMR({ sex: "female", weightKg: 58, heightCm: 162, age: 26 }),
    ).toBe(1302);
  });

  it("applies standard activity multipliers for TDEE", () => {
    expect(calculateTDEE(1659, "sedentary")).toBe(1991); // 1659 * 1.2
    expect(calculateTDEE(1659, "moderate")).toBe(2571); // 1659 * 1.55
    expect(calculateTDEE(1659, "very_active")).toBe(3152); // 1659 * 1.9
  });
});

describe("Calorie & Macro Target Calculation", () => {
  it("computes fat-loss deficit and high-protein targets (1.6-2.2 g/kg)", () => {
    const res = calculateTargets({
      sex: "male",
      weightKg: 75,
      heightCm: 175,
      age: 27,
      activityLevel: "moderate",
      goal: "lose_fat",
      weeklyRatePct: 0.5,
    });

    expect(res.bmr).toBe(1714);
    expect(res.tdee).toBe(2657);
    expect(res.targetCalories).toBeGreaterThanOrEqual(res.bmr);
    expect(res.targetCalories).toBeLessThan(res.tdee);
    // Protein 1.6-2.2 g/kg for 75kg => 120g - 165g
    expect(res.proteinG).toBeGreaterThanOrEqual(120);
    expect(res.proteinG).toBeLessThanOrEqual(165);
    expect(res.fatG).toBeGreaterThan(0);
    expect(res.carbsG).toBeGreaterThanOrEqual(0);
  });

  it("enforces safety floor so targetCalories never drops below BMR", () => {
    const res = calculateTargets({
      sex: "female",
      weightKg: 50,
      heightCm: 158,
      age: 30,
      activityLevel: "sedentary",
      goal: "lose_fat",
      weeklyRatePct: 1.0,
    });

    expect(res.targetCalories).toBeGreaterThanOrEqual(res.bmr);
    expect(res.hitSafetyFloor).toBe(true);
  });

  it("sets higher calories and adequate protein for muscle gain", () => {
    const res = calculateTargets({
      sex: "male",
      weightKg: 65,
      heightCm: 172,
      age: 24,
      activityLevel: "active",
      goal: "build_muscle",
      weeklyRatePct: 0.25,
    });

    expect(res.targetCalories).toBeGreaterThan(res.tdee);
    expect(res.proteinG).toBeGreaterThanOrEqual(104); // >= 1.6 g/kg
  });
});

describe("Safety & Health Guardrails", () => {
  it("flags under-18, pregnant, medical condition, and extreme weekly rate", () => {
    const warnings = evaluateSafetyWarnings({
      age: 16,
      isPregnantOrNursing: true,
      hasMedicalCondition: true,
      weeklyRatePct: 1.4,
      hitSafetyFloor: true,
    });

    expect(warnings.some((w) => w.code === "UNDER_18")).toBe(true);
    expect(warnings.some((w) => w.code === "PREGNANT_OR_NURSING")).toBe(true);
    expect(warnings.some((w) => w.code === "MEDICAL_CONDITION")).toBe(true);
    expect(warnings.some((w) => w.code === "EXTREME_RATE")).toBe(true);
    expect(warnings.some((w) => w.code === "BMR_FLOOR_APPLIED")).toBe(true);
  });
});
