import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export interface WeightPoint {
  log_date: string;
  weight_kg: number;
}

export type TrendStatus = "insufficient" | "ontrack" | "adjust";

export interface TrendResult {
  status: TrendStatus;
  /** อัตราเปลี่ยนน้ำหนักจากเส้นแนวโน้ม (กก./สัปดาห์ ลบ = ลดลง) null ถ้าข้อมูลไม่พอ */
  slopePerWeek: number | null;
  /** จำนวนครั้งที่ชั่งและจำนวนวันที่ครอบคลุมในช่วงที่ใช้คำนวณ */
  points: number;
  spanDays: number;
  /** วันที่เริ่มนับช่วงนี้ (หลังแก้เป้าครั้งล่าสุดหรือ 28 วันล่าสุด) */
  windowStart: string;
  /** เป้าอัตราลดที่ใช้เทียบ (กก./สัปดาห์ เป็นค่าบวก) */
  desiredLossPerWeek: number;
  /** เป้าแคลอรี่ที่แนะนำ (เฉพาะ status = adjust) */
  suggestedTarget?: number;
  /** ส่วนต่างที่แนะนำเทียบเป้าปัจจุบัน (kcal/วัน) */
  delta?: number;
  /** ถึงค่าต่ำสุดที่ปลอดภัยแล้ว จึงไม่แนะนำลดต่ออีก */
  atFloor?: boolean;
  message: string;
}

export const MIN_POINTS = 3;
export const MIN_SPAN_DAYS = 10;
const WINDOW_DAYS = 28;
/** อัตราลดน้ำหนักที่ตั้งเป้า: 0.5% ของน้ำหนักตัวต่อสัปดาห์ (ช้าๆ ปลอดภัย รักษากล้ามเนื้อ) */
const TARGET_PCT = 0.005;
/** ยอมให้คลาดเคลื่อนได้ ±0.25% ของน้ำหนักตัวต่อสัปดาห์ก่อนจะแนะนำให้ปรับ */
const BAND_PCT = 0.0025;
const MAX_STEP_KCAL = 200;
/** 7,700 kcal ≈ 1 กก. ไขมัน และปรับแค่ครึ่งหนึ่งของช่องว่างต่อครั้ง กันแกว่ง */
const KCAL_PER_KG = 7700;
const DAMPING = 0.5;

function round50(n: number) {
  return Math.round(n / 50) * 50;
}

