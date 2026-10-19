"use client";

import Link from "next/link";
import DayPlanner from "@/components/DayPlanner";
import { ArrowLeftIcon } from "@/components/icons";

export default function DayPage({
  params,
}: {
  params: { date: string };
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/calendar"
        className="btn btn-ghost btn-sm"
      >
        <ArrowLeftIcon size={18} />
        กลับไปปฏิทิน
      </Link>
      <DayPlanner date={params.date} />
    </div>
  );
}
