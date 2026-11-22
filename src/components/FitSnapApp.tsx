"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Dumbbell,
  Flame,
  Home,
  LogOut,
  Plus,
  Refrigerator,
  Ruler,
  Search,
  ShoppingBag,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { AuthGate } from "./AuthGate";
import { DishIllustration } from "./DishIllustration";
import { MealPlanView } from "./MealPlanView";
import { MeasurementTracker } from "./MeasurementTracker";
import { OnboardingWizard } from "./OnboardingWizard";
import { PantryAndScannerView } from "./PantryAndScannerView";
import { WorkoutFocusView } from "./WorkoutFocusView";
import { authFetch } from "@/lib/api/auth-fetch";
import { RECIPE_BANK } from "@/lib/meal-plan/generator";
import { searchFoods } from "@/lib/nutrition/vietnamese-foods";
import { getBrowserSupabase } from "@/lib/storage/supabase";
import type {
  BodyMeasurement,
  DietaryPref,
  MealLog,
  UserProfile,
  WorkoutLog,
} from "@/types/fitsnap";

type MobileTab = "home" | "pantry" | "workout" | "grocery";

interface AppState {
  authenticated: boolean;
  profile: UserProfile | null;
  mealLogs: MealLog[];
  workoutLogs: WorkoutLog[];
  measurements: BodyMeasurement[];
  storageMode: string;
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_CHIPS: { id: DietaryPref; label: string }[] = [
  { id: "high_protein", label: "Giàu đạm" },
  { id: "low_carb", label: "Ít tinh bột" },
  { id: "vegetarian", label: "Ăn chay" },
  { id: "no_dairy", label: "Không sữa" },
];

export function FitSnapApp() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<MobileTab>("home");
  const [pantryInitialSubTab, setPantryInitialSubTab] = useState<"pantry" | "photo">("pantry");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<DietaryPref[]>([]);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [measureSheetOpen, setMeasureSheetOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(false);

  const todayDate = useMemo(() => getTodayIso(), []);

  function reloadState() {
    setLoading(true);
    authFetch("/api/state")
      .then((r) => r.json())
      .then((data: AppState) => setState(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reloadState();
  }, []);

  async function handleSignOut() {
    const supabase = getBrowserSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      reloadState();
    }
  }

  async function quickAddFoodOrRecipe(entry: {
    title: string;
    grams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }) {
    const resp = await authFetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loggedDate: todayDate,
        mealSlot: "lunch",
        title: entry.title,
        source: "manual",
        items: [{ name: entry.title, ...entry }],
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      setState((prev) =>
        prev ? { ...prev, mealLogs: [data.meal, ...prev.mealLogs] } : prev,
      );
    }
  }