/** ความชันเส้นตรงแบบ least squares ของน้ำหนักต่อวัน (กก./วัน) */
function slopePerDay(points: WeightPoint[]): number {
  const t0 = parseISO(points[0].log_date).getTime();
  const xs = points.map((p) => (parseISO(p.log_date).getTime() - t0) / 86400000);
  const ys = points.map((p) => p.weight_kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * ดูแนวโน้มน้ำหนักแล้วแนะนำปรับเป้าแคลอรี่ (แนะนำเท่านั้น ผู้ใช้ต้องกดยืนยันเอง)
 * - ใช้เฉพาะน้ำหนักตั้งแต่แก้เป้าครั้งล่าสุด (profileUpdatedAt) ภายใน 28 วันล่าสุด เพื่อให้ผลสะท้อนเป้าปัจจุบัน
 * - ต้องมีอย่างน้อย 3 ครั้ง ครอบคลุม 10 วันขึ้นไป ไม่งั้นบอกว่าข้อมูลยังไม่พอ
 * - ปรับครั้งละไม่เกิน 200 kcal/วัน ปัดเป็นหลัก 50 และไม่ต่ำกว่าค่าต่ำสุดที่ปลอดภัย
 */
export function analyzeTrend(args: {
  logs: WeightPoint[];
  today: string;
  targetKcal: number | null;
  gender: "male" | "female" | null;
  /** วันที่แก้โปรไฟล์/เป้าล่าสุด (YYYY-MM-DD) หรือ null */
  profileUpdatedAt: string | null;
}): TrendResult {
  const { logs, today, targetKcal, gender, profileUpdatedAt } = args;
  const floorStart = format(addDays(parseISO(today), -WINDOW_DAYS), "yyyy-MM-dd");
  const windowStart = profileUpdatedAt && profileUpdatedAt > floorStart ? profileUpdatedAt : floorStart;

  const pts = [...logs]
    .filter((l) => l.log_date >= windowStart && l.log_date <= today)
    .sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  const spanDays = pts.length >= 2 ? differenceInCalendarDays(parseISO(pts[pts.length - 1].log_date), parseISO(pts[0].log_date)) : 0;
  const lastWeight = logs.length ? [...logs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1))[logs.length - 1].weight_kg : 75;
  const desired = Math.round(lastWeight * TARGET_PCT * 100) / 100;

  if (pts.length < MIN_POINTS || spanDays < MIN_SPAN_DAYS) {
    return {
      status: "insufficient",
      slopePerWeek: null,
      points: pts.length,
      spanDays,
      windowStart,
      desiredLossPerWeek: desired,
      message:
        "ข้อมูลยังไม่พอที่จะดูแนวโน้ม ชั่งน้ำหนักอย่างน้อย 3 ครั้งในช่วง 10 วันขึ้นไป (สัปดาห์ละ 1-2 ครั้งก็พอ) นับตั้งแต่แก้เป้าครั้งล่าสุด",
    };
  }

  const slopeWeek = Math.round(slopePerDay(pts) * 7 * 100) / 100;
  const band = lastWeight * BAND_PCT;
  // err > 0 = ลดช้ากว่าเป้า (หรือน้ำหนักขึ้น)
  const err = slopeWeek - -desired;
  const base = { slopePerWeek: slopeWeek, points: pts.length, spanDays, windowStart, desiredLossPerWeek: desired };

  if (Math.abs(err) <= band || !targetKcal) {
    return {
      ...base,
      status: "ontrack",
      message: !targetKcal
        ? "ตั้งเป้าแคลอรี่ที่หน้าโปรไฟล์ก่อน ระบบจึงจะแนะนำการปรับได้"
        : "น้ำหนักเปลี่ยนในอัตราที่เหมาะสมแล้ว ยังไม่ต้องปรับเป้า ทำต่อเนื่องไปก่อน",
    };
  }

  const raw = -((err * KCAL_PER_KG) / 7) * DAMPING; // ลดช้า -> ติดลบ (ลดเป้า)
  let delta = Math.max(-MAX_STEP_KCAL, Math.min(MAX_STEP_KCAL, round50(raw)));
  if (delta === 0) delta = raw < 0 ? -50 : 50;

  const floor = gender === "male" ? 1500 : 1200; // ถ้าไม่ทราบเพศใช้ค่าที่สูงกว่าไว้ก่อน
  const safeFloor = gender ? floor : 1500;
  let suggested = targetKcal + delta;
  let atFloor = false;
  if (suggested < safeFloor) {
    suggested = targetKcal; // ไม่ลดต่อ (และไม่ดันขึ้นเองเมื่อผู้ใช้ตั้งต่ำกว่าเองอยู่แล้ว)
    atFloor = true;
    delta = suggested - targetKcal;
  }

  if (delta === 0) {
    return {
      ...base,
      status: "ontrack",
      atFloor: true,
      message: "น้ำหนักลดช้ากว่าเป้า แต่เป้าแคลอรี่ใกล้ค่าต่ำสุดที่ปลอดภัยแล้ว ไม่แนะนำให้ลดต่อ ลองเพิ่มการเคลื่อนไหวหรือดูความสม่ำเสมอในการติ๊กแทน",
    };
  }

  const slow = err > 0;
  return {
    ...base,
    status: "adjust",
    suggestedTarget: suggested,
    delta,
    atFloor,
    message: slow
      ? slopeWeek > 0
        ? "น้ำหนักกำลังขึ้นเล็กน้อยทั้งที่ตั้งเป้าลด ลองลดเป้าเล็กน้อย และเช็กว่ากินตรงแผนจริงหรือไม่ก่อน"
        : "น้ำหนักลดช้ากว่าเป้า ลองลดเป้าแคลอรี่เล็กน้อย (ถ้ากินตรงแผนจริงอยู่แล้ว)"
      : "น้ำหนักลดเร็วกว่าที่แนะนำ เสี่ยงเสียกล้ามเนื้อและหมดแรง ลองเพิ่มเป้าแคลอรี่เล็กน้อย",
  };
}
