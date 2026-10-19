"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="mx-auto mt-10 max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-700">
          🏋️ Fit & Meal Planner
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "signin"
            ? "เข้าสู่ระบบเพื่อดูตารางของคุณ"
            : "สมัครสมาชิกใหม่"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading
            ? "กำลังดำเนินการ..."
            : mode === "signin"
            ? "เข้าสู่ระบบ"
            : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {mode === "signin" ? (
          <>
            ยังไม่มีบัญชี?{" "}
            <button
              className="font-medium text-brand-700 hover:underline"
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
              className="font-medium text-brand-700 hover:underline"
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

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #16a34a;
        }
      `}</style>
    </div>
  );
}
