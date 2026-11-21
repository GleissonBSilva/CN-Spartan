import React from 'react';

interface SpartanGoldenShieldProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Escudo com Capacete Dourado de Espartano (Spartan Golden Helmet & Shield)
 * Emblema VIP exclusivo de alta definição para o Plano Spartan Fundador.
 */
export const SpartanGoldenHelmetShield: React.FC<SpartanGoldenShieldProps> = ({
  size = 40,
  className = '',
  glow = true,
}) => {
  const filterId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${glow ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.55)]' : ''} ${className}`}
      aria-label="Escudo com Capacete Dourado Spartan Fundador"
    >
      <defs>
        {/* Gradiente Dourado Principal Metálico */}
        <linearGradient id={`goldGradMain-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D2" />
          <stop offset="25%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="75%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Gradiente Dourado Claro para Brilho Reflexivo */}
        <linearGradient id={`goldHighlight-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
        </linearGradient>

        {/* Gradiente Dourado Bronze para Profundidade */}
        <radialGradient id={`goldShieldSphere-${filterId}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#B45309" />
          <stop offset="90%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#291205" />
        </radialGradient>

        {/* Gradiente da Crista / Pluma */}
        <linearGradient id={`crestGrad-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="20%" stopColor="#FBBF24" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Gradiente das sombras internas da viseira */}
        <linearGradient id={`visorShadow-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#180B02" />
          <stop offset="100%" stopColor="#050201" />
        </linearGradient>

        {/* Filtro de Glow Dourado */}
        <filter id={`goldGlowFilter-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. ESCUDO ESPARTANO CIRCULAR (HOPLON) */}
      {/* Borda Exterior Esculpida */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill={`url(#goldShieldSphere-${filterId})`}
        stroke={`url(#goldGradMain-${filterId})`}
        strokeWidth="2.5"
      />

      {/* Aro Interno chanfrado */}
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke={`url(#goldGradMain-${filterId})`}
        strokeWidth="1.2"
        strokeDasharray="4 2"
        opacity="0.85"
      />

      {/* Tachas / Rebites de Bronze e Ouro ao redor do escudo (8 rebites) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + 44.5 * Math.cos(rad);
        const cy = 50 + 44.5 * Math.sin(rad);
        return (
          <g key={idx}>
            <circle cx={cx} cy={cy} r="1.6" fill="#FFFBEB" />
            <circle cx={cx} cy={cy} r="1.1" fill={`url(#goldGradMain-${filterId})`} />
          </g>
        );
      })}

      {/* Brilho Superior Curvado no Escudo */}
      <path
        d="M 12 45 A 42 42 0 0 1 88 45 A 43 25 0 0 0 12 45 Z"
        fill={`url(#goldHighlight-${filterId})`}
        opacity="0.25"
      />

      {/* Fundo do centro do escudo para destacar o elmo */}
      <circle
        cx="50"
        cy="51"
        r="32"
        fill="black"
        opacity="0.3"
      />

      {/* 2. CAPACETE ESPARTANO DOURADO (CORINTHIAN HELMET) */}
      {/* Crista / Penacho Superior Dourado (Transversal Espartana) */}
      <g>
        {/* Base da Crista curvada */}
        <path
          d="M 28 26 C 36 12 64 12 72 26 C 66 22 34 22 28 26 Z"
          fill={`url(#crestGrad-${filterId})`}
          stroke="#451A03"
          strokeWidth="0.8"
        />

        {/* Cerdas / Fios da Pluma Espartana */}
        <path
          d="M 32 23 C 38 15 62 15 68 23"
          stroke="#FFFBEB"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M 36 21 C 42 16 58 16 64 21"
          stroke={`url(#goldGradMain-${filterId})`}
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Suporte da Crista (Crista Holder sobre o topo do elmo) */}
        <path
          d="M 43 23 L 50 18 L 57 23 L 55 27 L 45 27 Z"
          fill={`url(#goldGradMain-${filterId})`}
          stroke="#78350F"
          strokeWidth="0.6"
        />
      </g>

      {/* Cúpula do Capacete (Calota Craniana) */}
      <path
        d="M 33 39 C 33 26 40 24 50 24 C 60 24 67 26 67 39 C 67 47 68 53 70 59 C 69 66 65 74 61 78 L 57 78 L 54 58 L 50 58 L 46 58 L 43 78 L 39 78 C 35 74 31 66 30 59 C 32 53 33 47 33 39 Z"
        fill={`url(#goldShieldSphere-${filterId})`}
        stroke={`url(#goldGradMain-${filterId})`}
        strokeWidth="1.2"
      />

      {/* Linha de Fronte reforçada do Elmo (Brow Band) */}
      <path
        d="M 33 41 C 42 37 58 37 67 41 L 66 44 C 58 40 42 40 34 44 Z"
        fill={`url(#goldGradMain-${filterId})`}
        stroke="#78350F"
        strokeWidth="0.5"
      />

      {/* Narigueira Pontiaguda (Nose Guard) Espartana */}
      <path
        d="M 48 42 L 52 42 L 53 64 L 50 67 L 47 64 Z"
        fill={`url(#goldGradMain-${filterId})`}
        stroke="#451A03"
        strokeWidth="0.7"
      />

      {/* Aberturas dos Olhos Espartanos (Visor Slits amendoados e agressivos) */}
      {/* Olho Esquerdo */}
      <path
        d="M 36 45 C 41 44 46 47 47 50 C 44 51 39 50 36 45 Z"
        fill={`url(#visorShadow-${filterId})`}
        stroke={`url(#goldGradMain-${filterId})`}
        strokeWidth="0.6"
      />
      {/* Olho Direito */}
      <path
        d="M 64 45 C 59 44 54 47 53 50 C 56 51 61 50 64 45 Z"
        fill={`url(#visorShadow-${filterId})`}
        stroke={`url(#goldGradMain-${filterId})`}
        strokeWidth="0.6"
      />

      {/* Brilho dourado/fogo interior nos olhos (Espírito Espartano) */}
      <circle cx="43" cy="48" r="0.9" fill="#FDE68A" />
      <circle cx="57" cy="48" r="0.9" fill="#FDE68A" />

      {/* Bochecheiras e Abertura em "T" Invertida da Boca */}
      <path
        d="M 47 55 L 47 65 L 43 76 C 41 73 38 67 37 60 C 41 60 45 58 47 55 Z"
        fill={`url(#goldGradMain-${filterId})`}
        stroke="#592507"
        strokeWidth="0.6"
      />
      <path
        d="M 53 55 L 53 65 L 57 76 C 59 73 62 67 63 60 C 59 60 55 58 53 55 Z"
        fill={`url(#goldGradMain-${filterId})`}
        stroke="#592507"
        strokeWidth="0.6"
      />

      {/* Abertura Central da Respiração / Boca (Espaço Escuro em T) */}
      <path
        d="M 47 64 L 53 64 L 54 77 L 50 78 L 46 77 Z"
        fill={`url(#visorShadow-${filterId})`}
        opacity="0.9"
      />

      {/* Reflexos Metálicos de Realce no Nariz e Bochechas */}
      <line x1="50" y1="43" x2="50" y2="62" stroke="#FFFBEB" strokeWidth="0.8" opacity="0.8" />
      <path
        d="M 37 38 C 39 31 46 27 50 27"
        stroke="#FFFBEB"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Estrela de 4 pontas de brilho cintilante no topo do elmo */}
      <path
        d="M 50 14 Q 50 17 53 17 Q 50 17 50 20 Q 50 17 47 17 Q 50 17 50 14 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

