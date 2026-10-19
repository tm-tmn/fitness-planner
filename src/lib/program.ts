// ========================================================
// "แผนเทรนเนอร์" — โปรแกรม 4 สัปดาห์ สำหรับมือใหม่
// ออกกำลังกาย 3 วัน/สัปดาห์ ที่บ้าน/โรงแรม (ไม่ต้องใช้อุปกรณ์)
// เป้าหมาย: ลดไขมัน + สร้างกล้ามเนื้อไปพร้อมกัน (body recomposition)
//
// นี่คือ "เนื้อหาโปรแกรม" ล้วน ๆ (ข้อมูล ไม่ใช่คำสั่งเขียนโค้ด)
// ฟังก์ชัน buildProgramEntries() ด้านล่างจะแปลงเป็นแถวข้อมูล
// สำหรับ insert ลง meal_entries / workout_entries ตามวันที่จริง
// ========================================================

export const PROGRAM_WEEKS = 4;
export const PROGRAM_NAME = "โปรแกรม 4 สัปดาห์: มือใหม่ฟิต & อิ่มพอดี";

type ExerciseKind = "reps" | "hold";

export interface ProgramExercise {
  name: string;
  kind: ExerciseKind;
  perSide?: boolean; // true = นับแยกซ้าย/ขวา
  note: string; // คำแนะนำท่า/ตัวเลือกง่ายลง
}

export interface WorkoutDayTemplate {
  title: string;
  focus: string;
  exercises: ProgramExercise[];
}

// ---------- ความหนักตามสัปดาห์ ----------
interface WeekLoad {
  sets: number;
  reps: number; // ใช้กับท่าที่นับครั้ง
  holdSeconds: number; // ใช้กับท่าที่นับเวลา
}

const WEEK_LOAD: WeekLoad[] = [
  { sets: 2, reps: 10, holdSeconds: 20 }, // สัปดาห์ 1
  { sets: 3, reps: 10, holdSeconds: 25 }, // สัปดาห์ 2
  { sets: 3, reps: 12, holdSeconds: 30 }, // สัปดาห์ 3
  { sets: 3, reps: 15, holdSeconds: 40 }, // สัปดาห์ 4
];

function instructionFor(ex: ProgramExercise, week: number): string {
  const load = WEEK_LOAD[Math.min(week, WEEK_LOAD.length) - 1];
  const sideLabel = ex.perSide ? " ต่อข้าง" : "";
  const mainLine =
    ex.kind === "reps"
      ? `${load.sets} เซ็ต x ${load.reps} ครั้ง${sideLabel}`
      : `${load.sets} เซ็ต x ค้าง ${load.holdSeconds} วินาที${sideLabel}`;
  return `${mainLine} — ${ex.note}`;
}

