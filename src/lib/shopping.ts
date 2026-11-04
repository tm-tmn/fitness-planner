/**
 * รายการซื้อของจากแผนอาหาร — แยกชื่อเมนูออกเป็นวัตถุดิบหลักด้วยคำสำคัญ (ทำงานในเครื่อง ไม่ส่งไปที่ไหน)
 * เป็นรายการคร่าวๆ สำหรับไปตลาด/ซูเปอร์ฯ ไม่ใช่สูตรอาหารที่ชั่งตวงแน่นอน
 */

export type ShopCategory = "protein" | "dairy" | "carb" | "produce" | "pantry" | "other";

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  protein: "เนื้อสัตว์ ไข่ เต้าหู้",
  dairy: "นมและโยเกิร์ต",
  carb: "ข้าว แป้ง ธัญพืช",
  produce: "ผักและผลไม้",
  pantry: "ของแห้งและอื่นๆ",
  other: "เมนูที่ต้องดูเอง",
};

export const CATEGORY_ORDER: ShopCategory[] = ["protein", "dairy", "carb", "produce", "pantry", "other"];

interface Rule {
  /** คำที่ต้องเจอในชื่อ (ตรวจตามลำดับ ยาว/เจาะจงก่อน) */
  keys: string[];
  item: string;
  cat: ShopCategory;
  /** หน่วยที่นับได้จากชื่อเมนู เช่น "2 ฟอง" */
  unit?: string;
}

