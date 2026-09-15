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
          <stop offset="0%" stopColor="#fff3dc" />
          <stop offset="100%" stopColor="#f5e6c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="honey-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaa52c" />
          <stop offset="100%" stopColor="#e8970a" />
        </linearGradient>
        <linearGradient id="lid-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b4513" />
          <stop offset="100%" stopColor="#6b3410" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="200" r="190" fill="url(#bg-glow)" />

      {/* frasco */}
      <rect x="130" y="140" width="140" height="180" rx="18" fill="url(#honey-fill)" stroke="#c97f08" strokeWidth="3" />
      <rect x="130" y="140" width="140" height="40" rx="10" fill="#f2cc85" opacity="0.5" />

      {/* tapa */}
      <rect x="150" y="95" width="100" height="45" rx="10" fill="url(#lid-fill)" stroke="#4a230b" strokeWidth="3" />
      <rect x="150" y="108" width="100" height="6" fill="#6b3410" opacity="0.6" />
      <rect x="150" y="120" width="100" height="6" fill="#6b3410" opacity="0.6" />

      {/* cuello */}
      <rect x="165" y="120" width="70" height="25" fill="#eaa52c" stroke="#c97f08" strokeWidth="2" />

      {/* etiqueta */}
      <rect x="145" y="210" width="110" height="70" rx="8" fill="#fff3dc" stroke="#e8970a" strokeWidth="2" />
      <text x="200" y="240" textAnchor="middle" fontSize="20" fontWeight="700" fill="#8b4513" fontFamily="Georgia, serif">
        Melera
      </text>
      <text x="200" y="258" textAnchor="middle" fontSize="9" fill="#c97f08" letterSpacing="1">
        MIEL ARTESANAL
      </text>

      {/* abejas decorativas */}
      <g>
        <ellipse cx="90" cy="120" rx="10" ry="7" fill="#2b2b2b" />
        <ellipse cx="90" cy="120" rx="10" ry="7" fill="#eaa52c" opacity="0.4" />
        <circle cx="80" cy="112" r="5" fill="#fff3dc" opacity="0.8" />
      </g>
      <g>
        <ellipse cx="320" cy="90" rx="8" ry="5.5" fill="#2b2b2b" />
        <ellipse cx="320" cy="90" rx="8" ry="5.5" fill="#eaa52c" opacity="0.4" />
        <circle cx="312" cy="84" r="4" fill="#fff3dc" opacity="0.8" />
      </g>
    </svg>
  );
}
