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

export function Sidebar({
  name,
  username,
  avatarImageId,
}: {
  name: string;
  username: string;
  avatarImageId: string | null;
}) {
  const pathname = usePathname();
  const initial = (name || username).slice(0, 1).toUpperCase();
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-border bg-bg md:flex md:w-60 md:flex-col">
      <div className="border-b border-border px-5 py-6">
        <Link
          href="/dashboard"
          aria-label="WeSchedule home"
          className="inline-flex items-center text-ink"
        >
          <Wordmark size={24} />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group relative flex h-9 items-center gap-3 rounded-md px-3 text-[14px] transition-colors duration-150 ${
                active
                  ? "bg-surface-hover font-medium text-ink"
                  : "text-ink-soft hover:bg-surface-hover hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                size={16}
                className={active ? "text-primary" : "text-ink-muted group-hover:text-ink-soft"}
              />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 border-t border-border px-3 py-3">
        <Link
          href="/account"
          className={`group flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 transition-colors duration-150 hover:bg-surface-hover ${
            pathname.startsWith("/account") ? "bg-surface-hover" : ""
          }`}
          title="Account"
        >
          {avatarImageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/images/${avatarImageId}`}
              alt={name}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-medium text-ink">{name}</div>
            <div className="truncate font-mono text-[10px] text-ink-muted">@{username}</div>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
