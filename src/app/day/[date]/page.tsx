"use client";

import Link from "next/link";
import DayPlanner from "@/components/DayPlanner";

export default function DayPage({
  params,
}: {
  params: { date: string };
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/calendar"
        className="inline-block text-sm text-brand-700 hover:underline"
      >
        ← กลับไปปฏิทิน
      </Link>
      <DayPlanner date={params.date} />
    </div>
  );
}
