
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ErlenmeyerFlaskProps {
  score: number;
}

const getLiquidColor = (score: number) => {
  if (score >= 100) return 'highlight';

  const colors = [
    { score: 0, color: { r: 239, g: 68, b: 68 } },      // red-500
    { score: 50, color: { r: 234, g: 179, b: 8 } },   // yellow-500
    { score: 100, color: { r: 34, g: 197, b: 94 } },   // green-500
  ];

  let lowerBound = colors[0];
  let upperBound = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (score >= colors[i].score && score <= colors[i + 1].score) {
      lowerBound = colors[i];
      upperBound = colors[i + 1];
      break;
    }
  }

  const scoreRange = upperBound.score - lowerBound.score;
  const t = scoreRange === 0 ? 0 : (score - lowerBound.score) / scoreRange;

  const r = Math.round(lowerBound.color.r + t * (upperBound.color.r - lowerBound.color.r));
  const g = Math.round(lowerBound.color.g + t * (upperBound.color.g - lowerBound.color.g));
  const b = Math.round(lowerBound.color.b + t * (upperBound.color.b - lowerBound.color.b));

  return `rgb(${r}, ${g}, ${b})`;
};

export function ErlenmeyerFlask({ score }: ErlenmeyerFlaskProps) {
  const [fillHeight, setFillHeight] = useState(0);
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    const animationTimeout = setTimeout(() => setFillHeight(score), 100);

    const handleScroll = () => {
      setWaveOffset(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
        clearTimeout(animationTimeout);
        window.removeEventListener('scroll', handleScroll);
    };
  }, [score]);
  
  const liquidColor = getLiquidColor(score);
  const isPerfectScore = score >= 100;

  const viewBoxWidth = 120;
  const viewBoxHeight = 150;
  
  const flaskPath = "M 30,0 H 90 L 120,150 H 0 Z";
  
  const liquidY = viewBoxHeight - (viewBoxHeight * fillHeight) / 100;
  
  const waveAmplitude = fillHeight > 0 ? 2 : 0;
  const waveLength = viewBoxWidth;

  const liquidPath = `
    M 0 ${liquidY + waveAmplitude * Math.sin(waveOffset / 10)}
    C ${waveLength / 4} ${liquidY + waveAmplitude * Math.sin(waveOffset / 10 + Math.PI / 2)},
      ${waveLength * 3 / 4} ${liquidY + waveAmplitude * Math.sin(waveOffset / 10 - Math.PI / 2)},
      ${waveLength} ${liquidY + waveAmplitude * Math.sin(waveOffset / 10 + Math.PI)}
    L ${viewBoxWidth},${viewBoxHeight}
    L 0,${viewBoxHeight}
    Z
  `;

  const textColor = fillHeight < 40 ? 'hsl(var(--foreground))' : 'hsl(var(--accent-foreground))';
  const textY = liquidY + ((viewBoxHeight * fillHeight) / 100) / 2 + 5;
  const textStyle: React.CSSProperties = isPerfectScore ? {} : { color: textColor };

  return (
    <div className="relative flex flex-col items-center justify-center mb-6">
      <svg width="120" height="150" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        <defs>
          <clipPath id="erlenmeyerClip">
            <path d={flaskPath} />
          </clipPath>
           <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                <stop offset="20%" stopColor="white" stopOpacity="0.4" />
                <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.2" />
            </linearGradient>
           {isPerfectScore && (
            <linearGradient id="highlightGradientFlask" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
                <stop offset="100%" style={{ stopColor: 'hsl(270, 90%, 65%)' }} />
            </linearGradient>
          )}
        </defs>

        {/* Flask outline */}
        <path
          d={flaskPath}
          stroke="hsl(var(--foreground) / 0.5)"
          strokeWidth="3"
          fill="transparent"
        />

        {/* Liquid */}
        <g clipPath="url(#erlenmeyerClip)">
            <path
                d={liquidPath}
                fill={isPerfectScore ? "url(#highlightGradientFlask)" : liquidColor}
                style={{ 
                    transition: 'd 1.5s ease-out',
                }}
            />
             {/* Bubbles for perfect score */}
            {isPerfectScore && (
                <g className="bubbles">
                    {[...Array(25)].map((_, i) => {
                        const size = Math.random() * 3 + 1;
                        const x = Math.random() * (viewBoxWidth - size * 2) + size;
                        const delay = Math.random() * 5;
                        const duration = Math.random() * 4 + 3;
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={viewBoxHeight + 10}
                                r={size}
                                fill="white"
                                style={{
                                    animation: `erlenmeyer-bubble-rise ${duration}s ease-in-out ${delay}s infinite`,
                                    opacity: 0,
                                }}
                            />
                        )
                    })}
                </g>
            )}
        </g>
        
        {/* Glass highlight effect */}
        <path
            d={flaskPath}
            fill="url(#glassGradient)"
        />

        {/* Score Text */}
        <text
          x={viewBoxWidth / 2}
          y={textY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="24"
          fontWeight="bold"
          fill={textColor}
          className={cn("font-headline transition-all duration-[1500ms] ease-out", isPerfectScore && "fill-transparent") /* Hide original text fill */}
          style={{ transition: 'y 1.5s ease-out' }}
        >
          {Math.round(fillHeight)}%
        </text>
         {isPerfectScore && (
          <text
            x={viewBoxWidth / 2}
            y={textY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="24"
            fontWeight="bold"
            className="font-headline bg-gradient-highlight text-transparent bg-clip-text"
            style={{ fill: 'url(#highlightGradientFlask)', transition: 'y 1.5s ease-out' }}
          >
            {Math.round(fillHeight)}%
          </text>
        )}
      </svg>
       <style jsx>{`
        @keyframes erlenmeyer-bubble-rise {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          90% {
            transform: translateY(-${viewBoxHeight + 10}px) translateX(${Math.sin(Math.random() * Math.PI) * 10}px);
          }
          100% {
            transform: translateY(-${viewBoxHeight + 20}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
