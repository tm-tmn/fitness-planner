"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "@/components/icons";
import { estimateLocal, searchFoods } from "@/lib/foodDb";

const PORTIONS = [0.5, 1, 1.5, 2];

/**
 * ช่องเพิ่มมื้ออาหาร: พิมพ์ชื่อแล้วระบบประเมินแคลอรี่ให้เอง (จากคลังในแอป)
 * มีรายการแนะนำ ปุ่มปรับขนาดส่วน และปุ่มให้ AI ประเมินเมื่อคลังไม่รู้จัก — แก้ตัวเลขเองได้เสมอ
 */
export default function MealAdd({
  onAdd,
}: {
  onAdd: (name: string, kcal: number | null) => void;
}) {
  const [value, setValue] = useState("");
  const [portion, setPortion] = useState(1);
  const [manual, setManual] = useState(false);
  const [kcalStr, setKcalStr] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [ai, setAi] = useState<{ kcal: number; note: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  const suggestions = useMemo(() => searchFoods(value, 6), [value]);
  const est = useMemo(() => estimateLocal(value), [value]);

  const base = ai ? ai.kcal : est ? est.kcal : null;
  const computed = base != null ? Math.round(base * portion) : null;
  const shownKcal = manual ? kcalStr : computed != null ? String(computed) : "";
  const hasText = value.trim().length > 0;

  function reset() {
    setValue("");
    setPortion(1);
    setManual(false);
    setKcalStr("");
    setAi(null);
    setAiMsg(null);
    setOpen(false);
    setActive(-1);
  }

  function submit() {
    const name = value.trim();
    if (!name) return;
    const n = shownKcal === "" ? null : Number(shownKcal);
    onAdd(portion === 1 ? name : `${name} ×${portion}`, n != null && Number.isFinite(n) ? n : null);
    reset();
  }

  function pick(name: string) {
    setValue(name);
    setPortion(1);
    setAi(null);
    setAiMsg(null);
    setManual(false);
    setOpen(false);
    setActive(-1);
  }

  async function askAi() {
    setAiBusy(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value.trim() }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 501) {
        setAiMsg("ยังไม่ได้เปิดใช้ AI ในเซิร์ฟเวอร์ ใส่แคลอรี่เองได้เลย");
      } else if (res.status === 504) {
        setAiMsg("AI ตอบช้าเกินไป ลองใหม่อีกครั้งหรือใส่แคลอรี่เอง");
      } else if (!res.ok) {
        setAiMsg("AI ประเมินไม่สำเร็จ ลองใหม่หรือใส่แคลอรี่เอง");
      } else {
        const data = (await res.json()) as { kcal: number; note?: string };
        setAi({ kcal: data.kcal, note: data.note ?? "" });
        setManual(false);
      }
    } catch (e) {
      const slow = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      setAiMsg(slow ? "AI ตอบช้าเกินไป ลองใหม่อีกครั้งหรือใส่แคลอรี่เอง" : "เชื่อมต่อไม่ได้ ลองใหม่หรือใส่แคลอรี่เอง");
    } finally {
      setAiBusy(false);
    }
  }

  const listId = "meal-suggest";
  const showList = open && suggestions.length > 0 && hasText;

  let hint: string | null = null;
  if (hasText) {
    if (manual) hint = "กำลังใช้ตัวเลขที่คุณใส่เอง";
    else if (ai) hint = `AI ประเมิน: ${ai.kcal} kcal${ai.note ? ` — ${ai.note}` : ""}`;
    else if (est)
      hint =
        `ประเมินจาก ${est.matched.join(" + ")}` +
        (est.unmatched.length ? ` (ยังไม่รู้จัก: ${est.unmatched.join(", ")})` : "");
    else hint = "คลังยังไม่รู้จักเมนูนี้ ลองให้ AI ประเมิน หรือใส่แคลอรี่เอง";
  }

  return (
    <div className="space-y-2">
      <div>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!e.target.value.trim()) setPortion(1);
            setAi(null);
            setAiMsg(null);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && showList) {
              e.preventDefault();
              setActive((a) => (a + 1) % suggestions.length);
            } else if (e.key === "ArrowUp" && showList) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (showList && active >= 0) pick(suggestions[active].name);
              else submit();
            }
          }}
          placeholder="พิมพ์เมนู เช่น ข้าวสวย + ไข่ 2 ฟอง"
          aria-label="เพิ่มเมนูอาหาร"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className="input"
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="mt-2 max-h-64 overflow-auto rounded-2xl border-[3px] border-ink bg-white"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.name}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s.name);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  i === active ? "bg-sun/50" : "hover:bg-sun/30"
                }`}
              >
                <span className="min-w-0 break-words">{s.name}</span>
                <span className="shrink-0 font-semibold">{s.kcal} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="ขนาดส่วน">
        {PORTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPortion(p)}
            aria-pressed={portion === p}
            className={`btn btn-sm ${portion === p ? "btn-mint" : "btn-ghost"} !px-3`}
          >
            ×{p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={5000}
          value={shownKcal}
          onChange={(e) => {
            setManual(true);
            setKcalStr(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="kcal"
          aria-label="แคลอรี่ (แก้ไขเองได้)"
          className="input !w-28 shrink-0"
        />
        <button type="button" onClick={submit} className="btn btn-mint min-w-0 flex-1">
          <PlusIcon size={16} />
          เพิ่ม
        </button>
      </div>

      {hasText && (
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
          <span className="min-w-0 break-words" aria-live="polite">
            {hint}
          </span>
          {manual && (
            <button
              type="button"
              className="underline"
              onClick={() => {
                setManual(false);
                setKcalStr("");
              }}
            >
              ให้ระบบคำนวณใหม่
            </button>
          )}
          {!manual && !ai && (
            <button type="button" onClick={askAi} disabled={aiBusy} className="btn btn-ghost btn-sm">
              {aiBusy ? "กำลังประเมิน..." : "ให้ AI ประเมิน"}
            </button>
          )}
        </div>
      )}
      {aiMsg && (
        <p className="text-xs text-bubble" role="status">
          {aiMsg}
        </p>
      )}
    </div>
  );
}
