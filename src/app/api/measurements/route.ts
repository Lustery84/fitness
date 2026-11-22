import { z } from "zod";
import { apiError, apiOk, zodErrorResponse } from "@/lib/api/http";
import { resolveAuthContext, upsertMeasurement } from "@/lib/storage/repository";
import { isSupabaseConfigured } from "@/lib/storage/supabase";

const MeasurementSchema = z.object({
  measuredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().min(30).max(250).optional(),
  waistCm: z.number().min(40).max(200).optional(),
  hipCm: z.number().min(40).max(200).optional(),
  thighCm: z.number().min(25).max(120).optional(),
  armCm: z.number().min(15).max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    if (isSupabaseConfigured() && !auth) {
      return apiError("UNAUTHORIZED", "Vui lòng đăng nhập trước.", 401);
    }

    const raw = await req.json();
    const parsed = MeasurementSchema.safeParse(raw);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const measurement = await upsertMeasurement(auth, parsed.data);
    return apiOk({ measurement }, 201);
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể lưu số đo.", 500);
  }
}
