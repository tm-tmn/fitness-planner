"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
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

  async function applyProgram() {
    setApplying(true);
    setError(null);
    setDone(false);

    const start = new Date(startDate + "T00:00:00");
    const { workouts, meals } = buildProgramEntries(
      start,
      profile?.daily_calorie_target
    );

    const [workoutRes, mealRes] = await Promise.all([
      supabase.from("workout_entries").insert(
        workouts.map((w) => ({
          entry_date: w.entry_date,
          exercise_name: w.exercise_name,
          notes: w.notes,
        }))
      ),
      supabase.from("meal_entries").insert(
        meals.map((m) => ({
          entry_date: m.entry_date,
          meal_type: m.meal_type,
          food_name: m.food_name,
          calories: m.calories,
        }))
      ),
    ]);

    if (workoutRes.error) setError(workoutRes.error.message);
    else if (mealRes.error) setError(mealRes.error.message);
    else setDone(true);

    setApplying(false);
  }

  if (loading) return <p className="text-gray-500">กำลังโหลด...</p>;

  const calorieTarget = profile?.daily_calorie_target;
  const proteinTarget = profile?.daily_protein_target_g;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">🧑‍🏫 {PROGRAM_NAME}</h1>
        <p className="mt-1 text-sm text-gray-500">
          โปรแกรมสำหรับมือใหม่ ออกกำลังกาย 3 วัน/สัปดาห์ ด้วยท่าบอดี้เวทล้วน
          ทำได้ทั้งที่บ้านและห้องพักโรงแรม ไม่ต้องใช้อุปกรณ์ พร้อมเมนูอาหาร
          ครบ 4 มื้อทุกวัน เน้นโปรตีนสูงเพื่อลดไขมันและรักษากล้ามเนื้อไปพร้อมกัน
        </p>
      </div>

      {!calorieTarget && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ยังไม่ได้ตั้งเป้าแคลอรี่ในหน้า{" "}
          <Link href="/profile" className="font-medium underline">
            โปรไฟล์
          </Link>
          — ถ้าข้ามไปก่อน ระบบจะใช้ค่าอ้างอิง 1800 kcal/วัน (ไม่ตรงกับตัวคุณ)
          แนะนำให้กรอกโปรไฟล์แล้วกด &quot;คำนวณให้อัตโนมัติ&quot; ก่อน
        </div>
      )}
      {calorieTarget && (
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          แคลอรี่จะถูกปรับให้เหมาะกับคุณ: {calorieTarget} kcal/วัน
          {proteinTarget ? ` · โปรตีน ~${proteinTarget} ก./วัน` : ""}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-700">
          🗓️ โครงสร้างโปรแกรม ({PROGRAM_WEEKS} สัปดาห์)
        </h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• ออกกำลังกายวันที่ 1 / 3 / 5 ของทุกสัปดาห์ (วันอื่นพัก)</li>
          <li>• ความหนักเพิ่มขึ้นทีละสัปดาห์ (จำนวนเซ็ต/ครั้งมากขึ้น)</li>
          <li>• อาหาร 4 มื้อทุกวัน หมุนเวียนเมนู 7 วัน</li>
        </ul>
        <div className="grid gap-3 sm:grid-cols-3">
          {WORKOUT_DAYS.map((d) => (
            <div
              key={d.title}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <h3 className="text-sm font-semibold text-gray-800">
                {d.title}
              </h3>
              <p className="mb-2 text-xs text-gray-400">{d.focus}</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {d.exercises.map((ex) => (
                  <li key={ex.name}>• {ex.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-brand-700">
          🚀 เริ่มโปรแกรมนี้
        </h2>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}
        {done && (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            ใส่แผนลงปฏิทินเรียบร้อย! ไปดูได้ที่{" "}
            <Link href="/calendar" className="font-medium underline">
              ปฏิทิน
            </Link>
          </div>
        )}
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-gray-600">เริ่มวันที่</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </label>
        <p className="text-xs text-gray-400">
          ⚠️ ถ้าช่วงวันที่นี้มีแผนเดิมอยู่แล้ว ระบบจะเพิ่มรายการใหม่ซ้อนเข้าไป
          (ไม่ลบของเดิม) แนะนำให้ลบรายการเก่าช่วงนั้นก่อนถ้าไม่ต้องการให้ซ้ำ
        </p>
        <button
          onClick={applyProgram}
          disabled={applying}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {applying ? "กำลังใส่แผน..." : `เริ่มโปรแกรมนี้ตั้งแต่วันที่เลือก`}
        </button>
      </section>
    </div>
  );
}
