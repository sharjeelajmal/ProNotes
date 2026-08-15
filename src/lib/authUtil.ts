import { cookies } from "next/headers";

export interface AuthPayload {
  portal: string;
  username: string;
  isAdmin: boolean;
}

export async function getAuthPayload(): Promise<AuthPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  if (!token) {
    return { portal: "personal", username: "admin", isAdmin: true };
  }

  try {
    // If it's the old format (just "personal" or "business")
    if (token === "personal") return { portal: "personal", username: "admin", isAdmin: true };
    if (token === "business") return { portal: "business", username: "admin", isAdmin: true };
    
    // Parse JSON
    return JSON.parse(token);
  } catch {
    return { portal: "personal", username: "admin", isAdmin: true };
  }
}
