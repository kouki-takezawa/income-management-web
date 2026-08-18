import type { NextAuthConfig } from "next-auth";

// エッジ/プロキシでも読み込める軽量な設定（Prisma や bcrypt には依存しない）。
// 実際の認証処理（Credentials provider）は auth.ts 側で追加する。
export default {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      if (isPublicPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
