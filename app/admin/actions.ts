"use server";

import { cookies } from "next/headers";

export async function loginAction(email: string, pass: string) {
  // Use environment variables for secure deployment, fallback to defaults if not set
  const correctEmail = process.env.ADMIN_EMAIL || "admin@baliwaste.com";
  const correctPass = process.env.ADMIN_PASSWORD || "admin123";

  if (email === correctEmail && pass === correctPass) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true };
  }
  return { success: false, error: "Email atau password salah" };
}

export async function checkAuthAction() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}