/**
 * Banner VIP Nobre com Escudo e Capacete Dourado Espartano
 * Utilizado dentro do painel do cliente (AccountModal.tsx).
 */
export const SpartanFounderBanner: React.FC<{
  screens?: number;
  quality?: string;
  className?: string;
}> = ({ screens = 3, quality = 'Full HD & 4K Ultra HD VIP', className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-yellow-950/40 to-black shadow-xl shadow-amber-950/50 ${className}`}
    >
      {/* Luz ambiente dourada de fundo */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-yellow-600/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        {/* Escudo com Capacete Dourado */}
        <div className="relative shrink-0 flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-amber-500/20 to-black/60 border border-amber-500/40 shadow-inner">
          <SpartanGoldenHelmetShield size={58} glow={true} />
        </div>

        {/* Textos de Honra e Status VIP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm">
              🛡️ VIP FUNDADOR
            </span>
            <span className="text-[10px] text-amber-300 font-extrabold tracking-wide uppercase">
              Membro Honorário Exclusivo
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
            Plano Spartan Fundador
          </h3>

          <p className="text-xs text-amber-200/90 leading-relaxed mt-1">
            Você possui a credencial de <strong className="text-amber-300">Pioneiro Spartan</strong> com condição especial concedida diretamente pela diretoria.
          </p>

          <div className="mt-3 flex items-center justify-center sm:justify-start gap-2.5 sm:gap-4 text-[11px] font-bold text-gray-200 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300">
              🛡️ <strong>{screens} Telas</strong> Simultâneas
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300">
              ✨ {quality}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300">
              👑 Suporte VIP Prioritário
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Pílula Compacta com Escudo e Capacete Dourado Espartano
 * Para o Topbar e Sidebar do cliente.
 */
export const SpartanFounderPill: React.FC<{
  compact?: boolean;
  className?: string;
}> = ({ compact = false, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-950/90 to-yellow-950/70 border border-amber-500/50 text-amber-300 font-black text-[10px] shadow-sm shadow-amber-950/50 ${className}`}
      title="Membro Spartan Fundador (VIP Exclusivo)"
    >
      <SpartanGoldenHelmetShield size={compact ? 14 : 16} glow={false} />
      <span>FUNDADOR</span>
    </span>
  );
};

export default SpartanGoldenHelmetShield;
