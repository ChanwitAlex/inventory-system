/**
 * ไฟล์: app/lib/prisma.ts — ตัวเชื่อมต่อฐานข้อมูล
 * ทุกไฟล์ที่ต้องอ่าน/เขียนฐานข้อมูลจะ import ตัวแปร prisma จากที่นี่
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// เก็บ client ไว้ใน globalThis เพื่อให้ใช้ตัวเดิมซ้ำตอน dev (Next.js โหลดโค้ดใหม่บ่อย)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter } as any);
}

const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;