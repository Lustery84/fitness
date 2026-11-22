import { apiOk } from "@/lib/api/http";
import { searchFoods } from "@/lib/nutrition/vietnamese-foods";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  return apiOk({ foods: searchFoods(query) });
}
