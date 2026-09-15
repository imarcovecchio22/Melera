export default function HoneyJarIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Frasco de miel artesanal Melera"
    >
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fdf1d6" />
          <stop offset="100%" stopColor="#fbe4ad" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="honey-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3b93d" />
          <stop offset="100%" stopColor="#dc8f1a" />
        </linearGradient>
        <linearGradient id="lid-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a2b" />
          <stop offset="100%" stopColor="#6b4520" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="200" r="190" fill="url(#bg-glow)" />

      {/* frasco */}
      <rect x="130" y="140" width="140" height="180" rx="18" fill="url(#honey-fill)" stroke="#b9740f" strokeWidth="3" />
      <rect x="130" y="140" width="140" height="40" rx="10" fill="#f6cc6f" opacity="0.5" />

      {/* tapa */}
      <rect x="150" y="95" width="100" height="45" rx="10" fill="url(#lid-fill)" stroke="#4f3115" strokeWidth="3" />
      <rect x="150" y="108" width="100" height="6" fill="#5c3a1a" opacity="0.6" />
      <rect x="150" y="120" width="100" height="6" fill="#5c3a1a" opacity="0.6" />

      {/* cuello */}
      <rect x="165" y="120" width="70" height="25" fill="#e6a733" stroke="#b9740f" strokeWidth="2" />

      {/* etiqueta */}
      <rect x="145" y="210" width="110" height="70" rx="8" fill="#fffaf0" stroke="#dc9420" strokeWidth="2" />
      <text x="200" y="240" textAnchor="middle" fontSize="20" fontWeight="700" fill="#9a5818" fontFamily="Georgia, serif">
        Melera
      </text>
      <text x="200" y="258" textAnchor="middle" fontSize="9" fill="#a9772f" letterSpacing="1">
        MIEL ARTESANAL
      </text>

      {/* abejas decorativas */}
      <g>
        <ellipse cx="90" cy="120" rx="10" ry="7" fill="#2b2b2b" />
        <ellipse cx="90" cy="120" rx="10" ry="7" fill="#f2b632" opacity="0.4" />
        <circle cx="80" cy="112" r="5" fill="#f2ebd9" opacity="0.8" />
      </g>
      <g>
        <ellipse cx="320" cy="90" rx="8" ry="5.5" fill="#2b2b2b" />
        <ellipse cx="320" cy="90" rx="8" ry="5.5" fill="#f2b632" opacity="0.4" />
        <circle cx="312" cy="84" r="4" fill="#f2ebd9" opacity="0.8" />
      </g>
    </svg>
  );
}
