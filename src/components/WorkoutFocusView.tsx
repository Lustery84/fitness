"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Dumbbell, Flame, Info } from "lucide-react";
import { authFetch } from "@/lib/api/auth-fetch";
import {
  estimateWorkoutCalories,
  generateBodyFocusPlan,
  regionLabelVi,
  type WorkoutDayPlan,
} from "@/lib/workout/body-focus-planner";
import type {
  BodyFocusRegion,
  EquipmentType,
  UserProfile,
  WorkoutLog,
} from "@/types/fitsnap";

interface WorkoutFocusViewProps {
  profile: UserProfile;
  todayDate: string;
  onWorkoutLogged: (workout: WorkoutLog) => void;
}

const REGIONS: BodyFocusRegion[] = [
  "belly",
  "thighs",
  "arms",
  "glutes",
  "chest_back",
  "full_body",
];

const BODY_HOTSPOTS: {
  region: BodyFocusRegion;
  cx: number;
  cy: number;
  r: number;
}[] = [
  { region: "chest_back", cx: 120, cy: 96, r: 17 },
  { region: "arms", cx: 76, cy: 118, r: 12 },
  { region: "belly", cx: 120, cy: 138, r: 19 },
  { region: "glutes", cx: 120, cy: 170, r: 16 },
  { region: "thighs", cx: 103, cy: 208, r: 15 },
];

