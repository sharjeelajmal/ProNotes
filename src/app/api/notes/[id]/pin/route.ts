import { toggleNotePin } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { isPinned } = await request.json();
  const result = await toggleNotePin(id, !!isPinned);
  return jsonResponse(result, result.success ? 200 : 400);
}
