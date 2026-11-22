import type { SupabaseClient } from "@supabase/supabase-js";
import { readLocalDb, writeLocalDb } from "./local-store";
import {
  mapMealFromRow,
  mapMeasurementFromRow,
  mapProfileFromRow,
  mapProfileToRow,
  mapWorkoutFromRow,
  type MealRow,
  type MeasurementRow,
  type ProfileRow,
  type WorkoutRow,
} from "./mappers";
import { createUserScopedSupabase, isSupabaseConfigured } from "./supabase";
import type {
  BodyMeasurement,
  MealLog,
  UserProfile,
  WorkoutLog,
} from "@/types/fitsnap";

export interface AuthContext {
  userId: string;
  supabase: SupabaseClient;
}

export async function resolveAuthContext(req: Request): Promise<AuthContext | null> {
  if (!isSupabaseConfigured()) return null;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const supabase = createUserScopedSupabase(token);
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { userId: data.user.id, supabase };
}

export async function loadAppState(auth: AuthContext | null) {
  if (isSupabaseConfigured()) {
    if (!auth) {
      return {
        authenticated: false,
        profile: null,
        mealLogs: [] as MealLog[],
        workoutLogs: [] as WorkoutLog[],
        measurements: [] as BodyMeasurement[],
      };
    }

    const [profileRes, mealsRes, workoutsRes, measRes] = await Promise.all([
      auth.supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.userId)
        .maybeSingle(),
      auth.supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", auth.userId)
        .order("measured_date", { ascending: true })
        .limit(100),
    ]);

    return {
      authenticated: true,
      profile: profileRes.data
        ? mapProfileFromRow(profileRes.data as ProfileRow)
        : null,
      mealLogs: ((mealsRes.data ?? []) as MealRow[]).map(mapMealFromRow),
      workoutLogs: ((workoutsRes.data ?? []) as WorkoutRow[]).map(mapWorkoutFromRow),
      measurements: ((measRes.data ?? []) as MeasurementRow[]).map(mapMeasurementFromRow),
    };
  }

  const db = await readLocalDb();
  return {
    authenticated: true,
    ...db,
  };
}

export async function saveUserProfile(
  auth: AuthContext | null,
  profile: UserProfile,
): Promise<UserProfile> {
  const today = new Date().toISOString().slice(0, 10);

  if (isSupabaseConfigured() && auth) {
    const scopedProfile: UserProfile = { ...profile, id: auth.userId };
    const row = mapProfileToRow(scopedProfile);
    const { error } = await auth.supabase
      .from("profiles")
      .upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);

    // Ensure initial weight entry exists for today
    const { data: existingMeas } = await auth.supabase
      .from("body_measurements")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("measured_date", today)
      .maybeSingle();

    if (!existingMeas) {
      await auth.supabase.from("body_measurements").insert({
        user_id: auth.userId,
        measured_date: today,
        weight_kg: scopedProfile.weightKg,
      });
    }
    return scopedProfile;
  }

  const db = await readLocalDb();
  const hasToday = db.measurements.some((m) => m.measuredDate === today);
  const measurements = hasToday
    ? db.measurements
    : [
        ...db.measurements,
        { id: `m-${Date.now()}`, measuredDate: today, weightKg: profile.weightKg },
      ];
  await writeLocalDb({ ...db, profile, measurements });
  return profile;
}

export async function createMealLog(
  auth: AuthContext | null,
  meal: Omit<MealLog, "id" | "createdAt">,
): Promise<MealLog> {
  if (isSupabaseConfigured() && auth) {
    const { data, error } = await auth.supabase
      .from("meal_logs")
      .insert({
        user_id: auth.userId,
        logged_date: meal.loggedDate,
        meal_slot: meal.mealSlot,
        title: meal.title,
        source: meal.source,
        items: meal.items,
        calories: meal.calories,
        protein_g: meal.proteinG,
        carbs_g: meal.carbsG,
        fat_g: meal.fatG,
        ai_confidence: meal.aiConfidence ?? null,
        provider: meal.provider ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapMealFromRow(data as MealRow);
  }

  const entry: MealLog = {
    ...meal,
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const db = await readLocalDb();
  await writeLocalDb({ ...db, mealLogs: [entry, ...db.mealLogs] });
  return entry;
}

export async function deleteMealLog(auth: AuthContext | null, id: string) {
  if (isSupabaseConfigured() && auth) {
    await auth.supabase
      .from("meal_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId);
    return;
  }
  const db = await readLocalDb();
  await writeLocalDb({
    ...db,
    mealLogs: db.mealLogs.filter((m) => m.id !== id),
  });
}

export async function createWorkoutLog(
  auth: AuthContext | null,
  workout: Omit<WorkoutLog, "id" | "createdAt">,
): Promise<WorkoutLog> {
  if (isSupabaseConfigured() && auth) {
    const { data, error } = await auth.supabase
      .from("workout_logs")
      .insert({
        user_id: auth.userId,
        logged_date: workout.loggedDate,
        title: workout.title,
        focus_region: workout.focusRegion,
        duration_min: workout.durationMin,
        calories_burned: workout.caloriesBurned,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapWorkoutFromRow(data as WorkoutRow);
  }

  const entry: WorkoutLog = {
    ...workout,
    id: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const db = await readLocalDb();
  await writeLocalDb({ ...db, workoutLogs: [entry, ...db.workoutLogs] });
  return entry;
}

export async function deleteWorkoutLog(auth: AuthContext | null, id: string) {
  if (isSupabaseConfigured() && auth) {
    await auth.supabase
      .from("workout_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId);
    return;
  }
  const db = await readLocalDb();
  await writeLocalDb({
    ...db,
    workoutLogs: db.workoutLogs.filter((w) => w.id !== id),
  });
}

export async function upsertMeasurement(
  auth: AuthContext | null,
  input: Omit<BodyMeasurement, "id">,
): Promise<BodyMeasurement> {
  if (isSupabaseConfigured() && auth) {
    const { data: existing } = await auth.supabase
      .from("body_measurements")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("measured_date", input.measuredDate)
      .maybeSingle();

    const payload = {
      user_id: auth.userId,
      measured_date: input.measuredDate,
      weight_kg: input.weightKg ?? null,
      waist_cm: input.waistCm ?? null,
      hip_cm: input.hipCm ?? null,
      thigh_cm: input.thighCm ?? null,
      arm_cm: input.armCm ?? null,
    };

    const query = existing
      ? auth.supabase
          .from("body_measurements")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : auth.supabase
          .from("body_measurements")
          .insert(payload)
          .select("*")
          .single();

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    if (input.weightKg) {
      await auth.supabase
        .from("profiles")
        .update({ weight_kg: input.weightKg })
        .eq("id", auth.userId);
    }
    return mapMeasurementFromRow(data as MeasurementRow);
  }

  const db = await readLocalDb();
  const entry: BodyMeasurement = { id: `ms-${Date.now()}`, ...input };
  const nextProfile =
    db.profile && input.weightKg
      ? { ...db.profile, weightKg: input.weightKg }
      : db.profile;
  const filtered = db.measurements.filter(
    (m) => m.measuredDate !== input.measuredDate,
  );
  await writeLocalDb({
    ...db,
    profile: nextProfile,
    measurements: [...filtered, entry].sort((a, b) =>
      a.measuredDate.localeCompare(b.measuredDate),
    ),
  });
  return entry;
}
