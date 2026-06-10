import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { jsonResponse } from "@/lib/apiHeaders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function uriFingerprint(uri: string) {
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "https://"));
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0] || "default";
    return {
      host: parsed.hostname,
      database: dbName,
    };
  } catch {
    return { host: "unknown", database: "unknown" };
  }
}

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI || "";
    if (!uri) {
      return jsonResponse(
        { success: false, error: "MONGODB_URI is not configured" },
        500
      );
    }

    await connectDB();
    const noteCount = await Note.countDocuments();
    const fingerprint = uriFingerprint(uri);

    return jsonResponse({
      success: true,
      database: fingerprint.database,
      host: fingerprint.host,
      noteCount,
      collection: "notes",
      source: process.env.VERCEL ? "vercel" : "local",
    });
  } catch (error) {
    console.error("sync-info failed:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database check failed",
      },
      500
    );
  }
}
