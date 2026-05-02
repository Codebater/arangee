import { Mark } from "./Mark";

interface Props {
  size?: number;
  className?: string;
  tone?: "default" | "primary";
}

export function Wordmark({ size = 22, className, tone = "default" }: Props) {
  const color = tone === "primary" ? "var(--primary)" : "currentColor";
  return (
    <span
      className={"inline-flex items-center leading-none " + (className ?? "")}
      style={{ color, height: size }}
      aria-label="WeSchedule"
    >
      <Mark size={size} />
      <span
        style={{
          fontWeight: 600,
          letterSpacing: "0.08em",
          fontSize: Math.round(size * 0.7),
          lineHeight: 1,
          marginLeft: Math.round(size * 0.3),
        }}
      >
        WESCHEDULE
      </span>
    </span>
  );
}
