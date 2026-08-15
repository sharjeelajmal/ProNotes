import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUsername = (body.username as string) || "";
    const rawPassword = (body.password as string) || "";

    const username = rawUsername.trim();
    const password = rawPassword.trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const validPersonalUsername = (process.env.PERSONAL_USERNAME || "admin").trim();
    const validPersonalPassword = (process.env.PERSONAL_PASSWORD || "admin").trim();

    const validBusinessUsername = (process.env.BUSINESS_USERNAME || "business").trim();
    const validBusinessPassword = (process.env.BUSINESS_PASSWORD || "business").trim();

    let authPayload: { portal: string; username: string; isAdmin: boolean } | null = null;

    if (
      username.toLowerCase() === validPersonalUsername.toLowerCase() &&
      password === validPersonalPassword
    ) {
      authPayload = { portal: "personal", username: validPersonalUsername, isAdmin: true };
    } else if (
      username.toLowerCase() === validBusinessUsername.toLowerCase() &&
      password === validBusinessPassword
    ) {
      authPayload = { portal: "business", username: validBusinessUsername, isAdmin: true };
    } else {
      // Dynamic business user authentication from MongoDB
      await connectDB();
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
        password: password,
        portal: "business",
      });

      if (user) {
        authPayload = { portal: "business", username: user.username, isAdmin: false };
      }
    }

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, user: authPayload });
    response.cookies.set("auth_token", encodeURIComponent(JSON.stringify(authPayload)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500 }
    );
  }
}
