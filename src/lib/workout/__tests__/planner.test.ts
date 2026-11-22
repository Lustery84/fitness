import { describe, expect, it } from "vitest";
import {
  generateBodyFocusPlan,
  estimateWorkoutCalories,
} from "../body-focus-planner";

describe("Body-Focus Workout & Spot-Reduction Science Planner", () => {
  it("generates a balanced weekly plan combining compound work, targeted toning, and cardio", () => {
    const plan = generateBodyFocusPlan({
      focusRegions: ["belly", "thighs"],
      daysPerWeek: 4,
      equipment: "dumbbells",
      sex: "female",
    });

    expect(plan.days).toHaveLength(4);
    expect(plan.scienceNote).toContain("không thể giảm mỡ cục bộ");
    expect(plan.sources.length).toBeGreaterThanOrEqual(2);
    const allExercises = plan.days.flatMap((d) => d.exercises);
    expect(allExercises.some((e) => e.category === "compound")).toBe(true);
    expect(allExercises.some((e) => e.targetRegion === "belly")).toBe(true);
    expect(allExercises.some((e) => e.targetRegion === "thighs")).toBe(true);
  });

  it("estimates burned calories using MET formula", () => {
    // MET 6.0 * 70kg * 0.5h = 210 kcal
    expect(estimateWorkoutCalories({ met: 6.0, weightKg: 70, durationMin: 30 })).toBe(210);
  });
});
