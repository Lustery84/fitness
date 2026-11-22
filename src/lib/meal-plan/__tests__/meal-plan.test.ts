import { describe, expect, it } from "vitest";
import {
  generateWeeklyMealPlan,
  swapMealInPlan,
  buildGroceryList,
  matchRecipesByPantry,
  getIngredientSubstitutes,
  substituteGroceryItem,
  PANTRY_PRESET_INGREDIENTS,
} from "../generator";

describe("Eatr-style High-Protein Weekly Meal Plan", () => {
  it("builds a 7-day meal plan respecting dietary filters and max cook time", () => {
    const plan = generateWeeklyMealPlan({
      targetCalories: 1900,
      targetProteinG: 140,
      dietaryPrefs: ["high_protein"],
      maxCookMinutes: 30,
    });

    expect(plan.days).toHaveLength(7);
    for (const day of plan.days) {
      expect(day.meals.length).toBe(4); // breakfast, lunch, dinner, snack
      for (const meal of day.meals) {
        expect(meal.cookMinutes).toBeLessThanOrEqual(30);
      }
    }
  });

  it("filters out meat/fish when vegetarian preference is set", () => {
    const plan = generateWeeklyMealPlan({
      targetCalories: 1800,
      targetProteinG: 110,
      dietaryPrefs: ["vegetarian"],
      maxCookMinutes: 45,
    });

    const allMeals = plan.days.flatMap((d) => d.meals);
    expect(allMeals.every((m) => m.tags.includes("vegetarian"))).toBe(true);
  });

  it("swaps a meal in a slot with a different recipe while preserving slot", () => {
    const plan = generateWeeklyMealPlan({
      targetCalories: 2000,
      targetProteinG: 150,
      dietaryPrefs: ["high_protein"],
      maxCookMinutes: 45,
    });

    const originalMeal = plan.days[0].meals[1];
    const updated = swapMealInPlan(plan, 0, originalMeal.slot, {
      dietaryPrefs: ["high_protein"],
      maxCookMinutes: 45,
    });
    expect(updated.days[0].meals[1].id).not.toBe(originalMeal.id);
    expect(updated.days[0].meals[1].slot).toBe(originalMeal.slot);
  });

  it("aggregates a categorized grocery list across the weekly plan", () => {
    const plan = generateWeeklyMealPlan({
      targetCalories: 2000,
      targetProteinG: 150,
      dietaryPrefs: ["high_protein"],
      maxCookMinutes: 45,
    });

    const grocery = buildGroceryList(plan);
    expect(grocery.length).toBeGreaterThan(0);
    expect(grocery.every((g) => g.totalGrams > 0 && g.aisle.length > 0)).toBe(true);
  });

  it("matches and ranks recipes based on ingredients the user currently has", () => {
    expect(PANTRY_PRESET_INGREDIENTS.length).toBeGreaterThanOrEqual(10);
    const matches = matchRecipesByPantry(["Trứng gà", "Yến mạch cán dẹt", "Chuối chín"]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].matchedCount).toBe(matches[0].recipe.ingredients.length);
    expect(matches[0].missingIngredients).toHaveLength(0);
    expect(matches[0].matchPct).toBe(100);
  });

  it("provides practical grocery substitutes and swaps an unavailable ingredient cleanly", () => {
    const subs = getIngredientSubstitutes("Phi lê cá hồi");
    expect(subs.length).toBeGreaterThan(0);

    const list = [
      {
        name: "Phi lê cá hồi",
        totalGrams: 320,
        aisle: "Thịt, Cá & Đạm" as const,
      },
    ];
    const updated = substituteGroceryItem(list, "Phi lê cá hồi", subs[0].name);
    expect(updated[0].name).toBe(subs[0].name);
    expect(updated[0].substitutedFrom).toBe("Phi lê cá hồi");
  });
});
