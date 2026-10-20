"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Buddy } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

/** ลงทะเบียน service worker และแสดงแบนเนอร์ชวนติดตั้งแอป (ปิดแล้วไม่ถามอีก) */
export default function PwaSetup() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* เข้าถึง storage ไม่ได้ ก็แสดงแบนเนอร์ตามปกติ */
    }
    if (standalone || dismissed) return;

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (isIos) {
      setIosHint(true);
      setHidden(false);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  }

  if (hidden || pathname === "/login" || (!deferred && !iosHint)) return null;

  return (
    <div className="card mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-3 bg-[#FFF3C4] p-3 text-sm">
      <Buddy size={48} />
      <div className="min-w-[11rem] flex-1">
        <p className="font-display">ติดตั้งเป็นแอปบนเครื่อง</p>
        {deferred ? (
          <p>เปิดได้จากไอคอนบนหน้าจอ เต็มจอ ไม่มีแถบเบราว์เซอร์</p>
        ) : (
          <p>
            กดปุ่มแชร์ของ Safari แล้วเลือก &quot;เพิ่มลงหน้าจอโฮม&quot;
          </p>
        )}
      </div>
      {deferred && (
        <button onClick={install} className="btn btn-mint btn-sm">
          ติดตั้ง
        </button>
      )}
      <button onClick={dismiss} className="btn btn-ghost btn-sm" aria-label="ปิดข้อความนี้">
        ไม่ต้อง
      </button>
    </div>
  );
}
