import type { BodyFocusRegion, EquipmentType, Sex } from "@/types/fitsnap";

export interface WorkoutExercise {
  name: string;
  setsReps: string;
  category: "compound" | "targeted_tone" | "cardio";
  targetRegion: BodyFocusRegion;
  met: number;
  note: string;
}

export interface WorkoutDayPlan {
  dayLabel: string;
  title: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
}

export interface BodyFocusPlanOutput {
  focusRegions: BodyFocusRegion[];
  days: WorkoutDayPlan[];
  scienceNote: string;
  sources: string[];
}

const TARGETED_EXERCISES: Record<
  BodyFocusRegion,
  Record<EquipmentType, WorkoutExercise[]>
> = {
  belly: {
    none: [
      {
        name: "Plank (siết core, lưng trung tính)",
        setsReps: "3 hiệp × 45 giây",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 3.8,
        note: "Tăng độ khỏe cơ bụng ngang & ổn định cột sống",
      },
      {
        name: "Dead Bug / Bicycle Crunch chậm",
        setsReps: "3 hiệp × 14 lần/bên",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 4.2,
        note: "Kiểm soát nhịp thở, tránh giật cổ",
      },
    ],
    dumbbells: [
      {
        name: "Pallof Press / Russian Twist với tạ đơn",
        setsReps: "3 hiệp × 12 lần/bên",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 4.5,
        note: "Tăng săn chắc cơ chéo bụng",
      },
      {
        name: "Hollow Body Hold + Leg Lower",
        setsReps: "3 hiệp × 12 lần",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 4.0,
        note: "Ép sát lưng dưới xuống sàn",
      },
    ],
    gym: [
      {
        name: "Cable Crunch (gập bụng với cáp)",
        setsReps: "3 hiệp × 12–15 lần",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 4.5,
        note: "Tăng tải lũy tiến để cơ bụng sắc nét khi giảm mỡ",
      },
      {
        name: "Hanging Knee/Leg Raise",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "belly",
        met: 4.8,
        note: "Tập trung nâng xương chậu, không đung đưa",
      },
    ],
  },
  thighs: {
    none: [
      {
        name: "Bulgarian Split Squat (trọng lượng cơ thể)",
        setsReps: "3 hiệp × 12 lần/chân",
        category: "targeted_tone",
        targetRegion: "thighs",
        met: 5.5,
        note: "Định hình đùi trước & đùi sau cân đối",
      },
    ],
    dumbbells: [
      {
        name: "Goblet Squat + Romanian Deadlift (tạ đơn)",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "thighs",
        met: 6.0,
        note: "Tác động đồng thời đùi trước, đùi sau và mông",
      },
    ],
    gym: [
      {
        name: "Leg Press + Seated Leg Curl",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "thighs",
        met: 5.8,
        note: "Kiểm soát pha hạ tạ 2–3 giây",
      },
    ],
  },
  arms: {
    none: [
      {
        name: "Push-up hẹp tay / Chair Dip",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "arms",
        met: 4.8,
        note: "Làm săn chắc bắp tay sau",
      },
    ],
    dumbbells: [
      {
        name: "Dumbbell Bicep Curl + Overhead Tricep Extension",
        setsReps: "3 hiệp × 12 lần",
        category: "targeted_tone",
        targetRegion: "arms",
        met: 4.2,
        note: "Giữ khuỷu tay cố định, không vung vai",
      },
    ],
    gym: [
      {
        name: "Cable Tricep Pushdown + Incline Dumbbell Curl",
        setsReps: "3 hiệp × 12 lần",
        category: "targeted_tone",
        targetRegion: "arms",
        met: 4.5,
        note: "Tạo nét bắp tay trước và sau",
      },
    ],
  },
  glutes: {
    none: [
      {
        name: "Single-Leg Glute Bridge",
        setsReps: "3 hiệp × 15 lần/bên",
        category: "targeted_tone",
        targetRegion: "glutes",
        met: 4.5,
        note: "Siết mông 1 giây ở đỉnh động tác",
      },
    ],
    dumbbells: [
      {
        name: "Dumbbell Hip Thrust",
        setsReps: "3 hiệp × 12 lần",
        category: "targeted_tone",
        targetRegion: "glutes",
        met: 5.5,
        note: "Bài tối ưu độ đầy và nâng vòng mông",
      },
    ],
    gym: [
      {
        name: "Barbell Hip Thrust + Cable Kickback",
        setsReps: "4 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "glutes",
        met: 6.0,
        note: "Tăng tạ đều đặn mỗi 1–2 tuần",
      },
    ],
  },
  chest_back: {
    none: [
      {
        name: "Push-up + Inverted Table/Band Row",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "chest_back",
        met: 5.2,
        note: "Cân bằng cơ đẩy và kéo, cải thiện tư thế",
      },
    ],
    dumbbells: [
      {
        name: "Dumbbell Bench Press + One-Arm Row",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "chest_back",
        met: 5.5,
        note: "Kéo bả vai về sau khi chèo tạ",
      },
    ],
    gym: [
      {
        name: "Lat Pulldown + Incline Machine Press",
        setsReps: "3 hiệp × 10–12 lần",
        category: "targeted_tone",
        targetRegion: "chest_back",
        met: 5.5,
        note: "Mở rộng khung lưng và săn chắc phần thân trên",
      },
    ],
  },
  full_body: {
    none: [
      {
        name: "Burpee kiểm soát nhịp / Squat Jump nhẹ",
        setsReps: "3 hiệp × 10 lần",
        category: "targeted_tone",
        targetRegion: "full_body",
        met: 7.0,
        note: "Tăng tiêu hao năng lượng toàn thân",
      },
    ],
    dumbbells: [
      {
        name: "Dumbbell Thruster (Squat + Đẩy vai)",
        setsReps: "3 hiệp × 10 lần",
        category: "targeted_tone",
        targetRegion: "full_body",
        met: 6.8,
        note: "Đốt calo cao, kích hoạt nhiều nhóm cơ lớn",
      },
    ],
    gym: [
      {
        name: "Kettlebell Swing / Farmer Walk",
        setsReps: "3 hiệp × 40m",
        category: "targeted_tone",
        targetRegion: "full_body",
        met: 6.5,
        note: "Rèn sức bền cơ cốt lõi và tim mạch",
      },
    ],
  },
};

