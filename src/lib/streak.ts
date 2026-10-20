import { addDays, format, parseISO } from "date-fns";

export interface DayStat {
  total: number;
  done: number;
}

export interface ActivityStats {
  /** จำนวนวันติดต่อกันที่ติ๊กครบทุกรายการ (วันนี้ที่ยังไม่ครบไม่ทำให้สตรีคขาด) */
  current: number;
  best: number;
  completeDays: number;
  workoutsDone: number;
  mealsDone: number;
}

export function localDateStr(d = new Date()) {
  return format(d, "yyyy-MM-dd");
}

const isComplete = (s?: DayStat) => !!s && s.total > 0 && s.done === s.total;

export function computeStats(
  days: Map<string, DayStat>,
  today: string,
  workoutsDone: number,
  mealsDone: number
): ActivityStats {
  // สตรีคปัจจุบัน: เดินถอยหลังจากวันนี้ (ถ้าวันนี้ยังไม่ครบ ให้เริ่มจากเมื่อวาน)
  let cursor = parseISO(today);
  if (!isComplete(days.get(today))) cursor = addDays(cursor, -1);
  let current = 0;
  while (isComplete(days.get(localDateStr(cursor)))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // สตรีคที่ยาวที่สุดในช่วงที่โหลดมา (ไม่นับวันในอนาคต)
  const dates = [...days.keys()].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  let completeDays = 0;
  for (const d of dates) {
    if (!isComplete(days.get(d))) {
      run = 0;
      prev = null;
      continue;
    }
    completeDays++;
    run = prev && localDateStr(addDays(parseISO(prev), 1)) === d ? run + 1 : 1;
    prev = d;
    best = Math.max(best, run);
  }
  return { current, best, completeDays, workoutsDone, mealsDone };
}

export interface Badge {
  id: string;
  title: string;
  hint: string;
  earned: (s: ActivityStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first", title: "วันแรก", hint: "ติ๊กครบทุกรายการใน 1 วัน", earned: (s) => s.completeDays >= 1 },
  { id: "s3", title: "ต่อเนื่อง 3 วัน", hint: "ติ๊กครบติดกัน 3 วัน", earned: (s) => s.best >= 3 },
  { id: "s7", title: "ครบสัปดาห์", hint: "ติ๊กครบติดกัน 7 วัน", earned: (s) => s.best >= 7 },
  { id: "s14", title: "สองสัปดาห์", hint: "ติ๊กครบติดกัน 14 วัน", earned: (s) => s.best >= 14 },
  { id: "s30", title: "ครบเดือน", hint: "ติ๊กครบติดกัน 30 วัน", earned: (s) => s.best >= 30 },
  { id: "w10", title: "นักสู้ 10 ท่า", hint: "ออกกำลังกายเสร็จ 10 ท่า", earned: (s) => s.workoutsDone >= 10 },
  { id: "w50", title: "สายแข็ง 50 ท่า", hint: "ออกกำลังกายเสร็จ 50 ท่า", earned: (s) => s.workoutsDone >= 50 },
];
