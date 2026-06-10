import { unlockNote } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { pin } = await request.json();
  const result = await unlockNote(id, pin);
  return jsonResponse(result, result.success ? 200 : 400);
}
