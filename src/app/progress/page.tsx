"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { ActivityLevel, Gender, calculateTargets } from "@/lib/calorie";
import { BADGES, localDateStr } from "@/lib/streak";
import { useActivity } from "@/lib/useActivity";
import {
  Buddy,
  FlameIcon,
  LockIcon,
  ScaleIcon,
  StarIcon,
  TrashIcon,
  TrophyIcon,
} from "@/components/icons";

interface WeightLog {
  id: string;
  log_date: string;
  weight_kg: number;
}

export default function ProgressPage() {
  const supabase = useMemo(() => createClient(), []);
  const stats = useActivity();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(localDateStr());
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([
      supabase
        .from("weight_logs")
        .select("id,log_date,weight_kg")
        .order("log_date", { ascending: true }),
      supabase.from("profiles").select("*").maybeSingle(),
    ]);
    if (w.error) {
      setError(
        w.error.message.includes("weight_logs")
          ? "ยังไม่มีตารางบันทึกน้ำหนักในฐานข้อมูล ต้องรันไฟล์ supabase/migration_v3_weight_logs.sql ใน Supabase SQL Editor ก่อน"
          : w.error.message
      );
    } else {
      setLogs(
        (w.data ?? []).map((r) => ({ ...r, weight_kg: Number(r.weight_kg) }))
      );
    }
    setProfile((p.data as Profile) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveWeight() {
    const kg = Number(weight);
    if (!kg || kg < 20 || kg > 400) {
      setError("กรอกน้ำหนักเป็นตัวเลข 20–400 กก.");
      return;
    }
    setSaving(true);
    setError(null);
    setMsg(null);
    const { error } = await supabase
      .from("weight_logs")
      .upsert({ log_date: date, weight_kg: kg }, { onConflict: "user_id,log_date" });
    if (error) setError(error.message);
    else {
      setWeight("");
      setMsg("บันทึกแล้ว");
      await load();
    }
    setSaving(false);
  }

  async function removeLog(id: string) {
    setLogs((l) => l.filter((x) => x.id !== id));
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);
    if (error) setError(error.message);
  }

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const canRecalc =
    !!profile?.id &&
    !!profile.gender &&
    !!profile.age &&
    !!profile.height_cm &&
    !!profile.activity_level;
  const profileDiff =
    latest && profile?.weight_kg ? latest.weight_kg - profile.weight_kg : 0;
  const suggestion =
    latest && canRecalc && Math.abs(profileDiff) >= 1
      ? calculateTargets({
          gender: profile!.gender as Gender,
          age: profile!.age as number,
          weightKg: latest.weight_kg,
          heightCm: profile!.height_cm as number,
          activityLevel: profile!.activity_level as ActivityLevel,
        })
      : null;

  async function applySuggestion() {
    if (!suggestion || !latest || !profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        weight_kg: latest.weight_kg,
        daily_calorie_target: suggestion.calorieTarget,
        daily_protein_target_g: suggestion.proteinTargetG,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (error) setError(error.message);
    else {
      setMsg("ปรับเป้าแคลอรี่ในโปรไฟล์แล้ว");
      await load();
    }
  }

  if (loading) return <p>กำลังโหลด...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex items-center gap-4 p-4">
        <Buddy size={80} mood={stats && stats.current >= 3 ? "cheer" : "happy"} />
        <div>
          <h1 className="text-xl">ความก้าวหน้า</h1>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <FlameIcon size={20} />
            {stats
              ? stats.current > 0
                ? `ติ๊กครบติดกัน ${stats.current} วัน (สูงสุด ${stats.best} วัน)`
                : "ยังไม่มีสตรีค ติ๊กให้ครบทุกรายการของวันนี้เพื่อเริ่มนับ"
              : "กำลังคำนวณ..."}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-[3px] border-ink bg-candy px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* ---------- น้ำหนัก ---------- */}
      <section className="card card-alt space-y-4 p-4">
        <h2 className="flex items-center gap-2 text-lg">
          <ScaleIcon size={30} /> น้ำหนักตัว
        </h2>

        <div className="flex flex-wrap items-end gap-2">
          <label className="block space-y-1 text-sm">
            <span className="block font-semibold">วันที่</span>
            <input
              type="date"
              className="input w-auto"
              value={date}
              max={localDateStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="block min-w-[8rem] flex-1 space-y-1 text-sm">
            <span className="block font-semibold">น้ำหนัก (กก.)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="input"
              value={weight}
              placeholder={latest ? String(latest.weight_kg) : "เช่น 72.5"}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveWeight()}
            />
          </label>
          <button onClick={saveWeight} disabled={saving || !weight} className="btn btn-mint">
            {saving ? "กำลังบันทึก..." : "บันทึกน้ำหนัก"}
          </button>
        </div>
        {msg && <p className="text-sm">{msg}</p>}

        {logs.length === 0 ? (
          <p className="text-sm opacity-70">
            ยังไม่มีข้อมูล ชั่งน้ำหนักแล้วบันทึกสัปดาห์ละครั้ง กราฟจะขึ้นเมื่อมีตั้งแต่ 2 ครั้ง
          </p>
        ) : (
          <>
            <WeightChart logs={logs} />
            <p className="text-sm">
              ล่าสุด {latest.weight_kg} กก.
              {first !== latest && (
                <>
                  {" "}
                  · เทียบกับครั้งแรก{" "}
                  <b>
                    {latest.weight_kg - first.weight_kg > 0 ? "+" : ""}
                    {(latest.weight_kg - first.weight_kg).toFixed(1)} กก.
                  </b>
                </>
              )}
            </p>
          </>
        )}

        {suggestion && (
          <div className="space-y-2 rounded-2xl border-[3px] border-ink bg-[#FFF3C4] p-3 text-sm">
            <p className="font-semibold">
              น้ำหนักล่าสุด {latest.weight_kg} กก. ต่างจากในโปรไฟล์ ({profile?.weight_kg} กก.){" "}
              {profileDiff > 0 ? "+" : ""}
              {profileDiff.toFixed(1)} กก.
            </p>
            <p>
              ปรับเป้าใหม่เป็น {suggestion.calorieTarget} kcal และโปรตีน {suggestion.proteinTargetG} ก. ต่อวันไหม
              แผนที่ใส่ในปฏิทินไว้แล้วจะไม่เปลี่ยนเอง ถ้าอยากให้แคลอรี่ตรงเป้าใหม่ ให้ใส่โปรแกรมใหม่ที่หน้าโปรแกรม
            </p>
            <button onClick={applySuggestion} className="btn btn-pink btn-sm">
              ปรับเป้าในโปรไฟล์
            </button>
          </div>
        )}
        {!canRecalc && logs.length > 0 && (
          <p className="text-sm opacity-70">
            กรอกโปรไฟล์ให้ครบที่{" "}
            <Link href="/profile" className="font-semibold underline">
              หน้าโปรไฟล์
            </Link>{" "}
            เพื่อให้ระบบปรับเป้าแคลอรี่ตามน้ำหนักใหม่ได้
          </p>
        )}

        {logs.length > 0 && (
          <ul className="space-y-1 text-sm">
            {[...logs]
              .reverse()
              .slice(0, 8)
              .map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 border-b-2 border-dashed border-ink/20 py-1">
                  <span>
                    {format(parseISO(l.log_date), "d MMM yyyy", { locale: th })}
                  </span>
                  <span className="flex items-center gap-1">
                    <b>{l.weight_kg} กก.</b>
                    <button
                      onClick={() => removeLog(l.id)}
                      className="icon-btn"
                      aria-label={`ลบน้ำหนักวันที่ ${l.log_date}`}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* ---------- ป้ายรางวัล ---------- */}
      <section className="card space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg">
          <TrophyIcon size={30} /> ป้ายรางวัล
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {BADGES.map((b) => {
            const got = stats ? b.earned(stats) : false;
            return (
              <li
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-2xl border-[3px] border-ink p-3 text-center ${
                  got ? "bg-sun shadow-pop-sm" : "bg-white opacity-60"
                }`}
              >
                {got ? <StarIcon size={36} /> : <LockIcon size={36} />}
                <span className="font-display text-sm">{b.title}</span>
                <span className="text-xs">{b.hint}</span>
              </li>
            );
          })}
        </ul>
        {stats && (
          <p className="text-sm">
            ออกกำลังกายเสร็จแล้ว {stats.workoutsDone} ท่า · กินตามแผนแล้ว {stats.mealsDone} มื้อ · ครบทั้งวัน {stats.completeDays} วัน
          </p>
        )}
      </section>
    </div>
  );
}

function WeightChart({ logs }: { logs: WeightLog[] }) {
  const W = 420;
  const H = 230;
  const pad = { l: 44, r: 16, t: 16, b: 34 };
  const vals = logs.map((l) => l.weight_kg);
  const lo = Math.min(...vals) - 0.5;
  const hi = Math.max(...vals) + 0.5;
  const t0 = parseISO(logs[0].log_date).getTime();
  const t1 = parseISO(logs[logs.length - 1].log_date).getTime();
  const x = (d: string) =>
    logs.length === 1 || t1 === t0
      ? (W + pad.l - pad.r) / 2
      : pad.l + ((parseISO(d).getTime() - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = logs.map((l, i) => `${i ? "L" : "M"}${x(l.log_date)},${y(l.weight_kg)}`).join(" ");
  const ticks = [lo, (lo + hi) / 2, hi];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-2xl border-[3px] border-ink bg-[#F4FBFF]"
      role="img"
      aria-label={`กราฟน้ำหนัก ล่าสุด ${logs[logs.length - 1].weight_kg} กิโลกรัม`}
    >
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#26234A" strokeOpacity="0.15" strokeDasharray="5 6" strokeWidth="2" />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="14" fill="#26234A">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#26234A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {logs.map((l) => (
        <circle key={l.id} cx={x(l.log_date)} cy={y(l.weight_kg)} r="6.5" fill="#5ED6A8" stroke="#26234A" strokeWidth="3" />
      ))}
      <text x={pad.l} y={H - 10} fontSize="14" fill="#26234A">
        {format(parseISO(logs[0].log_date), "d MMM", { locale: th })}
      </text>
      <text x={W - pad.r} y={H - 10} fontSize="14" textAnchor="end" fill="#26234A">
        {format(parseISO(logs[logs.length - 1].log_date), "d MMM", { locale: th })}
      </text>
    </svg>
  );
}
