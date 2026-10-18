/**
 * ไฟล์: app/api/auth/[...nextauth]/route.ts
 * รับ request ทุกเส้นทาง /api/auth/* แล้วส่งต่อให้ Auth.js จัดการ
 * เช่น /api/auth/csrf, /api/auth/callback/credentials (login), /api/auth/session
 * (Postman ใช้เส้นทางเหล่านี้ตอน login เพื่อทดสอบ DELETE ด้วยสิทธิ์ ADMIN)
 */
import { handlers } from "@/app/auth";

export const { GET, POST } = handlers;