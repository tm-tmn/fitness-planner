"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  MealEntry,
  MealType,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  WorkoutEntry,
} from "@/lib/types";

function formatDateHeading(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DayPlanner({ date }: { date: string }) {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [mealsRes, workoutsRes] = await Promise.all([
      supabase
        .from("meal_entries")
        .select("*")
        .eq("entry_date", date)
        .order("created_at", { ascending: true }),
      supabase
        .from("workout_entries")
        .select("*")
        .eq("entry_date", date)
        .order("created_at", { ascending: true }),
    ]);

    if (mealsRes.error) setError(mealsRes.error.message);
    if (workoutsRes.error) setError(workoutsRes.error.message);

    setMeals((mealsRes.data as MealEntry[]) ?? []);
    setWorkouts((workoutsRes.data as WorkoutEntry[]) ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function addMeal(meal_type: MealType, food_name: string) {
    if (!food_name.trim()) return;
    const { error } = await supabase
      .from("meal_entries")
      .insert({ entry_date: date, meal_type, food_name });
    if (error) setError(error.message);
    else load();
  }

  async function addWorkout(exercise_name: string) {
    if (!exercise_name.trim()) return;
    const { error } = await supabase
      .from("workout_entries")
      .insert({ entry_date: date, exercise_name });
    if (error) setError(error.message);
    else load();
  }

  async function toggleMeal(id: string, is_done: boolean) {
    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_done } : m))
    );
    const { error } = await supabase
      .from("meal_entries")
      .update({ is_done })
      .eq("id", id);
    if (error) setError(error.message);
  }

  async function toggleWorkout(id: string, is_done: boolean) {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_done } : w))
    );
    const { error } = await supabase
      .from("workout_entries")
      .update({ is_done })
      .eq("id", id);
    if (error) setError(error.message);
  }

  async function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from("meal_entries").delete().eq("id", id);
    if (error) setError(error.message);
  }

  async function deleteWorkout(id: string) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    const { error } = await supabase
      .from("workout_entries")
      .delete()
      .eq("id", id);
    if (error) setError(error.message);
  }

  if (loading) {
    return <p className="text-gray-500">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold capitalize">
        {formatDateHeading(date)}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {/* ---------- อาหาร ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-700">🍽️ มื้ออาหาร</h2>
        {MEAL_TYPE_ORDER.map((mt) => (
          <MealSection
            key={mt}
            mealType={mt}
            entries={meals.filter((m) => m.meal_type === mt)}
            onAdd={(name) => addMeal(mt, name)}
            onToggle={toggleMeal}
            onDelete={deleteMeal}
          />
        ))}
      </section>

      {/* ---------- ออกกำลังกาย ---------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-700">
          💪 ออกกำลังกาย
        </h2>
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={w.is_done}
                  onChange={(e) => toggleWorkout(w.id, e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className={w.is_done ? "text-gray-400 line-through" : ""}>
                  {w.exercise_name}
                </span>
              </label>
              <button
                onClick={() => deleteWorkout(w.id)}
                className="text-xs text-gray-400 hover:text-red-500"
                aria-label="ลบ"
              >
                ลบ
              </button>
            </li>
          ))}
          {workouts.length === 0 && (
            <li className="text-sm text-gray-400">ยังไม่มีแผนออกกำลังกาย</li>
          )}
        </ul>
        <AddRow placeholder="เพิ่มท่าออกกำลังกาย เช่น วิ่ง 30 นาที" onAdd={addWorkout} />
      </section>
    </div>
  );
}

function MealSection({
  mealType,
  entries,
  onAdd,
  onToggle,
  onDelete,
}: {
  mealType: MealType;
  entries: MealEntry[];
  onAdd: (name: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        {MEAL_TYPE_LABELS[mealType]}
      </h3>
      <ul className="mb-2 space-y-1.5">
        {entries.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <label className="flex flex-1 items-center gap-2">
              <input
                type="checkbox"
                checked={m.is_done}
                onChange={(e) => onToggle(m.id, e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className={m.is_done ? "text-gray-400 line-through" : ""}>
                {m.food_name}
                {m.calories ? (
                  <span className="ml-1 text-xs text-gray-400">
                    ({m.calories} kcal)
                  </span>
                ) : null}
              </span>
            </label>
            <button
              onClick={() => onDelete(m.id)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              ลบ
            </button>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-gray-400">ยังไม่มีรายการ</li>
        )}
      </ul>
      <AddRow placeholder="เพิ่มเมนูอาหาร" onAdd={onAdd} compact />
    </div>
  );
}

function AddRow({
  placeholder,
  onAdd,
  compact,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    onAdd(value);
    setValue("");
  }

  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={placeholder}
        className={`flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none ${
          compact ? "" : "py-2"
        }`}
      />
      <button
        onClick={submit}
        className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
      >
        เพิ่ม
      </button>
    </div>
  );
}
