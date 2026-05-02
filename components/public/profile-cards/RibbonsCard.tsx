export function RibbonsCard() {
  return (
    <div className="ribbons-card absolute inset-0 overflow-hidden">
      <svg
        className="ribbons-svg"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ribGradA" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ribGradB" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
          <linearGradient id="ribGradC" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          className="ribbon r1"
          d="M-100,90 Q200,40 400,100 T900,80"
          stroke="url(#ribGradA)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="ribbon r2"
          d="M-100,130 Q200,180 400,110 T900,150"
          stroke="url(#ribGradB)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="ribbon r3"
          d="M-100,60 Q220,110 440,50 T900,40"
          stroke="url(#ribGradC)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <style>{`
        .ribbons-card {
          background: linear-gradient(180deg, #0c0a1d 0%, #1a0f33 100%);
        }
        .ribbons-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 12px rgba(124, 92, 246, 0.4));
        }
        .ribbon {
          stroke-dasharray: 8 6;
          will-change: transform, stroke-dashoffset;
        }
        .r1 { animation: ribbonDrift 14s linear infinite; }
        .r2 { animation: ribbonDrift 18s linear -3s infinite reverse; }
        .r3 { animation: ribbonDrift 11s linear -7s infinite; }
        @keyframes ribbonDrift {
          to { stroke-dashoffset: -200; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ribbon { animation: none; stroke-dasharray: none; }
        }
      `}</style>
    </div>
  );
}
