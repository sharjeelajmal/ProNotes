import mongoose from "mongoose";
import dns from "dns";

if (process.env.NODE_ENV === "development") {
  try {
    const servers = dns.getServers();
    if (!servers || servers.length === 0 || servers.includes("127.0.0.1")) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    }
  } catch (e) {
    console.warn("Failed to set fallback DNS servers:", e);
  }
}

let cached = (global as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured on the server");
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
