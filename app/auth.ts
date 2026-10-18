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
  Credentials({
    credentials: { email: {}, password: {} },
    // ฟังก์ชันตรวจ login ทำทีละขั้น:
    // 1) ตรวจรูปแบบอีเมล/รหัสผ่านด้วย loginSchema
    // 2) หาผู้ใช้จากอีเมล
    // 3) เทียบรหัสผ่านกับ hash (ไม่พบผู้ใช้ก็เทียบกับ hash ปลอมเพื่อให้ใช้เวลาเท่ากัน)
    // 4) ถ้ายังไม่อนุมัติ -> แจ้งรออนุมัติ
    // 5) ผ่านทั้งหมด -> คืนข้อมูลผู้ใช้ (id, ชื่อ, อีเมล, สิทธิ์) ไปเก็บใน session
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
// เปิดปุ่ม GitHub เฉพาะเมื่อมีทั้ง AUTH_GITHUB_ID และ AUTH_GITHUB_SECRET
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

// ให้หน้า login รู้ว่าควรแสดงปุ่ม GitHub หรือไม่
export const githubEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);

// สร้างระบบ Auth.js แล้วส่งออกฟังก์ชันที่ใช้ทั้งโปรเจกต์
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  callbacks: {
    // GitHub login ใช้ได้เฉพาะอีเมลที่มีบัญชีในระบบและได้รับอนุมัติแล้ว
    // callback signIn: GitHub login ได้เฉพาะอีเมลที่มีบัญชีในระบบและอนุมัติแล้ว
    async signIn({ account, user }) {
      if (account?.provider !== "github") return true;
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { approved: true },
      });
      return Boolean(dbUser) && dbUser?.approved !== false;
    },
    // callback jwt: จัดการข้อมูลใน token (cookie)
    // - ตอน login: ใส่ id และ role ลง token
    // - request ถัดไป: ตรวจกับฐานข้อมูลซ้ำ
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
        return token;
      }

      // request ถัด ๆ มา: ตรวจกับฐานข้อมูลซ้ำ เพื่อให้การเปลี่ยนสิทธิ์/ลบผู้ใช้/ยกเลิกอนุมัติ
      // มีผลทันที (ไม่ต้องรอ JWT หมดอายุ 8 ชั่วโมง) — คืน null = ยกเลิก session
      // ตรวจซ้ำทุก request: ถ้าผู้ใช้ถูกลบ/ยกเลิกอนุมัติ -> คืน null เพื่อยกเลิก session ทันที
      // ถ้าถูกเปลี่ยนสิทธิ์ -> อัปเดต role ใน token ทันที (ไม่ต้องรอ 8 ชั่วโมง)
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
    // callback session: ส่ง id และ role จาก token ไปให้หน้าเว็บ/โค้ดฝั่งเซิร์ฟเวอร์ใช้ผ่าน auth()
    async session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      // token ที่ออกก่อนยกเลิกสิทธิ์ USER จะถูกนับเป็น STAFF ตามที่ migration ปรับข้อมูลไว้
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "STAFF";
      return session;
    },
  },
});