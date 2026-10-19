"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Buddy } from "@/components/icons";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            : error.message
        );
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // โปรเจกต์ Supabase ปิดการยืนยันอีเมล -> ล็อกอินได้ทันที
        router.push(redirectTo);
        router.refresh();
      } else {
        setInfo(
          "สมัครสำเร็จ! เช็กอีเมลของคุณเพื่อกดยืนยันก่อนเข้าสู่ระบบครั้งแรก"
        );
      }
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto mt-6 max-w-sm space-y-4">
      <div className="text-center">
        <Buddy size={140} mood="cheer" className="bob mx-auto" />
        <h1 className="text-2xl">Fit &amp; Meal Planner</h1>
        <p className="mt-1 text-sm">
          {mode === "signin"
            ? "เข้าสู่ระบบเพื่อดูตารางของคุณ"
            : "สมัครสมาชิกใหม่"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3 p-5">
        {mode === "signup" && (
          <input
            className="input"
            placeholder="ชื่อของคุณ"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          className="input"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="input"
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && (
          <div className="rounded-xl border-[3px] border-ink bg-candy px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-xl border-[3px] border-ink bg-mint-soft px-3 py-2 text-sm">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-pink w-full"
        >
          {loading
            ? "กำลังดำเนินการ..."
            : mode === "signin"
            ? "เข้าสู่ระบบ"
            : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-center text-sm">
        {mode === "signin" ? (
          <>
            ยังไม่มีบัญชี?{" "}
            <button
              className="font-semibold underline decoration-wavy underline-offset-4"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
            >
              สมัครสมาชิก
            </button>
          </>
        ) : (
          <>
            มีบัญชีอยู่แล้ว?{" "}
            <button
              className="font-semibold underline decoration-wavy underline-offset-4"
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfo(null);
              }}
            >
              เข้าสู่ระบบ
            </button>
          </>
        )}
      </p>

    </div>
  );
}
