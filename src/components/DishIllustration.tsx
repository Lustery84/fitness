"use client";

export function DishIllustration({
  id,
  category,
}: {
  id: string;
  category?: string;
}) {
  // Deterministic soft pastel background & vector food composition per dish
  const paletteIndex =
    id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
  const palettes = [
    { bg: "#EAF7F5", plate: "#FFFFFF", main: "#1FB8A6", side: "#F59E0B", garnish: "#10B981" },
    { bg: "#FEF6E7", plate: "#FFFFFF", main: "#F59E0B", side: "#10B981", garnish: "#FB7185" },
    { bg: "#EEF5FF", plate: "#FFFFFF", main: "#0EA5E9", side: "#F59E0B", garnish: "#14B8A6" },
    { bg: "#FDF2F4", plate: "#FFFFFF", main: "#FB7185", side: "#10B981", garnish: "#FBBF24" },
  ];
  const p = palettes[paletteIndex];

  if (category === "snack" || id.includes("yogurt") || id.includes("whey")) {
    return (
      <svg viewBox="0 0 120 84" className="h-24 w-full rounded-xl" style={{ background: p.bg }}>
        <ellipse cx="60" cy="64" rx="34" ry="8" fill="rgba(20,32,30,0.07)" />
        <path d="M32 34 H88 L80 62 Q60 68 40 62 Z" fill={p.plate} stroke="#DCE7E4" strokeWidth="1.5" />
        <ellipse cx="60" cy="34" rx="28" ry="8" fill={p.main} fillOpacity="0.22" />
        <circle cx="52" cy="33" r="6" fill={p.side} />
        <circle cx="66" cy="34" r="5" fill={p.garnish} />
        <circle cx="59" cy="30" r="4" fill={p.main} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 84" className="h-24 w-full rounded-xl" style={{ background: p.bg }}>
      <ellipse cx="60" cy="46" rx="34" ry="26" fill={p.plate} stroke="#DCE7E4" strokeWidth="1.5" />
      <ellipse cx="60" cy="46" rx="26" ry="19" fill="#F6FAF9" />
      <ellipse cx="51" cy="43" rx="11" ry="8" fill={p.main} fillOpacity="0.88" />
      <ellipse cx="69" cy="49" rx="10" ry="7" fill={p.side} fillOpacity="0.88" />
      <circle cx="57" cy="54" r="6" fill={p.garnish} fillOpacity="0.88" />
      <circle cx="67" cy="38" r="4" fill="#10B981" fillOpacity="0.75" />
    </svg>
  );
}
