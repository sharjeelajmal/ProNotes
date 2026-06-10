import { fetchAllNotes } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await fetchAllNotes();
  return jsonResponse(result, result.success ? 200 : 500);
}
