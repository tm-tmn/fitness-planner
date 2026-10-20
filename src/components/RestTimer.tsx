"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [30, 45, 60, 90];

export interface TimerStart {
  seconds: number;
  /** เปลี่ยนค่านี้ทุกครั้งที่สั่งเริ่มใหม่ */
  id: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** ตัวจับเวลาพักระหว่างเซ็ต: เสียงเตือน + สั่นเมื่อครบเวลา ทำงานต่อได้ตอนสลับแอป */
export default function RestTimer({ start }: { start: TimerStart | null }) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [left, setLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  const begin = useCallback((seconds: number) => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audio.current = audio.current ?? new AC();
        audio.current.resume?.();
      }
    } catch {
      /* ไม่มีเสียงก็ยังนับเวลาได้ */
    }
    setTotal(seconds);
    setLeft(seconds);
    setPausedLeft(null);
    setFinished(false);
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  useEffect(() => {
    if (start) begin(start.seconds);
  }, [start, begin]);

  function beep() {
    try {
      const ctx = audio.current;
      if (ctx) {
        [0, 0.28, 0.56].forEach((t) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.25);
        });
      }
      navigator.vibrate?.([200, 100, 200, 100, 300]);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        setEndAt(null);
        setFinished(true);
        beep();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt]);

  function pause() {
    if (endAt === null) return;
    setPausedLeft(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
    setEndAt(null);
  }
  function resume() {
    if (pausedLeft === null) return;
    setEndAt(Date.now() + pausedLeft * 1000);
    setPausedLeft(null);
  }
  function adjust(delta: number) {
    if (endAt !== null) setEndAt(endAt + delta * 1000);
    else if (pausedLeft !== null) {
      const v = Math.max(5, pausedLeft + delta);
      setPausedLeft(v);
      setLeft(v);
    }
  }
  function close() {
    setEndAt(null);
    setPausedLeft(null);
    setFinished(false);
    setTotal(0);
  }

  const active = total > 0;
  const shown = pausedLeft ?? left;
  const pct = total ? Math.round(((total - shown) / total) * 100) : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-display">จับเวลาพัก</span>
        {PRESETS.map((s) => (
          <button key={s} onClick={() => begin(s)} className="btn btn-ghost btn-sm">
            {s} วิ
          </button>
        ))}
      </div>

      {active && (
        <div
          role="timer"
          aria-live="off"
          className={`card fixed inset-x-3 bottom-20 z-20 mx-auto max-w-sm p-3 md:bottom-6 md:left-auto md:right-6 md:mx-0 ${
            finished ? "bg-sun" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs">{finished ? "ครบเวลาพักแล้ว!" : pausedLeft !== null ? "หยุดชั่วคราว" : "พักระหว่างเซ็ต"}</p>
              <p className="font-display text-4xl leading-none" aria-label={`เหลือ ${shown} วินาที`}>
                {fmt(shown)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {!finished && (
                <>
                  <button onClick={() => adjust(-15)} className="btn btn-ghost btn-sm" aria-label="ลด 15 วินาที">
                    −15
                  </button>
                  <button onClick={() => adjust(15)} className="btn btn-ghost btn-sm" aria-label="เพิ่ม 15 วินาที">
                    +15
                  </button>
                  {pausedLeft !== null ? (
                    <button onClick={resume} className="btn btn-mint btn-sm">เล่นต่อ</button>
                  ) : (
                    <button onClick={pause} className="btn btn-sm">หยุด</button>
                  )}
                </>
              )}
              {finished && (
                <button onClick={() => begin(total)} className="btn btn-mint btn-sm">พักอีกรอบ</button>
              )}
              <button onClick={close} className="btn btn-pink btn-sm">ปิด</button>
            </div>
          </div>
          <div className="meter mt-2" aria-hidden="true">
            <div className="meter-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
