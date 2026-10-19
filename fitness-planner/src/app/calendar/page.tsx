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
import { supabase } from "@/lib/supabaseClient";

const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

export default function CalendarPage() {
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthDate((d) => subMonths(d, 1))}
          className="rounded-md px-3 py-1 text-gray-600 hover:bg-gray-100"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">
          {format(monthDate, "MMMM yyyy", { locale: th })}
        </h1>
        <button
          onClick={() => setMonthDate((d) => addMonths(d, 1))}
          className="rounded-md px-3 py-1 text-gray-600 hover:bg-gray-100"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
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
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition ${
                isToday(day)
                  ? "border-brand-600 bg-brand-50 font-bold text-brand-700"
                  : inMonth
                  ? "border-gray-200 bg-white text-gray-700 hover:border-brand-400"
                  : "border-transparent text-gray-300"
              }`}
            >
              <span>{format(day, "d")}</span>
              {hasData && (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </div>

      {loading && <p className="text-sm text-gray-400">กำลังโหลด...</p>}
      <p className="text-xs text-gray-400">
        จุดสีเขียวใต้ตัวเลข = วันที่มีแผนอาหาร/ออกกำลังกายแล้ว คลิกวันไหนก็ได้เพื่อดู/เพิ่มแผน
      </p>
    </div>
  );
}
