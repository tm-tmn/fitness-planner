"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Buddy,
  DumbbellIcon,
  BowlIcon,
  FlameIcon,
  MEAL_ICONS,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
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
  const supabase = useMemo(() => createClient(), []);
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
    return (
      <div className="flex items-center gap-3 py-10">
        <Buddy size={64} className="bob" />
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  const total = meals.length + workouts.length;
  const doneCount =
    meals.filter((m) => m.is_done).length +
    workouts.filter((w) => w.is_done).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const kcalPlanned = meals.reduce((a, m) => a + (m.calories ?? 0), 0);
  const kcalDone = meals
    .filter((m) => m.is_done)
    .reduce((a, m) => a + (m.calories ?? 0), 0);
  const mood = total === 0 ? "sleepy" : pct === 100 ? "cheer" : "happy";
  const message =
    total === 0
      ? "วันนี้ยังว่าง ไปเริ่มโปรแกรมที่หน้าโปรแกรมได้เลย"
      : pct === 100
      ? "ครบทุกอย่างแล้ว เก่งมาก!"
      : pct >= 50
      ? "เกินครึ่งแล้ว อีกนิดเดียว"
      : "เริ่มติ๊กทีละอย่างได้เลย";

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4 bg-white p-4">
        <Buddy size={88} mood={mood} className={pct === 100 ? "bob" : ""} />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-xl">{formatDateHeading(date)}</h1>
          <p className="text-sm">{message}</p>
          <div
            className="meter"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="ความคืบหน้าวันนี้"
          >
            <div className="meter-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="flex flex-wrap items-center gap-x-4 text-sm">
            <span>
              ทำแล้ว {doneCount}/{total}
            </span>
            {kcalPlanned > 0 && (
              <span className="inline-flex items-center gap-1">
                <FlameIcon size={18} />
                {kcalDone}/{kcalPlanned} kcal
              </span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="card bg-candy px-4 py-2 text-sm">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* ---------- อาหาร ---------- */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg">
          <BowlIcon size={30} /> มื้ออาหาร
        </h2>
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
      <section className="space-y-3 lg:sticky lg:top-20">
        <h2 className="flex items-center gap-2 text-lg">
          <DumbbellIcon size={30} /> ออกกำลังกาย
        </h2>
        <div className="card card-alt space-y-2 p-3">
          <ul className="space-y-2">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="flex items-start justify-between gap-2"
              >
                <label className="flex flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={w.is_done}
                    onChange={(e) => toggleWorkout(w.id, e.target.checked)}
                    className="cartoon-check mt-0.5"
                  />
                  <span>
                    <span
                      className={
                        w.is_done ? "line-through opacity-50" : "font-semibold"
                      }
                    >
                      {w.exercise_name}
                    </span>
                    {w.notes && (
                      <span className="mt-0.5 block text-sm opacity-70">
                        {w.notes}
                      </span>
                    )}
                  </span>
                </label>
                <button
                  onClick={() => deleteWorkout(w.id)}
                  className="icon-btn"
                  aria-label={`ลบ ${w.exercise_name}`}
                >
                  <TrashIcon size={20} />
                </button>
              </li>
            ))}
            {workouts.length === 0 && (
              <li className="text-sm opacity-60">ยังไม่มีแผนออกกำลังกาย</li>
            )}
          </ul>
          <AddRow
            placeholder="เพิ่มท่าออกกำลังกาย เช่น วิ่ง 30 นาที"
            onAdd={addWorkout}
          />
        </div>
      </section>
      </div>
    </div>
  );
}

const MEAL_TINT: Record<MealType, string> = {
  breakfast: "bg-[#FFF3C4]",
  lunch: "bg-mint-soft",
  dinner: "bg-[#E6DDFF]",
  snack: "bg-[#FFE0E8]",
};

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
  const Icon = MEAL_ICONS[mealType];
  return (
    <div className="card">
      <h3 className={`flex items-center gap-2 border-b-[3px] border-ink px-3 py-1.5 ${MEAL_TINT[mealType]}`}>
        <Icon size={28} />
        {MEAL_TYPE_LABELS[mealType]}
      </h3>
      <div className="p-3">
        <ul className="mb-3 space-y-2">
          {entries.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={m.is_done}
                  onChange={(e) => onToggle(m.id, e.target.checked)}
                  className="cartoon-check"
                />
                <span className={m.is_done ? "line-through opacity-50" : ""}>
                  {m.food_name}
                  {m.calories ? (
                    <span className="ml-1 text-sm opacity-70">
                      ({m.calories} kcal)
                    </span>
                  ) : null}
                </span>
              </label>
              <button
                onClick={() => onDelete(m.id)}
                className="icon-btn"
                aria-label={`ลบ ${m.food_name}`}
              >
                <TrashIcon size={20} />
              </button>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="text-sm opacity-60">ยังไม่มีรายการ</li>
          )}
        </ul>
        <AddRow placeholder="เพิ่มเมนูอาหาร" onAdd={onAdd} />
      </div>
    </div>
  );
}

function AddRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
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
        aria-label={placeholder}
        className="input"
      />
      <button onClick={submit} className="btn btn-mint shrink-0">
        <PlusIcon size={16} />
        เพิ่ม
      </button>
    </div>
  );
}
