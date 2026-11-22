"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  ActivityLevel,
  BodyFocusRegion,
  DietaryPref,
  EquipmentType,
  FitnessGoal,
  Sex,
  UserProfile,
} from "@/types/fitsnap";

interface OnboardingWizardProps {
  initialProfile?: UserProfile | null;
  onComplete: (profile: UserProfile, warnings: { message: string }[]) => void;
}

const GOAL_CARDS: { id: FitnessGoal; title: string; desc: string }[] = [
  { id: "lose_fat", title: "Giảm mỡ & giữ cơ", desc: "Thâm hụt nhẹ, ưu tiên đạm cao" },
  { id: "recomp", title: "Siết nét săn chắc", desc: "Giảm mỡ nhẹ và tăng nét cơ" },
  { id: "maintain", title: "Giữ cân ăn khỏe", desc: "Ăn đủ chất, cân bằng năng lượng" },
  { id: "build_muscle", title: "Tăng cơ nạc", desc: "Thặng dư nhẹ + tập kháng lực" },
];

const FOCUS_OPTIONS: { id: BodyFocusRegion; label: string; hint: string }[] = [
  { id: "belly", label: "Bụng & Eo", hint: "Giảm mỡ toàn thân + siết core" },
  { id: "thighs", label: "Đùi", hint: "Đùi trước & đùi sau" },
  { id: "arms", label: "Bắp tay", hint: "Săn chắc tay sau & trước" },
  { id: "glutes", label: "Mông", hint: "Tăng độ đầy vòng 3" },
  { id: "chest_back", label: "Ngực & Lưng", hint: "Cải thiện dáng thân trên" },
  { id: "full_body", label: "Toàn thân", hint: "Cân đối tổng thể" },
];

const DIET_OPTIONS: { id: DietaryPref; label: string }[] = [
  { id: "high_protein", label: "Giàu đạm" },
  { id: "balanced", label: "Cân bằng" },
  { id: "low_carb", label: "Ít tinh bột" },
  { id: "vegetarian", label: "Ăn chay" },
  { id: "no_dairy", label: "Không sữa bò" },
  { id: "no_seafood", label: "Không hải sản" },
];

