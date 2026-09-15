import React from 'react';

interface ScoreRingProps {
  score: number;
  color?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  color = '#16a34a',
}) => {
  // Circular SVG ring dimensions
  const size = 184;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Outer subtle reference track
  const outerRadius = radius + 6;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        {/* Subtle Outer Reference Hairline */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          stroke="#E0DAD0"
          strokeWidth={1}
          strokeDasharray="2 3"
          fill="transparent"
          className="opacity-70"
        />

        {/* Muted Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#ECE7DD"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Active Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Centered Numeral & Technical Instrument Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center">
          <span className="text-[64px] font-bold text-neutral-900 leading-none tracking-tight tabular-nums font-sans">
            {score}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mt-1 font-sans">
          Hygiene Index
        </span>
      </div>
    </div>
  );
};
