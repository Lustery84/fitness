"use client";

import { useState } from "react";
import { Ruler, Scale } from "lucide-react";
import { authFetch } from "@/lib/api/auth-fetch";
import type { BodyMeasurement } from "@/types/fitsnap";

interface MeasurementTrackerProps {
  measurements: BodyMeasurement[];
  todayDate: string;
  currentWeightKg: number;
  onMeasurementAdded: (m: BodyMeasurement) => void;
}

export function MeasurementTracker({
  measurements,
  todayDate,
  currentWeightKg,
  onMeasurementAdded,
}: MeasurementTrackerProps) {
  const [weightKg, setWeightKg] = useState<string>(String(currentWeightKg));
  const [waistCm, setWaistCm] = useState<string>("");
  const [hipCm, setHipCm] = useState<string>("");
  const [thighCm, setThighCm] = useState<string>("");
  const [armCm, setArmCm] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = { measuredDate: todayDate };
      if (weightKg) payload.weightKg = Number(weightKg);
      if (waistCm) payload.waistCm = Number(waistCm);
      if (hipCm) payload.hipCm = Number(hipCm);
      if (thighCm) payload.thighCm = Number(thighCm);
      if (armCm) payload.armCm = Number(armCm);

      const resp = await authFetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok) {
        onMeasurementAdded(data.measurement);
        setMsg("Đã lưu số đo hôm nay.");
      }
    } finally {
      setSaving(false);
    }
  }

  const weightPoints = measurements.filter((m) => typeof m.weightKg === "number");
  const minW = Math.min(...weightPoints.map((p) => p.weightKg!), currentWeightKg) - 2;
  const maxW = Math.max(...weightPoints.map((p) => p.weightKg!), currentWeightKg) + 2;

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-2xl border border-teal-200 bg-[var(--mint-soft)] px-4 py-2 text-xs font-medium text-[var(--mint-dark)]">
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="mobile-card rounded-2xl p-4 space-y-3">
        <h3 className="flex items-center gap-1.5 text-xs font-bold">
          <Ruler className="h-4 w-4 text-[var(--mint-dark)]" />
          Số đo ngày {todayDate}
        </h3>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <label className="block">
            <span className="text-[var(--ink-muted)]">Cân nặng (kg)</span>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[var(--ink-muted)]">Vòng eo (cm)</span>
            <input
              type="number"
              step="0.5"
              placeholder="VD: 78"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[var(--ink-muted)]">Vòng mông (cm)</span>
            <input
              type="number"
              step="0.5"
              placeholder="VD: 94"
              value={hipCm}
              onChange={(e) => setHipCm(e.target.value)}
              className="mt-1 w-full rounded-xl bg-[var(--bg-soft)] px-3 py-2 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[var(--ink-muted)]">Đùi / Tay (cm)</span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <input
                type="number"
                step="0.5"
                placeholder="Đùi"
                value={thighCm}
                onChange={(e) => setThighCm(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-soft)] px-2 py-2 tabular-nums"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Tay"
                value={armCm}
                onChange={(e) => setArmCm(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-soft)] px-2 py-2 tabular-nums"
              />
            </div>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[var(--mint-primary)] py-2 text-xs font-bold text-white hover:bg-[var(--mint-dark)]"
        >
          {saving ? "Đang lưu..." : "Lưu số đo"}
        </button>
      </form>

      <div className="mobile-card rounded-2xl p-4">
        <h3 className="flex items-center gap-1.5 text-xs font-bold">
          <Scale className="h-4 w-4 text-[var(--mint-dark)]" />
          Xu hướng cân nặng
        </h3>
        {weightPoints.length >= 2 ? (
          <svg viewBox="0 0 320 110" className="mt-3 w-full overflow-visible">
            <polyline
              fill="none"
              stroke="#1FB8A6"
              strokeWidth="2.5"
              points={weightPoints
                .map((p, idx) => {
                  const x = (idx / (weightPoints.length - 1)) * 280 + 20;
                  const y =
                    90 - (((p.weightKg! - minW) / Math.max(1, maxW - minW)) * 65);
                  return `${x},${y}`;
                })
                .join(" ")}
            />
            {weightPoints.map((p, idx) => {
              const x = (idx / (weightPoints.length - 1)) * 280 + 20;
              const y =
                90 - (((p.weightKg! - minW) / Math.max(1, maxW - minW)) * 65);
              return (
                <g key={p.id}>
                  <circle cx={x} cy={y} r="4" fill="#0E9485" />
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#14201E"
                  >
                    {p.weightKg}kg
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Ghi thêm 1 ngày nữa để vẽ biểu đồ xu hướng (hiện có {weightPoints.length} bản ghi).
          </p>
        )}
      </div>
    </div>
  );
}
