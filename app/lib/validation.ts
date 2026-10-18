import { z } from "zod";
import { CATEGORIES } from "@/app/lib/constants";

// ---------- สินค้า ----------
export const productSchema = z.object({
  sku: z
    .string("กรุณากรอกรหัสสินค้า")
    .trim()
    .min(1, "กรุณากรอกรหัสสินค้า")
    .max(30, "รหัสสินค้าต้องไม่เกิน 30 ตัวอักษร")
    .regex(/^[A-Za-z0-9_-]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, - และ _")
    .transform((v) => v.toUpperCase()),

  name: z
    .string("กรุณากรอกชื่อสินค้า")
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(120, "ชื่อสินค้าต้องไม่เกิน 120 ตัวอักษร"),

  category: z.enum(CATEGORIES, "กรุณาเลือกหมวดหมู่"),

  description: z
    .string()
    .trim()
    .max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร")
    .nullish()
    .transform((v) => (v ? v : null)),

  price: z.coerce
    .number("ราคาต้องเป็นตัวเลข")
    .positive("ราคาต้องมากกว่า 0")
    .max(10_000_000, "ราคาสูงเกินไป"),

  stock: z.coerce
    .number("จำนวนต้องเป็นตัวเลข")
    .int("จำนวนต้องเป็นจำนวนเต็ม")
    .min(0, "จำนวนต้องไม่ติดลบ")
    .max(1_000_000, "จำนวนสูงเกินไป"),

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

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});


// ---------- ผู้ดูแลระบบจัดการผู้ใช้ ----------
export const roleSchema = z.enum(["ADMIN", "STAFF"], "สิทธิ์ไม่ถูกต้อง");

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80, "ชื่อยาวเกินไป"),
  email: z.string().trim().toLowerCase().pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
  role: roleSchema,
});