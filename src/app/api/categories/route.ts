import { fetchCategories, createCategory } from "@/lib/categoriesService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getAuthPayload();
    const portal = auth.portal;
    const result = await fetchCategories(portal);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch {
    return jsonResponse({ success: false, error: "Internal Error" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthPayload();
    const portal = auth.portal;
    const body = await request.json();
    if (!body || !body.name) {
      return jsonResponse({ success: false, error: "Name is required" }, 400);
    }
    const result = await createCategory(body.name, portal);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
  }
}
