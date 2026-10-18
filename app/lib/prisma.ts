/**
 * ไฟล์: app/lib/prisma.ts — ตัวเชื่อมต่อฐานข้อมูล
 * ทุกไฟล์ที่ต้องอ่าน/เขียนฐานข้อมูลจะ import ตัวแปร prisma จากที่นี่
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

// เก็บ client ไว้ใน globalThis เพื่อให้ใช้ตัวเดิมซ้ำตอน dev (Next.js โหลดโค้ดใหม่บ่อย)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// สร้าง PrismaClient โดยใช้ SQLite ผ่าน adapter ที่อยู่ไฟล์จาก DATABASE_URL ใน .env
function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

// ใช้ instance เดียวตอน dev เพื่อไม่ให้เปิด connection ซ้ำทุกครั้งที่ hot reload
const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;