// ลำดับสำคัญ: คำที่เจาะจงกว่าต้องมาก่อน (เช่น "ไข่ขาว" ก่อน "ไข่", "อกไก่" ก่อน "ไก่")
const RULES: Rule[] = [
  // ซุป/แกงจืด ต้องมาก่อน "แกง" และ "ผัก"
  { keys: ["แกงจืด", "ต้มจืด", "ซุป", "ต้มยำ", "สุกี้", "ซูกิยากี้", "ชาบู"], item: "เครื่องต้มยำหรือน้ำซุป", cat: "pantry" },
  // "ขนมปัง" มีคำว่า "นม" อยู่ข้างใน จึงต้องมาก่อนหมวดนม
  { keys: ["ขนมปังโฮลวีต", "ขนมปัง", "แซนด์วิช", "เบเกิล"], item: "ขนมปังโฮลวีต", cat: "carb", unit: "แผ่น" },
  { keys: ["ไข่ขาว", "ไข่ไก่", "ไข่ต้ม", "ไข่ลวก", "ไข่ดาว", "ไข่เจียว", "ไข่ข้น", "ไข่ตุ๋น", "ไข่"], item: "ไข่ไก่", cat: "protein", unit: "ฟอง" },
  { keys: ["อกไก่"], item: "อกไก่", cat: "protein" },
  { keys: ["ไก่"], item: "ไก่ส่วนอื่น", cat: "protein" },
  { keys: ["หมูสันใน"], item: "หมูสันใน", cat: "protein" },
  { keys: ["หมูสับ"], item: "หมูสับ", cat: "protein" },
  { keys: ["หมู"], item: "เนื้อหมู", cat: "protein" },
  { keys: ["เนื้อวัว", "สเต็กเนื้อ", "เนื้อย่าง", "เนื้อ"], item: "เนื้อวัว", cat: "protein" },
  { keys: ["ปลาแซลมอน", "แซลมอน"], item: "ปลาแซลมอน", cat: "protein" },
  { keys: ["ปลาทูน่า", "ทูน่า"], item: "ทูน่ากระป๋องหรือสด", cat: "protein" },
  { keys: ["ปลาหมึก"], item: "ปลาหมึก", cat: "protein" },
  { keys: ["กุ้ง"], item: "กุ้ง", cat: "protein" },
  { keys: ["หอย"], item: "หอย", cat: "protein" },
  { keys: ["ทะเล"], item: "อาหารทะเลรวม", cat: "protein" },
  { keys: ["ปลา"], item: "ปลาเนื้อขาว เช่น กะพง ดอลลี่", cat: "protein" },
  { keys: ["เต้าหู้"], item: "เต้าหู้", cat: "protein" },
  { keys: ["เวย์", "โปรตีนผง"], item: "เวย์โปรตีน", cat: "protein" },
  { keys: ["โยเกิร์ตกรีก"], item: "โยเกิร์ตกรีก", cat: "dairy" },
  { keys: ["โยเกิร์ต"], item: "โยเกิร์ตรสธรรมชาติ", cat: "dairy" },
  { keys: ["นมถั่วเหลือง"], item: "นมถั่วเหลืองไม่หวาน", cat: "dairy" },
  { keys: ["นมจืด", "นม"], item: "นมจืด", cat: "dairy" },
  { keys: ["ชีส"], item: "ชีส", cat: "dairy" },
  { keys: ["ข้าวกล้อง"], item: "ข้าวกล้อง", cat: "carb" },
  { keys: ["ควินัว"], item: "ควินัว", cat: "carb" },
  { keys: ["ข้าวโอ๊ต", "โอ๊ตมีล", "โอ๊ต"], item: "ข้าวโอ๊ต", cat: "carb" },
  { keys: ["กราโนล่า", "กราโนลา"], item: "กราโนล่า", cat: "carb" },
  { keys: ["มันหวาน", "มันเทศ", "มันฝรั่ง", "มันบด"], item: "มันหวานหรือมันฝรั่ง", cat: "carb" },
  { keys: ["วุ้นเส้น"], item: "วุ้นเส้น", cat: "carb" },
  { keys: ["พาสต้า"], item: "พาสต้าโฮลวีต", cat: "carb" },
  { keys: ["ก๋วยเตี๋ยว", "เส้นเล็ก", "บะหมี่", "เส้น"], item: "เส้นก๋วยเตี๋ยวหรือบะหมี่", cat: "carb" },
  { keys: ["ข้าวเหนียว"], item: "ข้าวเหนียว", cat: "carb" },
  { keys: ["ข้าวต้ม", "โจ๊ก", "ข้าวมัน", "ข้าวผัด", "ข้าวสวย", "ข้าวญี่ปุ่น", "ข้าว"], item: "ข้าวหอมมะลิ", cat: "carb" },
  { keys: ["แครกเกอร์", "โรตี"], item: "แครกเกอร์หรือโรตีโฮลวีต", cat: "carb" },
  { keys: ["อะโวคาโด"], item: "อะโวคาโด", cat: "produce" },
  { keys: ["กล้วย"], item: "กล้วยหอม", cat: "produce", unit: "ลูก" },
  { keys: ["บรอกโคลี"], item: "บรอกโคลี", cat: "produce" },
  { keys: ["แตงกวา"], item: "แตงกวา", cat: "produce" },
  { keys: ["มะเขือเทศ"], item: "มะเขือเทศ", cat: "produce" },
  { keys: ["เห็ด"], item: "เห็ด", cat: "produce" },
  { keys: ["เอดามาเมะ"], item: "ถั่วแระญี่ปุ่น (เอดามาเมะ)", cat: "produce" },
  { keys: ["มะนาว"], item: "มะนาว", cat: "produce" },
  { keys: ["สลัดผัก", "สลัด"], item: "ผักสลัด", cat: "produce" },
  { keys: ["ส้มตำ", "ตำไทย", "ตำป่า", "มะละกอ"], item: "มะละกอ", cat: "produce" },
  {
    keys: ["ผลไม้", "แอปเปิ้ล", "แอปเปิล", "ฝรั่ง", "ชมพู่", "แตงโม", "สับปะรด", "เงาะ", "มังคุด", "ลองกอง", "เบอร์รี่", "สตรอว์เบอร์รี", "ลูกพลับ", "มะม่วง", "ส้ม"],
    item: "ผลไม้ตามฤดู",
    cat: "produce",
  },
  { keys: ["ผัก"], item: "ผักรวมสำหรับต้มหรือผัด", cat: "produce" },
  { keys: ["เมล็ดเจีย", "เจีย"], item: "เมล็ดเจีย", cat: "pantry" },
  { keys: ["อัลมอนด์", "ถั่วรวม", "ถั่วอบ", "ถั่ว"], item: "ถั่วอบไม่ปรุงรส", cat: "pantry" },
  { keys: ["น้ำพริก", "แจ่ว"], item: "น้ำพริก", cat: "pantry" },
  { keys: ["กะทิ", "พะแนง", "แกง"], item: "พริกแกงและกะทิ", cat: "pantry" },
];

