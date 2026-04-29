"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Mark } from "@/components/brand/Mark";
import { LayoutDashboard, Calendar, Clock, ListChecks, Settings, LogOut } from "lucide-react";

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
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-[--color-border] bg-[--color-surface]">
      <div className="p-6 flex items-center gap-2">
        <Mark size={24} />
        <span className="font-display text-lg">Kalendly</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[--color-primary-tint] text-[--color-primary]"
                  : "text-[--color-ink-soft] hover:bg-[--color-primary-tint]/60"
              }`}
            >
              <Icon size={16} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[--color-border]">
        <div className="px-3 py-2 text-xs text-[--color-ink-muted]">{name}</div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[--color-ink-soft] hover:bg-[--color-primary-tint]/60"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
