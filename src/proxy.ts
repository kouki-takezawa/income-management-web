// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior, new name/location
// convention). This file guards every app route: unauthenticated users are redirected
// to /login, and logged-in users are redirected away from /login and /signup.
// The actual allow/deny + redirect decision lives in the `authorized` callback in
// auth.config.ts, which this `auth` wrapper consults on every matched request.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|api/icon|manifest.webmanifest|_next/static|_next/image|favicon.ico).*)"],
};