/** ข้อความในวงเล็บเป็นคำอธิบายวิธีทำ ไม่ใช่วัตถุดิบ */
const PARENS = /\([^)]*\)/g;
const QTY = /(\d+(?:\.\d+)?)\s*(ฟอง|แผ่น|ลูก|ชิ้น|ไม้|ถ้วย|สกู๊ป)/;
const PORTION_SUFFIX = /\s*×\s*\d+(?:\.\d+)?\s*$/;

export interface ShopItem {
  item: string;
  cat: ShopCategory;
  /** จำนวนมื้อที่ใช้ */
  meals: number;
  /** จำนวนนับรวม (เฉพาะของที่นับเป็นหน่วยได้ เช่น ไข่ X ฟอง) */
  qty?: number;
  unit?: string;
}

/** แยกชื่อเมนูหนึ่งรายการเป็นวัตถุดิบหลัก */
export function ingredientsOf(foodName: string): { item: string; cat: ShopCategory; qty?: number; unit?: string }[] {
  const portion = Number(foodName.match(/×\s*(\d+(?:\.\d+)?)\s*$/)?.[1] ?? 1);
  const clean = foodName.replace(PORTION_SUFFIX, "").replace(PARENS, " ");
  const parts = clean
    .split(/\s*[+,]\s*|\s+\/\s+|\s+กับ\s+|\s+และ\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: { item: string; cat: ShopCategory; qty?: number; unit?: string }[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    let rest = part;
    let matchedAny = false;
    for (const r of RULES) {
      const key = r.keys.find((k) => rest.includes(k));
      if (!key) continue;
      matchedAny = true;
      // ตัดคำที่จับได้ออก กันนับซ้ำ (เช่น "อกไก่" แล้วไม่ไปโดน "ไก่" อีก)
      rest = rest.split(key).join(" ");
      if (seen.has(r.item)) continue;
      seen.add(r.item);
      let qty: number | undefined;
      if (r.unit) {
        const m = part.match(QTY);
        qty = (m && m[2] === r.unit ? Number(m[1]) : 1) * portion;
      }
      out.push({ item: r.item, cat: r.cat, qty, unit: r.unit });
    }
    if (!matchedAny) {
      const label = part.replace(/\s+/g, " ").trim();
      if (label.length >= 2 && !seen.has(label)) {
        seen.add(label);
        out.push({ item: label, cat: "other" });
      }
    }
  }
  return out;
}

/** รวมวัตถุดิบจากหลายมื้อ เรียงตามหมวด แล้วตามจำนวนมื้อที่ใช้ */
export function buildShoppingList(meals: { food_name: string }[]): ShopItem[] {
  const map = new Map<string, ShopItem>();
  for (const m of meals) {
    for (const ing of ingredientsOf(m.food_name)) {
      const cur = map.get(ing.item);
      if (!cur) {
        map.set(ing.item, { item: ing.item, cat: ing.cat, meals: 1, qty: ing.qty, unit: ing.unit });
      } else {
        cur.meals++;
        if (ing.qty !== undefined) cur.qty = (cur.qty ?? 0) + ing.qty;
      }
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat) ||
      b.meals - a.meals ||
      a.item.localeCompare(b.item, "th")
  );
}

/** ข้อความสำหรับคัดลอก/แชร์ไปแอปโน้ตหรือแชต */
export function shoppingText(items: ShopItem[], title: string): string {
  const lines = [title];
  for (const cat of CATEGORY_ORDER) {
    const inCat = items.filter((i) => i.cat === cat);
    if (!inCat.length) continue;
    lines.push("", CATEGORY_LABELS[cat]);
    for (const i of inCat) lines.push(`- ${i.item} (${describe(i)})`);
  }
  return lines.join("\n");
}

export function describe(i: ShopItem): string {
  const q = i.qty !== undefined && i.unit ? `${Math.ceil(i.qty)} ${i.unit} · ` : "";
  return `${q}${i.meals} มื้อ`;
}
