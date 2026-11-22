import { z } from "zod";
import { searchFoods, VIETNAMESE_FOODS } from "@/lib/nutrition/vietnamese-foods";

export const MealVisionItemSchema = z.object({
  name: z.string().min(1).max(120),
  grams: z.number().min(1).max(5000),
  calories: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(500),
});

export const MealVisionResultSchema = z.object({
  dishTitle: z.string().min(1).max(160),
  confidence: z.number().min(0).max(1),
  notes: z.string().max(400).default(""),
  items: z.array(MealVisionItemSchema).min(1).max(15),
});

export interface MealVisionResponse {
  dishTitle: string;
  confidence: number;
  notes: string;
  items: z.infer<typeof MealVisionItemSchema>[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  provider: string;
  quotaFallbackTriggered: boolean;
}

export interface AnalyzeMealOptions {
  geminiApiKey?: string;
  primaryModel?: string;
  fallbackModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  fetchImpl?: typeof fetch;
}

const VISION_PROMPT = `Bạn là chuyên gia dinh dưỡng Việt Nam & quốc tế. Hãy nhận diện món ăn trong ảnh, ước lượng khối lượng từng thành phần (gram) và tính calo, protein, carbs, fat.
CHỈ trả về JSON hợp lệ theo schema:
{
  "dishTitle": "Tên món ăn bằng tiếng Việt",
  "confidence": 0.0-1.0,
  "notes": "Ghi chú ngắn về sai số ước lượng khẩu phần",
  "items": [
    { "name": "Tên thành phần", "grams": 150, "calories": 250, "proteinG": 20, "carbsG": 30, "fatG": 5 }
  ]
}`;

function summarize(
  parsed: z.infer<typeof MealVisionResultSchema>,
  provider: string,
  quotaFallbackTriggered: boolean,
): MealVisionResponse {
  const totalCalories = Math.round(parsed.items.reduce((s, i) => s + i.calories, 0));
  const totalProteinG = Math.round(parsed.items.reduce((s, i) => s + i.proteinG, 0) * 10) / 10;
  const totalCarbsG = Math.round(parsed.items.reduce((s, i) => s + i.carbsG, 0) * 10) / 10;
  const totalFatG = Math.round(parsed.items.reduce((s, i) => s + i.fatG, 0) * 10) / 10;

  return {
    ...parsed,
    totalCalories,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    provider,
    quotaFallbackTriggered,
  };
}

async function callGeminiModel(params: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
  hintText?: string;
  fetchImpl: typeof fetch;
}): Promise<{ ok: true; data: z.infer<typeof MealVisionResultSchema> } | { ok: false; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
  const promptText = params.hintText
    ? `${VISION_PROMPT}\nGợi ý từ người dùng: "${params.hintText.slice(0, 120)}"`
    : VISION_PROMPT;

  const resp = await params.fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: promptText },
            { inline_data: { mime_type: params.mimeType, data: params.imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!resp.ok) {
    return { ok: false, status: resp.status };
  }

  const json = (await resp.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return { ok: false, status: 502 };

  const cleaned = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = MealVisionResultSchema.safeParse(JSON.parse(cleaned));
  if (!parsed.success) return { ok: false, status: 422 };
  return { ok: true, data: parsed.data };
}

async function callOllamaVision(params: {
  baseUrl: string;
  model: string;
  imageBase64: string;
  hintText?: string;
  fetchImpl: typeof fetch;
}): Promise<z.infer<typeof MealVisionResultSchema> | null> {
  try {
    const resp = await params.fetchImpl(`${params.baseUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: params.model,
        prompt: params.hintText
          ? `${VISION_PROMPT}\nGợi ý: ${params.hintText.slice(0, 120)}`
          : VISION_PROMPT,
        images: [params.imageBase64],
        format: "json",
        stream: false,
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { response?: string };
    if (!data.response) return null;
    const parsed = MealVisionResultSchema.safeParse(JSON.parse(data.response));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function analyzeMealImage(
  input: { imageBase64: string; mimeType: string; hintText?: string },
  opts: AnalyzeMealOptions = {},
): Promise<MealVisionResponse> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const geminiKey = opts.geminiApiKey ?? process.env.GEMINI_API_KEY ?? "";
  const primaryModel = opts.primaryModel ?? process.env.GEMINI_MODEL_PRIMARY ?? "gemini-2.5-flash";
  const fallbackModel =
    opts.fallbackModel ?? process.env.GEMINI_MODEL_FALLBACK ?? "gemini-2.5-flash-lite";
  const ollamaUrl = opts.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL ?? "";
  const ollamaModel = opts.ollamaModel ?? process.env.OLLAMA_VISION_MODEL ?? "llama3.2-vision";

  let quotaFallbackTriggered = false;

  if (geminiKey) {
    try {
      const first = await callGeminiModel({
        apiKey: geminiKey,
        model: primaryModel,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        hintText: input.hintText,
        fetchImpl,
      });
      if (first.ok) {
        return summarize(first.data, `gemini:${primaryModel}`, false);
      }
      if (first.status === 429 || first.status >= 500) {
        quotaFallbackTriggered = true;
        if (fallbackModel && fallbackModel !== primaryModel) {
          const second = await callGeminiModel({
            apiKey: geminiKey,
            model: fallbackModel,
            imageBase64: input.imageBase64,
            mimeType: input.mimeType,
            hintText: input.hintText,
            fetchImpl,
          });
          if (second.ok) {
            return summarize(second.data, `gemini:${fallbackModel}`, true);
          }
        }
      }
    } catch {
      quotaFallbackTriggered = true;
    }
  }

  if (ollamaUrl) {
    const ollamaRes = await callOllamaVision({
      baseUrl: ollamaUrl,
      model: ollamaModel,
      imageBase64: input.imageBase64,
      hintText: input.hintText,
      fetchImpl,
    });
    if (ollamaRes) {
      return summarize(ollamaRes, `ollama:${ollamaModel}`, quotaFallbackTriggered);
    }
  }

  // Deterministic, non-crashing local fallback using Vietnamese nutrition DB
  const matches = input.hintText ? searchFoods(input.hintText) : [];
  const chosen = matches[0] ?? VIETNAMESE_FOODS[0];

  return summarize(
    {
      dishTitle: chosen.name,
      confidence: matches.length > 0 ? 0.72 : 0.45,
      notes: geminiKey
        ? "API AI đang hết quota hoặc quá tải — đã tự động chuyển sang gợi ý từ kho dinh dưỡng nội bộ để bạn chỉnh & lưu ngay."
        : "Chế độ offline/demo (chưa gắn GEMINI_API_KEY) — chọn món hoặc chỉnh gram trước khi lưu.",
      items: [
        {
          name: `${chosen.name} (${chosen.servingLabel})`,
          grams: chosen.servingGrams,
          calories: chosen.calories,
          proteinG: chosen.proteinG,
          carbsG: chosen.carbsG,
          fatG: chosen.fatG,
        },
      ],
    },
    "local_fallback",
    quotaFallbackTriggered,
  );
}
