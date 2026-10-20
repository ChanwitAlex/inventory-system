/**
 * ไฟล์: app/lib/prisma.ts — ตัวเชื่อมต่อฐานข้อมูล
 * ทุกไฟล์ที่ต้องอ่าน/เขียนฐานข้อมูลจะ import ตัวแปร prisma จากที่นี่
 */
import { PrismaClient } from "@/app/generated/prisma/client";

// เก็บ client ไว้ใน globalThis เพื่อให้ใช้ตัวเดิมซ้ำตอน dev (Next.js โหลดโค้ดใหม่บ่อย)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// สร้าง PrismaClient สำหรับ PostgreSQL (Supabase)
function createClient() {
  const options = {
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  };
  return new (PrismaClient as any)(options) as PrismaClient;
}

// ใช้ instance เดียวตอน dev เพื่อไม่ให้เปิด connection ซ้ำทุกครั้งที่ hot reload
const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;