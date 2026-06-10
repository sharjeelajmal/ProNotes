import mongoose from "mongoose";
import dns from "dns";

// Fix querySrv ECONNREFUSED error on Windows/local development by setting fallback DNS servers
// if Node falls back to loopback (127.0.0.1) DNS, which does not run a DNS server.
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

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
