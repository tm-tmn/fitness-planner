import { allMenuItems } from "@/lib/regionalMenus";

/**
 * คลังอาหารสำหรับ "คำนวณแคลอรี่ให้อัตโนมัติ" — อยู่ในแอปทั้งหมด ใช้ได้ออฟไลน์
 * แต่ละบรรทัด: "ชื่อ + ปริมาณ|แคลอรี่โดยประมาณ" เป็นค่าประมาณทั่วไป ไม่ใช่ค่าของร้านใดร้านหนึ่ง
 */
const SINGLE_ITEMS = `
ข้าวสวย 1 ถ้วย|200
ข้าวกล้อง 1 ถ้วย|215
ข้าวเหนียว 1 ห่อเล็ก|180
ข้าวต้ม 1 ชาม|250
โจ๊ก 1 ชาม|250
ขนมปังโฮลวีต 1 แผ่น|80
ขนมปังขาว 1 แผ่น|75
โอ๊ตมีล 1/2 ถ้วย (แห้ง)|150
เส้นก๋วยเตี๋ยวลวก 1 ถ้วย|110
บะหมี่กึ่งสำเร็จรูป 1 ซอง|340
มันเทศต้ม 1 หัวกลาง|130
ข้าวโพดต้ม 1 ฝัก|100
ไข่ต้ม 1 ฟอง|75
ไข่ดาว 1 ฟอง|110
ไข่เจียว 1 ฟอง|150
อกไก่ต้ม/ย่าง 100 ก.|165
ไก่ทอด 1 ชิ้น|250
หมูปิ้ง 1 ไม้|90
ไส้กรอก 1 ชิ้น|100
ปลานึ่ง 100 ก.|120
ปลาทูทอด 1 ตัว|130
กุ้งต้ม 5 ตัว|70
เต้าหู้ขาว 1/2 หลอด|80
นมจืด 1 กล่อง (200 มล.)|130
นมถั่วเหลืองหวานน้อย 1 กล่อง|120
นมช็อกโกแลต 1 กล่อง|180
โยเกิร์ตกรีก 1 ถ้วย|130
โยเกิร์ตรสธรรมชาติ 1 ถ้วย|100
เวย์โปรตีน 1 สกู๊ป|120
ชีสแผ่น 1 แผ่น|70
กล้วยหอม 1 ลูก|90
แอปเปิล 1 ลูก|80
ส้ม 1 ลูก|60
ส้มโอ 3 กลีบ|70
มะละกอ 1 จาน|60
แตงโม 1 จาน|60
สับปะรด 1 จาน|70
มะม่วงสุก 1/2 ลูก|100
ฝรั่ง 1/2 ลูก|50
สลัดผัก (ไม่ราดน้ำสลัด) 1 จาน|50
ต้มจืดผัก 1 ถ้วย|60
ผัดผักรวม 1 จาน|150
ส้มตำไทย 1 จาน|120
ต้มยำกุ้งน้ำใส 1 ถ้วย|100
ผัดกะเพราหมูสับไข่ดาว + ข้าว 1 จาน|620
ข้าวผัด 1 จาน|520
ข้าวไข่เจียว 1 จาน|500
ข้าวหมูแดง 1 จาน|550
ผัดไทย 1 จาน|600
ผัดซีอิ๊ว 1 จาน|600
ราดหน้า 1 จาน|450
ก๋วยเตี๋ยวน้ำ 1 ชาม|350
ซาลาเปา 1 ลูก|200
ขนมจีบ 3 ลูก|120
ปาท่องโก๋ 1 ชิ้น|100
ชานมไข่มุก 1 แก้ว|450
ชาเย็น 1 แก้ว|300
กาแฟเย็น 1 แก้ว|250
ลาเต้ร้อน 1 แก้ว|150
อเมริกาโน่ (ไม่หวาน) 1 แก้ว|5
น้ำอัดลม 1 กระป๋อง|140
น้ำส้ม 1 กล่อง|120
น้ำเปล่า|0
เบียร์ 1 กระป๋อง|150
อัลมอนด์ 10 เม็ด|70
ถั่วลิสงคั่ว 1 กำมือ|170
มันฝรั่งทอดกรอบ 1 ถุงเล็ก|150
เฟรนช์ฟรายส์ 1 ชุดเล็ก|230
ช็อกโกแลต 1 แท่ง|230
ไอศกรีม 1 สกู๊ป|140
คุกกี้ 1 ชิ้น|70
โปรตีนบาร์ 1 แท่ง|200
พิซซ่า 1 ชิ้น|270
แฮมเบอร์เกอร์ 1 ชิ้น|300
`;

