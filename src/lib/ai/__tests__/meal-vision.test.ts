import { describe, expect, it, vi } from "vitest";
import { analyzeMealImage, MealVisionResultSchema } from "../meal-vision";

describe("Meal Vision Adapter & Safe Fallbacks", () => {
  it("falls back cleanly to Vietnamese food matcher when no API key is configured", async () => {
    const res = await analyzeMealImage(
      {
        imageBase64: "ZmFrZQ==",
        mimeType: "image/jpeg",
        hintText: "pho bo tai",
      },
      { geminiApiKey: "", ollamaBaseUrl: "" },
    );

    expect(res.provider).toBe("local_fallback");
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].name.toLowerCase()).toContain("phở");
  });

  it("falls back to secondary model when primary Gemini returns 429 quota exceeded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Quota exceeded", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        dishTitle: "Cơm tấm sườn",
                        confidence: 0.88,
                        notes: "Ước lượng 1 đĩa tiêu chuẩn",
                        items: [
                          {
                            name: "Cơm tấm + sườn nướng",
                            grams: 350,
                            calories: 620,
                            proteinG: 32,
                            carbsG: 72,
                            fatG: 21,
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const res = await analyzeMealImage(
      { imageBase64: "ZmFrZQ==", mimeType: "image/jpeg" },
      {
        geminiApiKey: "test-key",
        primaryModel: "gemini-2.5-flash",
        fallbackModel: "gemini-2.5-flash-lite",
        fetchImpl: fetchMock as unknown as typeof fetch,
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.provider).toBe("gemini:gemini-2.5-flash-lite");
    expect(res.dishTitle).toBe("Cơm tấm sườn");
    expect(res.totalCalories).toBe(620);
  });

  it("rejects malformed/untrusted LLM JSON safely", () => {
    const parsed = MealVisionResultSchema.safeParse({
      dishTitle: "Hack",
      items: [{ name: "Test", calories: -500 }],
    });
    expect(parsed.success).toBe(false);
  });
});
