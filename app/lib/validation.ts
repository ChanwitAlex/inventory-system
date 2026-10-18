/**
 * ไฟล์: app/lib/validation.ts — กฎตรวจสอบข้อมูล (ข้อ 2 Validation) ด้วยไลบรารี Zod
 * ใช้ชุดกฎเดียวกันทั้ง 'ฟอร์มบนหน้าเว็บ' และ 'API' ข้อมูลจึงถูกตรวจเหมือนกันทุกช่องทาง
 * ถ้าไม่ผ่านจะได้ข้อความ error แยกรายช่อง นำไปแสดงใต้ช่องกรอกได้
 */
import { z } from "zod";
import { CATEGORIES } from "@/app/lib/constants";

// ---------- สินค้า ----------
// ค่าว่าง/null ถือว่า "ไม่ได้กรอก" (ไม่ใช่ 0) เพื่อให้ขึ้น error แทนการบันทึกเป็น 0 เงียบ ๆ
// ช่องที่เว้นว่าง/null ให้ถือว่า 'ไม่ได้กรอก' เพื่อขึ้น error
// (ถ้าไม่ทำ ช่องว่างจะถูกแปลงเป็น 0 แล้วบันทึกเงียบ ๆ)
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

// กฎของสินค้า — ใช้ตอนเพิ่ม (POST) และแก้ไข (PUT) ทั้งในฟอร์มและ API
export const productSchema = z.object({
  // รหัสสินค้า: ห้ามว่าง ไม่เกิน 30 ตัว ใช้ได้เฉพาะ A-Z 0-9 - _ และแปลงเป็นตัวพิมพ์ใหญ่ให้อัตโนมัติ
  sku: z
    .string("กรุณากรอกรหัสสินค้า")
    .trim()
    .min(1, "กรุณากรอกรหัสสินค้า")
    .max(30, "รหัสสินค้าต้องไม่เกิน 30 ตัวอักษร")
    .regex(/^[A-Za-z0-9_-]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, - และ _")
    .transform((v) => v.toUpperCase()),

  // ชื่อสินค้า: ห้ามว่าง ไม่เกิน 120 ตัวอักษร (trim ช่องว่างหน้า-หลังให้)
  name: z
    .string("กรุณากรอกชื่อสินค้า")
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(120, "ชื่อสินค้าต้องไม่เกิน 120 ตัวอักษร"),

  // หมวดหมู่: ต้องเป็นหนึ่งในรายการ CATEGORIES เท่านั้น
  category: z.enum(CATEGORIES, "กรุณาเลือกหมวดหมู่"),

  // รายละเอียด: ไม่บังคับ ไม่เกิน 500 ตัวอักษร ถ้าเว้นว่างจะเก็บเป็น null
  description: z
    .string()
    .trim()
    .max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร")
    .nullish()
    .transform((v) => (v ? v : null)),

  // ราคา: ต้องเป็นตัวเลข มากกว่า 0 และไม่เกิน 10,000,000
  price: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number("ราคาต้องเป็นตัวเลข")
      .positive("ราคาต้องมากกว่า 0")
      .max(10_000_000, "ราคาสูงเกินไป"),
  ),

  // จำนวนคงเหลือ: ต้องเป็นจำนวนเต็ม ตั้งแต่ 0 ถึง 1,000,000 (ห้ามติดลบ)
  stock: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number("จำนวนต้องเป็นตัวเลข")
      .int("จำนวนต้องเป็นจำนวนเต็ม")
      .min(0, "จำนวนต้องไม่ติดลบ")
      .max(1_000_000, "จำนวนสูงเกินไป"),
  ),

  // สถานะ: เปิดขาย (true) / ปิดขาย (false) รับได้ทั้งค่า boolean และข้อความ 'true'/'false' ถ้าไม่ส่งมาให้เป็น true
  status: z
    .union([
      z.boolean(),
      z.literal("true").transform(() => true),
      z.literal("false").transform(() => false),
    ])
    .default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type FieldErrors = Record<string, string[] | undefined>;

// ---------- สมัครสมาชิก / เข้าสู่ระบบ ----------
// กฎของฟอร์มสมัครสมาชิก: ชื่อ, อีเมลรูปแบบถูกต้อง (แปลงเป็นตัวพิมพ์เล็ก), รหัสผ่าน 8-72 ตัวอักษร และต้องกรอกยืนยันให้ตรงกัน
export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80, "ชื่อยาวเกินไป"),
    email: z.string().trim().toLowerCase().pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านไม่ตรงกัน",
  });

// กฎของฟอร์ม login: อีเมลต้องถูกรูปแบบ และต้องกรอกรหัสผ่าน
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});


// ---------- ผู้ดูแลระบบจัดการผู้ใช้ ----------
// สิทธิ์ที่อนุญาตให้กำหนดให้ผู้ใช้: ADMIN หรือ STAFF เท่านั้น
export const roleSchema = z.enum(["ADMIN", "STAFF"], "สิทธิ์ไม่ถูกต้อง");

// กฎตอนแอดมินเพิ่มผู้ใช้เองที่หน้า /admin/users
export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80, "ชื่อยาวเกินไป"),
  email: z.string().trim().toLowerCase().pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
  role: roleSchema,
});