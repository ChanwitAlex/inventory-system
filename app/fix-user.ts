import prisma from "./lib/prisma"; // แก้ไขพาธตรงนี้ให้ถูกต้องเมื่ออยู่ในโฟลเดอร์ app

async function main() {
  const updated = await prisma.user.updateMany({
    data: {
      approved: true,
      role: "STAFF",
    },
  });
  console.log(`อัปเดตผู้ใช้สำเร็จแล้วจำนวน: ${updated.count} คน`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());