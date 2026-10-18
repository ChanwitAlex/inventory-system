import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

async function main() {
  // 1. สร้างผู้ใช้งาน
  const users = [
    { name: "Admin", email: "admin@example.com", password: "Admin@12345", role: "ADMIN" },
    { name: "Staff", email: "staff@example.com", password: "Staff@12345", role: "STAFF" },
    { name: "Viewer", email: "user@example.com", password: "User@12345", role: "USER" },
  ] as const;

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, passwordHash },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash,
      },
    });
  }

  // 2. รายการสินค้าอุปกรณ์คอมพิวเตอร์ (30 รายการ - ปรับเฉพาะฟิลด์ที่มีใน Schema)
  const products = [
    // 💻 ชิ้นส่วนคอมพิวเตอร์
    { sku: "CPU-001", name: "ซีพียู Intel Core i7-14700K", category: "ชิ้นส่วนคอมพิวเตอร์", price: 15900, stock: 5, status: true, description: "20 Cores / 28 Threads" },
    { sku: "CPU-002", name: "ซีพียู AMD Ryzen 7 7800X3D", category: "ชิ้นส่วนคอมพิวเตอร์", price: 14500, stock: 8, status: true, description: "8 Cores / 16 Threads" },
    { sku: "MB-003", name: "เมนบอร์ด ASUS ROG STRIX B760-F", category: "ชิ้นส่วนคอมพิวเตอร์", price: 8900, stock: 6, status: true, description: "Socket LGA1700 DDR5" },
    { sku: "GC-004", name: "การ์ดจอ NVIDIA RTX 4070 SUPER 12GB", category: "ชิ้นส่วนคอมพิวเตอร์", price: 23900, stock: 4, status: true, description: "12GB GDDR6X" },
    { sku: "GC-005", name: "การ์ดจอ NVIDIA RTX 4060 8GB", category: "ชิ้นส่วนคอมพิวเตอร์", price: 11500, stock: 10, status: true, description: "8GB GDDR6" },
    { sku: "RAM-006", name: "แรม PC Kingston FURY DDR5 32GB", category: "ชิ้นส่วนคอมพิวเตอร์", price: 4590, stock: 15, status: true, description: "16GBx2 6000MHz" },
    { sku: "RAM-007", name: "แรม โน้ตบุ๊ก DDR4 16GB", category: "ชิ้นส่วนคอมพิวเตอร์", price: 1450, stock: 20, status: true, description: "3200MHz SODIMM" },
    { sku: "SSD-008", name: "SSD M.2 NVMe 1TB Samsung 990 PRO", category: "ชิ้นส่วนคอมพิวเตอร์", price: 4290, stock: 12, status: true, description: "PCIe 4.0 Read 7450MB/s" },
    { sku: "PSU-009", name: "พาวเวอร์ซัพพลาย Corsair 850W Gold", category: "ชิ้นส่วนคอมพิวเตอร์", price: 4590, stock: 7, status: true, description: "80 Plus Gold Fully Modular" },
    { sku: "CAS-010", name: "เคสคอมพิวเตอร์ NZXT H6 Flow RGB", category: "ชิ้นส่วนคอมพิวเตอร์", price: 4390, stock: 5, status: true, description: "Tempered Glass Dual-Chamber" },

    // 🖥️ จอมอนิเตอร์
    { sku: "MN-011", name: "จอมอนิเตอร์ 24 นิ้ว Full HD IPS 100Hz", category: "จอมอนิเตอร์", price: 3890, stock: 0, status: true, description: "1920x1080 100Hz" },
    { sku: "MN-012", name: "จอมอนิเตอร์ 27 นิ้ว 2K QHD Gaming 180Hz", category: "จอมอนิเตอร์", price: 8900, stock: 6, status: true, description: "2560x1440 Fast IPS" },
    { sku: "MN-013", name: "จอมอนิเตอร์โค้ง 34 นิ้ว UWQHD 165Hz", category: "จอมอนิเตอร์", price: 12900, stock: 3, status: true, description: "3440x1440 Curved 1500R" },

    // ⌨️ อุปกรณ์ต่อพ่วง
    { sku: "KB-014", name: "คีย์บอร์ดไร้สาย Mechanical Custom", category: "อุปกรณ์ต่อพ่วง", price: 2890, stock: 18, status: true, description: "Hot-swappable RGB" },
    { sku: "MS-015", name: "เมาส์ไร้สาย Ergonomic Logitech", category: "อุปกรณ์ต่อพ่วง", price: 990, stock: 35, status: true, description: "Wireless 2.4GHz / Bluetooth" },
    { sku: "HUB-016", name: "USB-C Hub 8-in-1 HDMI 4K", category: "อุปกรณ์ต่อพ่วง", price: 1290, stock: 22, status: true, description: "USB 3.0, SD Card, PD 100W" },
    { sku: "FD-017", name: "Flash Drive USB 3.2 128GB", category: "อุปกรณ์ต่อพ่วง", price: 390, stock: 80, status: true, description: "Read speed up to 100MB/s" },
    { sku: "SSD-018", name: "External SSD Portable 1TB Type-C", category: "อุปกรณ์ต่อพ่วง", price: 3290, stock: 9, status: true, description: "Read 1050MB/s NVMe" },
    { sku: "ST-019", name: "ขาตั้งโน้ตบุ๊กอลูมิเนียม", category: "อุปกรณ์ต่อพ่วง", price: 590, stock: 25, status: true, description: "Adjustable Height & Angle" },
    { sku: "UPS-020", name: "เครื่องสำรองไฟ (UPS) 1000VA / 600W", category: "อุปกรณ์ต่อพ่วง", price: 2890, stock: 6, status: true, description: "LED Display Clean Power" },

    // 🎮 อุปกรณ์เกมมิ่ง
    { sku: "MS-021", name: "เมาส์เกมมิ่งไร้สาย 60g 26K DPI", category: "อุปกรณ์เกมมิ่ง", price: 2590, stock: 14, status: true, description: "Ultra-lightweight Sensor 26,000 DPI" },
    { sku: "HD-022", name: "หูฟัง Gaming Headset 7.1 Surround", category: "อุปกรณ์เกมมิ่ง", price: 1890, stock: 8, status: true, description: "RGB Light 50mm Drivers" },
    { sku: "MIC-023", name: "ไมโครโฟน USB คอนเดนเซอร์ สตรีมมิ่ง", category: "อุปกรณ์เกมมิ่ง", price: 1690, stock: 11, status: true, description: "Cardioid Pattern with Mute Touch" },
    { sku: "MP-024", name: "แผ่นรองเมาส์แบบยาว Speed XL", category: "อุปกรณ์เกมมิ่ง", price: 490, stock: 30, status: true, description: "900x400mm Anti-slip Rubber Base" },
    { sku: "PAD-025", name: "จอยสติ๊กไร้สาย Gamepad PC/Steam", category: "อุปกรณ์เกมมิ่ง", price: 1390, stock: 16, status: true, description: "Dual Vibration Motors" },

    // 🌐 อุปกรณ์เครือข่าย/กล้อง
    { sku: "RT-026", name: "Wi-Fi 6 Router Dual-Band AX3000", category: "อุปกรณ์เครือข่าย/กล้อง", price: 2190, stock: 8, status: true, description: "OFDMA & MU-MIMO Technology" },
    { sku: "LAN-027", name: "สายแลน Cat7 RJ45 10Gbps 10m", category: "อุปกรณ์เครือข่าย/กล้อง", price: 320, stock: 50, status: true, description: "Shielded SSTP Pure Copper" },
    { sku: "WB-028", name: "กล้องเว็บแคม 1080P Full HD", category: "อุปกรณ์เครือข่าย/กล้อง", price: 1290, stock: 4, status: true, description: "Built-in Noise Reduction Mic" },
    { sku: "CAM-029", name: "กล้องวงจรปิด Wi-Fi 2K 360 องศา", category: "อุปกรณ์เครือข่าย/กล้อง", price: 990, stock: 20, status: true, description: "Night Vision Motion Tracking" },
    { sku: "PR-030", name: "เครื่องพิมพ์เลเซอร์ ขาวดำ Wi-Fi", category: "อุปกรณ์เครือข่าย/กล้อง", price: 5990, stock: 3, status: true, description: "Wireless Direct Printing" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        status: p.status,
        description: p.description,
      },
      create: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        status: p.status,
        description: p.description,
      },
    });
  }

  console.log("✅ Seed ข้อมูลอุปกรณ์ IT 30 รายการสำเร็จเรียบร้อยแล้ว!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());