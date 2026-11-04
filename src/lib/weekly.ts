import { addDays, format, parseISO } from "date-fns";

export interface MealRow {
  entry_date: string;
  calories: number | null;
  is_done: boolean;
}
export interface WorkoutRow {
  entry_date: string;
  is_done: boolean;
}
export interface WeightRow {
  log_date: string;
  weight_kg: number;
}

export interface WeekStats {
  /** วันแรกและวันสุดท้ายของสัปดาห์ที่สรุป (7 วันจบที่วันนี้) */
  from: string;
  to: string;
  itemsTotal: number;
  itemsDone: number;
  /** % ที่ติ๊กแล้ว 0-100 (ไม่มีรายการ = 0) */
  tickPct: number;
  /** % ของสัปดาห์ก่อนหน้า หรือ null ถ้าสัปดาห์ก่อนไม่มีรายการ */
  prevTickPct: number | null;
  completeDays: number;
  workoutsTotal: number;
  workoutsDone: number;
  /** แคลอรี่เฉลี่ยของวันที่ติ๊กกินอย่างน้อย 1 รายการ (ไม่รวมวันนี้ที่ยังไม่จบ ถ้ามีวันอื่น) */
  avgEaten: number | null;
  eatenDays: number;
  target: number | null;
  /** จำนวนวันที่แคลอรี่ที่กินอยู่ในช่วง 80–105% ของเป้า */
  daysNearTarget: number;
  /** น้ำหนักเปลี่ยนในสัปดาห์ (กก.) จากบันทึกที่มีอย่างน้อย 2 ค่าในช่วง 7 วัน + ค่าก่อนหน้า */
  weightChange: number | null;
}

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

