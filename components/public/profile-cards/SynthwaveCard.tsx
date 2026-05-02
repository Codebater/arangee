export function SynthwaveCard() {
  return (
    <div className="synthwave-card absolute inset-0 overflow-hidden">
      <div className="sw-sun" />
      <div className="sw-grid" />
      <div className="sw-haze" />
      <style>{`
        .synthwave-card {
          background:
            linear-gradient(180deg, #0a0322 0%, #240b51 45%, #f24389 75%, #ff8a4c 100%);
        }
        .sw-sun {
          position: absolute;
          left: 50%;
          bottom: 38%;
          width: 36%;
          aspect-ratio: 1;
          transform: translateX(-50%);
          background:
            linear-gradient(180deg, #ffe66d 0%, #ff8a4c 60%, #f24389 100%);
          border-radius: 9999px;
          box-shadow: 0 0 60px rgba(255, 138, 76, 0.7);
        }
        .sw-sun::after {
          content: "";
          position: absolute;
          inset: 60% 0 0 0;
          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 6px,
              #0a0322 6px,
              #0a0322 9px
            );
        }
        .sw-grid {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: 0;
          height: 50%;
          background:
            repeating-linear-gradient(90deg,
              rgba(255, 80, 200, 0.55) 0,
              rgba(255, 80, 200, 0.55) 1px,
              transparent 1px,
              transparent 40px),
            repeating-linear-gradient(0deg,
              rgba(255, 80, 200, 0.55) 0,
              rgba(255, 80, 200, 0.55) 1px,
              transparent 1px,
              transparent 24px);
          transform: perspective(220px) rotateX(60deg);
          transform-origin: center bottom;
          animation: synthGrid 1.6s linear infinite;
          mask-image: linear-gradient(to top, #000 60%, transparent 100%);
        }
        .sw-haze {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, transparent 30%, rgba(255, 138, 76, 0.18) 65%, transparent 100%);
          pointer-events: none;
        }
        @keyframes synthGrid {
          to { background-position: 0 24px, 0 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sw-grid { animation: none; }
        }
      `}</style>
    </div>
  );
}
