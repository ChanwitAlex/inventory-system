export const CATEGORIES = [
  "ชิ้นส่วนคอมพิวเตอร์",
  "จอมอนิเตอร์",
  "อุปกรณ์ต่อพ่วง",
  "อุปกรณ์เกมมิ่ง",
  "อุปกรณ์เครือข่าย/กล้อง",
] as const;

// สินค้าที่มีจำนวนไม่เกินค่านี้ (แต่มากกว่า 0) ถือว่า "ใกล้หมด"
export const LOW_STOCK_THRESHOLD = 10;

export const PAGE_SIZE = 10;
