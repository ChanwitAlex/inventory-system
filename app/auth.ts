import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";
import type { Role } from "@/app/lib/permissions";
import { loginSchema } from "@/app/lib/validation";

// hash ปลอม ใช้เทียบเวลาเมื่อไม่พบผู้ใช้ เพื่อไม่ให้เดาได้ว่าอีเมลมีอยู่ในระบบหรือไม่
const DUMMY_HASH =
  "$2b$12$MYRQVg8/A/gnpWJkmernqugdllqwPFtgQp1/7xNaOPYQDqISMoVBe";

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });

      const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) return null;

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  }),
];

// เปิด GitHub login เฉพาะเมื่อตั้งค่า env ครบ
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const githubEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER"; // ผู้ใช้ GitHub เริ่มต้นเป็น USER
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      session.user.role = (token.role as Role | undefined) ?? "USER";
      return session;
    },
  },
});
