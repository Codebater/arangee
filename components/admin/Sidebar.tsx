"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  ListChecks,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/event-types", label: "Event types", icon: ListChecks },
  { href: "/availability", label: "Availability", icon: Clock },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col border-r border-[--border] bg-[--bg] sticky top-0 h-screen">
      <div className="px-4 py-5 border-b border-[--border]">
        <Link
          href="/dashboard"
          aria-label="Kalendly home"
          className="text-[--ink] inline-flex items-center"
        >
          <Wordmark size={20} />
        </Link>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group flex items-center gap-2.5 h-8 rounded-md px-2.5 text-[13px] transition-colors duration-150 ${
                active
                  ? "bg-[--surface-hover] text-[--ink] font-medium"
                  : "text-[--ink-soft] hover:bg-[--surface-hover] hover:text-[--ink]"
              }`}
            >
              <Icon size={15} className={active ? "text-[--primary]" : ""} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-[--border] flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 truncate text-[12px] text-[--ink-muted]">{name}</div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[--ink-muted] transition-colors duration-150 hover:bg-[--surface-hover] hover:text-[--ink]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
