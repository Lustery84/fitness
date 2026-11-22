import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

export function zodErrorResponse(err: ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "Dữ liệu gửi lên chưa hợp lệ.",
    400,
    err.flatten().fieldErrors,
  );
}
