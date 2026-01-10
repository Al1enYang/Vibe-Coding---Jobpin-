import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isOnboardingComplete } from "@/lib/onboarding";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Check onboarding completion for dashboard access
  const url = new URL(request.url);
  const { userId } = await auth();

  // If user is logged in and trying to access dashboard
  if (userId && url.pathname.startsWith("/dashboard")) {
    const isComplete = await isOnboardingComplete(userId);

    if (!isComplete) {
      // Redirect to onboarding if not completed
      return NextResponse.redirect(new URL("/onboarding/rolename", request.url));
    }
  }
});
