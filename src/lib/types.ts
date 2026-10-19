export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "มื้อเช้า",
  lunch: "มื้อกลางวัน",
  dinner: "มื้อเย็น",
  snack: "ของว่าง",
};

export const MEAL_TYPE_ORDER: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export interface MealEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  meal_type: MealType;
  food_name: string;
  calories: number | null;
  notes: string | null;
  is_done: boolean;
  created_at: string;
}

export interface WorkoutEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  time_of_day: string | null;
  exercise_name: string;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  notes: string | null;
  is_done: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  daily_calorie_target: number | null;
  notes: string | null;
  updated_at: string;
}
