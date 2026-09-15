import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 28,
  className = '',
  showText = true,
  subtitle,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Geometric Cybersecurity Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="SurakshaScore Logo"
      >
        {/* Outer Shield Polygon (Sharp Precision) */}
        <polygon
          points="16,2 29,7 29,17 16,30 3,17 3,7"
          fill="#1b1c1a"
        />
        {/* Inner Geometric Shield Core */}
        <polygon
          points="16,5.5 26,9.5 26,16 16,26.5 6,16 6,9.5"
          fill="#faf9f5"
        />
        {/* Modern Interlocking 'S' Security Core in Carbon & Emerald */}
        <path
          d="M19.5 11.5 H12.5 C11.5 11.5 10.5 12.3 10.5 13.5 C10.5 14.7 11.5 15.5 12.5 15.5 H19.5 C20.5 15.5 21.5 16.3 21.5 17.5 C21.5 18.7 20.5 19.5 19.5 19.5 H12"
          stroke="#1b1c1a"
          strokeWidth="2.4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Dynamic Verification Dot */}
        <rect
          x="14.5"
          y="21.5"
          width="3"
          height="3"
          fill="#15803d"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold tracking-tight text-on-surface font-sans">
              SurakshaScore
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-surface-container-high text-on-surface-variant uppercase tracking-widest border border-outline-variant/60">
              PSS
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-on-surface-variant font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