export interface FoodItem {
  name: string;
  kcal: number;
  /** true = อาหารเดี่ยว (ไม่ใช่เมนูชุดเต็มมื้อ) */
  single?: boolean;
}

let cache: FoodItem[] | null = null;

function all(): FoodItem[] {
  if (cache) return cache;
  const out: FoodItem[] = [];
  const seen = new Set<string>();
  const push = (name: string, kcal: number, single: boolean) => {
    const key = norm(name);
    if (!key || seen.has(key) || !Number.isFinite(kcal)) return;
    seen.add(key);
    out.push({ name, kcal, single });
  };
  for (const line of SINGLE_ITEMS.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const [name, kcal] = t.split("|");
    push(name, Number(kcal), true);
  }
  for (const m of allMenuItems()) push(m.name, m.kcal, false);
  cache = out;
  return out;
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/** ค้นหาอาหาร: ขึ้นต้นด้วยคำที่พิมพ์ก่อน แล้วค่อยตามด้วยที่มีคำนั้นอยู่ข้างใน */
export function searchFoods(query: string, limit = 6, singlesOnly = false): FoodItem[] {
  const q = norm(query);
  if (!q) return [];
  const starts: FoodItem[] = [];
  const contains: FoodItem[] = [];
  for (const f of all()) {
    if (singlesOnly && !f.single) continue;
    const n = norm(f.name);
    if (n.startsWith(q)) starts.push(f);
    else if (n.includes(q)) contains.push(f);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** หาอาหารที่ชื่อตรงทั้งหมด (ไม่สนช่องว่าง/ตัวพิมพ์) */
export function findExact(name: string): FoodItem | null {
  const q = norm(name);
  if (!q) return null;
  return all().find((f) => norm(f.name) === q) ?? null;
}

export function foodCount(): number {
  return all().length;
}

export interface LocalEstimate {
  kcal: number;
  matched: string[];
  unmatched: string[];
}

const UNIT_RE = /(ฟอง|ถ้วย|จาน|ชาม|แก้ว|ลูก|ชิ้น|ไม้|แผ่น|ตัว|กล่อง|กระป๋อง|ซอง|ห่อ|สกู๊ป|แท่ง|ฝัก|หัว|กลีบ)/;

/**
 * ประเมินแคลอรี่จากข้อความที่พิมพ์ (ออฟไลน์):
 * 1) ถ้าตรงกับรายการในคลังทั้งชื่อ ใช้ค่านั้น
 * 2) ถ้าไม่ตรง แยกด้วย + , / และ "กับ" แล้วหาแต่ละส่วน (คูณจำนวนที่ระบุ เช่น "ไข่ต้ม 2 ฟอง")
 * คืน null ถ้าไม่รู้จักเลยสักส่วน
 */
export function estimateLocal(text: string): LocalEstimate | null {
  const t = text.trim();
  if (!t) return null;

  const exact = findExact(t);
  if (exact) return { kcal: exact.kcal, matched: [exact.name], unmatched: [] };

  const parts = t
    .split(/\s*[+,]\s*|\s+\/\s+|\s+กับ\s+|\s+และ\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  let kcal = 0;
  const matched: string[] = [];
  const unmatched: string[] = [];
  for (const part of parts) {
    let qty = 1;
    let core = part;
    const m = part.match(/(\d+(?:\.\d+)?)\s*(?:x|×)?\s*/i);
    if (m && UNIT_RE.test(part)) {
      const n = Number(m[1]);
      if (n > 0 && n <= 20) {
        qty = n;
        core = part.replace(m[0], " ").replace(UNIT_RE, " ").trim();
      }
    }
    // ข้อความเดียว: จับกับเมนูชุดได้ / หลายส่วน: จับเฉพาะอาหารเดี่ยว กันตัวเลขสูงเกินจริง
    const singlesOnly = parts.length > 1;
    const hit =
      findExact(core) ??
      searchFoods(core, 1, singlesOnly)[0] ??
      findExact(part) ??
      searchFoods(part, 1, singlesOnly)[0];
    if (hit && norm(core).length >= 2) {
      kcal += hit.kcal * qty;
      matched.push(qty === 1 ? hit.name : `${hit.name} ×${qty}`);
    } else {
      unmatched.push(part);
    }
  }
  if (matched.length === 0) return null;
  return { kcal: Math.round(kcal), matched, unmatched };
}
