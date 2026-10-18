import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";
import type { Role } from "@/app/lib/permissions";
import { loginSchema } from "@/app/lib/validation";

export const PENDING_APPROVAL_CODE = "pending_approval";

// ใช้แจ้งว่ารหัสผ่านถูกต้องแต่บัญชียังรอผู้ดูแลระบบอนุมัติ
class PendingApprovalError extends CredentialsSignin {
  code = PENDING_APPROVAL_CODE;
}

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
      if (user.approved === false) throw new PendingApprovalError();

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
    // GitHub login ใช้ได้เฉพาะอีเมลที่มีบัญชีในระบบและได้รับอนุมัติแล้ว
    async signIn({ account, user }) {
      if (account?.provider !== "github") return true;
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { approved: true },
      });
      return Boolean(dbUser) && dbUser?.approved !== false;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "github" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true, approved: true },
        });
        if (dbUser && dbUser.approved !== false) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "STAFF";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      // token ที่ออกก่อนยกเลิกสิทธิ์ USER จะถูกนับเป็น STAFF ตามที่ migration ปรับข้อมูลไว้
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "STAFF";
      return session;
    },
  },
});