export function OnboardingWizard({
  initialProfile,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(initialProfile?.displayName ?? "");
  const [sex, setSex] = useState<Sex>(initialProfile?.sex ?? "male");
  const [age, setAge] = useState(initialProfile?.age ?? 26);
  const [heightCm, setHeightCm] = useState(initialProfile?.heightCm ?? 172);
  const [weightKg, setWeightKg] = useState(initialProfile?.weightKg ?? 72);
  const [targetWeightKg, setTargetWeightKg] = useState(
    initialProfile?.targetWeightKg ?? 66,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel ?? "moderate",
  );
  const [goal, setGoal] = useState<FitnessGoal>(initialProfile?.goal ?? "lose_fat");
  const [weeklyRatePct, setWeeklyRatePct] = useState(
    initialProfile?.weeklyRatePct ?? 0.5,
  );
  const [isPregnantOrNursing, setIsPregnantOrNursing] = useState(false);
  const [hasMedicalCondition, setHasMedicalCondition] = useState(false);

  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPref[]>(
    initialProfile?.dietaryPrefs ?? ["high_protein"],
  );
  const [maxCookMinutes, setMaxCookMinutes] = useState(
    initialProfile?.maxCookMinutes ?? 30,
  );

  const [focusRegions, setFocusRegions] = useState<BodyFocusRegion[]>(
    initialProfile?.focusRegions ?? ["belly"],
  );
  const [equipment, setEquipment] = useState<EquipmentType>(
    initialProfile?.equipment ?? "none",
  );
  const [daysPerWeek, setDaysPerWeek] = useState(initialProfile?.daysPerWeek ?? 4);

  function toggleItem<T>(list: T[], item: T, setter: (v: T[]) => void) {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  }

  async function submitProfile(override?: Partial<Record<string, unknown>>) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        displayName,
        sex,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        targetWeightKg: Number(targetWeightKg),
        activityLevel,
        goal,
        weeklyRatePct: Number(weeklyRatePct),
        focusRegions,
        dietaryPrefs,
        maxCookMinutes: Number(maxCookMinutes),
        equipment,
        daysPerWeek: Number(daysPerWeek),
        isPregnantOrNursing,
        hasMedicalCondition,
        ...override,
      };

      const resp = await authFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data?.error?.message ?? "Không thể lưu hồ sơ.");
        return;
      }
      onComplete(data.profile, data.warnings ?? []);
    } catch {
      setErrorMsg("Lỗi kết nối khi lưu hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-[var(--bg-canvas)] px-4 py-6 shadow-xl">
      <div className="mobile-card rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[var(--mint-dark)]">
              Bước {step} / 3
            </p>
            <h1 className="text-lg font-extrabold tracking-tight">
              Thiết lập FitSnap
            </h1>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full ${
                n <= step ? "bg-[var(--mint-primary)]" : "bg-[var(--bg-soft)]"
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="ob-1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {GOAL_CARDS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setGoal(c.id)}
                    className={`rounded-2xl border p-3 text-left ${
                      goal === c.id
                        ? "border-[var(--mint-primary)] bg-[var(--mint-soft)]"
                        : "border-[var(--border-hairline)] bg-white"
                    }`}
                  >
                    <p className="text-xs font-bold">{c.title}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">{c.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Tên</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2"
                  />
                </label>
                <div>
                  <span className="text-[var(--ink-muted)]">Giới tính</span>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSex(g)}
                        className={`rounded-xl py-2 font-bold ${
                          sex === g
                            ? "bg-[var(--mint-primary)] text-white"
                            : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                        }`}
                      >
                        {g === "male" ? "Nam" : "Nữ"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Tuổi</span>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Chiều cao (cm)</span>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Cân nặng (kg)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Vận động</span>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-2.5 py-2"
                  >
                    <option value="sedentary">Ít vận động</option>
                    <option value="light">Nhẹ (1–2b)</option>
                    <option value="moderate">Vừa (3–4b)</option>
                    <option value="active">Năng động</option>
                    <option value="very_active">Rất cao</option>
                  </select>
                </label>
              </div>

              <div className="space-y-1.5 rounded-2xl bg-[var(--bg-soft)] p-3 text-[11px]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPregnantOrNursing}
                    onChange={(e) => setIsPregnantOrNursing(e.target.checked)}
                  />
                  <span>Đang mang thai / cho con bú</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasMedicalCondition}
                    onChange={(e) => setHasMedicalCondition(e.target.checked)}
                  />
                  <span>Có bệnh lý nền</span>
                </label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="ob-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-4"
            >
              <p className="text-xs font-bold">Khẩu vị & kiêng khem:</p>
              <div className="grid grid-cols-2 gap-2">
                {DIET_OPTIONS.map((opt) => {
                  const active = dietaryPrefs.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleItem(dietaryPrefs, opt.id, setDietaryPrefs)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-xs font-semibold ${
                        active
                          ? "border-[var(--mint-primary)] bg-[var(--mint-soft)] text-[var(--mint-dark)]"
                          : "border-[var(--border-hairline)] bg-white"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-bold">Thời gian nấu tối đa:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMaxCookMinutes(m)}
                      className={`rounded-xl py-2 text-xs font-bold ${
                        maxCookMinutes === m
                          ? "bg-[var(--mint-primary)] text-white"
                          : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                      }`}
                    >
                      ≤ {m} phút
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs">
                <span className="text-[var(--ink-muted)]">
                  Cân nặng mục tiêu (kg) & Tốc độ ({weeklyRatePct}%/tuần)
                </span>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                    className="w-20 rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
                  />
                  <input
                    type="range"
                    min={0.25}
                    max={1.25}
                    step={0.25}
                    value={weeklyRatePct}
                    onChange={(e) => setWeeklyRatePct(Number(e.target.value))}
                    className="flex-1 accent-[var(--mint-primary)]"
                  />
                </div>
              </label>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="ob-3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_OPTIONS.map((reg) => {
                  const active = focusRegions.includes(reg.id);
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => toggleItem(focusRegions, reg.id, setFocusRegions)}
                      className={`rounded-2xl border p-2.5 text-left ${
                        active
                          ? "border-[var(--mint-primary)] bg-[var(--mint-soft)]"
                          : "border-[var(--border-hairline)] bg-white"
                      }`}
                    >
                      <p className="text-xs font-bold">{reg.label}</p>
                      <p className="text-[10px] text-[var(--ink-muted)]">{reg.hint}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Dụng cụ tập</span>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-2.5 py-2"
                  >
                    <option value="none">Không dụng cụ</option>
                    <option value="dumbbells">Có tạ đơn</option>
                    <option value="gym">Phòng Gym</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[var(--ink-muted)]">Số buổi / tuần</span>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-2.5 py-2"
                  >
                    {[3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>
                        {d} buổi / tuần
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--border-hairline)] pt-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] px-4 py-2 text-xs font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--mint-primary)] px-5 py-2 text-xs font-bold text-white"
            >
              Tiếp tục
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitProfile()}
              className="rounded-full bg-[var(--mint-primary)] px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Đang tạo..." : "Hoàn tất"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