// ---------- ท่าออกกำลังกาย 3 วัน/สัปดาห์ (วน A/B/C) ----------
export const WORKOUT_DAYS: WorkoutDayTemplate[] = [
  {
    title: "Day A — ขา & อก",
    focus: "เน้นขาและอก ใช้บอดี้เวทล้วน",
    exercises: [
      {
        name: "Bodyweight Squat",
        kind: "reps",
        note: "ยืนแยกขากว้างไหล่ ย่อสะโพกลงเหมือนจะนั่งเก้าอี้ หลังตรง",
      },
      {
        name: "Push-up",
        kind: "reps",
        note: "ถ้ายังไม่ไหว ให้ลงเข่าแตะพื้นแทนได้",
      },
      {
        name: "Reverse Lunge",
        kind: "reps",
        perSide: true,
        note: "ก้าวขาถอยหลัง ย่อเข่าหน้า 90 องศา สลับข้าง",
      },
      {
        name: "Plank",
        kind: "hold",
        note: "ลำตัวตรงเป็นเส้นเดียว ไม่แอ่นหลัง",
      },
      {
        name: "Glute Bridge",
        kind: "reps",
        note: "นอนหงาย ยกสะโพกขึ้นบีบก้นค้างแป๊บหนึ่งแล้วลง",
      },
    ],
  },
  {
    title: "Day B — หลัง & แกนกลาง",
    focus: "เน้นหลังและคอร์ สร้างความมั่นคงของแกนกลางลำตัว",
    exercises: [
      {
        name: "Superman Raise",
        kind: "reps",
        note: "นอนคว่ำ ยกแขน-ขาขึ้นพร้อมกันเหมือนซูเปอร์แมนบิน",
      },
      {
        name: "Incline Push-up (ใช้โต๊ะ/เก้าอี้/ขอบเตียง)",
        kind: "reps",
        note: "มือวางบนที่สูง ทำได้ในห้องพักโรงแรมได้สบาย",
      },
      {
        name: "Bird-dog",
        kind: "reps",
        perSide: true,
        note: "คลาน 4 ขา ยื่นแขน-ขาตรงข้ามกันออกพร้อมกัน สลับข้าง",
      },
      {
        name: "Side Plank",
        kind: "hold",
        perSide: true,
        note: "นอนตะแคง ยกสะโพกขึ้นให้ลำตัวเป็นเส้นตรง สลับข้าง",
      },
      {
        name: "Step-up (ใช้บันได/ม้านั่ง/เตียง)",
        kind: "reps",
        perSide: true,
        note: "ก้าวขึ้นที่สูงทีละข้าง ควบคุมจังหวะตอนลง",
      },
    ],
  },
  {
    title: "Day C — คาร์ดิโอคุมจังหวะ",
    focus: "เน้นหัวใจ-ปอด เผาผลาญ ควบคุมฟอร์มทุกจังหวะ",
    exercises: [
      {
        name: "Jump Squat (หรือ Squat ธรรมดาถ้าเข่าไม่พร้อม)",
        kind: "reps",
        note: "ย่อแล้วกระโดดขึ้นเบา ๆ ลงอย่างนุ่มนวล",
      },
      {
        name: "Push-up จังหวะช้า (Tempo)",
        kind: "reps",
        note: "ลงช้า นับ 1-2-3 แล้วดันขึ้นปกติ",
      },
      {
        name: "Mountain Climbers",
        kind: "hold",
        note: "อยู่ท่าแพลงก์ สลับดึงเข่าเข้าหาอกเร็ว ๆ",
      },
      {
        name: "Glute Bridge March",
        kind: "reps",
        perSide: true,
        note: "ค้างสะพานสะโพกแล้วยกเข่าสลับข้างทีละขา",
      },
      {
        name: "Plank to Shoulder Tap",
        kind: "reps",
        perSide: true,
        note: "อยู่ท่าแพลงก์มือ สลับมือแตะไหล่ตรงข้าม คุมสะโพกนิ่ง",
      },
    ],
  },
];

// ---------- เมนูอาหาร 7 วันหมุนเวียน (วนซ้ำทั้ง 4 สัปดาห์) ----------
// ค่าแคลอรี่ที่ระบุ "อ้างอิงจากเป้า 1800 kcal/วัน" แล้วจะถูกสเกล
// ตามเป้าแคลอรี่จริงของแต่ละคนอัตโนมัติตอนกดใช้งานโปรแกรม
interface MealTemplate {
  food_name: string;
  calories: number; // อ้างอิงที่ 1800 kcal/วัน
}
interface DayMealTemplate {
  breakfast: MealTemplate;
  lunch: MealTemplate;
  dinner: MealTemplate;
  snack: MealTemplate;
}

