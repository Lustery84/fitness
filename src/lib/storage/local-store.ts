import fs from "node:fs/promises";
import path from "node:path";
import type {
  BodyMeasurement,
  MealLog,
  UserProfile,
  WorkoutLog,
} from "@/types/fitsnap";

export interface LocalDbSchema {
  profile: UserProfile | null;
  mealLogs: MealLog[];
  workoutLogs: WorkoutLog[];
  measurements: BodyMeasurement[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "fitsnap-db.json");

const DEFAULT_DB: LocalDbSchema = {
  profile: null,
  mealLogs: [],
  workoutLogs: [],
  measurements: [],
};

export async function readLocalDb(): Promise<LocalDbSchema> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDbSchema>;
    return {
      profile: parsed.profile ?? null,
      mealLogs: Array.isArray(parsed.mealLogs) ? parsed.mealLogs : [],
      workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

export async function writeLocalDb(data: LocalDbSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpFile, DB_FILE);
}
