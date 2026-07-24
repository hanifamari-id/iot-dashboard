import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (
      username === process.env.DASHBOARD_USERNAME &&
      password === process.env.DASHBOARD_PASSWORD
    ) {
      await createSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: "Username atau password salah" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}