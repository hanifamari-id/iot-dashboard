import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "@/types";

const SESSION_COOKIE_NAME = "iot-dashboard-session";

export async function createSession(): Promise<void> {
  const sealed = await sealData(
    { isLoggedIn: true } satisfies SessionData,
    {
      password: process.env.SESSION_SECRET!,
      ttl: 60 * 60 * 24 * 7, // 7 days
    }
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sealed) return null;

  try {
    const data = await unsealData<SessionData>(sealed, {
      password: process.env.SESSION_SECRET!,
    });
    return data;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}