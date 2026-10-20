"use client";

import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { CalendarIcon } from "@/components/icons";

type Table = "meal_entries" | "workout_entries";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

/** เลื่อนรายการที่ยังไม่ติ๊กตั้งแต่วันที่เลือกเป็นต้นไป ไปข้างหน้า N วัน */
export default function ShiftPlan({ onChanged }: { onChanged?: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [from, setFrom] = useState(todayStr());
  const [days, setDays] = useState(1);
  const [preview, setPreview] = useState<{
    meals: number;
    workouts: number;
    dates: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function check() {
    setBusy(true);
    setError(null);
    setMsg(null);
    setPreview(null);
    const [m, w] = await Promise.all([
      supabase
        .from("meal_entries")
        .select("entry_date")
        .gte("entry_date", from)
        .eq("is_done", false)
        .range(0, 9999),
      supabase
        .from("workout_entries")
        .select("entry_date")
        .gte("entry_date", from)
        .eq("is_done", false)
        .range(0, 9999),
    ]);
    setBusy(false);
    if (m.error || w.error) {
      setError((m.error ?? w.error)!.message);
      return;
    }
    const dates = [
      ...new Set([...(m.data ?? []), ...(w.data ?? [])].map((r) => r.entry_date)),
    ].sort();
    if (dates.length === 0) {
      setMsg("ไม่มีรายการที่ยังไม่ติ๊กตั้งแต่วันที่เลือกเป็นต้นไป");
      return;
    }
    setPreview({
      meals: (m.data ?? []).length,
      workouts: (w.data ?? []).length,
      dates,
    });
  }

  async function shift() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      // เลื่อนจากวันท้ายสุดก่อน เพื่อไม่ให้รายการที่เพิ่งย้ายถูกเลือกซ้ำ
      const desc = [...preview.dates].reverse();
      for (const table of ["meal_entries", "workout_entries"] as Table[]) {
        for (const d of desc) {
          const target = format(addDays(parseISO(d), days), "yyyy-MM-dd");
          const { error } = await supabase
            .from(table)
            .update({ entry_date: target })
            .eq("entry_date", d)
            .eq("is_done", false);
          if (error) throw new Error(error.message);
        }
      }
      setMsg(
        `เลื่อนแผนไปข้างหน้า ${days} วันแล้ว (${preview.meals + preview.workouts} รายการ)`
      );
      setPreview(null);
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const last = preview ? preview.dates[preview.dates.length - 1] : null;

  return (
    <section className="card card-alt space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-lg">
        <CalendarIcon size={30} /> เลื่อนแผน
      </h2>
      <p className="text-sm">
        พลาดไปสองสามวัน? เลื่อนรายการที่ยังไม่ได้ทำตั้งแต่วันที่เลือกเป็นต้นไปไปข้างหน้า
        แผนจะต่อเนื่องไม่เหลือช่องว่าง รายการที่ติ๊กแล้วจะอยู่ที่เดิม
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block space-y-1 text-sm">
          <span className="block font-semibold">เริ่มเลื่อนจากวันที่</span>
          <input
            type="date"
            className="input w-auto"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreview(null);
            }}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="block font-semibold">เลื่อนไป (วัน)</span>
          <select
            className="input w-auto"
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setPreview(null);
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
              <option key={n} value={n}>
                {n} วัน
              </option>
            ))}
          </select>
        </label>
        <button onClick={check} disabled={busy} className="btn btn-sm">
          ตรวจสอบก่อน
        </button>
      </div>

      {error && (
        <div className="rounded-xl border-[3px] border-ink bg-candy px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="rounded-xl border-[3px] border-ink bg-mint-soft px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {preview && last && (
        <div className="space-y-2 rounded-2xl border-[3px] border-ink bg-[#FFF3C4] p-3 text-sm">
          <p className="font-semibold">
            จะเลื่อน {preview.meals} มื้อ และ {preview.workouts} ท่าออกกำลังกาย ไปข้างหน้า {days} วัน
          </p>
          <p>
            แผนที่ยังไม่ทำจะย้ายจาก{" "}
            {format(parseISO(preview.dates[0]), "d MMM", { locale: th })} –{" "}
            {format(parseISO(last), "d MMM", { locale: th })} ไปเป็น{" "}
            {format(addDays(parseISO(preview.dates[0]), days), "d MMM", { locale: th })} –{" "}
            {format(addDays(parseISO(last), days), "d MMM", { locale: th })}
          </p>
          <div className="flex gap-2">
            <button onClick={shift} disabled={busy} className="btn btn-pink btn-sm">
              {busy ? "กำลังเลื่อน..." : "ยืนยันเลื่อนแผน"}
            </button>
            <button onClick={() => setPreview(null)} disabled={busy} className="btn btn-ghost btn-sm">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
