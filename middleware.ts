import { createClerkClient } from "@clerk/backend";
import { next } from "@vercel/functions";
import { isAppGated } from "./lib/gates.js";

const AUTHORIZED_PARTIES = [
  "https://map.uptonm.dev",
  "https://uptonm.dev",
] as const;

/**
 * Production-only fleet gate for this static Bun SPA. Preview/local stay public.
 * Uses @clerk/backend (not @clerk/nextjs) because this app is not Next.js.
 */
export default async function middleware(request: Request) {
  if (process.env.VERCEL_ENV !== "production") {
    return next();
  }

  if (!(await isAppGated())) {
    return next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const signInUrl =
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "https://uptonm.dev/sign-in";

  if (!secretKey || !publishableKey) {
    throw new Error(
      "CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be configured in production.",
    );
  }

  const clerk = createClerkClient({ secretKey, publishableKey });
  const requestState = await clerk.authenticateRequest(request, {
    authorizedParties: [...AUTHORIZED_PARTIES],
    publishableKey,
    secretKey,
    signInUrl,
  });

  if (requestState.status === "handshake") {
    return new Response(null, {
      status: 307,
      headers: requestState.headers,
    });
  }

  if (requestState.isAuthenticated) {
    return next();
  }

  const redirectTo = new URL(signInUrl);
  redirectTo.searchParams.set("redirect_url", request.url);
  return Response.redirect(redirectTo, 307);
}

export const config = {
  // @clerk/backend needs Node (not Edge) — Vercel Routing Middleware supports this.
  runtime: "nodejs",
  matcher: [
    /*
     * Gate document + JS (SPA shell). Skip immutable media/fonts so link
     * previews and icons still load while the app itself stays locked.
     */
    "/((?![^?]*\\.(?:css|jpe?g|png|gif|svg|webp|ico|ttf|woff2?|map)).*)",
  ],
};
