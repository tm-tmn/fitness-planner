import type { MealType } from "@/lib/types";

export interface RecentRow {
  meal_type: MealType;
  food_name: string;
  calories: number | null;
  entry_date: string;
  is_done: boolean;
}

export interface RecentFood {
  name: string;
  kcal: number | null;
}

/**
 * อาหารที่ผู้ใช้ "กินจริง" (ติ๊กแล้ว) ในมื้อนั้นๆ เรียงตามความถี่ แล้วตามวันล่าสุด
 * ไม่รวมรายการที่มีอยู่ในมื้อของวันนี้แล้ว (exclude)
 */
export function buildRecents(
  rows: RecentRow[],
  mealType: MealType,
  exclude: string[] = [],
  limit = 5
): RecentFood[] {
  const skip = new Set(exclude.map((n) => n.trim()));
  const byName = new Map<string, { count: number; last: string; kcal: number | null }>();
  for (const r of rows) {
    if (r.meal_type !== mealType || !r.is_done) continue;
    const name = r.food_name.trim();
    if (!name || skip.has(name)) continue;
    const cur = byName.get(name);
    if (!cur) {
      byName.set(name, { count: 1, last: r.entry_date, kcal: r.calories ?? null });
    } else {
      cur.count++;
      // ใช้แคลอรี่ของครั้งล่าสุด
      if (r.entry_date > cur.last || (r.entry_date === cur.last && cur.kcal == null)) {
        cur.last = r.entry_date;
        cur.kcal = r.calories ?? cur.kcal;
      }
    }
  }
  return [...byName.entries()]
    .sort((a, b) => b[1].count - a[1].count || (a[1].last < b[1].last ? 1 : a[1].last > b[1].last ? -1 : 0))
    .slice(0, limit)
    .map(([name, v]) => ({ name, kcal: v.kcal }));
}

export interface CopyRow {
  meal_type: MealType;
  food_name: string;
  calories: number | null;
}

/**
 * เลือกรายการของเมื่อวานที่จะก๊อปมาวันนี้ — ตัดรายการซ้ำกันเองในต้นทาง
 * และข้ามรายการที่วันนี้มีมื้อเดียวกันชื่อเดียวกันอยู่แล้ว
 */
export function pickCopyRows(
  source: CopyRow[],
  today: { meal_type: MealType; food_name: string }[]
): { rows: CopyRow[]; skipped: number } {
  const key = (m: string, n: string) => `${m}|${n.trim()}`;
  const have = new Set(today.map((t) => key(t.meal_type, t.food_name)));
  const rows: CopyRow[] = [];
  let skipped = 0;
  for (const s of source) {
    const k = key(s.meal_type, s.food_name);
    if (have.has(k)) {
      skipped++;
      continue;
    }
    have.add(k);
    rows.push({ meal_type: s.meal_type, food_name: s.food_name, calories: s.calories ?? null });
  }
  return { rows, skipped };
}
