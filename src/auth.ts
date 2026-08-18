import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // ADMIN_EMAIL による自己修復的な昇格: この環境変数が設定されていて、
        // 一致するメールアドレスのユーザーがまだ owner でない場合はログイン時に
        // 昇格させる。ADMIN_EMAIL 導入前から存在するユーザーを、本番DBに直接
        // アクセスせずに owner にできるようにするための仕組み。
        let role = user.role;
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        if (adminEmail && adminEmail === user.email && user.role !== "owner") {
          const updated = await prisma.user.update({ where: { id: user.id }, data: { role: "owner" } });
          role = updated.role;
        }

        return { id: user.id, email: user.email, role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role ?? "member";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string | undefined) ?? "member";
      }
      return session;
    },
  },
});