export function WorkoutFocusView({
  profile,
  todayDate,
  onWorkoutLogged,
}: WorkoutFocusViewProps) {
  const [equipment, setEquipment] = useState<EquipmentType>(profile.equipment);
  const [selectedRegions, setSelectedRegions] = useState<BodyFocusRegion[]>(
    profile.focusRegions,
  );
  const [customTitle, setCustomTitle] = useState("Đi bộ dốc / Đạp xe");
  const [customDuration, setCustomDuration] = useState(30);
  const [customMet, setCustomMet] = useState(6.0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const plan = useMemo(
    () =>
      generateBodyFocusPlan({
        focusRegions: selectedRegions,
        daysPerWeek: profile.daysPerWeek,
        equipment,
        sex: profile.sex,
      }),
    [selectedRegions, profile.daysPerWeek, equipment, profile.sex],
  );

  function toggleRegion(region: BodyFocusRegion) {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.length > 1
          ? prev.filter((r) => r !== region)
          : prev
        : [...prev, region],
    );
  }

  async function logSession(
    title: string,
    durationMin: number,
    met: number,
    focusRegion: BodyFocusRegion,
  ) {
    setSaving(true);
    setFeedback(null);
    try {
      const resp = await authFetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loggedDate: todayDate,
          title,
          focusRegion,
          durationMin,
          met,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        onWorkoutLogged(data.workout);
        setFeedback(`Đã ghi "${data.workout.title}" (-${data.workout.caloriesBurned} kcal).`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function completeDayPlan(day: WorkoutDayPlan) {
    const avgMet =
      day.exercises.reduce((s, e) => s + e.met, 0) / Math.max(1, day.exercises.length);
    await logSession(
      `${day.dayLabel}: ${day.title}`,
      day.estimatedMinutes,
      Math.round(avgMet * 10) / 10,
      selectedRegions[0] ?? "full_body",
    );
  }

  return (
    <div className="space-y-4">
      {/* Instant Equipment Selector (Có / Không dụng cụ) */}
      <div className="mobile-card rounded-2xl p-3.5 space-y-2">
        <p className="text-xs font-bold">Bạn đang tập với dụng cụ nào?</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["none", "Không dụng cụ"],
              ["dumbbells", "Có tạ đơn"],
              ["gym", "Phòng Gym"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setEquipment(id)}
              className={`rounded-xl px-2 py-2 text-xs font-bold transition ${
                equipment === id
                  ? "bg-[var(--mint-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Light Body Silhouette + Region Chips */}
      <div className="mobile-card rounded-2xl p-4">
        <p className="text-xs font-bold text-center">
          Chạm vùng cơ thể muốn ưu tiên siết nét
        </p>
        <div className="mt-2 flex flex-col items-center">
          <svg viewBox="0 0 240 250" className="h-48 w-44 select-none">
            <g fill="#EAF3F1" stroke="#B6CFC9" strokeWidth="1.5">
              <circle cx="120" cy="36" r="16" />
              <path d="M92 64 Q120 58 148 64 L164 120 L148 124 L142 86 L138 154 L146 238 L128 238 L122 174 L118 174 L112 238 L94 238 L102 154 L98 86 L92 124 L76 120 Z" />
            </g>
            {BODY_HOTSPOTS.map((spot) => {
              const active = selectedRegions.includes(spot.region);
              return (
                <g
                  key={spot.region}
                  onClick={() => toggleRegion(spot.region)}
                  className="cursor-pointer"
                >
                  {active && (
                    <motion.circle
                      cx={spot.cx}
                      cy={spot.cy}
                      r={spot.r + 5}
                      fill="none"
                      stroke="#1FB8A6"
                      strokeWidth="1.5"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.9, 0.2, 0.9] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r={spot.r}
                    fill={active ? "rgba(31, 184, 166, 0.35)" : "rgba(255,255,255,0.65)"}
                    stroke={active ? "#0E9485" : "#9BB8B2"}
                    strokeWidth={active ? 2 : 1}
                  />
                </g>
              );
            })}
          </svg>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {REGIONS.map((reg) => {
              const active = selectedRegions.includes(reg);
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => toggleRegion(reg)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "bg-[var(--mint-primary)] text-white"
                      : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                  }`}
                >
                  {regionLabelVi(reg)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honest Science Note */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>{plan.scienceNote}</p>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-teal-200 bg-[var(--mint-soft)] px-4 py-2 text-xs font-medium text-[var(--mint-dark)]">
          {feedback}
        </div>
      )}

      {/* Quick Cardio / Activity Logger */}
      <div className="mobile-card rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Flame className="h-4 w-4 text-amber-500" />
          Ghi nhanh vận động / Cardio
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="col-span-2 rounded-xl bg-[var(--bg-soft)] px-3 py-2"
          />
          <select
            value={customMet}
            onChange={(e) => setCustomMet(Number(e.target.value))}
            className="rounded-xl bg-[var(--bg-soft)] px-2.5 py-2"
          >
            <option value={3.5}>Đi bộ (3.5 MET)</option>
            <option value={6.0}>Đi bộ dốc / Xe đạp (6.0)</option>
            <option value={5.5}>Tập tạ / Kháng lực (5.5)</option>
            <option value={8.0}>Chạy bộ / HIIT (8.0)</option>
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={5}
              max={240}
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className="w-16 rounded-xl bg-[var(--bg-soft)] px-2.5 py-2 tabular-nums"
            />
            <span className="text-[11px] text-[var(--ink-muted)]">phút</span>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            logSession(
              customTitle,
              customDuration,
              customMet,
              selectedRegions[0] ?? "full_body",
            )
          }
          className="w-full rounded-xl bg-[var(--mint-primary)] py-2 text-xs font-bold text-white hover:bg-[var(--mint-dark)]"
        >
          + Ghi buổi tập (
          {estimateWorkoutCalories({
            met: customMet,
            weightKg: profile.weightKg,
            durationMin: customDuration,
          })}{" "}
          kcal)
        </button>
      </div>

      {/* Weekly Exercise Cards */}
      <div className="space-y-3">
        {plan.days.map((day) => (
          <div key={day.dayLabel} className="mobile-card rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--mint-dark)]">
                {day.dayLabel} · ~{day.estimatedMinutes} phút
              </span>
              <Dumbbell className="h-4 w-4 text-[var(--ink-muted)]" />
            </div>
            <h4 className="text-sm font-bold">{day.title}</h4>
            <ul className="space-y-1.5 text-xs">
              {day.exercises.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg-canvas)] px-3 py-2"
                >
                  <span>{ex.name}</span>
                  <span className="shrink-0 font-bold text-[var(--mint-dark)]">
                    {ex.setsReps}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={saving}
              onClick={() => completeDayPlan(day)}
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[var(--mint-primary)] py-1.5 text-xs font-bold text-[var(--mint-dark)] hover:bg-[var(--mint-soft)]"
            >
              <Check className="h-3.5 w-3.5" />
              Hoàn thành buổi này
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
