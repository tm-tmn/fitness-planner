import { NextResponse } from "next/server";

// Supabase แพ็กเกจฟรีจะพักโปรเจกต์ถ้าไม่มีการใช้งาน ~7 วัน
// Vercel Cron เรียก endpoint นี้ทุกวัน (ดู vercel.json) เพื่อให้ฐานข้อมูลมีความเคลื่อนไหว
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // ถ้าตั้ง CRON_SECRET ไว้ใน Vercel จะรับเฉพาะคำขอจาก Vercel Cron
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "missing env" }, { status: 500 });
  }

  const started = Date.now();
  try {
    // คิวรีเล็ก ๆ หนึ่งครั้ง (RLS ยังทำงาน จึงไม่มีข้อมูลผู้ใช้หลุดออกมา)
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return NextResponse.json(
      { ok: res.ok, status: res.status, ms: Date.now() - started, at: new Date().toISOString() },
      { status: res.ok ? 200 : 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
