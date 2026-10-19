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

  if (loading) return <p>กำลังโหลด...</p>;

  const calorieTarget = profile?.daily_calorie_target;
  const proteinTarget = profile?.daily_protein_target_g;

  return (
    <div className="max-w-xl space-y-6">
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
          ⚠️ ถ้าช่วงวันที่นี้มีแผนเดิมอยู่แล้ว ระบบจะเพิ่มรายการใหม่ซ้อนเข้าไป
          (ไม่ลบของเดิม) แนะนำให้ลบรายการเก่าช่วงนั้นก่อนถ้าไม่ต้องการให้ซ้ำ
        </p>
        <button
          onClick={applyProgram}
          disabled={applying}
          className="btn btn-pink"
        >
          {applying ? "กำลังใส่แผน..." : `เริ่มโปรแกรมนี้ตั้งแต่วันที่เลือก`}
        </button>
      </section>
    </div>
  );
}
