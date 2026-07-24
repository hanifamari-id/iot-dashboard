import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsealData } from "iron-session";

const SESSION_COOKIE_NAME = "iot-dashboard-session";

const protectedRoutes = ["/dashboard", "/api/realtime", "/api/usage"];
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next();
  }

  const sealed = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isLoggedIn = false;

  if (sealed) {
    try {
      const session = await unsealData<{ isLoggedIn: boolean }>(sealed, {
        password: process.env.SESSION_SECRET!,
      });
      isLoggedIn = session?.isLoggedIn === true;
    } catch {
      isLoggedIn = false;
    }
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};