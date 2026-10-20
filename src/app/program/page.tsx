"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Buddy, DumbbellIcon, CalendarIcon, RocketIcon } from "@/components/icons";
import {
  PROGRAM_NAME,
  PROGRAM_WEEKS,
  WORKOUT_DAYS,
  buildProgramEntries,
} from "@/lib/program";

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProgramPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startDate, setStartDate] = useState(tomorrowStr());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      setProfile((data as Profile) ?? null);
      setLoading(false);
    })();
  }, [supabase]);

  type Built = ReturnType<typeof buildProgramEntries>;
  const [conflict, setConflict] = useState<{
    built: Built;
    from: string;
    to: string;
    count: number;
    doneCount: number;
  } | null>(null);
  const [dupCount, setDupCount] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState<string | null>(null);

  // หาแถวที่ซ้ำกัน (วัน+มื้อ+ชื่อเดียวกัน) เก็บไว้ 1 แถว โดยเลือกแถวที่ติ๊กแล้วก่อน
  async function findDuplicateIds() {
    const [m, w] = await Promise.all([
      supabase
        .from("meal_entries")
        .select("id,entry_date,meal_type,food_name,is_done,created_at")
        .order("created_at", { ascending: true })
        .range(0, 4999),
      supabase
        .from("workout_entries")
        .select("id,entry_date,exercise_name,is_done,created_at")
        .order("created_at", { ascending: true })
        .range(0, 4999),
    ]);
    function pick<T extends { id: string; is_done: boolean }>(
      rows: T[],
      keyOf: (r: T) => string
    ) {
      const groups = new Map<string, T[]>();
      rows.forEach((r) => {
        const k = keyOf(r);
        groups.set(k, [...(groups.get(k) ?? []), r]);
      });
      const extra: string[] = [];
      groups.forEach((g) => {
        if (g.length < 2) return;
        const keep = g.find((r) => r.is_done) ?? g[0];
        g.forEach((r) => r !== keep && extra.push(r.id));
      });
      return extra;
    }
    return {
      mealIds: pick(
        (m.data ?? []) as { id: string; is_done: boolean; entry_date: string; meal_type: string; food_name: string }[],
        (r) => `${r.entry_date}|${r.meal_type}|${r.food_name}`
      ),
      workoutIds: pick(
        (w.data ?? []) as { id: string; is_done: boolean; entry_date: string; exercise_name: string }[],
        (r) => `${r.entry_date}|${r.exercise_name}`
      ),
    };
  }

  async function refreshDupCount() {
    const { mealIds, workoutIds } = await findDuplicateIds();
    setDupCount(mealIds.length + workoutIds.length);
  }

  useEffect(() => {
    refreshDupCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function removeIds(table: "meal_entries" | "workout_entries", ids: string[]) {
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in("id", ids.slice(i, i + 100));
      if (error) throw new Error(error.message);
    }
  }

  async function cleanDuplicates() {
    setCleaning(true);
    setCleanMsg(null);
    setError(null);
    try {
      const { mealIds, workoutIds } = await findDuplicateIds();
      await removeIds("meal_entries", mealIds);
      await removeIds("workout_entries", workoutIds);
      setCleanMsg(`ลบรายการซ้ำแล้ว ${mealIds.length + workoutIds.length} รายการ`);
      await refreshDupCount();
    } catch (e) {
      setError((e as Error).message);
    }
    setCleaning(false);
  }

  // ขั้นที่ 1: เตรียมแผน แล้วเช็กว่าช่วงวันนั้นมีของเดิมอยู่ไหม
  async function applyProgram() {
    if (applying) return;
    setApplying(true);
    setError(null);
    setDone(false);
    setConflict(null);

    const start = new Date(startDate + "T00:00:00");
    const built = buildProgramEntries(start, profile?.daily_calorie_target);
    const dates = [...built.workouts, ...built.meals].map((e) => e.entry_date).sort();
    const from = dates[0];
    const to = dates[dates.length - 1];

    const [m, w] = await Promise.all([
      supabase.from("meal_entries").select("id,is_done").gte("entry_date", from).lte("entry_date", to),
      supabase.from("workout_entries").select("id,is_done").gte("entry_date", from).lte("entry_date", to),
    ]);
    if (m.error || w.error) {
      setError((m.error ?? w.error)!.message);
      setApplying(false);
      return;
    }
    const existing = [...(m.data ?? []), ...(w.data ?? [])];
    if (existing.length > 0) {
      setConflict({
        built,
        from,
        to,
        count: existing.length,
        doneCount: existing.filter((r) => r.is_done).length,
      });
      setApplying(false);
      return;
    }
    await insertProgram(built);
  }

  // ขั้นที่ 2: ใส่แผนลงปฏิทิน (replace = ลบของเดิมในช่วงนั้นก่อน)
  async function insertProgram(built: Built, replaceRange?: { from: string; to: string }) {
    setApplying(true);
    setError(null);
    try {
      if (replaceRange) {
        const [a, b] = await Promise.all([
          supabase.from("meal_entries").delete().gte("entry_date", replaceRange.from).lte("entry_date", replaceRange.to),
          supabase.from("workout_entries").delete().gte("entry_date", replaceRange.from).lte("entry_date", replaceRange.to),
        ]);
        if (a.error || b.error) throw new Error((a.error ?? b.error)!.message);
      }
      const [workoutRes, mealRes] = await Promise.all([
        supabase.from("workout_entries").insert(
          built.workouts.map((x) => ({
            entry_date: x.entry_date,
            exercise_name: x.exercise_name,
            notes: x.notes,
          }))
        ),
        supabase.from("meal_entries").insert(
          built.meals.map((x) => ({
            entry_date: x.entry_date,
            meal_type: x.meal_type,
            food_name: x.food_name,
            calories: x.calories,
          }))
        ),
      ]);
      if (workoutRes.error) throw new Error(workoutRes.error.message);
      if (mealRes.error) throw new Error(mealRes.error.message);
      setConflict(null);
      setDone(true);
      refreshDupCount();
    } catch (e) {
      setError((e as Error).message);
    }
    setApplying(false);
  }

  if (loading) return <p>กำลังโหลด...</p>;

  const calorieTarget = profile?.daily_calorie_target;
  const proteinTarget = profile?.daily_protein_target_g;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex items-center gap-4 p-4">
        <Buddy size={80} />
        <div>
        <h1 className="text-xl">{PROGRAM_NAME}</h1>
        <p className="mt-1 text-sm">
          โปรแกรมสำหรับมือใหม่ ออกกำลังกาย 3 วัน/สัปดาห์ ด้วยท่าบอดี้เวทล้วน
          ทำได้ทั้งที่บ้านและห้องพักโรงแรม ไม่ต้องใช้อุปกรณ์ พร้อมเมนูอาหาร
          ครบ 4 มื้อทุกวัน เน้นโปรตีนสูงเพื่อลดไขมันและรักษากล้ามเนื้อไปพร้อมกัน
        </p>
        </div>
      </div>

      {!calorieTarget && (
        <div className="rounded-2xl border-[3px] border-ink bg-[#FFF3C4] px-4 py-3 text-sm">
          ยังไม่ได้ตั้งเป้าแคลอรี่ในหน้า{" "}
          <Link href="/profile" className="font-medium underline">
            โปรไฟล์
          </Link>
          — ถ้าข้ามไปก่อน ระบบจะใช้ค่าอ้างอิง 1800 kcal/วัน (ไม่ตรงกับตัวคุณ)
          แนะนำให้กรอกโปรไฟล์แล้วกด &quot;คำนวณให้อัตโนมัติ&quot; ก่อน
        </div>
      )}
      {calorieTarget && (
        <div className="rounded-2xl border-[3px] border-ink bg-mint-soft px-4 py-3 text-sm">
          แคลอรี่จะถูกปรับให้เหมาะกับคุณ: {calorieTarget} kcal/วัน
          {proteinTarget ? ` · โปรตีน ~${proteinTarget} ก./วัน` : ""}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg">
          <CalendarIcon size={30} /> โครงสร้างโปรแกรม ({PROGRAM_WEEKS} สัปดาห์)
        </h2>
        <ul className="space-y-1 text-sm">
          <li>• ออกกำลังกายวันที่ 1 / 3 / 5 ของทุกสัปดาห์ (วันอื่นพัก)</li>
          <li>• ความหนักเพิ่มขึ้นทีละสัปดาห์ (จำนวนเซ็ต/ครั้งมากขึ้น)</li>
          <li>• อาหาร 4 มื้อทุกวัน หมุนเวียนเมนู 7 วัน</li>
        </ul>
        <div className="grid gap-3 sm:grid-cols-3">
          {WORKOUT_DAYS.map((d) => (
            <div
              key={d.title}
              className="card p-3"
            >
              <h3 className="flex items-center gap-1 text-sm">
                <DumbbellIcon size={22} /> {d.title}
              </h3>
              <p className="mb-2 text-xs opacity-70">{d.focus}</p>
              <ul className="space-y-1 text-xs">
                {d.exercises.map((ex) => (
                  <li key={ex.name}>• {ex.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-alt space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg">
          <RocketIcon size={30} /> เริ่มโปรแกรมนี้
        </h2>
        {error && (
          <div className="rounded-xl border-[3px] border-ink bg-candy px-3 py-2 text-sm">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}
        {done && (
          <div className="rounded-xl border-[3px] border-ink bg-mint-soft px-3 py-2 text-sm">
            ใส่แผนลงปฏิทินเรียบร้อย! ไปดูได้ที่{" "}
            <Link href="/calendar" className="font-medium underline">
              ปฏิทิน
            </Link>
          </div>
        )}
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">เริ่มวันที่</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input w-auto"
          />
        </label>
        <p className="text-sm opacity-70">
          ถ้าช่วงวันที่นี้มีแผนอยู่แล้ว ระบบจะถามก่อนว่าจะแทนที่หรือยกเลิก
          จะไม่ใส่ซ้ำเองเงียบ ๆ
        </p>
        {conflict && (
          <div className="space-y-2 rounded-2xl border-[3px] border-ink bg-[#FFF3C4] p-3 text-sm">
            <p className="font-semibold">
              ช่วง {conflict.from} ถึง {conflict.to} มีรายการอยู่แล้ว {conflict.count} รายการ
              {conflict.doneCount > 0 ? ` (ติ๊กไปแล้ว ${conflict.doneCount})` : ""}
            </p>
            <p>
              ถ้าแทนที่ รายการเดิมทั้งหมดในช่วงนี้จะถูกลบ
              {conflict.doneCount > 0 ? " รวมถึงที่ติ๊กไปแล้วด้วย" : ""} แล้วใส่แผนใหม่แทน
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  insertProgram(conflict.built, { from: conflict.from, to: conflict.to })
                }
                disabled={applying}
                className="btn btn-pink btn-sm"
              >
                แทนที่รายการเดิม
              </button>
              <button
                onClick={() => setConflict(null)}
                disabled={applying}
                className="btn btn-ghost btn-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
        <button
          onClick={applyProgram}
          disabled={applying}
          className="btn btn-pink"
        >
          {applying ? "กำลังใส่แผน..." : `เริ่มโปรแกรมนี้ตั้งแต่วันที่เลือก`}
        </button>
      </section>

      {(dupCount > 0 || cleanMsg) && (
        <section className="card space-y-2 p-4">
          <h2 className="text-lg">ล้างรายการซ้ำ</h2>
          {dupCount > 0 && (
            <p className="text-sm">
              พบรายการซ้ำกัน {dupCount} รายการ (วันเดียวกัน มื้อเดียวกัน ชื่อเดียวกัน)
              ระบบจะเก็บไว้อย่างละ 1 รายการ โดยเลือกอันที่ติ๊กแล้วก่อน
            </p>
          )}
          {cleanMsg && <p className="text-sm">{cleanMsg}</p>}
          {dupCount > 0 && (
            <button onClick={cleanDuplicates} disabled={cleaning} className="btn btn-mint btn-sm">
              {cleaning ? "กำลังลบ..." : "ลบรายการซ้ำ"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