  async function deleteMeal(id: string) {
    await authFetch(`/api/meals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setState((prev) =>
      prev ? { ...prev, mealLogs: prev.mealLogs.filter((m) => m.id !== id) } : prev,
    );
  }

  async function deleteWorkout(id: string) {
    await authFetch(`/api/workouts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setState((prev) =>
      prev
        ? { ...prev, workoutLogs: prev.workoutLogs.filter((w) => w.id !== id) }
        : prev,
    );
  }

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--ink-muted)]">
        Đang mở FitSnap...
      </div>
    );
  }

  if (state.storageMode === "supabase" && !state.authenticated) {
    return <AuthGate onAuthenticated={reloadState} />;
  }

  if (!state.profile || editingQuiz) {
    return (
      <div>
        {state.profile && (
          <div className="mx-auto max-w-[430px] bg-[var(--bg-canvas)] px-4 pt-3">
            <button
              type="button"
              onClick={() => setEditingQuiz(false)}
              className="text-xs font-bold text-[var(--mint-dark)]"
            >
              ← Quay lại FitSnap
            </button>
          </div>
        )}
        <OnboardingWizard
          initialProfile={state.profile}
          onComplete={(profile) => {
            setState((prev) => (prev ? { ...prev, profile } : prev));
            setEditingQuiz(false);
          }}
        />
      </div>
    );
  }

  const profile = state.profile;
  const todayMeals = state.mealLogs.filter((m) => m.loggedDate === todayDate);
  const todayWorkouts = state.workoutLogs.filter((w) => w.loggedDate === todayDate);

  const caloriesIn = todayMeals.reduce((s, m) => s + m.calories, 0);
  const proteinIn = Math.round(todayMeals.reduce((s, m) => s + m.proteinG, 0));
  const caloriesBurned = todayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
  const remaining = profile.targetCalories + caloriesBurned - caloriesIn;
  const progressPct = Math.min(
    100,
    Math.round((caloriesIn / Math.max(1, profile.targetCalories + caloriesBurned)) * 100),
  );

  // Combined searchable + filterable 2-col menu (VN dishes + high-protein recipes)
  const searchedVnFoods = searchFoods(searchQuery);
  const filteredRecipes = RECIPE_BANK.filter((r) => {
    const matchText =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchChips = activeFilters.every((f) => r.tags.includes(f));
    return matchText && matchChips;
  });

  function toggleFilter(chip: DietaryPref) {
    setActiveFilters((prev) =>
      prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip],
    );
  }

  return (
    <div className="min-h-screen sm:py-4">
      {/* Mobile-First App Shell (fits phones natively, centered phone frame on desktop) */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--bg-canvas)] pb-32 sm:min-h-[844px] sm:rounded-[34px] sm:border sm:border-white sm:shadow-[0_24px_60px_rgba(16,38,34,0.12)]">
        {/* Top Greeting Bar */}
        <header className="sticky top-0 z-20 rounded-t-[34px] bg-[var(--bg-canvas)]/95 px-4 pb-3 pt-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--mint-primary)] text-sm font-black text-white">
                F
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[var(--mint-dark)]">
                  FitSnap Mobile
                </p>
                <h1 className="text-base font-extrabold leading-tight">
                  Chào {profile.displayName}!
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMeasureSheetOpen(true)}
                aria-label="Số đo cơ thể"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[var(--border-hairline)] text-[var(--mint-dark)]"
              >
                <Ruler className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingQuiz(true)}
                aria-label="Hồ sơ & Mục tiêu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[var(--border-hairline)] text-[var(--mint-dark)]"
              >
                <UserCircle2 className="h-5 w-5" />
              </button>
              {state.storageMode === "supabase" && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Đăng xuất"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[var(--border-hairline)] text-[var(--ink-muted)] hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Bar on Home */}
          {tab === "home" && (
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn (phở bò, ức gà, cá hồi...)"
                className="w-full rounded-2xl bg-[var(--bg-soft)] py-2 pl-10 pr-4 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mint-primary)]"
              />
            </div>
          )}
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 px-4 pt-1">
          <AnimatePresence mode="wait">
            {tab === "home" && (
              <motion.div
                key="tab-home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* 4 Squircle Category Shortcuts (inspired by reference screenshot) */}
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  {[
                    {
                      label: "Quét ảnh",
                      icon: Camera,
                      action: () => {
                        setPantryInitialSubTab("photo");
                        setTab("pantry");
                      },
                    },
                    {
                      label: "Tủ lạnh",
                      icon: Refrigerator,
                      action: () => {
                        setPantryInitialSubTab("pantry");
                        setTab("pantry");
                      },
                    },
                    {
                      label: "Tập luyện",
                      icon: Dumbbell,
                      action: () => setTab("workout"),
                    },
                    {
                      label: "Đi chợ",
                      icon: ShoppingBag,
                      action: () => setTab("grocery"),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="group flex flex-col items-center gap-1.5"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-hairline)] bg-white text-[var(--mint-dark)] shadow-sm transition group-active:scale-95 group-hover:bg-[var(--mint-soft)]">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--ink-primary)]">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Hero Banner Card (Calorie Budget + 1 Clear Action) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#134E4A] via-[#0F766E] to-[#1FB8A6] p-4 text-white shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold">
                        <Flame className="h-3 w-3 text-amber-300" />
                        Ngân sách hôm nay
                      </span>
                      <p className="mt-1.5 text-2xl font-extrabold tabular-nums">
                        {remaining} kcal còn lại
                      </p>
                      <p className="mt-0.5 text-[11px] text-teal-100 tabular-nums">
                        Đạm {proteinIn}/{profile.targetProteinG}g · Vận động +{caloriesBurned} kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPantryInitialSubTab("photo");
                        setTab("pantry");
                      }}
                      className="shrink-0 rounded-2xl bg-amber-400 px-3.5 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm active:scale-95"
                    >
                      Quét món
                    </button>
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      className="h-full rounded-full bg-amber-300"
                    />
                  </div>
                </div>

                {/* Checkbox Filter Chips (inspired by Screen 2 in reference) */}
                <div>
                  <p className="mb-2 text-xs font-bold">Lọc nhanh chế độ ăn</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FILTER_CHIPS.map((chip) => {
                      const active = activeFilters.includes(chip.id);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleFilter(chip.id)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? "border-[var(--mint-primary)] bg-[var(--mint-soft)] text-[var(--mint-dark)]"
                              : "border-[var(--border-hairline)] bg-white text-[var(--ink-muted)]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                              active
                                ? "border-[var(--mint-primary)] bg-[var(--mint-primary)] text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {active ? "✓" : ""}
                          </span>
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Column Food Menu Grid (Best Seller / Menu style from reference) */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold">Món giàu đạm gợi ý</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setPantryInitialSubTab("pantry");
                        setTab("pantry");
                      }}
                      className="text-[11px] font-bold text-[var(--mint-dark)]"
                    >
                      Nấu từ đồ có sẵn →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredRecipes.slice(0, 4).map((recipe) => (
                      <motion.div
                        key={recipe.id}
                        whileTap={{ scale: 0.98 }}
                        className="mobile-card flex flex-col justify-between rounded-2xl p-2.5"
                      >
                        <div>
                          <DishIllustration id={recipe.id} />
                          <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-snug">
                            {recipe.title}
                          </h3>
                          <p className="mt-0.5 text-[10px] tabular-nums text-[var(--ink-muted)]">
                            Đạm {recipe.proteinG}g · {recipe.cookMinutes}p
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[var(--mint-dark)] tabular-nums">
                            {recipe.calories} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              quickAddFoodOrRecipe({
                                title: recipe.title,
                                grams: recipe.ingredients.reduce((s, i) => s + i.grams, 0),
                                calories: recipe.calories,
                                proteinG: recipe.proteinG,
                                carbsG: recipe.carbsG,
                                fatG: recipe.fatG,
                              })
                            }
                            aria-label={`Thêm ${recipe.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--mint-primary)] text-white hover:bg-[var(--mint-dark)]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Vietnamese Quick Dishes 2-col */}
                <div>
                  <h2 className="mb-2 text-sm font-extrabold">Món Việt quen thuộc</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {searchedVnFoods.slice(0, 4).map((food) => (
                      <motion.div
                        key={food.id}
                        whileTap={{ scale: 0.98 }}
                        className="mobile-card flex flex-col justify-between rounded-2xl p-2.5"
                      >
                        <div>
                          <DishIllustration id={food.id} category={food.category} />
                          <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-snug">
                            {food.name}
                          </h3>
                          <p className="mt-0.5 text-[10px] tabular-nums text-[var(--ink-muted)]">
                            {food.servingLabel} · {food.proteinG}g đạm
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[var(--mint-dark)] tabular-nums">
                            {food.calories} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              quickAddFoodOrRecipe({
                                title: food.name,
                                grams: food.servingGrams,
                                calories: food.calories,
                                proteinG: food.proteinG,
                                carbsG: food.carbsG,
                                fatG: food.fatG,
                              })
                            }
                            aria-label={`Thêm ${food.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--mint-primary)] text-white hover:bg-[var(--mint-dark)]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "pantry" && (
              <motion.div
                key="tab-pantry"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PantryAndScannerView
                  initialSubTab={pantryInitialSubTab}
                  dietaryPrefs={profile.dietaryPrefs}
                  todayDate={todayDate}
                  onMealLogged={(meal) =>
                    setState((prev) =>
                      prev ? { ...prev, mealLogs: [meal, ...prev.mealLogs] } : prev,
                    )
                  }
                />
              </motion.div>
            )}

            {tab === "workout" && (
              <motion.div
                key="tab-workout"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <WorkoutFocusView
                  profile={profile}
                  todayDate={todayDate}
                  onWorkoutLogged={(workout) =>
                    setState((prev) =>
                      prev
                        ? { ...prev, workoutLogs: [workout, ...prev.workoutLogs] }
                        : prev,
                    )
                  }
                />
              </motion.div>
            )}

            {tab === "grocery" && (
              <motion.div
                key="tab-grocery"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <MealPlanView
                  initialView="grocery"
                  profile={profile}
                  todayDate={todayDate}
                  onMealLogged={(meal) =>
                    setState((prev) =>
                      prev ? { ...prev, mealLogs: [meal, ...prev.mealLogs] } : prev,
                    )
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sticky Floating Mint Summary Pill (mirrors bottom bar in reference screenshot) */}
        <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-[406px] -translate-x-1/2 px-3">
          <button
            type="button"
            onClick={() => setLogSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-[var(--mint-primary)] px-4 py-2.5 text-white shadow-lg transition active:scale-98 hover:bg-[var(--mint-dark)]"
          >
            <div className="text-left">
              <p className="text-xs font-extrabold">
                {todayMeals.length} bữa · {todayWorkouts.length} buổi tập
              </p>
              <p className="text-[10px] text-teal-50">Chạm để xem hoặc xóa nhật ký</p>
            </div>
            <span className="tabular-nums text-sm font-extrabold">
              {caloriesIn} / {profile.targetCalories} kcal
            </span>
          </button>
        </div>

        {/* Fixed 4-Tab Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 justify-around border-t border-[var(--border-hairline)] bg-white/95 py-2 backdrop-blur-md sm:rounded-b-[34px]">
          {(
            [
              ["home", "Trang chủ", Home],
              ["pantry", "Tủ lạnh", Refrigerator],
              ["workout", "Tập luyện", Dumbbell],
              ["grocery", "Đi chợ", ShoppingBag],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-0.5 text-[11px] font-bold transition ${
                  active ? "text-[var(--mint-dark)]" : "text-[var(--ink-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Today's Log Bottom Sheet */}
        <AnimatePresence>
          {logSheetOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogSheetOpen(false)}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 max-h-[75vh] overflow-y-auto"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-extrabold">Nhật ký hôm nay ({todayDate})</h3>
                  <button
                    type="button"
                    onClick={() => setLogSheetOpen(false)}
                    className="rounded-full bg-[var(--bg-soft)] p-1.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {todayMeals.length === 0 && todayWorkouts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[var(--ink-muted)]">
                    Chưa có bữa ăn hay buổi tập nào hôm nay.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todayMeals.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-2xl bg-[var(--bg-canvas)] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold">{m.title}</p>
                          <p className="tabular-nums text-[var(--ink-muted)]">
                            +{m.calories} kcal · P {m.proteinG}g · C {m.carbsG}g · F {m.fatG}g
                          </p>
                        </div>
                        <button type="button" onClick={() => deleteMeal(m.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </button>
                      </div>
                    ))}
                    {todayWorkouts.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-2xl bg-[var(--mint-soft)] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold">{w.title}</p>
                          <p className="tabular-nums text-[var(--mint-dark)]">
                            {w.durationMin} phút · Đốt {w.caloriesBurned} kcal
                          </p>
                        </div>
                        <button type="button" onClick={() => deleteWorkout(w.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Measurements Bottom Sheet */}
        <AnimatePresence>
          {measureSheetOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMeasureSheetOpen(false)}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 max-h-[82vh] overflow-y-auto"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-extrabold">Cân nặng & Số đo vòng</h3>
                  <button
                    type="button"
                    onClick={() => setMeasureSheetOpen(false)}
                    className="rounded-full bg-[var(--bg-soft)] p-1.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <MeasurementTracker
                  measurements={state.measurements}
                  todayDate={todayDate}
                  currentWeightKg={profile.weightKg}
                  onMeasurementAdded={(m) =>
                    setState((prev) => {
                      if (!prev) return prev;
                      const nextMeasurements = [
                        ...prev.measurements.filter((x) => x.measuredDate !== m.measuredDate),
                        m,
                      ].sort((a, b) => a.measuredDate.localeCompare(b.measuredDate));
                      return {
                        ...prev,
                        measurements: nextMeasurements,
                        profile:
                          m.weightKg && prev.profile
                            ? { ...prev.profile, weightKg: m.weightKg }
                            : prev.profile,
                      };
                    })
                  }
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
