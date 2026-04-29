import Image from "next/image";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/wordmark.svg"
      alt="Kalendly"
      width={160}
      height={32}
      className={className}
      priority
    />
  );
}
