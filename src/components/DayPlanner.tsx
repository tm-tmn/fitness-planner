"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useActivity } from "@/lib/useActivity";
import {
  REGION_LABELS,
  REGION_ORDER,
  Region,
  detectRegion,
  suggestMenus,
} from "@/lib/regionalMenus";
import LocationPrompt from "@/components/LocationPrompt";
import { Coords, mapsSearchUrl, searchTerms } from "@/lib/shopSearch";
import RestTimer, { TimerStart } from "@/components/RestTimer";
import { HOTEL_PREFIX, HOTEL_ROUTINE } from "@/lib/hotel";
import {
  Buddy,
  DumbbellIcon,
  BedIcon,
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

/** ดึงเวลาพักจากโน้ต เช่น "พัก 45 วินาที" หรือ "พัก 1 นาที" (ไม่ระบุแต่มีเซ็ต = 60 วินาที) */
function restSeconds(notes?: string | null): number | null {
  if (!notes) return null;
  const s = notes.match(/พัก\s*(\d+)\s*วินาที/);
  if (s) return Math.min(Number(s[1]), 600);
  const m = notes.match(/พัก\s*(\d+)\s*นาที/);
  if (m) return Math.min(Number(m[1]) * 60, 600);
  // ท่าที่มีเซ็ตแต่ไม่ได้ระบุเวลาพัก ใช้ค่ามาตรฐาน 60 วินาที
  if (/\d+\s*เซ็ต/.test(notes)) return 60;
  return null;
}

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
  const [kcalTarget, setKcalTarget] = useState<number | null | undefined>(undefined);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [regionOverride, setRegionOverride] = useState<Region | null>(null);
  const [undo, setUndo] = useState<
    { id: string; food_name: string; calories: number | null }[][]
  >([]);
  const region: Region | null = coords
    ? regionOverride ?? detectRegion(coords.lat, coords.lng)
    : null;
  const [timerStart, setTimerStart] = useState<TimerStart | null>(null);
  const [hotelOpen, setHotelOpen] = useState(false);
  const [hotelBusy, setHotelBusy] = useState(false);
  const activity = useActivity(meals.filter((m) => m.is_done).length * 1000 + workouts.filter((w) => w.is_done).length);

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

  useEffect(() => {
    supabase
      .from("profiles")
      .select("daily_calorie_target")
      .maybeSingle()
      .then(({ data }) =>
        setKcalTarget((data as { daily_calorie_target: number | null } | null)?.daily_calorie_target ?? null)
      );
  }, [supabase]);

  async function addMeal(meal_type: MealType, food_name: string, calories?: number | null) {
    if (!food_name.trim()) return;
    const { error } = await supabase
      .from("meal_entries")
      .insert({ entry_date: date, meal_type, food_name, calories: calories ?? null });
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

  async function addHotelRoutine(replaceUnfinished: boolean) {
    setHotelBusy(true);
    setError(null);
    if (replaceUnfinished) {
      const ids = workouts
        .filter((w) => !w.is_done && !w.exercise_name.startsWith(HOTEL_PREFIX))
        .map((w) => w.id);
      if (ids.length) {
        const { error } = await supabase
          .from("workout_entries")
          .delete()
          .in("id", ids);
        if (error) {
          setError(error.message);
          setHotelBusy(false);
          return;
        }
      }
    }
    const { error } = await supabase.from("workout_entries").insert(
      HOTEL_ROUTINE.map((r) => ({
        entry_date: date,
        exercise_name: HOTEL_PREFIX + r.name,
        notes: r.notes,
      }))
    );
    if (error) setError(error.message);
    setHotelOpen(false);
    setHotelBusy(false);
    load();
  }

  /** สลับเมนูของมื้อที่ยังไม่ติ๊ก เก็บค่าเดิมไว้ให้ย้อนกลับได้ในหน้านี้ */
  async function swapMeals(
    changes: { id: string; food_name: string; calories: number }[]
  ) {
    const before = changes
      .map((c) => meals.find((m) => m.id === c.id))
      .filter((m): m is MealEntry => !!m)
      .map((m) => ({ id: m.id, food_name: m.food_name, calories: m.calories ?? null }));
    setMeals((prev) =>
      prev.map((m) => {
        const c = changes.find((x) => x.id === m.id);
        return c ? { ...m, food_name: c.food_name, calories: c.calories } : m;
      })
    );
    setUndo((u) => [...u, before]);
    for (const c of changes) {
      const { error } = await supabase
        .from("meal_entries")
        .update({ food_name: c.food_name, calories: c.calories })
        .eq("id", c.id);
      if (error) {
        setError(error.message);
        load();
        return;
      }
    }
  }

  async function undoSwap() {
    const last = undo[undo.length - 1];
    if (!last) return;
    setUndo((u) => u.slice(0, -1));
    setMeals((prev) =>
      prev.map((m) => {
        const o = last.find((x) => x.id === m.id);
        return o ? { ...m, food_name: o.food_name, calories: o.calories } : m;
      })
    );
    for (const o of last) {
      const { error } = await supabase
        .from("meal_entries")
        .update({ food_name: o.food_name, calories: o.calories })
        .eq("id", o.id);
      if (error) {
        setError(error.message);
        load();
        return;
      }
    }
  }

  function swapWholeDay() {
    if (!region) return;
    const used = new Set<string>();
    const changes: { id: string; food_name: string; calories: number }[] = [];
    meals
      .filter((m) => !m.is_done)
      .forEach((m, i) => {
        const options = suggestMenus(region, m.meal_type, m.calories ?? null, m.food_name, 6, 0);
        const pick = options.find((o) => !used.has(o.name)) ?? options[i % Math.max(options.length, 1)];
        if (pick) {
          used.add(pick.name);
          changes.push({ id: m.id, food_name: pick.name, calories: pick.kcal });
        }
      });
    if (changes.length) swapMeals(changes);
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

  const hotelAdded = workouts.some((w) =>
    w.exercise_name.startsWith(HOTEL_PREFIX)
  );
  const unfinishedOriginal = workouts.filter(
    (w) => !w.is_done && !w.exercise_name.startsWith(HOTEL_PREFIX)
  ).length;
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
            {activity && activity.current > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <FlameIcon size={18} />
                สตรีค {activity.current} วัน
              </span>
            )}
            {kcalPlanned > 0 && (
              <span className="inline-flex items-center gap-1">
                <FlameIcon size={18} />
                {kcalDone}/{kcalPlanned} kcal
              </span>
            )}
          </p>
        </div>
      </div>

      <CalorieSummary
        target={kcalTarget}
        planned={kcalPlanned}
        eaten={kcalDone}
        missing={meals.filter((m) => !m.calories).length}
      />

      {error && (
        <div className="card bg-candy px-4 py-2 text-sm">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <LocationPrompt coords={coords} onChange={setCoords} />

      {region && (
        <div className="card flex flex-wrap items-center gap-2 bg-[#E6F6FF] px-4 py-3 text-sm">
          <label className="flex flex-wrap items-center gap-2">
            <span className="font-display">เมนูแนะนำตามพื้นที่:</span>
            <select
              className="input w-auto"
              value={region}
              onChange={(e) => setRegionOverride(e.target.value as Region)}
              aria-label="เลือกพื้นที่สำหรับเมนูแนะนำ"
            >
              {REGION_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <button onClick={swapWholeDay} className="btn btn-mint btn-sm">
            สลับทั้งวันเป็นเมนูแถวนี้
          </button>
          {undo.length > 0 && (
            <button onClick={undoSwap} className="btn btn-ghost btn-sm">
              ย้อนกลับการสลับล่าสุด
            </button>
          )}
          <p className="w-full text-xs opacity-80">
            ตรวจพื้นที่จากตำแหน่งแบบประมาณ เปลี่ยนเองได้ ตัวเลขแคลอรี่เป็นค่าประมาณทั่วไป
            สลับเฉพาะมื้อที่ยังไม่ติ๊ก และย้อนกลับได้เฉพาะตอนอยู่ในหน้านี้
            ถ้าอยากกลับไปเป็นเมนูของโค้ชหลังรีเฟรช ให้ใส่โปรแกรมใหม่ที่หน้าโปรแกรม
          </p>
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
            onAdd={(name, kcal) => addMeal(mt, name, kcal)}
            coords={coords}
            region={region}
            onSwap={(id, name, kcal) => swapMeals([{ id, food_name: name, calories: kcal }])}
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
          <RestTimer start={timerStart} />
          <div className="rounded-2xl border-[3px] border-dashed border-ink bg-[#E6F6FF] p-3">
            <div className="flex items-center gap-2">
              <BedIcon size={30} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm">อยู่โรงแรมหรือไม่มีที่ออกกำลังกาย?</p>
                <p className="text-xs opacity-80">
                  ชุดท่าในห้องพัก ~15 นาที ไม่ใช้อุปกรณ์ ไม่เสียงดัง
                </p>
              </div>
              {hotelAdded ? (
                <span className="text-sm font-semibold">เพิ่มแล้ว</span>
              ) : (
                <button
                  onClick={() => setHotelOpen((o) => !o)}
                  className="btn btn-sm shrink-0"
                  aria-expanded={hotelOpen}
                >
                  โหมดห้องพัก
                </button>
              )}
            </div>
            {hotelOpen && !hotelAdded && (
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  ท่าที่จะเพิ่ม: สควอต วิดพื้นพิงเตียง ลันจ์ สะพานก้น แพลงก์ ยืดเหยียด
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addHotelRoutine(false)}
                    disabled={hotelBusy}
                    className="btn btn-mint btn-sm"
                  >
                    เพิ่มชุดห้องพัก
                  </button>
                  {unfinishedOriginal > 0 && (
                    <button
                      onClick={() => addHotelRoutine(true)}
                      disabled={hotelBusy}
                      className="btn btn-pink btn-sm"
                    >
                      แทนที่ท่าเดิมที่ยังไม่ติ๊ก ({unfinishedOriginal})
                    </button>
                  )}
                  <button
                    onClick={() => setHotelOpen(false)}
                    disabled={hotelBusy}
                    className="btn btn-ghost btn-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
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
                    {restSeconds(w.notes) && !w.is_done && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTimerStart({ seconds: restSeconds(w.notes)!, id: Date.now() });
                        }}
                        className="btn btn-ghost btn-sm mt-1"
                      >
                        จับเวลาพัก {restSeconds(w.notes)} วิ
                      </button>
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
  coords,
  region,
  onSwap,
  onToggle,
  onDelete,
}: {
  mealType: MealType;
  entries: MealEntry[];
  coords: Coords | null;
  region: Region | null;
  onSwap: (id: string, name: string, kcal: number) => void;
  onAdd: (name: string, kcal?: number | null) => void;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = MEAL_ICONS[mealType];
  return (
    <div className="card">
      <h3 className={`flex items-center gap-2 border-b-[3px] border-ink px-3 py-1.5 ${MEAL_TINT[mealType]}`}>
        <Icon size={28} />
        {MEAL_TYPE_LABELS[mealType]}
        {entries.some((e) => e.calories) && (
          <span className="ml-auto text-sm opacity-80">
            รวม {entries.reduce((a, e) => a + (e.calories ?? 0), 0).toLocaleString()} kcal
          </span>
        )}
      </h3>
      <div className="p-3">
        <ul className="mb-3 space-y-2">
          {entries.map((m) => (
            <li key={m.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
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
              </div>
              {region && !m.is_done && (
                <SwapOptions
                  meal={m}
                  mealType={mealType}
                  region={region}
                  onSwap={onSwap}
                />
              )}
              {coords && !m.is_done && (
                <ShopLinks foodName={m.food_name} coords={coords} />
              )}
            </li>
          ))}
          {entries.length === 0 && (
            <li className="text-sm opacity-60">ยังไม่มีรายการ</li>
          )}
        </ul>
        <AddRow placeholder="เพิ่มเมนูอาหาร" onAdd={onAdd} withKcal />
      </div>
    </div>
  );
}

function SwapOptions({
  meal,
  mealType,
  region,
  onSwap,
}: {
  meal: MealEntry;
  mealType: MealType;
  region: Region;
  onSwap: (id: string, name: string, kcal: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const options = suggestMenus(region, mealType, meal.calories ?? null, meal.food_name, 4, page);
  return (
    <div className="pl-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm font-semibold underline decoration-wavy underline-offset-4"
      >
        {open ? "ซ่อนเมนูแนะนำ" : "เมนูแนะนำแถวนี้"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <ul className="space-y-2">
            {options.map((o) => (
              <li key={o.name}>
                <button
                  type="button"
                  onClick={() => {
                    onSwap(meal.id, o.name, o.kcal);
                    setOpen(false);
                  }}
                  className="btn btn-ghost w-full !flex-col !items-start !gap-0 !rounded-2xl !whitespace-normal text-left text-sm sm:!flex-row sm:!items-center sm:!justify-between sm:!gap-3"
                >
                  <span>{o.name}</span>
                  <span className="shrink-0 text-xs opacity-70">
                    ~{o.kcal} kcal · โปรตีน ~{o.protein} ก.
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setPage((p) => p + 1)} className="btn btn-sm">
            ดูตัวเลือกอื่น
          </button>
        </div>
      )}
    </div>
  );
}

function CalorieSummary({
  target,
  planned,
  eaten,
  missing,
}: {
  target: number | null | undefined;
  planned: number;
  eaten: number;
  missing: number;
}) {
  if (planned === 0 && !target && missing === 0) return null;
  const scale = Math.max(target ?? 0, planned, eaten, 1);
  const eatenPct = Math.min(100, (eaten / scale) * 100);
  const plannedPct = Math.min(100, (planned / scale) * 100);
  const targetPct = target ? Math.min(100, (target / scale) * 100) : null;
  const left = target ? target - eaten : null;
  const planDiff = target ? planned - target : null;
  return (
    <section className="card space-y-3 p-4" aria-label="สรุปแคลอรี่วันนี้">
      <h2 className="flex items-center gap-2 text-lg">
        <FlameIcon size={28} /> สรุปแคลอรี่วันนี้
      </h2>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-xl border-[3px] border-ink bg-[#E6F6FF] p-2">
          <dt className="text-xs">เป้าต่อวัน</dt>
          <dd className="font-display text-lg">
            {target ? `${target.toLocaleString()}` : "—"}
            <span className="text-xs"> kcal</span>
          </dd>
        </div>
        <div className="rounded-xl border-[3px] border-ink bg-[#FFF3C4] p-2">
          <dt className="text-xs">แผนวันนี้รวม</dt>
          <dd className="font-display text-lg">
            {planned.toLocaleString()}
            <span className="text-xs"> kcal</span>
          </dd>
        </div>
        <div className="rounded-xl border-[3px] border-ink bg-mint-soft p-2">
          <dt className="text-xs">กินแล้ว (ที่ติ๊ก)</dt>
          <dd className="font-display text-lg">
            {eaten.toLocaleString()}
            <span className="text-xs"> kcal</span>
          </dd>
        </div>
        <div
          className={`rounded-xl border-[3px] border-ink p-2 ${
            left !== null && left < 0 ? "bg-candy" : "bg-white"
          }`}
        >
          <dt className="text-xs">{left !== null && left < 0 ? "เกินเป้า" : "เหลือกินได้"}</dt>
          <dd className="font-display text-lg">
            {left === null ? "—" : Math.abs(left).toLocaleString()}
            <span className="text-xs"> kcal</span>
          </dd>
        </div>
      </dl>

      <div
        className="relative h-6 rounded-full border-[3px] border-ink bg-white"
        role="img"
        aria-label={`กินแล้ว ${eaten} จากแผน ${planned}${target ? ` เป้า ${target}` : ""} กิโลแคลอรี่`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-l-full bg-sun/70"
          style={{ width: `${plannedPct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-l-full bg-mint"
          style={{ width: `${eatenPct}%` }}
        />
        {targetPct !== null && (
          <div
            className="absolute -top-1 -bottom-1 w-[3px] bg-ink"
            style={{ left: `calc(${targetPct}% - 1.5px)` }}
            title="เป้า"
          />
        )}
      </div>
      <p className="flex flex-wrap gap-x-4 text-xs">
        <span>
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-ink bg-mint" /> กินแล้ว
        </span>
        <span>
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-ink bg-sun" /> แผนทั้งวัน
        </span>
        {targetPct !== null && <span>| เส้นดำ = เป้า</span>}
      </p>

      {planDiff !== null && (
        <p className="text-sm">
          {Math.abs(planDiff) <= 100
            ? "แผนของวันนี้ใกล้เคียงเป้าแล้ว"
            : planDiff > 0
            ? `แผนของวันนี้สูงกว่าเป้า ~${planDiff.toLocaleString()} kcal ถ้ากินครบทุกอย่าง`
            : `แผนของวันนี้ต่ำกว่าเป้า ~${Math.abs(planDiff).toLocaleString()} kcal เพิ่มของว่างได้ถ้ายังหิว`}
        </p>
      )}
      {!target && target !== undefined && (
        <p className="text-sm">
          ยังไม่ได้ตั้งเป้าแคลอรี่ ไปตั้งที่หน้าโปรไฟล์เพื่อเทียบกับแผน
        </p>
      )}
      {missing > 0 && (
        <p className="text-sm">
          มี {missing} รายการที่ไม่ได้ใส่แคลอรี่ จึงไม่ถูกนับรวม (ใส่ตัวเลข kcal ตอนเพิ่มเมนูได้)
        </p>
      )}
      <p className="text-xs opacity-70">
        &quot;กินแล้ว&quot; นับจากมื้อที่คุณติ๊ก ตัวเลขแคลอรี่ของเมนูเป็นค่าประมาณ
      </p>
    </section>
  );
}

function ShopLinks({ foodName, coords }: { foodName: string; coords: Coords }) {
  const [open, setOpen] = useState(false);
  const terms = searchTerms(foodName);
  if (terms.length === 0) return null;
  return (
    <div className="pl-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm font-semibold underline decoration-wavy underline-offset-4"
      >
        {open ? "ซ่อน" : "หาที่ซื้อใกล้ฉัน"}
      </button>
      {open && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {terms.map((t) => (
            <li key={t}>
              <a
                href={mapsSearchUrl(t, coords)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                {t}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddRow({
  placeholder,
  onAdd,
  withKcal,
}: {
  placeholder: string;
  onAdd: (value: string, kcal?: number | null) => void;
  withKcal?: boolean;
}) {
  const [value, setValue] = useState("");
  const [kcal, setKcal] = useState("");

  function submit() {
    onAdd(value, kcal ? Number(kcal) : null);
    setValue("");
    setKcal("");
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
      {withKcal && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={5000}
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="kcal"
          aria-label="แคลอรี่ (ไม่บังคับ)"
          className="input !w-24 shrink-0"
        />
      )}
      <button onClick={submit} className="btn btn-mint shrink-0">
        <PlusIcon size={16} />
        เพิ่ม
      </button>
    </div>
  );
}
