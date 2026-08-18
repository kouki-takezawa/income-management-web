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
      const path = nextUrl.pathname;
      const isAuthPage = path === "/login" || path === "/signup";
      // 管理者が発行したリンクからアクセスするページなので、ログイン状態に
      // 関わらず常に到達できるようにする（ログイン中でも古いセッションのまま
      // リンクを開くケースがあるため、ログイン済みでもリダイレクトしない）。
      const isResetPasswordPage = path === "/reset-password";

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isResetPasswordPage) {
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
