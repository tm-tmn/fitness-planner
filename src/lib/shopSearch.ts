export interface Coords {
  lat: number;
  lng: number;
}

/** แยกชื่อเมนูหลายอย่าง ("ไข่ต้ม 2 ฟอง + ขนมปัง 2 แผ่น") เป็นรายการวัตถุดิบ/เมนูย่อยที่ค้นหาได้ */
export function searchTerms(foodName: string): string[] {
  const units =
    "ฟอง|แผ่น|ถ้วย|จาน|ชาม|ช้อนโต๊ะ|ช้อนชา|ช้อน|ชิ้น|กำมือ|กรัม|ก\\.|กก\\.|มล\\.|แก้ว|ลูก|ผล|ขีด";
  const seen = new Set<string>();
  const terms: string[] = [];
  foodName
    .replace(/\([^)]*\)/g, " ")
    .split(/[+/,]|\sกับ\s/)
    .forEach((raw) => {
      const t = raw
        .replace(new RegExp(`\\d+(?:[./]\\d+)?\\s*(?:${units})?`, "g"), " ")
        .replace(/ครึ่ง|น้อย|นิดหน่อย|ไม่ใส่น้ำตาล|ปริมาณ/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (t.length >= 2 && !seen.has(t)) {
        seen.add(t);
        terms.push(t);
      }
    });
  return terms.slice(0, 4);
}

/** ลิงก์ค้นหาใน Google Maps รอบตำแหน่งที่ผู้ใช้อนุญาต (ไม่ต้องใช้ API key) */
export function mapsSearchUrl(term: string, at: Coords): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${at.lat.toFixed(
    5
  )},${at.lng.toFixed(5)},15z`;
}
