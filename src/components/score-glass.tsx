'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreGlassProps {
  score: number;
}

// Function to get color based on score
const getLiquidColor = (score: number) => {
  if (score >= 100) return 'rainbow';

  const colors = [
    { score: 0, color: { r: 255, g: 0, b: 0 } },      // Red
    { score: 20, color: { r: 255, g: 165, b: 0 } },   // Orange
    { score: 40, color: { r: 255, g: 255, b: 0 } },   // Yellow
    { score: 60, color: { r: 0, g: 128, b: 0 } },     // Green
    { score: 80, color: { r: 255, g: 215, b: 0 } },   // Gold
    { score: 99, color: { r: 255, g: 215, b: 0 } },   // Gold up to 99
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

export function ScoreGlass({ score }: ScoreGlassProps) {
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    const animationTimeout = setTimeout(() => setFillHeight(score), 100);
    return () => clearTimeout(animationTimeout);
  }, [score]);
  
  const liquidColor = getLiquidColor(score);
  const isRainbow = liquidColor === 'rainbow';

  const glassHeight = 150;
  const glassWidth = 100;
  const liquidY = glassHeight - (glassHeight * fillHeight) / 100;
  const liquidHeight = (glassHeight * fillHeight) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <svg width={glassWidth + 20} height={glassHeight + 20} viewBox={`-10 -10 ${glassWidth + 20} ${glassHeight + 20}`}>
        <defs>
          <clipPath id="glassClip">
            <path d={`M0,0 L10,${glassHeight} L${glassWidth - 10},${glassHeight} L${glassWidth},0 Z`} />
          </clipPath>
           {isRainbow && (
            <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'red' }} />
              <stop offset="20%" style={{ stopColor: 'orange' }} />
              <stop offset="40%" style={{ stopColor: 'yellow' }} />
              <stop offset="60%" style={{ stopColor: 'green' }} />
              <stop offset="80%" style={{ stopColor: 'blue' }} />
              <stop offset="100%" style={{ stopColor: 'purple' }} />
            </linearGradient>
          )}
        </defs>

        {/* Glass outline */}
        <path
          d={`M0,0 L10,${glassHeight} L${glassWidth - 10},${glassHeight} L${glassWidth},0 Z`}
          stroke="hsl(var(--foreground) / 0.5)"
          strokeWidth="3"
          fill="hsl(var(--card))"
        />

        {/* Liquid */}
        <g clipPath="url(#glassClip)">
            <rect
                x="0"
                y={liquidY}
                width={glassWidth}
                height={liquidHeight}
                fill={isRainbow ? "url(#rainbowGradient)" : liquidColor}
                className={cn(isRainbow && 'animate-shimmer')}
                style={{ 
                    transition: 'y 1.5s ease-out, height 1.5s ease-out',
                    backgroundSize: isRainbow ? '200% 200%' : undefined,
                }}
            />
        </g>
        
        {/* Score Text */}
        <text
          x={glassWidth / 2}
          y={liquidY - 10 > 20 ? liquidY - 10 : 20}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={isRainbow ? 'hsl(var(--primary))' : 'hsl(var(--accent-foreground))'}
          className="font-headline"
          style={{ transition: 'y 1.5s ease-out' }}
        >
          {Math.round(fillHeight)}%
        </text>
      </svg>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-shimmer {
          animation: shimmer 4s linear infinite;
        }
      `}</style>
    </div>
  );
}