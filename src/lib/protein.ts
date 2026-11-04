import { estimateLocal } from "@/lib/foodDb";
import { programMealRef } from "@/lib/program";

export interface ProteinEstimate {
  /** โปรตีนโดยประมาณ (กรัม) */
  g: number;
  /** true = บางส่วนของเมนูไม่รู้จัก ตัวเลขจึงอาจต่ำกว่าจริง */
  partial: boolean;
}

const PORTION_SUFFIX = /\s*×\s*(\d+(?:\.\d+)?)\s*$/;

/**
 * ประเมินโปรตีนของรายการอาหารจาก "ชื่อ" (ใช้คลังในแอป ออฟไลน์) แล้วสเกลตามแคลอรี่ที่บันทึกไว้
 * เช่น เมนูโปรแกรมที่สเกลตามเป้า หรือเมนูที่ใส่ส่วน ×1.5 — คืน null ถ้าไม่รู้จักเมนูเลย
 * (เช่น เมนูที่ AI ประเมินแคลอรี่ให้) จึงไม่นับรวมและแจ้งผู้ใช้ว่ายังประเมินไม่ได้
 */
export function estimateProtein(name: string, kcal: number | null): ProteinEstimate | null {
  const m = name.match(PORTION_SUFFIX);
  const portion = m ? Number(m[1]) : 1;
  const core = (m ? name.replace(PORTION_SUFFIX, "") : name).trim();
  if (!core) return null;

  let ref: { kcal: number; protein: number } | null = programMealRef(core);
  let partial = false;
  if (!ref) {
    const est = estimateLocal(core);
    if (!est) return null;
    ref = { kcal: est.kcal, protein: est.protein };
    partial = est.unmatched.length > 0;
  }

  // สเกลตามแคลอรี่ที่บันทึกไว้ (ถ้าต่างจากค่าอ้างอิงมากเกินไป ถือว่าไม่เกี่ยวกัน ใช้ตัวคูณส่วนแทน)
  let ratio = portion;
  if (kcal != null && ref.kcal > 0) {
    const r = kcal / ref.kcal;
    if (r >= 0.25 && r <= 3.5) ratio = r;
  }
  return { g: Math.round(ref.protein * ratio), partial };
}

export interface DayProtein {
  eaten: number;
  planned: number;
  /** จำนวนรายการที่ประเมินโปรตีนไม่ได้ */
  unknown: number;
  /** จำนวนรายการที่ประเมินได้แค่บางส่วน */
  partial: number;
}

export function sumProtein(
  meals: { food_name: string; calories: number | null; is_done: boolean }[]
): DayProtein {
  const out: DayProtein = { eaten: 0, planned: 0, unknown: 0, partial: 0 };
  for (const m of meals) {
    const e = estimateProtein(m.food_name, m.calories);
    if (!e) {
      out.unknown++;
      continue;
    }
    if (e.partial) out.partial++;
    out.planned += e.g;
    if (m.is_done) out.eaten += e.g;
  }
  return out;
}
