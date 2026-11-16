'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function StellarLogoIcon({ size = 34, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Upper Red Ribbon Main Body */}
        <linearGradient id="stellarRedBody" x1="20%" y1="10%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="45%" stopColor="#e11d48" />
          <stop offset="85%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Upper Red Ribbon Highlight Ridge (Folded 3D Edge) */}
        <linearGradient id="stellarRedRidge" x1="15%" y1="15%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Upper Red Ribbon Deep Shadow */}
        <linearGradient id="stellarRedShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>

        {/* Lower Charcoal Ribbon Main Body */}
        <linearGradient id="stellarDarkBody" x1="15%" y1="20%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="80%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>

        {/* Lower Charcoal Ribbon Ridge / Light Facet */}
        <linearGradient id="stellarDarkRidge" x1="20%" y1="10%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Lower Charcoal Shadow */}
        <linearGradient id="stellarDarkShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Dimensional Glow / Drop Shadow */}
        <filter id="stellarDrop" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#090d16" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#stellarDrop)">
        {/* 1. LOWER CHARCOAL RIBBON (Interlocking bottom wing & spine) */}
        <path
          d="M31 28
             C 26 39, 28 50, 36 58
             C 43 65, 52 70, 58 77
             C 63 83, 64 89, 58 93
             C 50 97, 39 94, 31 84
             C 25 75, 25 72, 25 72
             C 32 78, 41 81, 48 79
             C 55 77, 56 71, 49 64
             C 42 57, 30 49, 27 37
             C 25 31, 28 27, 31 28 Z"
          fill="url(#stellarDarkShadow)"
        />
        <path
          d="M31 28
             C 27 38, 30 48, 39 55
             C 48 62, 58 68, 62 76
             C 65 83, 62 89, 55 91
             C 46 93, 36 88, 25 72
             C 33 82, 44 85, 51 83
             C 58 81, 59 74, 52 66
             C 44 58, 32 50, 28 38
             C 26 32, 28 27, 31 28 Z"
          fill="url(#stellarDarkBody)"
        />
        <path
          d="M 31 28
             C 28 37, 33 46, 42 53
             C 50 59, 57 65, 60 73
             C 58 68, 51 62, 43 56
             C 35 49, 29 42, 28 35
             C 27 31, 29 28, 31 28 Z"
          fill="url(#stellarDarkRidge)"
        />

        {/* 2. UPPER CRIMSON RED RIBBON (Interlocking top wing & swoosh) */}
        <path
          d="M 75 28
             C 67 17, 53 12, 40 16
             C 34 18, 33 24, 40 26
             C 49 28, 59 32, 67 40
             C 75 48, 76 60, 71 72
             C 71 72, 74 65, 75 58
             C 76 50, 71 42, 62 35
             C 54 28, 43 23, 47 17
             C 55 13, 67 17, 75 28 Z"
          fill="url(#stellarRedShadow)"
        />
        <path
          d="M 75 28
             C 66 16, 51 13, 41 17
             C 35 20, 36 25, 43 27
             C 52 30, 63 35, 69 44
             C 75 54, 73 65, 71 72
             C 73 64, 73 54, 68 45
             C 61 36, 50 30, 42 26
             C 37 23, 40 17, 47 15
             C 58 13, 68 18, 75 28 Z"
          fill="url(#stellarRedBody)"
        />
        <path
          d="M 75 28
             C 66 18, 54 16, 44 20
             C 38 22, 39 26, 46 28
             C 55 31, 64 36, 68 45
             C 66 38, 58 32, 49 28
             C 43 25, 43 21, 48 18
             C 57 15, 67 19, 75 28 Z"
          fill="url(#stellarRedRidge)"
        />

        {/* 3. CUSTOM STELLAR SPARKLE ACCENT */}
        <path
          d="M 79 7 L 80.5 11.5 L 85 13 L 80.5 14.5 L 79 19 L 77.5 14.5 L 73 13 L 77.5 11.5 Z"
          fill="#f43f5e"
        />
      </g>
    </svg>
  );
}

export default function BrandLogo({ 
  size = 'md', 
  href = '/', 
  textColor = '',
  className = '',
  hideText = false,
  logoSrc = '/tab-icon.png'
}) {
  const containerSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const isDark = textColor && textColor.includes('white');
  const activeLogo = isDark && (logoSrc === '/tab-icon.png' || logoSrc === '/logo.png') ? '/vestro-logo-white.png' : logoSrc;

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Official Main Brand Logo Container */}
      <div className={`${containerSize} relative shrink-0`}>
        <Image
          src={activeLogo}
          alt="Vestro Wear House Logo"
          fill
          className="object-contain transition-transform group-hover:scale-105 duration-200"
          priority
        />
      </div>

      {!hideText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-[0.18em] uppercase leading-none ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base sm:text-lg'
          } ${isDark ? 'text-white' : 'text-black'}`}>
            VESTRO
          </span>
          <span className={`font-bold tracking-[0.26em] uppercase text-[8px] sm:text-[9px] mt-0.5 leading-none ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            WEAR HOUSE
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Vestro Wear House Home">
        {content}
      </Link>
    );
  }

  return content;
}
