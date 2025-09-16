import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes accessible without auth
  const publicPaths = ["/api/auth/google-auth", "/"];

  // Protected routes requiring JWT token
  const protectedPaths = ["/chat"];

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    try {
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  // Let public routes pass
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Protect these routes

  // For all other unmatched routes - block access or allow as per your logic
  // Here, to be secure, redirect to homepage
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)"],
};
