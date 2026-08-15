import { fetchUsers, createUser } from "@/lib/usersService";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Middleware-like check
async function isBusinessPortal() {
  const auth = await getAuthPayload();
  return auth.portal === "business";
}

export async function GET() {
  if (!(await isBusinessPortal())) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  const result = await fetchUsers();
  return jsonResponse(result, result.success ? 200 : 500);
}

export async function POST(request: Request) {
  if (!(await isBusinessPortal())) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await request.json();
    const result = await createUser(body);
    return jsonResponse(result, result.success ? 200 : 400);
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid request body" }, 400);
  }
}
