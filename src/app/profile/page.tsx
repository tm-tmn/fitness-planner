"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Buddy, TargetIcon } from "@/components/icons";
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  Gender,
  calculateTargets,
} from "@/lib/calorie";

const emptyProfile = (): Profile => ({
  id: "",
  full_name: "",
  gender: null,
  age: null,
  weight_kg: null,
  height_cm: null,
  activity_level: null,
  goal: "",
  daily_calorie_target: null,
  daily_protein_target_g: null,
  notes: "",
  updated_at: new Date().toISOString(),
});

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
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
        .maybeSingle();
      if (error) setError(error.message);
      setProfile((data as Profile) ?? emptyProfile());
      setLoading(false);
    })();
  }, [supabase]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  const canCalculate =
    !!profile?.gender &&
    !!profile?.age &&
    !!profile?.weight_kg &&
    !!profile?.height_cm &&
    !!profile?.activity_level;

  function applyCalculatedTargets() {
    if (!profile || !canCalculate) return;
    const result = calculateTargets({
      gender: profile.gender as Gender,
      age: profile.age as number,
      weightKg: profile.weight_kg as number,
      heightCm: profile.height_cm as number,
      activityLevel: profile.activity_level as ActivityLevel,
    });
    update("daily_calorie_target", result.calorieTarget);
    update("daily_protein_target_g", result.proteinTargetG);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const payload = {
      full_name: profile.full_name,
      gender: profile.gender,
      age: profile.age,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      activity_level: profile.activity_level,
      goal: profile.goal,
      daily_calorie_target: profile.daily_calorie_target,
      daily_protein_target_g: profile.daily_protein_target_g,
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

  if (loading || !profile) return <p>กำลังโหลด...</p>;

  return (
    <div className="card max-w-md space-y-5 p-5">
      <div className="flex items-center gap-3">
        <Buddy size={64} />
        <h1 className="text-xl">โปรไฟล์ของฉัน</h1>
      </div>
      {error && (
        <div className="rounded-xl border-[3px] border-ink bg-candy px-4 py-2 text-sm">
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

      <Field label="เพศ (ใช้คำนวณแคลอรี่)">
        <select
          className="input"
          value={profile.gender ?? ""}
          onChange={(e) => update("gender", (e.target.value || null) as Gender | null)}
        >
          <option value="">เลือก...</option>
          <option value="male">ชาย</option>
          <option value="female">หญิง</option>
        </select>
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
      </div>

      <Field label="ระดับกิจกรรม">
        <select
          className="input"
          value={profile.activity_level ?? ""}
          onChange={(e) =>
            update(
              "activity_level",
              (e.target.value || null) as ActivityLevel | null
            )
          }
        >
          <option value="">เลือก...</option>
          {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="เป้าหมาย">
        <input
          className="input"
          placeholder="เช่น ลดไขมัน, เพิ่มกล้ามเนื้อ, วิ่งมาราธอน"
          value={profile.goal ?? ""}
          onChange={(e) => update("goal", e.target.value)}
        />
      </Field>

      <div className="rounded-2xl border-[3px] border-ink bg-[#FFF3C4] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2">
            <TargetIcon size={26} /> เป้าแคลอรี่ &amp; โปรตีนต่อวัน
          </h3>
          <button
            type="button"
            onClick={applyCalculatedTargets}
            disabled={!canCalculate}
            className="btn btn-mint btn-sm"
          >
            คำนวณให้อัตโนมัติ
          </button>
        </div>
        {!canCalculate && (
          <p className="mb-2 text-sm opacity-70">
            กรอกเพศ อายุ น้ำหนัก ส่วนสูง และระดับกิจกรรมให้ครบก่อน
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="แคลอรี่/วัน (kcal)">
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
          <Field label="โปรตีน/วัน (ก.)">
            <input
              type="number"
              className="input"
              value={profile.daily_protein_target_g ?? ""}
              onChange={(e) =>
                update(
                  "daily_protein_target_g",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </Field>
        </div>
      </div>

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
          className="btn btn-pink"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {savedAt && (
          <span className="text-sm">บันทึกแล้ว ✓</span>
        )}
      </div>

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
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
