"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@/components/icons";

const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const [monthDate, setMonthDate] = useState(new Date());
  const [daysWithData, setDaysWithData] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const from = format(gridStart, "yyyy-MM-dd");
    const to = format(gridEnd, "yyyy-MM-dd");

    const [mealsRes, workoutsRes] = await Promise.all([
      supabase
        .from("meal_entries")
        .select("entry_date")
        .gte("entry_date", from)
        .lte("entry_date", to),
      supabase
        .from("workout_entries")
        .select("entry_date")
        .gte("entry_date", from)
        .lte("entry_date", to),
    ]);

    const set = new Set<string>();
    (mealsRes.data ?? []).forEach((r: { entry_date: string }) =>
      set.add(r.entry_date)
    );
    (workoutsRes.data ?? []).forEach((r: { entry_date: string }) =>
      set.add(r.entry_date)
    );
    setDaysWithData(set);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime()]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-2">
        <button
          onClick={() => setMonthDate((d) => subMonths(d, 1))}
          className="btn btn-ghost btn-sm"
          aria-label="เดือนก่อนหน้า"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="text-lg">
          {format(monthDate, "MMMM yyyy", { locale: th })}
        </h1>
        <button
          onClick={() => setMonthDate((d) => addMonths(d, 1))}
          className="btn btn-ghost btn-sm"
          aria-label="เดือนถัดไป"
        >
          <ArrowRightIcon size={20} />
        </button>
      </div>

      <div className="card p-2 sm:p-3">
        <div className="mb-1 grid grid-cols-7 gap-1 text-center font-display text-sm">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, monthDate);
            const hasData = daysWithData.has(dateStr);
            return (
              <Link
                key={dateStr}
                href={`/day/${dateStr}`}
                aria-label={`${format(day, "d MMMM", { locale: th })}${hasData ? " มีแผน" : ""}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border-[2.5px] text-sm transition hover:-translate-y-0.5 ${
                  isToday(day)
                    ? "border-ink bg-sun font-display shadow-pop-sm"
                    : inMonth
                    ? "border-ink/30 bg-white hover:border-ink hover:bg-mint-soft"
                    : "border-transparent opacity-30"
                }`}
              >
                <span>{format(day, "d")}</span>
                {hasData && <StarIcon size={14} />}
              </Link>
            );
          })}
        </div>
      </div>

      {loading && <p className="text-sm opacity-60">กำลังโหลด...</p>}
      <p className="flex items-center gap-1 text-sm">
        <StarIcon size={16} /> = วันที่มีแผนอาหาร/ออกกำลังกายแล้ว แตะวันไหนก็ได้เพื่อดูหรือเพิ่มแผน
      </p>
    </div>
  );
}
