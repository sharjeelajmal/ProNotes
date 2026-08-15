"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const validPersonalUsername = process.env.PERSONAL_USERNAME || "admin";
  const validPersonalPassword = process.env.PERSONAL_PASSWORD || "admin";
  
  const validBusinessUsername = process.env.BUSINESS_USERNAME || "business";
  const validBusinessPassword = process.env.BUSINESS_PASSWORD || "business";

  let authPayload: { portal: string, username: string, isAdmin: boolean } | null = null;
  if (username === validPersonalUsername && password === validPersonalPassword) {
    authPayload = { portal: "personal", username, isAdmin: true };
  } else if (username === validBusinessUsername && password === validBusinessPassword) {
    authPayload = { portal: "business", username, isAdmin: true };
  } else {
    // Check database for dynamically created business users
    try {
      const { connectDB } = await import("@/lib/db");
      const { User } = await import("@/models/User");
      await connectDB();
      const user = await User.findOne({ username, password, portal: "business" });
      if (user) {
        authPayload = { portal: "business", username: user.username, isAdmin: false };
      }
    } catch (error) {
      console.error("DB auth failed:", error);
    }
  }

  if (authPayload) {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", JSON.stringify(authPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    redirect("/");
  } else {
    return { error: "Invalid username or password" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}
