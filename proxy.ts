import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const needsAuth =
    pathname.startsWith("/clubs") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/join");

  if (needsAuth && !isLoggedIn) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && pathname.startsWith("/clubs") && !req.auth?.user?.name) {
    const onboardingUrl = new URL("/onboarding", req.nextUrl.origin);
    onboardingUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(onboardingUrl);
  }
});

export const config = {
  matcher: ["/clubs/:path*", "/onboarding/:path*", "/join/:path*"],
};
