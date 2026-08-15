import { unlockNote } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const auth = await getAuthPayload();
  const portal = auth.portal;
  
  if (!body.pin) {
    return jsonResponse({ success: false, error: "PIN is required" }, 400);
  }

  const result = await unlockNote(id, body.pin, portal);
  return jsonResponse(result, result.success ? 200 : 403);
}
