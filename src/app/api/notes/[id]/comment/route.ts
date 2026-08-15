import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { jsonResponse } from "@/lib/apiHeaders";
import { getAuthPayload } from "@/lib/authUtil";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const auth = await getAuthPayload();
    const portal = auth.portal;
    const username = auth.username;

    if (!username) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const { text, type = 'text', mediaData } = await request.json();
    if (type === 'text' && (!text || typeof text !== "string" || text.trim() === "")) {
      return jsonResponse({ success: false, error: "Invalid comment text" }, 400);
    }

    await connectDB();

    const newComment = {
      id: "cmt-" + Date.now().toString(),
      username,
      text: text ? text.trim() : "",
      type,
      mediaData,
      createdAt: new Date(),
    };

    const note = await Note.findOneAndUpdate(
      { _id: id, portal },
      { $push: { comments: newComment } },
      { new: true }
    );

    if (!note) {
      return jsonResponse({ success: false, error: "Note not found" }, 404);
    }

    return jsonResponse({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      500
    );
  }
}
