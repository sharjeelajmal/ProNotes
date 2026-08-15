import { deleteNote, saveNote } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const auth = await getAuthPayload();
  const portal = auth.portal;
  
  const result = await saveNote(id, body, portal, auth.username);
  return jsonResponse(result, result.success ? 200 : 400);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getAuthPayload();
  const portal = auth.portal;
  
  const result = await deleteNote(id, portal);
  return jsonResponse(result, result.success ? 200 : 400);
}
