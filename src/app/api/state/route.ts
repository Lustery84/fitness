import { apiError, apiOk } from "@/lib/api/http";
import { loadAppState, resolveAuthContext } from "@/lib/storage/repository";
import { isSupabaseConfigured } from "@/lib/storage/supabase";

export async function GET(req: Request) {
  try {
    const auth = await resolveAuthContext(req);
    const data = await loadAppState(auth);
    return apiOk({
      ...data,
      storageMode: isSupabaseConfigured() ? "supabase" : "local_json",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasOllama: Boolean(process.env.OLLAMA_BASE_URL),
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Không thể đọc dữ liệu.", 500);
  }
}
