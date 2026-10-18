"use client";

import { useState } from "react";
import { adjustStock } from "@/app/products/actions";

export default function StockButtons({
  productId,
  currentStock,
}: {
  productId: number;
  currentStock: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleStockUpdate = async (type: "IN" | "OUT") => {
    const title = type === "IN" ? "รับสินค้าเข้าคลัง" : "เบิกจ่ายสินค้าออก";
    const input = prompt(`กรอกจำนวนที่ต้องการ${title}:`, "1");
    if (!input) return;

    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("กรุณากรอกจำนวนตัวเลขที่ถูกต้อง");
      return;
    }

    if (type === "OUT" && amount > currentStock) {
      alert("จำนวนสินค้าคงเหลือไม่เพียงพอสำหรับเบิกจ่าย");
      return;
    }

    setLoading(true);
    const res = await adjustStock(productId, type, amount);
    setLoading(false);

    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={loading}
        onClick={() => handleStockUpdate("IN")}
        className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors disabled:opacity-50"
      >
        + รับเข้า
      </button>
      <button
        disabled={loading}
        onClick={() => handleStockUpdate("OUT")}
        className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors disabled:opacity-50"
      >
        - เบิกจ่าย
      </button>
    </div>
  );
}