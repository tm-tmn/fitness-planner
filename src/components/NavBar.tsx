"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Buddy,
  CalendarIcon,
  DoorIcon,
  ListIcon,
  SmileIcon,
  SunIcon,
} from "@/components/icons";

const links = [
  { href: "/", label: "วันนี้", Icon: SunIcon },
  { href: "/calendar", label: "ปฏิทิน", Icon: CalendarIcon },
  { href: "/program", label: "โปรแกรม", Icon: ListIcon },
  { href: "/profile", label: "โปรไฟล์", Icon: SmileIcon },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ไม่แสดง NavBar ในหน้า login
  if (pathname === "/login") return null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-10 border-b-[3px] border-ink bg-sun">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-lg">
            <Buddy size={40} />
            <span>Fit &amp; Meal</span>
          </Link>

          {/* เมนูบนจอกว้าง */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="เมนูหลัก">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`tab ${isActive(href) ? "tab-active" : ""}`}
              >
                <Icon size={26} />
                {label}
              </Link>
            ))}
          </nav>

          {email && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-[10rem] truncate text-xs lg:inline">
                {email}
              </span>
              <button onClick={signOut} className="btn btn-ghost btn-sm">
                <DoorIcon size={20} />
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">ออก</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* แท็บล่างบนมือถือ */}
      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-ink bg-sun pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-1.5">
          {links.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex flex-col items-center rounded-2xl border-[3px] px-1 py-0.5 text-xs font-display ${
                  isActive(href)
                    ? "border-ink bg-bubble text-white shadow-pop-sm"
                    : "border-transparent"
                }`}
              >
                <Icon size={26} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
