import { describe, expect, it } from "vitest";
import { searchFoods, scaleFoodMacros, VIETNAMESE_FOODS } from "../vietnamese-foods";

describe("Vietnamese & Fitness Food Database", () => {
  it("includes curated Vietnamese dishes with cited nutrition sources", () => {
    expect(VIETNAMESE_FOODS.length).toBeGreaterThanOrEqual(15);
    for (const food of VIETNAMESE_FOODS) {
      expect(food.source.length).toBeGreaterThan(3);
      expect(food.calories).toBeGreaterThan(0);
    }
  });

  it("finds Vietnamese dishes with or without Vietnamese diacritics", () => {
    const withAccents = searchFoods("phở bò");
    const withoutAccents = searchFoods("pho bo");
    expect(withAccents.length).toBeGreaterThan(0);
    expect(withoutAccents.length).toBeGreaterThan(0);
    expect(withoutAccents[0].id).toBe(withAccents[0].id);
  });

  it("scales calories and macros accurately by serving multiplier", () => {
    const pho = searchFoods("pho bo")[0];
    const half = scaleFoodMacros(pho, 0.5);
    expect(half.calories).toBe(Math.round(pho.calories * 0.5));
    expect(half.proteinG).toBe(Math.round(pho.proteinG * 0.5 * 10) / 10);
  });
});
