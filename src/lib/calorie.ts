// คำนวณเป้าแคลอรี่/โปรตีนต่อวัน แบบคร่าว ๆ สำหรับ "body recomposition"
// (ลดไขมัน + สร้างกล้ามเนื้อไปพร้อมกัน) ซึ่งเหมาะกับมือใหม่
//
// หลักการ:
// 1) BMR ด้วยสูตร Mifflin-St Jeor
// 2) TDEE = BMR x ตัวคูณกิจกรรม
// 3) เป้าหมาย = TDEE ลดลงเล็กน้อย (~15%) เพื่อลดไขมันแบบค่อยเป็นค่อยไป
//    โดยคุมโปรตีนให้สูงพอรักษา/สร้างกล้ามเนื้อระหว่างพร่องแคลอรี่
//
// ตัวเลขนี้เป็นค่าประมาณทั่วไป ไม่ใช่คำแนะนำทางการแพทย์

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary" // แทบไม่ขยับตัว งานนั่งโต๊ะ
  | "light" // ออกกำลังกาย 1-3 วัน/สัปดาห์
  | "moderate" // ออกกำลังกาย 3-5 วัน/สัปดาห์
  | "active"; // ออกกำลังกาย 6-7 วัน/สัปดาห์ หรืองานใช้แรงเยอะ

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "แทบไม่ขยับตัว (นั่งทำงานทั้งวัน)",
  light: "ขยับตัวเล็กน้อย (ออกกำลังกาย 1-3 วัน/สัปดาห์)",
  moderate: "ปานกลาง (ออกกำลังกาย 3-5 วัน/สัปดาห์)",
  active: "ขยับตัวเยอะ (ออกกำลังกาย 6-7 วัน/สัปดาห์)",
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export interface CalorieInput {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface CalorieResult {
  bmr: number;
  multiplier: number;
  tdee: number;
  /** ค่าแคลอรี่ที่ถูกตัดจาก TDEE ต่อวัน (หลังคิดค่าต่ำสุดแล้ว) */
  deficit: number;
  /** แปลงเป็นน้ำหนักไขมันที่ลดได้โดยประมาณต่อสัปดาห์ (7,700 kcal ≈ 1 กก.) */
  weeklyLossKg: number;
  floorApplied: boolean;
  calorieTarget: number;
  proteinTargetG: number;
}

export function calculateTargets(input: CalorieInput): CalorieResult {
  const { gender, age, weightKg, heightCm, activityLevel } = input;

  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "male" ? base + 5 : base - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];

  // พร่องแคลอรี่ ~15% เพื่อลดไขมันแบบค่อยเป็นค่อยไป (recomposition-friendly)
  let calorieTarget = Math.round(tdee * 0.85);
  let floorApplied = false;

  // กันไม่ให้ต่ำเกินไปจนเป็นอันตราย (ค่าต่ำสุดทั่วไปที่แนะนำ)
  const floor = gender === "male" ? 1500 : 1200;
  if (calorieTarget < floor) {
    calorieTarget = floor;
    floorApplied = true;
  }

  // โปรตีนสูงหน่อยเพื่อรักษากล้ามเนื้อระหว่างพร่องแคลอรี่ (1.8 ก./กก.)
  const proteinTargetG = Math.round(weightKg * 1.8);

  return {
    bmr: Math.round(bmr),
    multiplier: ACTIVITY_MULTIPLIER[activityLevel],
    tdee: Math.round(tdee),
    deficit: Math.max(0, Math.round(tdee) - calorieTarget),
    weeklyLossKg:
      Math.round((Math.max(0, tdee - calorieTarget) * 7 / 7700) * 100) / 100,
    floorApplied,
    calorieTarget,
    proteinTargetG,
  };
}
