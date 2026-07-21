import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-12 h-12" }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
    >
      <defs>
        <filter id="logo-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Glowing background elements (semi-transparent, wider stroke) */}
      <g stroke="#2962ff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" filter="url(#logo-neon-glow)">
        <path d="M 48 24 Q 48 52 76 52 Q 48 52 48 80 Q 48 52 20 52 Q 48 52 48 24 Z" />
        <path d="M 70 26 H 86 M 78 18 V 34" />
        <circle cx="20" cy="74" r="7" />
      </g>

      {/* Middle glow elements (more intense blue, medium stroke) */}
      <g stroke="#2979ff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8">
        <path d="M 48 24 Q 48 52 76 52 Q 48 52 48 80 Q 48 52 20 52 Q 48 52 48 24 Z" />
        <path d="M 70 26 H 86 M 78 18 V 34" />
        <circle cx="20" cy="74" r="7" />
      </g>

      {/* Inner bright core elements (light blue/white core, thin stroke) */}
      <g stroke="#e3f2fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 48 24 Q 48 52 76 52 Q 48 52 48 80 Q 48 52 20 52 Q 48 52 48 24 Z" />
        <path d="M 70 26 H 86 M 78 18 V 34" />
        <circle cx="20" cy="74" r="7" />
      </g>
    </svg>
  );
}
