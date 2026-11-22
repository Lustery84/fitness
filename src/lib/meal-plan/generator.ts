import type { DietaryPref, MealSlot } from "@/types/fitsnap";

export interface MealIngredient {
  name: string;
  grams: number;
  aisle: "Thịt, Cá & Đạm" | "Rau củ & Trái cây" | "Tinh bột & Hạt" | "Sữa & Gia vị";
}

export interface RecipeTemplate {
  id: string;
  slot: MealSlot;
  title: string;
  cookMinutes: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: DietaryPref[];
  ingredients: MealIngredient[];
  source: string;
}

export interface WeeklyMealPlan {
  targetCalories: number;
  targetProteinG: number;
  days: {
    dayIndex: number;
    dayLabel: string;
    meals: RecipeTemplate[];
    totalCalories: number;
    totalProteinG: number;
  }[];
}

export interface GroceryItem {
  name: string;
  totalGrams: number;
  aisle: MealIngredient["aisle"];
  substitutedFrom?: string;
}

export interface PantryMatchResult {
  recipe: RecipeTemplate;
  matchedCount: number;
  missingIngredients: MealIngredient[];
  matchPct: number;
}

export interface IngredientSubstitute {
  name: string;
  note: string;
}

export const PANTRY_PRESET_INGREDIENTS: string[] = [
  "Trứng gà",
  "Ức gà",
  "Thịt bò",
  "Thịt heo nạc",
  "Cá hồi",
  "Tôm",
  "Đậu hũ",
  "Cơm / Gạo lứt",
  "Yến mạch",
  "Khoai lang",
  "Bánh mì",
  "Bún tươi",
  "Bông cải xanh",
  "Rau xà lách / Rau cải",
  "Chuối chín",
  "Sữa chua Hy Lạp",
  "Whey Protein",
];

