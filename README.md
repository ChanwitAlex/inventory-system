# ระบบจัดการสินค้าและคลังสินค้า

Next.js 16 (App Router) + Prisma 7 + SQLite + Auth.js (NextAuth v5) + Zod + Tailwind CSS 4

## คุณสมบัติ

| ข้อ | รายละเอียด | อยู่ที่ไฟล์ |
|---|---|---|
| CRUD | แสดงรายการ เพิ่ม แก้ไข ลบสินค้า | `app/products/**` |
| Validation | ตรวจข้อมูลด้วย Zod ทั้งในฟอร์มและ API | `app/lib/validation.ts` |
| Authentication | Login/สมัครสมาชิก, รหัสผ่านเข้ารหัสด้วย bcrypt, session แบบ JWT, 3 สิทธิ์ (ADMIN / STAFF / USER) | `app/auth.ts`, `proxy.ts`, `app/lib/permissions.ts` |
| Search + Filter | ค้นหา รหัส/ชื่อ/รายละเอียด, กรอง หมวดหมู่ / สถานะ / ระดับสต็อก, เรียงลำดับ, แบ่งหน้า | `app/lib/products.ts` |
| API | GET / POST / PUT / DELETE | `app/api/products/**` |
| Admin | ภาพรวมสต็อก และจัดการสิทธิ์ผู้ใช้ | `app/admin/**` |

## สิทธิ์การใช้งาน

| สิทธิ์ | ดูสินค้า | เพิ่ม/แก้ไข | ลบสินค้า | หน้า Admin |
|---|---|---|---|---|
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| STAFF | ✓ | ✓ | – | – |
| USER | ✓ | – | – | – |

ผู้ที่สมัครเองจะได้สิทธิ์ USER ผู้ดูแลระบบเป็นผู้เลื่อนสิทธิ์ที่หน้า `/admin/users`

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env        # แล้วใส่ AUTH_SECRET (สร้างด้วย: openssl rand -base64 32)
npm run db:setup            # สร้างตารางและข้อมูลตัวอย่าง
npm run dev                 # เปิด http://localhost:3000
```

บัญชีตัวอย่างหลัง seed

| สิทธิ์ | อีเมล | รหัสผ่าน |
|---|---|---|
| ADMIN | admin@example.com | Admin@12345 |
| STAFF | staff@example.com | Staff@12345 |
| USER | user@example.com | User@12345 |

**เปลี่ยนรหัสผ่านเหล่านี้ก่อนใช้งานจริง** (ตั้งรหัสผ่านแอดมินผ่าน `SEED_ADMIN_PASSWORD` ใน `.env` ก่อนรัน seed)

หลังแก้ `prisma/schema.prisma` ให้รัน `npm run db:migrate` เพื่อสร้าง migration ใหม่

## API

ทุก endpoint ต้องยืนยันตัวตน ใช้ได้ 2 แบบ

1. Session cookie (หลัง login ในเบราว์เซอร์)
2. Header `x-api-key: <API_KEY>` (ตั้ง `API_KEY` ใน `.env`) ได้สิทธิ์ระดับ STAFF คือดู/เพิ่ม/แก้ไขได้ ลบไม่ได้

| Method | Path | สิทธิ์ที่ต้องมี | คำอธิบาย |
|---|---|---|---|
| GET | `/api/products` | ทุกสิทธิ์ | รายการสินค้า |
| POST | `/api/products` | ADMIN, STAFF | เพิ่มสินค้า |
| GET | `/api/products/:id` | ทุกสิทธิ์ | ดูสินค้า 1 รายการ |
| PUT | `/api/products/:id` | ADMIN, STAFF | แก้ไขสินค้า |
| DELETE | `/api/products/:id` | ADMIN | ลบสินค้า |

พารามิเตอร์ของ `GET /api/products`: `search`, `category`, `status` (`active`/`inactive`), `stock` (`ok`/`low`/`out`), `sort` (`newest`/`name`/`price_asc`/`price_desc`/`stock_asc`), `page`, `pageSize` (สูงสุด 100)

ตัวอย่าง

```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/api/products?stock=low&category=เครื่องเขียน"

curl -X POST http://localhost:3000/api/products \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"sku":"NB-100","name":"โน้ตบุ๊ก","category":"อิเล็กทรอนิกส์","price":19900,"stock":5}'
```

รหัสตอบกลับ: `200` สำเร็จ · `201` สร้างแล้ว · `400` ข้อมูลไม่ถูกต้อง (มี `errors` รายฟิลด์) · `401` ยังไม่ยืนยันตัวตน · `403` ไม่มีสิทธิ์ · `404` ไม่พบ · `409` รหัสสินค้าซ้ำ

## ก่อนนำขึ้นใช้งานจริง

- ตั้ง `AUTH_SECRET` และ `API_KEY` เป็นค่าสุ่มยาว ๆ ของคุณเอง และห้าม commit ไฟล์ `.env`
- การจำกัดจำนวนครั้งที่ login ผิดเก็บในหน่วยความจำของ process เดียว หากรันหลายเครื่องควรใช้ตัวเก็บกลาง เช่น Redis
- SQLite เหมาะกับการเรียนรู้และระบบขนาดเล็ก ถ้าหลายคนใช้พร้อมกันมาก ควรย้ายไป PostgreSQL