export const MEAL_CYCLE: DayMealTemplate[] = [
  {
    breakfast: { food_name: "ไข่ต้ม 2 ฟอง + ขนมปังโฮลวีต 2 แผ่น + อะโวคาโด", calories: 450 },
    lunch: { food_name: "ข้าวกล้อง + อกไก่ย่าง + ผักรวมผัดน้ำมันน้อย", calories: 630 },
    dinner: { food_name: "ปลานึ่งมะนาว + ข้าวกล้องครึ่งจาน + ผักลวก", calories: 540 },
    snack: { food_name: "โยเกิร์ตกรีกรสธรรมชาติ + กล้วยหอม", calories: 180 },
  },
  {
    breakfast: { food_name: "โจ๊กอกไก่ฉีก + ไข่ลวก", calories: 450 },
    lunch: { food_name: "สลัดอกไก่ย่าง + ข้าวกล้อง/ควินัว + ไข่ต้ม", calories: 630 },
    dinner: { food_name: "แกงจืดเต้าหู้หมูสับ + ข้าวกล้อง", calories: 540 },
    snack: { food_name: "นมถั่วเหลืองไม่หวาน + ถั่วอบไม่ปรุงรส", calories: 180 },
  },
  {
    breakfast: { food_name: "แซนด์วิชทูน่า + ไข่ขาวต้ม", calories: 450 },
    lunch: { food_name: "ข้าวผัดอกไก่ใส่ไข่ (น้ำมันน้อย) + แตงกวา", calories: 630 },
    dinner: { food_name: "ต้มยำกุ้งน้ำใส + ข้าวกล้อง", calories: 540 },
    snack: { food_name: "ไข่ต้ม 2 ฟอง", calories: 180 },
  },
  {
    breakfast: { food_name: "ข้าวต้มปลา + ไข่ลวก", calories: 450 },
    lunch: { food_name: "สเต็กอกไก่ + มันหวานอบ + ผักย่าง", calories: 630 },
    dinner: { food_name: "ยำวุ้นเส้นทะเล + ข้าวกล้องเล็กน้อย", calories: 540 },
    snack: { food_name: "เวย์โปรตีน 1 สกู๊ป + กล้วยหอม", calories: 180 },
  },
  {
    breakfast: { food_name: "โยเกิร์ตกรีก + กราโนล่า + ผลไม้สด", calories: 450 },
    lunch: { food_name: "ข้าวกล้อง + ปลาแซลมอนย่าง + บรอกโคลีนึ่ง", calories: 630 },
    dinner: { food_name: "สุกี้น้ำทะเล (กุ้ง/ปลาหมึก) + วุ้นเส้น", calories: 540 },
    snack: { food_name: "ถั่วรวมอบ + นมจืดไขมันต่ำ", calories: 180 },
  },
  {
    breakfast: { food_name: "ไข่เจียวผัก + ข้าวกล้อง", calories: 450 },
    lunch: { food_name: "ข้าวมันไก่ต้ม (ไม่เอาหนัง น้ำมันน้อย) + ซุปแตงกวา", calories: 630 },
    dinner: { food_name: "พะแนงไก่กะทิน้อย + ข้าวกล้อง", calories: 540 },
    snack: { food_name: "ผลไม้รวม + ไข่ต้ม", calories: 180 },
  },
  {
    breakfast: { food_name: "แพนเค้กข้าวโอ๊ตกล้วยหอม + ไข่ขาว", calories: 450 },
    lunch: { food_name: "ข้าวกล้อง + หมูสันในย่าง + สลัดผัก", calories: 630 },
    dinner: { food_name: "ซุปไข่ผัก + ขนมปังโฮลวีต + อกไก่ฉีก", calories: 540 },
    snack: { food_name: "โยเกิร์ต + เมล็ดเจีย", calories: 180 },
  },
];

const REFERENCE_DAILY_CALORIES = 1800;

export interface GeneratedWorkoutEntry {
  entry_date: string;
  exercise_name: string;
  notes: string;
}
export interface GeneratedMealEntry {
  entry_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  calories: number;
}

/**
 * สร้างรายการแผนออกกำลังกาย + อาหาร สำหรับ 4 สัปดาห์ (28 วัน)
 * เริ่มจาก startDate ที่กำหนด โดยสเกลแคลอรี่ตามเป้าของผู้ใช้แต่ละคน
 *
 * รูปแบบสัปดาห์ (7 วัน): วัน1=A ออกกำลังกาย, วัน2=พัก, วัน3=B, วัน4=พัก,
 * วัน5=C, วัน6-7=พัก (อาหารกินทุกวันไม่ว่าจะพักหรือไม่)
 */
export function buildProgramEntries(
  startDate: Date,
  dailyCalorieTarget: number | null | undefined
): { workouts: GeneratedWorkoutEntry[]; meals: GeneratedMealEntry[] } {
  const calorieRatio = dailyCalorieTarget
    ? dailyCalorieTarget / REFERENCE_DAILY_CALORIES
    : 1;

  const workouts: GeneratedWorkoutEntry[] = [];
  const meals: GeneratedMealEntry[] = [];

  const totalDays = PROGRAM_WEEKS * 7;

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const entry_date = toDateString(date);

    const week = Math.floor(dayIndex / 7) + 1; // 1..4
    const dayOfWeek = (dayIndex % 7) + 1; // 1..7

    // ---- ออกกำลังกาย: วัน 1,3,5 ของสัปดาห์ ----
    const workoutDayTemplate =
      dayOfWeek === 1
        ? WORKOUT_DAYS[0]
        : dayOfWeek === 3
        ? WORKOUT_DAYS[1]
        : dayOfWeek === 5
        ? WORKOUT_DAYS[2]
        : null;

    if (workoutDayTemplate) {
      for (const ex of workoutDayTemplate.exercises) {
        workouts.push({
          entry_date,
          exercise_name: `${workoutDayTemplate.title}: ${ex.name}`,
          notes: instructionFor(ex, week),
        });
      }
    }

    // ---- อาหาร: ทุกวัน วนเมนู 7 วัน ----
    const mealTemplate = MEAL_CYCLE[dayIndex % 7];
    (["breakfast", "lunch", "dinner", "snack"] as const).forEach((mt) => {
      const m = mealTemplate[mt];
      meals.push({
        entry_date,
        meal_type: mt,
        food_name: m.food_name,
        calories: Math.round(m.calories * calorieRatio),
      });
    });
  }

  return { workouts, meals };
}

function toDateString(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
