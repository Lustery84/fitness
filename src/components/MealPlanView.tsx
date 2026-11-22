"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Check,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { DishIllustration } from "./DishIllustration";
import { authFetch } from "@/lib/api/auth-fetch";
import {
  buildGroceryList,
  generateWeeklyMealPlan,
  getIngredientSubstitutes,
  substituteGroceryItem,
  swapMealInPlan,
  type GroceryItem,
  type RecipeTemplate,
  type WeeklyMealPlan,
} from "@/lib/meal-plan/generator";
import type { MealLog, MealSlot, UserProfile } from "@/types/fitsnap";

interface MealPlanViewProps {
  initialView?: "menu" | "grocery";
  profile: UserProfile;
  todayDate: string;
  onMealLogged: (meal: MealLog) => void;
}

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Phụ",
};

export function MealPlanView({
  initialView = "grocery",
  profile,
  todayDate,
  onMealLogged,
}: MealPlanViewProps) {
  const [plan, setPlan] = useState<WeeklyMealPlan>(() =>
    generateWeeklyMealPlan({
      targetCalories: profile.targetCalories,
      targetProteinG: profile.targetProteinG,
      dietaryPrefs: profile.dietaryPrefs,
      maxCookMinutes: profile.maxCookMinutes,
    }),
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<"menu" | "grocery">(initialView);
  const [checkedGrocery, setCheckedGrocery] = useState<Record<string, boolean>>({});
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [editingSubKey, setEditingSubKey] = useState<string | null>(null);
  const [customSubText, setCustomSubText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const groceryList: GroceryItem[] = useMemo(() => {
    let list = buildGroceryList(plan);
    for (const [origName, newName] of Object.entries(substitutions)) {
      list = substituteGroceryItem(list, origName, newName);
    }
    return list;
  }, [plan, substitutions]);

  const activeDay = plan.days[selectedDay] ?? plan.days[0];

  function handleSwapMeal(slot: MealSlot) {
    setPlan((prev) =>
      swapMealInPlan(prev, selectedDay, slot, {
        dietaryPrefs: profile.dietaryPrefs,
        maxCookMinutes: profile.maxCookMinutes,
      }),
    );
  }

  function applySubstitution(originalOrCurrentName: string, newName: string) {
    const clean = newName.trim();
    if (!clean) return;
    setSubstitutions((prev) => {
      const next = { ...prev };
      // Preserve original root key if substituting an already-substituted item
      const existingRoot = Object.keys(next).find(
        (k) => next[k] === originalOrCurrentName,
      );
      next[existingRoot ?? originalOrCurrentName] = clean;
      return next;
    });
    setEditingSubKey(null);
    setCustomSubText("");
    setFeedback(`Đã đổi sang "${clean}".`);
  }

  async function logPlannedMeal(meal: RecipeTemplate) {
    const resp = await authFetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loggedDate: todayDate,
        mealSlot: meal.slot,
        title: meal.title,
        source: "meal_plan",
        items: [
          {
            name: meal.title,
            grams: meal.ingredients.reduce((s, i) => s + i.grams, 0),
            calories: meal.calories,
            proteinG: meal.proteinG,
            carbsG: meal.carbsG,
            fatG: meal.fatG,
          },
        ],
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      onMealLogged(data.meal);
      setFeedback(`Đã ghi "${meal.title}" vào hôm nay.`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-[var(--bg-soft)] p-1">
          <button
            type="button"
            onClick={() => setViewMode("grocery")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "grocery"
                ? "bg-[var(--mint-primary)] text-white shadow-sm"
                : "text-[var(--ink-muted)]"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Đi chợ ({groceryList.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("menu")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "menu"
                ? "bg-[var(--mint-primary)] text-white shadow-sm"
                : "text-[var(--ink-muted)]"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Thực đơn 7 ngày
          </button>
        </div>

        <span className="tabular-nums text-[11px] font-semibold text-[var(--mint-dark)]">
          {activeDay.totalCalories} kcal · {activeDay.totalProteinG}g đạm
        </span>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-teal-200 bg-[var(--mint-soft)] px-4 py-2 text-xs font-medium text-[var(--mint-dark)]"
        >
          {feedback}
        </motion.div>
      )}

      {viewMode === "grocery" ? (
        <div className="space-y-2.5">
          <p className="text-xs text-[var(--ink-muted)]">
            Không tìm được món nào ngoài chợ? Bấm <strong>Đổi</strong> để chọn nguyên liệu thay thế tương đương dinh dưỡng.
          </p>

          <div className="space-y-2">
            {groceryList.map((item) => {
              const key = `${item.aisle}-${item.name}`;
              const checked = Boolean(checkedGrocery[key]);
              const isEditing = editingSubKey === key;
              const substitutes = getIngredientSubstitutes(
                item.substitutedFrom ?? item.name,
              );

              return (
                <div key={key} className="mobile-card rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className={`flex flex-1 cursor-pointer items-center gap-2.5 text-xs ${
                        checked ? "line-through opacity-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setCheckedGrocery((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[var(--mint-primary)]"
                      />
                      <div>
                        <p className="font-bold text-[var(--ink-primary)]">{item.name}</p>
                        <p className="text-[10px] text-[var(--ink-muted)]">
                          {item.aisle}
                          {item.substitutedFrom
                            ? ` · Đã đổi từ "${item.substitutedFrom}"`
                            : ""}
                        </p>
                      </div>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-xs font-bold text-[var(--mint-dark)]">
                        {item.totalGrams}g
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSubKey(isEditing ? null : key)
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-primary)] hover:bg-teal-50"
                      >
                        <ArrowLeftRight className="h-3 w-3 text-[var(--mint-dark)]" />
                        Đổi
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 space-y-2 overflow-hidden border-t border-[var(--border-hairline)] pt-2.5"
                      >
                        <p className="text-[11px] font-semibold text-[var(--ink-muted)]">
                          Chọn nguyên liệu thay thế tương đương:
                        </p>
                        <div className="space-y-1.5">
                          {substitutes.map((sub) => (
                            <button
                              key={sub.name}
                              type="button"
                              onClick={() => applySubstitution(item.name, sub.name)}
                              className="flex w-full items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-left text-xs hover:border-[var(--mint-primary)] hover:bg-[var(--mint-soft)]"
                            >
                              <span className="font-semibold">{sub.name}</span>
                              <span className="text-[10px] text-[var(--ink-muted)]">
                                {sub.note}
                              </span>
                            </button>
                          ))}
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            applySubstitution(item.name, customSubText);
                          }}
                          className="flex gap-1.5"
                        >
                          <input
                            value={customSubText}
                            onChange={(e) => setCustomSubText(e.target.value)}
                            placeholder="Hoặc tự nhập món khác..."
                            className="flex-1 rounded-xl bg-[var(--bg-soft)] px-3 py-1.5 text-xs"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-[var(--mint-primary)] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Lưu
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {plan.days.map((d) => (
              <button
                key={d.dayIndex}
                type="button"
                onClick={() => setSelectedDay(d.dayIndex)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedDay === d.dayIndex
                    ? "bg-[var(--mint-primary)] text-white"
                    : "bg-white border border-[var(--border-hairline)] text-[var(--ink-muted)]"
                }`}
              >
                {d.dayLabel}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {activeDay.meals.map((meal) => (
              <motion.div
                key={`${activeDay.dayIndex}-${meal.id}`}
                layout
                className="mobile-card flex flex-col justify-between rounded-2xl p-2.5"
              >
                <div>
                  <DishIllustration id={meal.id} />
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[var(--mint-dark)]">
                      {SLOT_LABEL[meal.slot]} · {meal.cookMinutes}p
                    </span>
                    <span className="tabular-nums font-bold">{meal.calories} kcal</span>
                  </div>
                  <h4 className="mt-1 line-clamp-2 text-xs font-bold leading-snug">
                    {meal.title}
                  </h4>
                  <p className="mt-1 text-[10px] tabular-nums text-[var(--ink-muted)]">
                    P {meal.proteinG}g · C {meal.carbsG}g · F {meal.fatG}g
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--border-hairline)] pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwapMeal(meal.slot)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-hairline)] px-2 py-1 text-[10px] font-semibold"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => logPlannedMeal(meal)}
                    className="ml-auto inline-flex items-center gap-1 rounded-xl bg-[var(--mint-primary)] px-2.5 py-1 text-[10px] font-bold text-white"
                  >
                    <Check className="h-3 w-3" />
                    Ăn
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
