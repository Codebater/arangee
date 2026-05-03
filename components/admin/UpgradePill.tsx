import Link from "next/link";
import { Sparkles } from "lucide-react";

export function UpgradePill({
  label = "Pro feature",
  href = "/settings#billing",
  className = "",
}: {
  label?: string;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary transition-colors duration-150 hover:border-primary hover:bg-primary/15 ${className}`}
    >
      <Sparkles size={10} />
      {label}
    </Link>
  );
}
