interface Props {
  size?: number;
  className?: string;
}

export function Mark({ size = 16, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="7" y="12" width="50" height="45" rx="12" stroke="currentColor" strokeWidth="3" />
      <line x1="18" y1="12" x2="18" y2="4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="12" x2="46" y2="4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="36" r="5" fill="#3B82F6" />
    </svg>
  );
}
