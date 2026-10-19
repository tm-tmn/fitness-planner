"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client สำหรับใช้ฝั่ง client component (browser)
 * ใช้ตัวนี้ในหน้า/คอมโพเนนต์ที่มี "use client" และต้องอ่าน/เขียนข้อมูล
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
