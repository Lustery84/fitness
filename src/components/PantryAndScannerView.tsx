"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChefHat,
  Loader2,
  Plus,
  Refrigerator,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DishIllustration } from "./DishIllustration";
import { authFetch } from "@/lib/api/auth-fetch";
import {
  matchRecipesByPantry,
  PANTRY_PRESET_INGREDIENTS,
  type RecipeTemplate,
} from "@/lib/meal-plan/generator";
import type {
  DietaryPref,
  MealLog,
  MealLogItem,
  MealSlot,
} from "@/types/fitsnap";

interface PantryAndScannerViewProps {
  initialSubTab?: "pantry" | "photo";
  dietaryPrefs: DietaryPref[];
  todayDate: string;
  onMealLogged: (meal: MealLog) => void;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  snack: "Bữa phụ",
};

async function compressImageToBase64(
  file: File,
): Promise<{ base64: string; mimeType: "image/jpeg"; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  return { base64: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg", previewUrl: dataUrl };
}

export function PantryAndScannerView({
  initialSubTab = "pantry",
  dietaryPrefs,
  todayDate,
  onMealLogged,
}: PantryAndScannerViewProps) {
  const [subTab, setSubTab] = useState<"pantry" | "photo">(initialSubTab);
  const [mealSlot, setMealSlot] = useState<MealSlot>("lunch");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Pantry ("Có gì nấu nấy") state
  const [customIngInput, setCustomIngInput] = useState("");
  const [pantryItems, setPantryItems] = useState<string[]>([]);

  // Photo scanner state
  const [hintText, setHintText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dishTitle, setDishTitle] = useState("");
  const [items, setItems] = useState<MealLogItem[]>([]);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const pantryMatches = useMemo(
    () =>
      pantryItems.length > 0
        ? matchRecipesByPantry(pantryItems, dietaryPrefs)
        : [],
    [pantryItems, dietaryPrefs],
  );

  function addPantryItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPantryItems((prev) =>
      prev.some((p) => p.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed],
    );
    setCustomIngInput("");
  }

  function togglePresetIngredient(name: string) {
    setPantryItems((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  }

  async function logMatchedRecipe(recipe: RecipeTemplate) {
    setSaving(true);
    try {
      const resp = await authFetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loggedDate: todayDate,
          mealSlot,
          title: recipe.title,
          source: "meal_plan",
          items: [
            {
              name: recipe.title,
              grams: recipe.ingredients.reduce((s, i) => s + i.grams, 0),
              calories: recipe.calories,
              proteinG: recipe.proteinG,
              carbsG: recipe.carbsG,
              fatG: recipe.fatG,
            },
          ],
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        onMealLogged(data.meal);
        setFeedback(`Đã ghi "${recipe.title}" (+${recipe.calories} kcal)!`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setAnalyzing(true);
    setFeedback(null);
    try {
      const compressed = await compressImageToBase64(file);
      setPreviewUrl(compressed.previewUrl);

      const resp = await authFetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
          hintText: hintText.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setFeedback(data?.error?.message ?? "Không thể phân tích ảnh.");
        return;
      }
      setDishTitle(data.dishTitle);
      setItems(data.items);
      setAiNotes(data.notes ?? null);
      setAiProvider(data.provider ?? null);
    } catch {
      setFeedback("Không đọc được ảnh. Thử chọn ảnh JPEG hoặc PNG khác.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function savePhotoMeal() {
    if (!dishTitle.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const resp = await authFetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loggedDate: todayDate,
          mealSlot,
          title: dishTitle.trim(),
          source: "photo_ai",
          items,
          provider: aiProvider ?? undefined,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        onMealLogged(data.meal);
        setDishTitle("");
        setItems([]);
        setPreviewUrl(null);
        setFeedback(`Đã lưu "${data.meal.title}" vào nhật ký hôm nay!`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab & Meal Slot Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-[var(--bg-soft)] p-1">
          <button
            type="button"
            onClick={() => setSubTab("pantry")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              subTab === "pantry"
                ? "bg-[var(--mint-primary)] text-white shadow-sm"
                : "text-[var(--ink-muted)]"
            }`}
          >
            <Refrigerator className="h-3.5 w-3.5" />
            Có gì nấu nấy
          </button>
          <button
            type="button"
            onClick={() => setSubTab("photo")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              subTab === "photo"
                ? "bg-[var(--mint-primary)] text-white shadow-sm"
                : "text-[var(--ink-muted)]"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Quét ảnh AI
          </button>
        </div>

        <select
          value={mealSlot}
          onChange={(e) => setMealSlot(e.target.value as MealSlot)}
          className="rounded-full border border-[var(--border-hairline)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
        >
          {Object.entries(SLOT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-teal-200 bg-[var(--mint-soft)] px-4 py-2.5 text-xs font-medium text-[var(--mint-dark)]"
        >
          {feedback}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {subTab === "pantry" ? (
          <motion.div
            key="pantry-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Input Ingredients on Hand */}
            <div className="mobile-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-[var(--mint-dark)]" />
                <h3 className="text-sm font-bold">Trong tủ lạnh bạn đang có gì?</h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addPantryItem(customIngInput);
                }}
                className="flex gap-2"
              >
                <input
                  value={customIngInput}
                  onChange={(e) => setCustomIngInput(e.target.value)}
                  placeholder="Nhập nguyên liệu đang có (VD: cà chua, thịt bò...)"
                  className="flex-1 rounded-xl bg-[var(--bg-soft)] px-3.5 py-2 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mint-primary)]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-[var(--mint-primary)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--mint-dark)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </form>

              {/* Selected Pills */}
              {pantryItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pantryItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--mint-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--mint-dark)]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => togglePresetIngredient(item)}
                        aria-label={`Bỏ ${item}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Tap Presets */}
              <div>
                <p className="mb-1.5 text-[11px] text-[var(--ink-muted)]">
                  Chạm nhanh nguyên liệu phổ biến:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PANTRY_PRESET_INGREDIENTS.map((ing) => {
                    const active = pantryItems.includes(ing);
                    return (
                      <button
                        key={ing}
                        type="button"
                        onClick={() => togglePresetIngredient(ing)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          active
                            ? "border-[var(--mint-primary)] bg-[var(--mint-primary)] text-white"
                            : "border-[var(--border-hairline)] bg-white text-[var(--ink-muted)]"
                        }`}
                      >
                        {ing}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matched Recipes (2-column mobile grid) */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold">
                Món nấu được ngay ({pantryMatches.length} gợi ý)
              </h4>
              {pantryItems.length === 0 ? (
                <div className="mobile-card rounded-2xl p-5 text-center text-xs text-[var(--ink-muted)]">
                  Nhập hoặc chạm vào nguyên liệu bạn đang có ở trên để gợi ý món phù hợp.
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-3">
                {pantryMatches.slice(0, 8).map((match) => (
                  <motion.div
                    key={match.recipe.id}
                    layout
                    className="mobile-card flex flex-col justify-between rounded-2xl p-2.5"
                  >
                    <div>
                      <DishIllustration id={match.recipe.id} />
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            match.matchPct === 100
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {match.matchPct === 100
                            ? "Đủ 100%"
                            : `Khớp ${match.matchPct}%`}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--ink-muted)] tabular-nums">
                          {match.recipe.cookMinutes}p
                        </span>
                      </div>
                      <h5 className="mt-1 line-clamp-2 text-xs font-bold leading-snug">
                        {match.recipe.title}
                      </h5>
                      {match.missingIngredients.length > 0 && (
                        <p className="mt-1 text-[10px] text-rose-600 line-clamp-2">
                          Thiếu: {match.missingIngredients.map((m) => m.name).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-hairline)] pt-2">
                      <div className="tabular-nums text-[11px]">
                        <span className="font-bold text-[var(--ink-primary)]">
                          {match.recipe.calories} kcal
                        </span>
                        <span className="block text-[10px] text-[var(--mint-dark)]">
                          {match.recipe.proteinG}g đạm
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => logMatchedRecipe(match.recipe)}
                        className="rounded-xl bg-[var(--mint-primary)] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[var(--mint-dark)]"
                      >
                        + Ăn
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="photo-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="mobile-card rounded-2xl p-4 space-y-3">
              <input
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                placeholder="Gợi ý tên món (tùy chọn: bún chả, bánh mì...)"
                className="w-full rounded-xl bg-[var(--bg-soft)] px-3.5 py-2 text-xs text-[var(--ink-primary)]"
              />

              <label className="relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-teal-300 bg-[var(--mint-soft)]/50 p-6 text-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Ảnh món ăn"
                    className="max-h-48 rounded-xl object-contain"
                  />
                ) : analyzing ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--mint-dark)]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang phân tích ảnh món ăn...
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-[var(--mint-dark)]" />
                    <span className="mt-2 text-xs font-bold">
                      Chụp ảnh hoặc tải ảnh đĩa ăn
                    </span>
                    <span className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                      Tự nén ≤ 1024px để tiết kiệm quota AI
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </label>
            </div>

            {items.length > 0 && (
              <div className="mobile-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={dishTitle}
                    onChange={(e) => setDishTitle(e.target.value)}
                    className="flex-1 rounded-xl bg-[var(--bg-soft)] px-3 py-1.5 text-sm font-bold"
                  />
                  {aiProvider && (
                    <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]">
                      {aiProvider}
                    </span>
                  )}
                </div>
                {aiNotes && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    {aiNotes}
                  </p>
                )}
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--border-hairline)] p-2.5 text-xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={item.name}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                        className="flex-1 font-semibold"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 tabular-nums text-[11px]">
                      {(
                        [
                          ["calories", "Kcal"],
                          ["proteinG", "Đạm"],
                          ["carbsG", "Carb"],
                          ["fatG", "Béo"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field} className="block">
                          <span className="text-[10px] text-[var(--ink-muted)]">{label}</span>
                          <input
                            type="number"
                            value={item[field]}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, [field]: Number(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                            className="w-full rounded-lg bg-[var(--bg-soft)] px-2 py-1"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePhotoMeal}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--mint-primary)] py-2.5 text-xs font-bold text-white hover:bg-[var(--mint-dark)]"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Xác nhận & Ghi vào nhật ký"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
