export function AuroraCard() {
  return (
    <div className="aurora-card absolute inset-0 overflow-hidden">
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />
      <style>{`
        .aurora-card {
          background: linear-gradient(135deg, #0d0524 0%, #04132e 100%);
        }
        .aurora-blob {
          position: absolute;
          width: 55%;
          height: 220%;
          top: -60%;
          filter: blur(46px);
          opacity: 0.78;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .aurora-a {
          left: -10%;
          background: radial-gradient(closest-side, #b06aff, transparent 70%);
          animation: auroraFloat 14s ease-in-out infinite;
        }
        .aurora-b {
          left: 28%;
          background: radial-gradient(closest-side, #57a3ff, transparent 70%);
          animation: auroraFloat 18s ease-in-out -4s infinite;
        }
        .aurora-c {
          right: -8%;
          background: radial-gradient(closest-side, #ff5fa2, transparent 70%);
          animation: auroraFloat 16s ease-in-out -9s infinite;
        }
        @keyframes auroraFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(8%, -4%) scale(1.05); }
          66%      { transform: translate(-6%, 4%) scale(0.95); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-blob { animation: none; }
        }
      `}</style>
    </div>
  );
}