export const RECIPE_BANK: RecipeTemplate[] = [
  // Breakfast
  {
    id: "bf-egg-oats",
    slot: "breakfast",
    title: "Yến mạch + 2 trứng ốp la & chuối",
    cookMinutes: 10,
    calories: 430,
    proteinG: 24,
    carbsG: 52,
    fatG: 14,
    tags: ["high_protein", "balanced", "vegetarian", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Yến mạch cán dẹt", grams: 50, aisle: "Tinh bột & Hạt" },
      { name: "Trứng gà", grams: 110, aisle: "Thịt, Cá & Đạm" },
      { name: "Chuối chín", grams: 110, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA FoodData Central",
  },
  {
    id: "bf-greek-yogurt-whey",
    slot: "breakfast",
    title: "Sữa chua Hy Lạp + Whey + Hạt chia",
    cookMinutes: 5,
    calories: 360,
    proteinG: 41,
    carbsG: 26,
    fatG: 8,
    tags: ["high_protein", "low_carb", "vegetarian", "no_seafood"],
    ingredients: [
      { name: "Sữa chua Hy Lạp không đường", grams: 170, aisle: "Sữa & Gia vị" },
      { name: "Whey Protein Isolate", grams: 30, aisle: "Thịt, Cá & Đạm" },
      { name: "Chuối / Dâu tây", grams: 100, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA FoodData Central",
  },
  {
    id: "bf-banh-mi-trung",
    slot: "breakfast",
    title: "Bánh mì nguyên cám + ức gà xé & dưa leo",
    cookMinutes: 12,
    calories: 440,
    proteinG: 36,
    carbsG: 46,
    fatG: 10,
    tags: ["high_protein", "balanced", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Bánh mì nguyên cám", grams: 90, aisle: "Tinh bột & Hạt" },
      { name: "Ức gà chín", grams: 120, aisle: "Thịt, Cá & Đạm" },
      { name: "Dưa leo & rau thơm", grams: 80, aisle: "Rau củ & Trái cây" },
    ],
    source: "Viện Dinh dưỡng QG VN",
  },
  // Lunch
  {
    id: "ln-chicken-rice",
    slot: "lunch",
    title: "Cơm gạo lứt + Ức gà áp chảo & Bông cải",
    cookMinutes: 20,
    calories: 560,
    proteinG: 48,
    carbsG: 62,
    fatG: 11,
    tags: ["high_protein", "balanced", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Ức gà phi lê", grams: 180, aisle: "Thịt, Cá & Đạm" },
      { name: "Gạo lứt (trọng lượng sống)", grams: 75, aisle: "Tinh bột & Hạt" },
      { name: "Bông cải xanh", grams: 180, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA & Viện Dinh dưỡng VN",
  },
  {
    id: "ln-bun-bo-nac",
    slot: "lunch",
    title: "Bún bò nạc thăn ít bánh + rau sống",
    cookMinutes: 25,
    calories: 510,
    proteinG: 39,
    carbsG: 54,
    fatG: 13,
    tags: ["high_protein", "balanced", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Thịt bò nạc thăn", grams: 150, aisle: "Thịt, Cá & Đạm" },
      { name: "Bún tươi", grams: 160, aisle: "Tinh bột & Hạt" },
      { name: "Rau xà lách & giá đỗ", grams: 150, aisle: "Rau củ & Trái cây" },
    ],
    source: "Viện Dinh dưỡng QG VN",
  },
  {
    id: "ln-tofu-edamame",
    slot: "lunch",
    title: "Đậu hũ non áp chảo + Đậu nành Edamame & Cơm lứt",
    cookMinutes: 20,
    calories: 510,
    proteinG: 32,
    carbsG: 58,
    fatG: 15,
    tags: ["high_protein", "balanced", "vegetarian", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Đậu hũ trắng", grams: 220, aisle: "Thịt, Cá & Đạm" },
      { name: "Đậu nành Edamame", grams: 100, aisle: "Thịt, Cá & Đạm" },
      { name: "Gạo lứt (trọng lượng sống)", grams: 70, aisle: "Tinh bột & Hạt" },
    ],
    source: "USDA FoodData Central",
  },
  // Dinner
  {
    id: "dn-salmon-sweet-potato",
    slot: "dinner",
    title: "Cá hồi áp chảo + Khoai lang & Măng tây",
    cookMinutes: 25,
    calories: 540,
    proteinG: 38,
    carbsG: 42,
    fatG: 22,
    tags: ["high_protein", "low_carb", "balanced", "no_dairy"],
    ingredients: [
      { name: "Phi lê cá hồi", grams: 160, aisle: "Thịt, Cá & Đạm" },
      { name: "Khoai lang", grams: 160, aisle: "Tinh bột & Hạt" },
      { name: "Măng tây / Bông cải", grams: 150, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA FoodData Central",
  },
  {
    id: "dn-shrimp-salad",
    slot: "dinner",
    title: "Gỏi cuốn tôm thịt nạc (4 cuốn)",
    cookMinutes: 20,
    calories: 430,
    proteinG: 34,
    carbsG: 46,
    fatG: 10,
    tags: ["high_protein", "balanced", "no_dairy"],
    ingredients: [
      { name: "Tôm sú bóc vỏ", grams: 140, aisle: "Thịt, Cá & Đạm" },
      { name: "Thịt heo nạc thăn", grams: 80, aisle: "Thịt, Cá & Đạm" },
      { name: "Bánh tráng & rau sống", grams: 160, aisle: "Rau củ & Trái cây" },
    ],
    source: "Viện Dinh dưỡng QG VN",
  },
  {
    id: "dn-veg-tempeh-salad",
    slot: "dinner",
    title: "Salad Đậu hũ nướng + Trứng luộc & Dầu ô liu",
    cookMinutes: 15,
    calories: 450,
    proteinG: 30,
    carbsG: 26,
    fatG: 24,
    tags: ["high_protein", "low_carb", "vegetarian", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Đậu hũ cứng", grams: 200, aisle: "Thịt, Cá & Đạm" },
      { name: "Trứng gà", grams: 110, aisle: "Thịt, Cá & Đạm" },
      { name: "Xà lách & cà chua bi", grams: 180, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA FoodData Central",
  },
  {
    id: "dn-lean-pork-stirfry",
    slot: "dinner",
    title: "Thịt thăn heo xào nấm & rau cải + ít cơm",
    cookMinutes: 20,
    calories: 490,
    proteinG: 40,
    carbsG: 42,
    fatG: 15,
    tags: ["high_protein", "balanced", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Thịt thăn heo", grams: 170, aisle: "Thịt, Cá & Đạm" },
      { name: "Nấm & rau cải", grams: 200, aisle: "Rau củ & Trái cây" },
      { name: "Gạo trắng/lứt", grams: 55, aisle: "Tinh bột & Hạt" },
    ],
    source: "Viện Dinh dưỡng QG VN",
  },
  // Snack
  {
    id: "sn-whey-banana",
    slot: "snack",
    title: "1 muỗng Whey Protein + 1 quả chuối",
    cookMinutes: 2,
    calories: 220,
    proteinG: 26,
    carbsG: 28,
    fatG: 1,
    tags: ["high_protein", "balanced", "vegetarian", "no_seafood"],
    ingredients: [
      { name: "Whey Protein Isolate", grams: 30, aisle: "Thịt, Cá & Đạm" },
      { name: "Chuối chín", grams: 118, aisle: "Rau củ & Trái cây" },
    ],
    source: "USDA FoodData Central",
  },
  {
    id: "sn-soy-edamame",
    slot: "snack",
    title: "Đậu nành Edamame luộc + Sữa đậu nành ít đường",
    cookMinutes: 8,
    calories: 240,
    proteinG: 22,
    carbsG: 18,
    fatG: 8,
    tags: ["high_protein", "low_carb", "vegetarian", "no_dairy", "no_seafood"],
    ingredients: [
      { name: "Đậu nành Edamame", grams: 150, aisle: "Thịt, Cá & Đạm" },
      { name: "Sữa đậu nành không đường", grams: 200, aisle: "Sữa & Gia vị" },
    ],
    source: "USDA FoodData Central",
  },
];

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function filterRecipes(slot: MealSlot, dietaryPrefs: DietaryPref[], maxCookMinutes: number): RecipeTemplate[] {
  const strictTags = dietaryPrefs.filter((p) =>
    ["vegetarian", "no_dairy", "no_seafood", "low_carb"].includes(p),
  );

  const matched = RECIPE_BANK.filter((r) => {
    if (r.slot !== slot) return false;
    if (r.cookMinutes > maxCookMinutes) return false;
    return strictTags.every((tag) => r.tags.includes(tag));
  });

  if (matched.length > 0) return matched;
  // Relax cook-time constraint if strict diet + time yielded 0 items
  const dietOnly = RECIPE_BANK.filter(
    (r) => r.slot === slot && strictTags.every((tag) => r.tags.includes(tag)),
  );
  return dietOnly.length > 0 ? dietOnly : RECIPE_BANK.filter((r) => r.slot === slot);
}

export function generateWeeklyMealPlan(params: {
  targetCalories: number;
  targetProteinG: number;
  dietaryPrefs: DietaryPref[];
  maxCookMinutes: number;
}): WeeklyMealPlan {
  const days = DAY_LABELS.map((dayLabel, dayIndex) => {
    const meals = SLOTS.map((slot) => {
      const pool = filterRecipes(slot, params.dietaryPrefs, params.maxCookMinutes);
      return pool[dayIndex % pool.length];
    });
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProteinG = meals.reduce((sum, m) => sum + m.proteinG, 0);
    return { dayIndex, dayLabel, meals, totalCalories, totalProteinG };
  });

  return {
    targetCalories: params.targetCalories,
    targetProteinG: params.targetProteinG,
    days,
  };
}

export function swapMealInPlan(
  plan: WeeklyMealPlan,
  dayIndex: number,
  slot: MealSlot,
  opts: { dietaryPrefs: DietaryPref[]; maxCookMinutes: number },
): WeeklyMealPlan {
  const day = plan.days[dayIndex];
  if (!day) return plan;
  const current = day.meals.find((m) => m.slot === slot);
  const pool = filterRecipes(slot, opts.dietaryPrefs, opts.maxCookMinutes);
  const nextRecipe =
    pool.find((r) => r.id !== current?.id) ??
    RECIPE_BANK.find((r) => r.slot === slot && r.id !== current?.id) ??
    current;

  if (!nextRecipe) return plan;

  const updatedDays = plan.days.map((d, idx) => {
    if (idx !== dayIndex) return d;
    const meals = d.meals.map((m) => (m.slot === slot ? nextRecipe : m));
    return {
      ...d,
      meals,
      totalCalories: meals.reduce((s, m) => s + m.calories, 0),
      totalProteinG: meals.reduce((s, m) => s + m.proteinG, 0),
    };
  });

  return { ...plan, days: updatedDays };
}

export function buildGroceryList(plan: WeeklyMealPlan): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const key = `${ing.aisle}::${ing.name}`;
        const existing = map.get(key);
        if (existing) {
          existing.totalGrams += ing.grams;
        } else {
          map.set(key, {
            name: ing.name,
            totalGrams: ing.grams,
            aisle: ing.aisle,
          });
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.aisle.localeCompare(b.aisle));
}

function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function ingredientMatchesPantry(ingName: string, pantryTokens: string[]): boolean {
  const target = normalizeText(ingName);
  return pantryTokens.some((token) => {
    if (!token) return false;
    if (target.includes(token) || token.includes(target)) return true;
    const words = token.split(/[\s/,]+/).filter((w) => w.length >= 2);
    return words.some((w) => target.includes(w));
  });
}

export function matchRecipesByPantry(
  availableIngredients: string[],
  dietaryPrefs: DietaryPref[] = [],
): PantryMatchResult[] {
  const pantryTokens = availableIngredients.map(normalizeText).filter(Boolean);
  const strictTags = dietaryPrefs.filter((p) =>
    ["vegetarian", "no_dairy", "no_seafood", "low_carb"].includes(p),
  );

  const pool = RECIPE_BANK.filter((r) =>
    strictTags.every((tag) => r.tags.includes(tag)),
  );

  return pool
    .map((recipe) => {
      const missingIngredients = recipe.ingredients.filter(
        (ing) => !ingredientMatchesPantry(ing.name, pantryTokens),
      );
      const matchedCount = recipe.ingredients.length - missingIngredients.length;
      const matchPct = Math.round(
        (matchedCount / Math.max(1, recipe.ingredients.length)) * 100,
      );
      return { recipe, matchedCount, missingIngredients, matchPct };
    })
    .sort((a, b) => {
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
      return b.recipe.proteinG - a.recipe.proteinG;
    });
}

const SUBSTITUTES_MAP: { match: string; options: IngredientSubstitute[] }[] = [
  {
    match: "ca hoi",
    options: [
      { name: "Phi lê cá basa / cá thu", note: "Đạm tương đương, dễ mua & rẻ hơn" },
      { name: "Ức gà phi lê", note: "Giàu đạm, ít béo hơn" },
      { name: "Đậu hũ cứng + 2 trứng", note: "Thay thế không cần cá" },
    ],
  },
  {
    match: "uc ga",
    options: [
      { name: "Thịt thăn heo nạc", note: "Đạm cao, dễ chế biến tương tự" },
      { name: "Phi lê cá diêu hồng / cá basa", note: "Nhẹ bụng, giàu đạm" },
      { name: "Đậu hũ trắng + Edamame", note: "Lựa chọn thực vật" },
    ],
  },
  {
    match: "thit bo",
    options: [
      { name: "Thịt thăn heo nạc", note: "Tiết kiệm hơn, đạm tương đương" },
      { name: "Ức gà áp chảo", note: "Ít chất béo bão hòa hơn" },
    ],
  },
  {
    match: "tom",
    options: [
      { name: "Ức gà xé", note: "Thay thế nếu hết hải sản" },
      { name: "Đậu hũ non + Trứng luộc", note: "Dễ tìm ở chợ/siêu thị" },
    ],
  },
  {
    match: "yen mach",
    options: [
      { name: "Khoai lang luộc", note: "Tinh bột chậm no lâu tương đương" },
      { name: "Cơm gạo lứt", note: "Dễ ăn quen miệng" },
    ],
  },
  {
    match: "gao lut",
    options: [
      { name: "Cơm trắng (giảm 20% lượng)", note: "Dễ nấu nếu không có gạo lứt" },
      { name: "Khoai lang hấp", note: "Nhiều chất xơ, no lâu" },
    ],
  },
  {
    match: "sua chua hy lap",
    options: [
      { name: "Sữa chua ít đường + 1/2 muỗng Whey", note: "Bù đủ đạm tương đương" },
      { name: "Sữa đậu nành không đường", note: "Không lactose, dễ mua" },
    ],
  },
  {
    match: "whey",
    options: [
      { name: "3 lòng trắng trứng + 1 trứng nguyên quả", note: "Bù ~24g đạm tự nhiên" },
      { name: "150g ức gà luộc xé", note: "Đủ đạm tương đương 1 muỗng whey" },
    ],
  },
  {
    match: "bong cai",
    options: [
      { name: "Rau cải thìa / Cải ngọt", note: "Dễ tìm ngoài chợ Việt" },
      { name: "Đậu cô ve / Bầu luộc", note: "Giàu chất xơ tương đương" },
    ],
  },
  {
    match: "mang tay",
    options: [
      { name: "Đậu cô ve / Bông cải xanh", note: "Rẻ hơn và dễ tìm hơn" },
      { name: "Rau cải ngọt xào tỏi", note: "Thanh nhẹ, nhiều vi chất" },
    ],
  },
];

export function getIngredientSubstitutes(ingredientName: string): IngredientSubstitute[] {
  const norm = normalizeText(ingredientName);
  for (const entry of SUBSTITUTES_MAP) {
    if (norm.includes(entry.match)) {
      return entry.options;
    }
  }
  return [
    { name: "Ức gà / Trứng gà (nếu là đạm)", note: "Thay thế nhanh dễ kiếm" },
    { name: "Rau xanh theo mùa / Cơm trắng vừa phần", note: "Linh hoạt theo đồ có sẵn" },
  ];
}

export function substituteGroceryItem(
  list: GroceryItem[],
  targetName: string,
  newName: string,
): GroceryItem[] {
  return list.map((item) =>
    item.name === targetName
      ? {
          ...item,
          name: newName,
          substitutedFrom: item.substitutedFrom ?? targetName,
        }
      : item,
  );
}
