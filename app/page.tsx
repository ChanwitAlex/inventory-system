import { redirect } from "next/navigation";
import { auth } from "@/app/auth";

// หน้าแรก: ADMIN เข้าหน้าภาพรวม, STAFF เข้ารายการสินค้า, ยังไม่ login ไปหน้า login
export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "ADMIN" ? "/admin" : "/products");
}