"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { localDateStr } from "@/lib/streak";
import { analyzeTrend, MIN_POINTS, MIN_SPAN_DAYS } from "@/lib/trend";
import { Profile } from "@/lib/types";
import { ScaleIcon } from "@/components/icons";

/** แนะนำปรับเป้าแคลอรี่จากแนวโน้มน้ำหนัก — ผู้ใช้กดยืนยันเองเสมอ */
export default function TrendCard({
  logs,
  profile,
  blocked,
  onApplied,
}: {
  logs: { log_date: string; weight_kg: number }[];
  profile: Profile | null;
  /** true = มีคำแนะนำปรับตามน้ำหนักล่าสุดแสดงอยู่แล้ว ให้จัดการอันนั้นก่อน */
  blocked: boolean;
  onApplied: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const today = localDateStr();
  const updatedDate = profile?.updated_at ? format(parseISO(profile.updated_at), "yyyy-MM-dd") : null;
  const r = useMemo(
    () =>
      analyzeTrend({
        logs,
        today,
        targetKcal: profile?.daily_calorie_target ?? null,
        gender: profile?.gender ?? null,
        profileUpdatedAt: updatedDate,
      }),
    [logs, today, profile?.daily_calorie_target, profile?.gender, updatedDate]
  );

  async function apply() {
    if (!profile || r.suggestedTarget == null) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from("profiles")
      .update({ daily_calorie_target: r.suggestedTarget, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(`ปรับเป้าเป็น ${r.suggestedTarget.toLocaleString()} kcal/วันแล้ว รอดูผล 10-14 วันก่อนปรับอีก`);
    onApplied();
  }

  const since = format(parseISO(r.windowStart), "d MMM", { locale: th });
  const rate = r.slopePerWeek;

  return (
    <section className="card space-y-3 p-4" aria-label="แนวโน้มน้ำหนัก">
      <h2 className="flex items-center gap-2 text-lg">
        <ScaleIcon size={30} /> แนวโน้มน้ำหนัก
      </h2>

      {rate !== null ? (
        <p className="text-sm">
          ช่วงตั้งแต่ {since} ({r.points} ครั้ง ครอบคลุม {r.spanDays} วัน) น้ำหนักเปลี่ยนประมาณ{" "}
          <b>
            {rate > 0 ? "+" : ""}
            {rate.toFixed(2)} กก./สัปดาห์
          </b>{" "}
          เป้าที่ตั้งไว้คือลดช้าๆ ~{r.desiredLossPerWeek.toFixed(2)} กก./สัปดาห์ (0.5% ของน้ำหนักตัว)
        </p>
      ) : (
        <p className="text-sm">
          นับจาก {since} มีบันทึกน้ำหนัก {r.points} ครั้ง (ต้องมีอย่างน้อย {MIN_POINTS} ครั้ง ครอบคลุม {MIN_SPAN_DAYS} วันขึ้นไป)
        </p>
      )}

      <p className="rounded-2xl border-[3px] border-ink bg-[#E6F6FF] p-3 text-sm">{r.message}</p>

      {r.status === "adjust" && r.suggestedTarget != null && !done && (
        <div className="space-y-2 rounded-2xl border-[3px] border-ink bg-[#FFF3C4] p-3 text-sm">
          {blocked ? (
            <p>มีคำแนะนำปรับตามน้ำหนักล่าสุดอยู่ด้านบนแล้ว จัดการอันนั้นก่อน แล้วค่อยดูแนวโน้มนี้ใหม่</p>
          ) : (
            <>
              <p className="font-semibold">
                แนะนำปรับเป้าจาก {profile?.daily_calorie_target?.toLocaleString()} เป็น{" "}
                {r.suggestedTarget.toLocaleString()} kcal/วัน ({r.delta! > 0 ? "+" : ""}
                {r.delta} kcal)
              </p>
              <p>
                ปรับทีละน้อยไม่เกิน 200 kcal และไม่ต่ำกว่าค่าต่ำสุดที่ปลอดภัย แผนในปฏิทินไม่เปลี่ยนเอง ถ้าอยากให้ตรงเป้าใหม่ ให้ใส่โปรแกรมใหม่ที่หน้าโปรแกรม
                ตัวเลขนี้เป็นค่าประมาณทั่วไป ไม่ใช่คำแนะนำทางการแพทย์
              </p>
              <button onClick={apply} disabled={busy} className="btn btn-pink btn-sm">
                {busy ? "กำลังปรับ..." : "ปรับเป้าตามนี้"}
              </button>
            </>
          )}
        </div>
      )}
      {done && <p className="text-sm font-semibold">{done}</p>}
      {err && <p className="text-sm text-bubble">{err}</p>}
    </section>
  );
}
