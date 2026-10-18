/**
 * ไฟล์: app/products/product-form.tsx — ฟอร์มสินค้า (ใช้ร่วมกันทั้ง 'เพิ่ม' และ 'แก้ไข')
 * เป็น Client Component เพราะต้องแสดงสถานะ 'กำลังบันทึก' และ error ทันทีโดยไม่โหลดหน้าใหม่
 * รับ action เข้ามา: หน้าเพิ่มส่ง createProduct, หน้าแก้ไขส่ง updateProduct
 */
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CATEGORIES } from "@/app/lib/constants";
import type { ProductFormState } from "./actions";

// ค่าเริ่มต้นของแต่ละช่อง (หน้าเพิ่ม = ค่าว่าง, หน้าแก้ไข = ข้อมูลเดิมของสินค้า)
export type ProductDefaults = {
  sku: string;
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  status: boolean;
};

type Props = {
  action: (prev: ProductFormState, fd: FormData) => Promise<ProductFormState>;
  defaults: ProductDefaults;
  submitLabel: string;
};

export default function ProductForm({ action, defaults, submitLabel }: Props) {
  // useActionState: เรียก action เมื่อกดบันทึก
  // state = ผลที่ได้กลับมา (errors/values), pending = กำลังบันทึกอยู่หรือไม่
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, {});

  // ถ้าบันทึกไม่ผ่าน ให้คงค่าที่ผู้ใช้กรอกไว้ ไม่ให้ฟอร์มถูกล้าง
  // ถ้าบันทึกไม่ผ่าน ให้แสดงค่าที่ผู้ใช้เพิ่งกรอก (ไม่ล้างฟอร์ม) ไม่งั้นใช้ค่าเริ่มต้น
  const v = (state.values as Partial<ProductDefaults> | undefined) ?? defaults;
  // ดึงข้อความ error ของช่องนั้น ๆ มาแสดงใต้ช่อง (ข้อ 2 Validation ที่ผู้ใช้มองเห็น)
  const err = (f: string) => state.errors?.[f]?.[0];

  return (
    // noValidate = ปิดการตรวจของเบราว์เซอร์ ให้เซิร์ฟเวอร์ตรวจเองด้วยกฎใน validation.ts เพื่อได้ข้อความภาษาไทยชุดเดียวกัน
    <form action={formAction} className="card space-y-5 p-6" noValidate>
      {state.message && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="label">รหัสสินค้า (SKU)</label>
          <input id="sku" name="sku" className="input" defaultValue={v.sku} placeholder="เช่น NB-001" aria-invalid={!!err("sku")} />
          {err("sku") && <p className="field-error">{err("sku")}</p>}
        </div>

        <div>
          <label htmlFor="category" className="label">หมวดหมู่</label>
          <select id="category" name="category" className="input" defaultValue={v.category}>
            <option value="">เลือกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {err("category") && <p className="field-error">{err("category")}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="name" className="label">ชื่อสินค้า</label>
        <input id="name" name="name" className="input" defaultValue={v.name} aria-invalid={!!err("name")} />
        {err("name") && <p className="field-error">{err("name")}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">รายละเอียด (ไม่บังคับ)</label>
        <textarea id="description" name="description" rows={3} className="input" defaultValue={v.description} />
        {err("description") && <p className="field-error">{err("description")}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="label">ราคา (บาท)</label>
          <input id="price" name="price" type="number" step="0.01" min="0" inputMode="decimal" className="input" defaultValue={v.price} />
          {err("price") && <p className="field-error">{err("price")}</p>}
        </div>

        <div>
          <label htmlFor="stock" className="label">จำนวนคงเหลือ</label>
          <input id="stock" name="stock" type="number" step="1" min="0" inputMode="numeric" className="input" defaultValue={v.stock} />
          {err("stock") && <p className="field-error">{err("stock")}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="status" defaultChecked={v.status} className="size-4 accent-brand" />
        เปิดขายสินค้านี้
      </label>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "กำลังบันทึก..." : submitLabel}
        </button>
        <Link href="/products" className="btn-ghost">ยกเลิก</Link>
      </div>
    </form>
  );
}