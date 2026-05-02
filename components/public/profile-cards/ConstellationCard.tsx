const STARS = Array.from({ length: 60 }, (_, i) => {
  const x = ((i * 9301 + 49297) % 233280) / 233280;
  const y = ((i * 7919 + 6857) % 233280) / 233280;
  const s = 0.4 + (((i * 1543 + 2017) % 100) / 100) * 1.6;
  const d = ((i * 257) % 5000) / 1000;
  return { x: x * 100, y: y * 100, s, d };
});

export function ConstellationCard() {
  return (
    <div className="constellation-card absolute inset-0 overflow-hidden">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.s}px`,
            height: `${star.s}px`,
            animationDelay: `${star.d}s`,
          }}
        />
      ))}
      <div className="nebula" />
      <style>{`
        .constellation-card {
          background:
            radial-gradient(circle at 70% 30%, rgba(120, 80, 200, 0.35), transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(40, 80, 180, 0.3), transparent 55%),
            #050615;
        }
        .star {
          position: absolute;
          background: #f6f5ff;
          border-radius: 9999px;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.7);
          animation: starTwinkle 4s ease-in-out infinite;
        }
        .nebula {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 60%, rgba(180, 130, 255, 0.18), transparent 65%);
          mix-blend-mode: screen;
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .star { animation: none; opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
