import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // จะไม่ throw ตอน build แต่จะเตือนใน console ตอนรันจริงถ้าลืมตั้งค่า
  // eslint-disable-next-line no-console
  console.warn(
    "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
