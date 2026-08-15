import { fetchAllNotes, saveNote } from "@/lib/notesService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthPayload();
  const portal = auth.portal;
  const result = await fetchAllNotes(portal, auth.username, auth.isAdmin);
  return jsonResponse(result, result.success ? 200 : 500);
}

export async function POST(request: Request) {
  const auth = await getAuthPayload();
  const portal = auth.portal;
  try {
    const body = await request.json();
    const result = await saveNote("", body, portal, auth.username);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
  }
}
