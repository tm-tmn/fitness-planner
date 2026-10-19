"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) setError(error.message);
      setProfile(
        (data as Profile) ?? {
          id: "",
          full_name: "",
          age: null,
          weight_kg: null,
          height_cm: null,
          goal: "",
          daily_calorie_target: null,
          notes: "",
          updated_at: new Date().toISOString(),
        }
      );
      setLoading(false);
    })();
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const payload = {
      full_name: profile.full_name,
      age: profile.age,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      goal: profile.goal,
      daily_calorie_target: profile.daily_calorie_target,
      notes: profile.notes,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (profile.id) {
      result = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("profiles")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setProfile(result.data as Profile);
      setSavedAt(Date.now());
    }
    setSaving(false);
  }

  if (loading || !profile) return <p className="text-gray-500">กำลังโหลด...</p>;

  return (
    <div className="max-w-md space-y-5">
      <h1 className="text-xl font-bold">โปรไฟล์ของฉัน</h1>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <Field label="ชื่อ">
        <input
          className="input"
          value={profile.full_name ?? ""}
          onChange={(e) => update("full_name", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="อายุ (ปี)">
          <input
            type="number"
            className="input"
            value={profile.age ?? ""}
            onChange={(e) =>
              update("age", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>
        <Field label="น้ำหนัก (กก.)">
          <input
            type="number"
            step="0.1"
            className="input"
            value={profile.weight_kg ?? ""}
            onChange={(e) =>
              update(
                "weight_kg",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>
        <Field label="ส่วนสูง (ซม.)">
          <input
            type="number"
            step="0.1"
            className="input"
            value={profile.height_cm ?? ""}
            onChange={(e) =>
              update(
                "height_cm",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>
        <Field label="เป้าแคลอรี่/วัน">
          <input
            type="number"
            className="input"
            value={profile.daily_calorie_target ?? ""}
            onChange={(e) =>
              update(
                "daily_calorie_target",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </Field>
      </div>

      <Field label="เป้าหมาย">
        <input
          className="input"
          placeholder="เช่น ลดไขมัน, เพิ่มกล้ามเนื้อ, วิ่งมาราธอน"
          value={profile.goal ?? ""}
          onChange={(e) => update("goal", e.target.value)}
        />
      </Field>

      <Field label="บันทึกเพิ่มเติม">
        <textarea
          className="input h-24"
          value={profile.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {savedAt && (
          <span className="text-sm text-gray-400">บันทึกแล้ว ✓</span>
        )}
      </div>

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
