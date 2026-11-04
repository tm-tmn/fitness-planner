"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { localDateStr } from "@/lib/streak";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  ShopItem,
  buildShoppingList,
  describe,
  shoppingText,
} from "@/lib/shopping";
import { BowlIcon } from "@/components/icons";

const RANGES = [3, 7] as const;

function storageKey(from: string, days: number) {
  return `tmfit.shop.${from}.${days}`;
}

function readChecked(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

/** รายการซื้อของจากมื้อที่ยังไม่ติ๊กในอีกไม่กี่วันข้างหน้า */
export default function ShoppingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const [meals, setMeals] = useState<{ food_name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const from = localDateStr();
  const to = format(addDays(parseISO(from), days - 1), "yyyy-MM-dd");
  const key = storageKey(from, days);

  useEffect(() => {
    setMeals(null);
    setError(null);
    supabase
      .from("meal_entries")
      .select("food_name")
      .gte("entry_date", from)
      .lte("entry_date", to)
      .eq("is_done", false)
      .range(0, 999)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setMeals((data as { food_name: string }[] | null) ?? []);
      });
  }, [supabase, from, to]);

  useEffect(() => {
    setChecked(readChecked(key));
  }, [key]);

  const items: ShopItem[] = useMemo(() => (meals ? buildShoppingList(meals) : []), [meals]);
  const range = `${format(parseISO(from), "d MMM", { locale: th })} – ${format(parseISO(to), "d MMM", { locale: th })}`;

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        // จำไม่ได้ข้ามการรีเฟรช แต่ยังติ๊กได้
      }
      return next;
    });
  }

  async function copyList() {
    const left = items.filter((i) => !checked.has(i.item));
    const text = shoppingText(left.length ? left : items, `รายการซื้อของ ${range}`);
    setMsg(null);
    try {
      if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share({ title: "รายการซื้อของ", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg("คัดลอกรายการแล้ว วางในแอปโน้ตหรือแชตได้เลย");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // ผู้ใช้ปิดหน้าต่างแชร์เอง
      setMsg("คัดลอกอัตโนมัติไม่ได้ในเบราว์เซอร์นี้ กดค้างที่รายการเพื่อคัดลอกเองได้");
    }
  }

  const leftCount = items.filter((i) => !checked.has(i.item)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-xl">
            <BowlIcon size={32} /> รายการซื้อของ
          </h1>
          <div className="flex gap-1" role="group" aria-label="ช่วงวัน">
            {RANGES.map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                aria-pressed={days === n}
                className={`btn btn-sm ${days === n ? "" : "btn-ghost"}`}
              >
                {n} วัน
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm">
          วัตถุดิบหลักจากมื้อที่ยังไม่ติ๊ก ช่วง {range}
          {meals ? ` (${meals.length} มื้อ)` : ""} เป็นรายการคร่าวๆ จากชื่อเมนู ปริมาณให้ดูจากจำนวนมื้อที่ใช้
        </p>
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={copyList} className="btn btn-mint btn-sm">
              {leftCount < items.length ? `คัดลอกที่ยังไม่ได้ซื้อ (${leftCount})` : "คัดลอก/แชร์รายการ"}
            </button>
            {checked.size > 0 && (
              <button
                onClick={() => {
                  setChecked(new Set());
                  try {
                    localStorage.removeItem(key);
                  } catch {
                    // ไม่เป็นไร
                  }
                }}
                className="btn btn-ghost btn-sm"
              >
                ล้างเครื่องหมายทั้งหมด
              </button>
            )}
          </div>
        )}
        {msg && (
          <p className="text-sm" role="status">
            {msg}
          </p>
        )}
      </section>

      {error && <div className="rounded-xl border-[3px] border-ink bg-candy px-4 py-2 text-sm">{error}</div>}

      {meals === null ? (
        <p>กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <section className="card space-y-2 p-4 text-sm">
          <p>ช่วงนี้ยังไม่มีมื้อที่วางแผนไว้ (หรือติ๊กกินครบแล้ว)</p>
          <p>
            ใส่แผนอาหารได้ที่{" "}
            <Link href="/program" className="font-semibold underline">
              หน้าโปรแกรม
            </Link>{" "}
            หรือเพิ่มเมนูเองในหน้าวันนี้
          </p>
        </section>
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const inCat = items.filter((i) => i.cat === cat);
          if (!inCat.length) return null;
          return (
            <section key={cat} className="card space-y-2 p-4" aria-label={CATEGORY_LABELS[cat]}>
              <h2 className="text-lg">{CATEGORY_LABELS[cat]}</h2>
              {cat === "other" && (
                <p className="text-xs opacity-70">ส่วนของเมนูที่แยกวัตถุดิบไม่ได้ อาจเป็นของที่ซื้อสำเร็จหรือกินนอกบ้าน</p>
              )}
              <ul className="space-y-1.5">
                {inCat.map((i) => (
                  <li key={i.item}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked.has(i.item)}
                        onChange={() => toggle(i.item)}
                        className="cartoon-check mt-0.5"
                      />
                      <span className={checked.has(i.item) ? "line-through opacity-50" : ""}>
                        <span className="font-semibold">{i.item}</span>{" "}
                        <span className="text-sm opacity-70">({describe(i)})</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
