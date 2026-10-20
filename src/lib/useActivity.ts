"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  ActivityStats,
  DayStat,
  computeStats,
  localDateStr,
} from "@/lib/streak";

/** โหลดกิจกรรม 400 วันล่าสุดมาคำนวณสตรีคและป้ายรางวัล */
export function useActivity(refreshKey: unknown = 0) {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<ActivityStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = localDateStr();
      const from = localDateStr(addDays(new Date(), -400));
      const [m, w] = await Promise.all([
        supabase
          .from("meal_entries")
          .select("entry_date,is_done")
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
      if (cancelled || m.error || w.error) return;
      const days = new Map<string, DayStat>();
      const add = (r: { entry_date: string; is_done: boolean }) => {
        const s = days.get(r.entry_date) ?? { total: 0, done: 0 };
        s.total++;
        if (r.is_done) s.done++;
        days.set(r.entry_date, s);
      };
      (m.data ?? []).forEach(add);
      (w.data ?? []).forEach(add);
      setStats(
        computeStats(
          days,
          today,
          (w.data ?? []).filter((r) => r.is_done).length,
          (m.data ?? []).filter((r) => r.is_done).length
        )
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  return stats;
}
