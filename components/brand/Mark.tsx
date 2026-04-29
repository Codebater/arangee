import Image from "next/image";

export function Mark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo/mark.svg"
      alt="Kalendly"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
