"use client";

import { useState } from "react";
import type { Coords } from "@/lib/shopSearch";

/**
 * ขออนุญาตใช้ตำแหน่งทุกครั้งที่เปิดหน้า: ไม่จำคำตอบ ไม่บันทึกพิกัดลงฐานข้อมูล
 * พิกัดอยู่ในหน่วยความจำของหน้านี้เท่านั้น และหายเมื่อรีเฟรช/ปิดหน้า
 */
export default function LocationPrompt({
  coords,
  onChange,
}: {
  coords: Coords | null;
  onChange: (c: Coords | null) => void;
}) {
  const [state, setState] = useState<"ask" | "loading" | "declined" | "error">(
    "ask"
  );
  const [message, setMessage] = useState<string | null>(null);

  function allow() {
    if (!("geolocation" in navigator)) {
      setState("error");
      setMessage("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setState("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "เบราว์เซอร์ไม่อนุญาตให้ใช้ตำแหน่ง เปิดสิทธิ์ตำแหน่งของเว็บนี้ในการตั้งค่าเบราว์เซอร์ แล้วลองใหม่"
            : "หาตำแหน่งไม่ได้ ลองใหม่อีกครั้ง"
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  if (coords) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-2 bg-mint-soft px-4 py-2 text-sm">
        <span>ใช้ตำแหน่งปัจจุบันของคุณหาที่ซื้อ (ไม่ถูกบันทึกไว้)</span>
        <button
          onClick={() => {
            onChange(null);
            setState("ask");
          }}
          className="btn btn-ghost btn-sm"
        >
          เลิกใช้ตำแหน่ง
        </button>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <span>ไม่ใช้ตำแหน่งในครั้งนี้</span>
        <button onClick={() => setState("ask")} className="btn btn-ghost btn-sm">
          ขอใช้อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-2 bg-[#E6F6FF] px-4 py-3 text-sm">
      <p className="font-display">ให้ช่วยหาร้านที่ขายเมนูในแผนใกล้ตัวคุณไหม?</p>
      <p>
        ต้องใช้ตำแหน่งปัจจุบันของคุณ ระบบจะถามทุกครั้งที่เปิดหน้านี้
        ตำแหน่งใช้เพื่อเปิดผลค้นหาใน Google Maps เท่านั้น ไม่ถูกเก็บในฐานข้อมูล
      </p>
      {message && <p className="font-semibold">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={allow} disabled={state === "loading"} className="btn btn-mint btn-sm">
          {state === "loading" ? "กำลังหาตำแหน่ง..." : "อนุญาตครั้งนี้"}
        </button>
        <button onClick={() => setState("declined")} className="btn btn-ghost btn-sm">
          ไม่ใช้
        </button>
      </div>
    </div>
  );
}