const COMPOUND_BASE: Record<EquipmentType, WorkoutExercise[]> = {
  none: [
    {
      name: "Bodyweight Squat + Reverse Lunge",
      setsReps: "4 hiệp × 15 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 5.8,
      note: "Kích hoạt nhóm cơ lớn để tối đa hóa tiêu hao calo",
    },
    {
      name: "Incline / Standard Push-up",
      setsReps: "3 hiệp × 10–15 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 5.0,
      note: "Giữ cơ thể thẳng từ vai tới gót",
    },
  ],
  dumbbells: [
    {
      name: "Dumbbell Squat + Overhead Press",
      setsReps: "4 hiệp × 10–12 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 6.2,
      note: "Bài đa khớp đốt năng lượng hiệu quả",
    },
    {
      name: "Dumbbell Bent-Over Row",
      setsReps: "3 hiệp × 12 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 5.5,
      note: "Bảo vệ lưng và giữ khối cơ thân trên",
    },
  ],
  gym: [
    {
      name: "Goblet / Barbell Squat",
      setsReps: "4 hiệp × 8–10 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 6.5,
      note: "Ưu tiên kỹ thuật chuẩn trước khi tăng tạ",
    },
    {
      name: "Assisted Pull-up / Lat Pulldown",
      setsReps: "3 hiệp × 10–12 lần",
      category: "compound",
      targetRegion: "full_body",
      met: 5.5,
      note: "Giữ khối cơ lưng trong giai đoạn giảm mỡ",
    },
  ],
};

export function generateBodyFocusPlan(params: {
  focusRegions: BodyFocusRegion[];
  daysPerWeek: number;
  equipment: EquipmentType;
  sex: Sex;
}): BodyFocusPlanOutput {
  const regions: BodyFocusRegion[] =
    params.focusRegions.length > 0 ? params.focusRegions : ["belly"];
  const totalDays = Math.min(Math.max(params.daysPerWeek, 3), 6);
  const compounds = COMPOUND_BASE[params.equipment];

  const days: WorkoutDayPlan[] = [];
  for (let i = 0; i < totalDays; i++) {
    const primaryRegion = regions[i % regions.length];
    const targeted = TARGETED_EXERCISES[primaryRegion][params.equipment];
    const isCardioEmphasis = i % 2 === 1;

    const cardioExercise: WorkoutExercise = {
      name: isCardioEmphasis
        ? "Đi bộ dốc nhanh / Đạp xe Zone 2"
        : "Cardio nhẹ hạ nhiệt (Đi bộ nhanh)",
      setsReps: isCardioEmphasis ? "25 phút (nhịp tim 65–75% max)" : "15 phút",
      category: "cardio",
      targetRegion: "full_body",
      met: isCardioEmphasis ? 6.5 : 4.5,
      note: "Hỗ trợ thâm hụt calo toàn thân, ít gây mệt khớp",
    };

    const exercises: WorkoutExercise[] = [
      compounds[i % compounds.length],
      ...targeted,
      cardioExercise,
    ];

    days.push({
      dayLabel: `Buổi ${i + 1}`,
      title:
        params.sex === "female"
          ? `Toàn thân + Nhấn ${regionLabelVi(primaryRegion)}`
          : `Kháng lực + Siết ${regionLabelVi(primaryRegion)}`,
      estimatedMinutes: isCardioEmphasis ? 45 : 40,
      exercises,
    });
  }

  return {
    focusRegions: regions,
    days,
    scienceNote:
      "Lưu ý khoa học: Cơ thể không thể giảm mỡ cục bộ (spot reduction) chỉ bằng bài tập tại một vùng. Lịch tập kết hợp bài đa khớp toàn thân + cardio để giảm mỡ toàn thân, đồng thời tập tăng săn chắc cơ tại vùng bạn chọn để định hình rõ nét hơn.",
    sources: [
      "Systematic Review & Meta-Analysis (2022) — Localized muscle training & spot reduction",
      "ACSM / NSCA — Khuyến nghị tập kháng lực toàn thân khi giảm mỡ",
    ],
  };
}

export function estimateWorkoutCalories(params: {
  met: number;
  weightKg: number;
  durationMin: number;
}): number {
  return Math.round(params.met * params.weightKg * (params.durationMin / 60));
}

export function regionLabelVi(region: BodyFocusRegion): string {
  const labels: Record<BodyFocusRegion, string> = {
    belly: "Bụng & Eo",
    thighs: "Đùi",
    arms: "Bắp tay",
    glutes: "Mông",
    chest_back: "Ngực & Lưng",
    full_body: "Toàn thân",
  };
  return labels[region];
}
