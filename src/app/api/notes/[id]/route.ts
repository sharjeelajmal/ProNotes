import { deleteNote, saveNote } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = await saveNote(id, body);
  return jsonResponse(result, result.success ? 200 : 400);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await deleteNote(id);
  return jsonResponse(result, result.success ? 200 : 400);
}
