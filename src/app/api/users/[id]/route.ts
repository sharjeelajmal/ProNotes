import { updateUser, deleteUser } from "@/lib/usersService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function isBusinessPortal() {
  const auth = await getAuthPayload();
  return auth.portal === "business";
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isBusinessPortal())) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await updateUser(id, body);
    return jsonResponse(result, result.success ? 200 : 400);
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isBusinessPortal())) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  const { id } = await context.params;
  const result = await deleteUser(id);
  return jsonResponse(result, result.success ? 200 : 400);
}
