/**
 * ไฟล์: app/auth.ts — ตั้งค่าระบบยืนยันตัวตนด้วย Auth.js (ข้อ 3 Authentication)
 * - Credentials: login ด้วยอีเมล + รหัสผ่าน (เทียบกับฐานข้อมูลด้วย bcrypt)
 * - GitHub: login ด้วย GitHub (เปิดใช้เมื่อตั้งค่าใน .env และต้องมีบัญชีในระบบ)
 * - Session แบบ JWT เก็บใน cookie หมดอายุใน 8 ชั่วโมง
 * ส่งออก: handlers (route /api/auth), signIn, signOut, auth (อ่าน session ปัจจุบัน)
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";
import { loginSchema } from "@/app/lib/validation";

export const PENDING_APPROVAL_CODE = "pending_approval";

// ใช้แจ้งว่ารหัสผ่านถูกต้องแต่บัญชียังรอผู้ดูแลระบบอนุมัติ
// error พิเศษ: รหัสผ่านถูกแต่บัญชียังรอแอดมินอนุมัติ (ใช้แสดงข้อความต่างจาก 'รหัสผิด')
class PendingApprovalError extends CredentialsSignin {
  code = PENDING_APPROVAL_CODE;
}

// hash ปลอม ใช้เทียบเวลาเมื่อไม่พบผู้ใช้ เพื่อไม่ให้เดาได้ว่าอีเมลมีอยู่ในระบบหรือไม่
const DUMMY_HASH =
  "$2b$12$MYRQVg8/A/gnpWJkmernqugdllqwPFtgQp1/7xNaOPYQDqISMoVBe";

// วิธี login ที่เปิดให้ใช้
const providers: Provider[] = [
   // ฟังก์ชันตรวจ login ทำทีละขั้น:
    // 1) ตรวจรูปแบบอีเมล/รหัสผ่านด้วย loginSchema
    // 2) หาผู้ใช้จากอีเมล
    // 3) เทียบรหัสผ่านกับ hash (ไม่พบผู้ใช้ก็เทียบกับ hash ปลอมเพื่อให้ใช้เวลาเท่ากัน)
    // 4) ถ้ายังไม่อนุมัติ -> แจ้งรออนุมัติ
    // 5) ผ่านทั้งหมด -> คืนข้อมูลผู้ใช้ (id, ชื่อ, อีเมล, สิทธิ์) ไปเก็บใน session
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
    async signIn({ account, user, profile }) {
      if (account?.provider !== "github") return true;

      // ดึงอีเมล หากไม่มีอีเมลสาธารณะ ให้ใช้อีเมลสำรองจาก profile หรือ username
      const email = (
        user.email || 
        (profile as any)?.email || 
        `${profile?.login || "github_user"}@github.local`
      ).toLowerCase();

      // บันทึกอีเมลกลับเข้า user object เพื่อใช้ต่อใน jwt callback
      user.email = email;

      // ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
      let dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!dbUser) {
        // กรณีไม่มีบัญชี: สร้างใหม่เป็น STAFF + approved = true
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name || profile?.name || (profile?.login as string) || "GitHub User",
            passwordHash: "",
            role: "STAFF",
            approved: true,
          },
        });
      } else if (dbUser.approved === false) {
        // กรณีมีบัญชีเก่าที่ยังอัปเดตเป็น false อยู่: บังคับอัปเดตเป็น true ทันที
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { approved: true, role: dbUser.role || "STAFF" },
        });
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "github" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true, approved: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role ?? "STAFF";
        return token;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, approved: true },
        });
        if (!dbUser || dbUser.approved === false) return null;
        token.role = dbUser.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "STAFF";
      return session;
    },
  },
});