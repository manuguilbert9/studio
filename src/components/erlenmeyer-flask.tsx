
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

  useEffect(() => {
    const animationTimeout = setTimeout(() => setFillHeight(score), 100);
    return () => clearTimeout(animationTimeout);
  }, [score]);
  
  const liquidColor = getLiquidColor(score);
  const isPerfectScore = score >= 100;

  const viewBoxWidth = 120;
  const viewBoxHeight = 150;
  
  // Erlenmeyer shape path
  const flaskPath = "M 30,0 H 90 L 120,150 H 0 Z";
  
  const liquidY = viewBoxHeight - (viewBoxHeight * fillHeight) / 100;
  const liquidHeight = (viewBoxHeight * fillHeight) / 100;

  const textColor = fillHeight < 40 ? 'hsl(var(--foreground))' : 'hsl(var(--accent-foreground))';
  const textY = fillHeight < 20 ? liquidY - 10 : liquidY + liquidHeight / 2 + 10;

  return (
    <div className="relative flex flex-col items-center justify-center mb-6">
      <svg width="120" height="150" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        <defs>
          <clipPath id="erlenmeyerClip">
            <path d={flaskPath} />
          </clipPath>
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
          fill="hsl(var(--card))"
        />

        {/* Liquid */}
        <g clipPath="url(#erlenmeyerClip)">
            <rect
                x="0"
                y={liquidY}
                width={viewBoxWidth}
                height={liquidHeight}
                fill={isPerfectScore ? "url(#highlightGradientFlask)" : liquidColor}
                style={{ 
                    transition: 'y 1.5s ease-out, height 1.5s ease-out',
                }}
            />
        </g>
        
        {/* Score Text */}
        <text
          x={viewBoxWidth / 2}
          y={textY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="24"
          fontWeight="bold"
          fill={textColor}
          className="font-headline"
          style={{ transition: 'y 1.5s ease-out' }}
        >
          {Math.round(fillHeight)}%
        </text>
      </svg>
    </div>
  );
}