function pct(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function computeWeek(
  meals: MealRow[],
  workouts: WorkoutRow[],
  weights: WeightRow[],
  today: string,
  target: number | null
): WeekStats {
  const end = parseISO(today);
  const from = ymd(addDays(end, -6));
  const prevFrom = ymd(addDays(end, -13));
  const prevTo = ymd(addDays(end, -7));

  const inWeek = (d: string) => d >= from && d <= today;
  const inPrev = (d: string) => d >= prevFrom && d <= prevTo;

  const wm = meals.filter((m) => inWeek(m.entry_date));
  const ww = workouts.filter((w) => inWeek(w.entry_date));
  const itemsTotal = wm.length + ww.length;
  const itemsDone = wm.filter((m) => m.is_done).length + ww.filter((w) => w.is_done).length;

  const pm = meals.filter((m) => inPrev(m.entry_date));
  const pw = workouts.filter((w) => inPrev(w.entry_date));
  const prevTotal = pm.length + pw.length;
  const prevDone = pm.filter((m) => m.is_done).length + pw.filter((w) => w.is_done).length;

  // วันที่ติ๊กครบ: มีรายการและติ๊กหมดทุกอย่างของวันนั้น
  const perDay = new Map<string, { total: number; done: number; eaten: number }>();
  const bump = (d: string, done: boolean, kcal: number) => {
    const cur = perDay.get(d) ?? { total: 0, done: 0, eaten: 0 };
    cur.total++;
    if (done) {
      cur.done++;
      cur.eaten += kcal;
    }
    perDay.set(d, cur);
  };
  wm.forEach((m) => bump(m.entry_date, m.is_done, m.calories ?? 0));
  ww.forEach((w) => bump(w.entry_date, w.is_done, 0));

  let completeDays = 0;
  let eatenList: number[] = [];
  let todayEaten = 0;
  for (const [d, v] of perDay) {
    if (v.total > 0 && v.done === v.total) completeDays++;
    if (v.eaten > 0) {
      if (d === today) todayEaten = v.eaten;
      else eatenList.push(v.eaten);
    }
  }
  // วันนี้ยังไม่จบ จึงไม่นับในค่าเฉลี่ย (ไม่งั้นดูเหมือนกินน้อยกว่าจริง) ยกเว้นไม่มีวันอื่นให้เทียบเลย
  if (eatenList.length === 0 && todayEaten > 0) eatenList = [todayEaten];
  const avgEaten = eatenList.length
    ? Math.round(eatenList.reduce((a, b) => a + b, 0) / eatenList.length)
    : null;
  const daysNearTarget = target
    ? eatenList.filter((e) => e >= target * 0.8 && e <= target * 1.05).length
    : 0;

  // น้ำหนัก: ค่าสุดท้ายในสัปดาห์ เทียบกับค่าล่าสุดก่อนสัปดาห์ (ถ้าไม่มี ใช้ค่าแรกในสัปดาห์)
  const sorted = [...weights].sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  const weekW = sorted.filter((w) => inWeek(w.log_date));
  const before = sorted.filter((w) => w.log_date < from);
  let weightChange: number | null = null;
  if (weekW.length) {
    const last = weekW[weekW.length - 1].weight_kg;
    const ref = before.length ? before[before.length - 1].weight_kg : weekW.length > 1 ? weekW[0].weight_kg : null;
    if (ref !== null) weightChange = Math.round((last - ref) * 10) / 10;
  }

  return {
    from,
    to: today,
    itemsTotal,
    itemsDone,
    tickPct: pct(itemsDone, itemsTotal),
    prevTickPct: prevTotal > 0 ? pct(prevDone, prevTotal) : null,
    completeDays,
    workoutsTotal: ww.length,
    workoutsDone: ww.filter((w) => w.is_done).length,
    avgEaten,
    eatenDays: eatenList.length,
    target,
    daysNearTarget,
    weightChange,
  };
}

/** เคล็ดลับจากกฎง่ายๆ ในแอป (ใช้เมื่อไม่ได้เปิด AI หรือก่อนกดขอจาก AI) */
export function localTip(s: WeekStats): string {
  if (s.itemsTotal === 0) {
    return "สัปดาห์นี้ยังไม่มีแผนในปฏิทิน ไปหน้าโปรแกรมเลือกวันเริ่มได้เลย หรือเพิ่มมื้อแรกของวันนี้ก็พอ";
  }
  if (s.tickPct < 40) {
    return "ลองลดเป้าให้เล็กลง ติ๊กแค่ 1 มื้อกับ 1 ท่าให้ครบทุกวันก่อน พอเป็นนิสัยแล้วค่อยเพิ่ม";
  }
  if (s.target && s.avgEaten !== null && s.eatenDays >= 3) {
    const diff = s.avgEaten - s.target;
    if (diff > s.target * 0.1) {
      return `กินเฉลี่ยเกินเป้า ~${Math.round(diff).toLocaleString()} kcal ต่อวัน ลองเปลี่ยนเครื่องดื่มหวานหรือของทอดหนึ่งอย่างต่อวัน หรือเลือกส่วนเล็กลง (×0.5)`;
    }
    if (diff < -s.target * 0.25) {
      return `กินเฉลี่ยต่ำกว่าเป้า ~${Math.round(-diff).toLocaleString()} kcal ต่อวัน ถ้าหิวบ่อยลองเพิ่มโปรตีนในมื้อเช้า เช่น ไข่หรืออกไก่ แทนที่จะอดแล้วไปกินเยอะทีหลัง`;
    }
  }
  if (s.workoutsTotal > 0 && s.workoutsDone / s.workoutsTotal < 0.5) {
    return "มื้ออาหารทำได้ดี แต่การออกกำลังกายยังติ๊กไม่ถึงครึ่ง ลองกำหนดเวลาไว้ล่วงหน้าหนึ่งวัน เช่น หลังตื่นนอน 15 นาที";
  }
  if (s.prevTickPct !== null && s.tickPct > s.prevTickPct) {
    return `ติ๊กได้ ${s.tickPct}% ดีขึ้นจากสัปดาห์ก่อน (${s.prevTickPct}%) รักษาจังหวะนี้ไว้ และลองเพิ่มเป้าอีกนิดในสัปดาห์หน้า`;
  }
  if (s.tickPct >= 80) {
    return `ติ๊กได้ ${s.tickPct}% ถือว่าทำได้สม่ำเสมอมาก ถ้ารู้สึกไม่ยากแล้ว ลองเพิ่มความท้าทายอีกหนึ่งอย่างในสัปดาห์หน้า`;
  }
  return "ทำได้ต่อเนื่องดีแล้ว ลองเลือกหนึ่งจุดที่อยากดีขึ้นในสัปดาห์หน้า เช่น ติ๊กให้ครบอีกหนึ่งวัน";
}
