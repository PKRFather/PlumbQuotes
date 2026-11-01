import React from 'react';
import { LogoType } from '../types';

interface LetterheadLogoProps {
  type: LogoType;
  customUrl?: string;
  size?: number; // size in pixels
  frame?: 'circle' | 'double_ring' | 'rounded' | 'square' | 'none';
  primaryColor?: string;
  className?: string;
}

export const LetterheadLogo: React.FC<LetterheadLogoProps> = ({
  type,
  customUrl,
  size = 80,
  frame = 'none',
  primaryColor = '#0f172a',
  className = '',
}) => {
  if (type === 'none') {
    return null;
  }

  // Frame wrapping styles
  const frameClasses = (() => {
    switch (frame) {
      case 'circle':
        return 'rounded-full border-2 border-slate-800 p-1 bg-white shadow-sm';
      case 'double_ring':
        return 'rounded-full border-[3px] border-slate-900 ring-2 ring-slate-700 ring-offset-2 p-1 bg-white shadow-sm';
      case 'rounded':
        return 'rounded-2xl border-2 border-slate-300 p-1.5 bg-white shadow-sm';
      case 'square':
        return 'border-2 border-slate-800 p-1 bg-white shadow-sm';
      case 'none':
      default:
        return '';
    }
  })();

  const renderIconContent = () => {
    if (type === 'custom' && customUrl) {
      return (
        <img
          src={customUrl}
          alt="Custom Logo"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="object-contain"
        />
      );
    }

    if (type === 'shiva') {
      return (
        <img
          src="/shiva-logo.svg"
          alt="Lord Shiva Medallion"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="object-contain"
        />
      );
    }

    if (type === 'pipe_wrench') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          className="text-slate-900"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Circular Seal Background */}
          <circle cx="50" cy="50" r="46" stroke={primaryColor} strokeWidth="3" />
          <circle cx="50" cy="50" r="41" stroke={primaryColor} strokeWidth="1" strokeDasharray="3 3" />
          {/* Crossed Pipe & Pipe Wrench */}
          {/* Pipe diagonally */}
          <path d="M22 78 L78 22" stroke={primaryColor} strokeWidth="7" strokeLinecap="square" />
          <path d="M22 78 L78 22" stroke="#ffffff" strokeWidth="2.5" />
          <rect x="20" y="70" width="10" height="10" transform="rotate(-45 25 75)" fill={primaryColor} />
          <rect x="70" y="20" width="10" height="10" transform="rotate(-45 75 25)" fill={primaryColor} />
          {/* Heavy Pipe Wrench crossed */}
          <path d="M78 78 L38 38" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
          {/* Wrench Jaw */}
          <path d="M38 38 L28 28 C26 24 30 20 34 22 L44 32" stroke="#1e293b" strokeWidth="4" fill="#cbd5e1" />
          <path d="M26 24 L20 30 C18 34 22 38 26 36 L34 32" stroke="#1e293b" strokeWidth="4" fill="#cbd5e1" />
          {/* Adjustment knurl wheel */}
          <circle cx="44" cy="44" r="3.5" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.5" />
        </svg>
      );
    }

    if (type === 'tools') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="50" cy="50" r="46" stroke={primaryColor} strokeWidth="3" />
          {/* Faucet Tap */}
          <path d="M30 40 L52 40 C58 40 62 44 62 50 L62 60" stroke={primaryColor} strokeWidth="5" />
          {/* Faucet Handle */}
          <path d="M41 30 L41 40" stroke="#1e293b" strokeWidth="4" />
          <path d="M34 30 L48 30" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          {/* Droplet from tap */}
          <path
            d="M62 70 C62 70 57 76 57 80 C57 83 59 85 62 85 C65 85 67 83 67 80 C67 76 62 70 62 70 Z"
            fill="#0284c7"
            stroke="#0284c7"
            strokeWidth="1.5"
          />
          {/* Water Spurt Waves */}
          <path d="M24 64 Q32 58 40 64 T56 64" stroke="#38bdf8" strokeWidth="2.5" />
        </svg>
      );
    }

    if (type === 'water_drop') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="50" cy="50" r="46" stroke={primaryColor} strokeWidth="3" />
          {/* Hydro Droplet Badge */}
          <path
            d="M50 18 C50 18 30 42 30 58 C30 70 39 79 50 79 C61 79 70 70 70 58 C70 42 50 18 50 18 Z"
            fill="#e0f2fe"
            stroke={primaryColor}
            strokeWidth="3.5"
          />
          {/* Pipeline Ring inside droplet */}
          <circle cx="50" cy="60" r="10" stroke={primaryColor} strokeWidth="2.5" />
          <path d="M40 60 L60 60" stroke={primaryColor} strokeWidth="2.5" />
          <path d="M50 50 L50 70" stroke={primaryColor} strokeWidth="2.5" />
        </svg>
      );
    }

    if (type === 'contractor_shield') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shield Outline */}
          <path
            d="M50 14 L80 24 V50 C80 68 67 82 50 88 C33 82 20 68 20 50 V24 Z"
            fill="#f8fafc"
            stroke={primaryColor}
            strokeWidth="3.5"
          />
          {/* Inner Badge Star */}
          <polygon
            points="50,30 54,42 66,42 56,50 60,62 50,54 40,62 44,50 34,42 46,42"
            fill={primaryColor}
          />
          {/* Contractor letters banner */}
          <path d="M30 70 Q50 78 70 70" stroke={primaryColor} strokeWidth="2" />
        </svg>
      );
    }

    if (type === 'industrial_valve') {
      return (
        <svg
          viewBox="0 0 100 100"
          style={{ width: `${size}px`, height: `${size}px` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="50" cy="50" r="46" stroke={primaryColor} strokeWidth="3" />
          {/* Heavy Flanged Valve Body */}
          <path d="M24 45 L40 55 L24 65 Z" fill="#64748b" stroke={primaryColor} strokeWidth="2.5" />
          <path d="M76 45 L60 55 L76 65 Z" fill="#64748b" stroke={primaryColor} strokeWidth="2.5" />
          <circle cx="50" cy="55" r="9" fill="#059669" stroke={primaryColor} strokeWidth="2.5" />
          {/* Valve Stem & Handwheel */}
          <line x1="50" y1="46" x2="50" y2="28" stroke={primaryColor} strokeWidth="3.5" />
          <ellipse cx="50" cy="28" rx="16" ry="5" fill="#f8fafc" stroke={primaryColor} strokeWidth="2.5" />
          {/* Flange ends */}
          <line x1="24" y1="40" x2="24" y2="70" stroke={primaryColor} strokeWidth="3.5" />
          <line x1="76" y1="40" x2="76" y2="70" stroke={primaryColor} strokeWidth="3.5" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`shrink-0 flex items-center justify-center ${frameClasses} ${className}`}
    >
      {renderIconContent()}
    </div>
  );
};
