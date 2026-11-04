"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { localDateStr } from "@/lib/streak";
import { MealRow, WeekStats, WeightRow, WorkoutRow, computeWeek, localTip } from "@/lib/weekly";
import { TrophyIcon } from "@/components/icons";

function cacheKey(to: string) {
  return `tmfit.coachtip.${to}`;
}

function readCached(to: string): string | null {
  try {
    const raw = localStorage.getItem(cacheKey(to));
    if (!raw) return null;
    const v = JSON.parse(raw) as { tip?: string };
    return typeof v.tip === "string" ? v.tip : null;
  } catch {
    return null;
  }
}

/** สรุป 7 วันล่าสุด + เคล็ดลับ (จากกฎในแอปทันที และจาก AI เมื่อกดขอ) */
export default function WeeklySummary({
  target,
  weights,
}: {
  target: number | null;
  weights: WeightRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<{ meals: MealRow[]; workouts: WorkoutRow[] } | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const today = localDateStr();

  useEffect(() => {
    (async () => {
      const from = format(addDays(parseISO(today), -13), "yyyy-MM-dd");
      const [m, w] = await Promise.all([
        supabase
          .from("meal_entries")
          .select("entry_date,calories,is_done")
          .gte("entry_date", from)
          .lte("entry_date", today)
          .range(0, 9999),
        supabase
          .from("workout_entries")
          .select("entry_date,is_done")
          .gte("entry_date", from)
          .lte("entry_date", today)
          .range(0, 9999),
      ]);
      setRows({
        meals: (m.data as MealRow[] | null) ?? [],
        workouts: (w.data as WorkoutRow[] | null) ?? [],
      });
    })();
  }, [supabase, today]);

  useEffect(() => {
    setTip(readCached(today));
  }, [today]);

  const stats: WeekStats | null = useMemo(
    () => (rows ? computeWeek(rows.meals, rows.workouts, weights, today, target) : null),
    [rows, weights, today, target]
  );

  async function askCoach() {
    if (!stats) return;
    setAiBusy(true);
    setAiMsg(null);
    // ส่งเฉพาะตัวเลขสรุป ไม่ส่งชื่ออาหารหรือข้อมูลส่วนตัว
    const payload = {
      tickPct: stats.tickPct,
      prevTickPct: stats.prevTickPct,
      completeDays: stats.completeDays,
      workoutsTotal: stats.workoutsTotal,
      workoutsDone: stats.workoutsDone,
      eatenDays: stats.eatenDays,
      avgEaten: stats.avgEaten,
      target: stats.target,
      daysNearTarget: stats.daysNearTarget,
      weightChange: stats.weightChange,
    };
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 501) setAiMsg("ยังไม่ได้เปิดใช้ AI ในเซิร์ฟเวอร์ ใช้เคล็ดลับจากระบบด้านบนไปก่อน");
      else if (res.status === 429) setAiMsg("ขอเคล็ดลับถี่เกินไป รอสักครู่แล้วลองใหม่");
      else if (res.status === 504) setAiMsg("AI ตอบช้าเกินไป ลองใหม่อีกครั้ง");
      else if (!res.ok) setAiMsg("ขอเคล็ดลับจาก AI ไม่สำเร็จ ลองใหม่อีกครั้ง");
      else {
        const data = (await res.json()) as { tip: string };
        setTip(data.tip);
        try {
          localStorage.setItem(cacheKey(today), JSON.stringify({ tip: data.tip }));
        } catch {
          // ไม่เป็นไร แค่ไม่จำข้ามการรีเฟรช
        }
      }
    } catch (e) {
      const slow = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      setAiMsg(slow ? "AI ตอบช้าเกินไป ลองใหม่อีกครั้ง" : "เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setAiBusy(false);
    }
  }

  if (!stats) {
    return (
      <section className="card space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg">
          <TrophyIcon size={30} /> สรุปสัปดาห์
        </h2>
        <p className="text-sm opacity-70">กำลังคำนวณ...</p>
      </section>
    );
  }

  const range = `${format(parseISO(stats.from), "d MMM", { locale: th })} – ${format(parseISO(stats.to), "d MMM", { locale: th })}`;
  const diff = stats.prevTickPct !== null ? stats.tickPct - stats.prevTickPct : null;
  const tiles: { label: string; value: string; sub?: string }[] = [
    {
      label: "ติ๊กแล้ว",
      value: stats.itemsTotal ? `${stats.tickPct}%` : "-",
      sub: stats.itemsTotal
        ? `${stats.itemsDone}/${stats.itemsTotal} รายการ${diff !== null ? ` (${diff >= 0 ? "+" : ""}${diff}% จากสัปดาห์ก่อน)` : ""}`
        : "ยังไม่มีแผน",
    },
    { label: "ครบทั้งวัน", value: `${stats.completeDays} วัน`, sub: "จาก 7 วัน" },
    {
      label: "ออกกำลังกาย",
      value: stats.workoutsTotal ? `${stats.workoutsDone}/${stats.workoutsTotal}` : "-",
      sub: stats.workoutsTotal ? "ท่าที่ทำแล้ว" : "ยังไม่มีแผน",
    },
    {
      label: "กินเฉลี่ย",
      value: stats.avgEaten !== null ? `${stats.avgEaten.toLocaleString()}` : "-",
      sub:
        stats.avgEaten !== null
          ? `kcal/วัน${stats.target ? ` · ใกล้เป้า ${stats.daysNearTarget}/${stats.eatenDays} วัน` : ""}`
          : "ยังไม่ได้ติ๊กกิน",
    },
  ];
  if (stats.weightChange !== null) {
    tiles.push({
      label: "น้ำหนัก",
      value: `${stats.weightChange > 0 ? "+" : ""}${stats.weightChange.toFixed(1)} กก.`,
      sub: "เทียบก่อนสัปดาห์นี้",
    });
  }

  return (
    <section className="card space-y-3 p-4" aria-label="สรุปสัปดาห์">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg">
          <TrophyIcon size={30} /> สรุปสัปดาห์
        </h2>
        <span className="text-sm opacity-70">{range}</span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label} className="rounded-2xl border-[3px] border-ink bg-white p-3">
            <p className="text-xs font-semibold opacity-70">{t.label}</p>
            <p className="font-display text-xl leading-tight">{t.value}</p>
            {t.sub && <p className="text-xs opacity-70">{t.sub}</p>}
          </li>
        ))}
      </ul>

      <div className="space-y-2 rounded-2xl border-[3px] border-ink bg-[#E6F6FF] p-3 text-sm">
        <p className="font-semibold">เคล็ดลับจากโค้ช</p>
        <p>{tip ?? localTip(stats)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={askCoach} disabled={aiBusy || stats.itemsTotal === 0} className="btn btn-ghost btn-sm">
            {aiBusy ? "โค้ชกำลังคิด..." : tip ? "ขอเคล็ดลับใหม่จาก AI" : "ให้โค้ช AI เขียนให้"}
          </button>
          <span className="text-xs opacity-70">ส่งให้ AI เฉพาะตัวเลขสรุป ไม่ส่งชื่ออาหาร</span>
        </div>
        {aiMsg && (
          <p className="text-xs text-bubble" role="status">
            {aiMsg}
          </p>
        )}
      </div>
    </section>
  );
}
