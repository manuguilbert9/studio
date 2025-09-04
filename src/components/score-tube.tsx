
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreTubeProps {
  score: number;
}

// Function to get color based on score
const getLiquidColor = (score: number) => {
  if (score >= 100) return 'rainbow';

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


export function ScoreTube({ score }: ScoreTubeProps) {
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    const animationTimeout = setTimeout(() => setFillHeight(score), 100);
    return () => clearTimeout(animationTimeout);
  }, [score]);
  
  const liquidColor = getLiquidColor(score);
  const isPerfectScore = score >= 100;

  const tubeHeight = 150;
  const tubeWidth = 60;
  const tubeRadius = tubeWidth / 2;
  const liquidY = tubeHeight - (tubeHeight * fillHeight) / 100;
  const liquidHeight = (tubeHeight * fillHeight) / 100;

  const tubePath = `M0,0 V${tubeHeight-tubeRadius} A${tubeRadius},${tubeRadius} 0 0 0 ${tubeWidth},${tubeHeight-tubeRadius} V0 Z`;

  // Determine text color and position
  const textColor = fillHeight < 40 ? 'hsl(var(--foreground))' : 'hsl(var(--accent-foreground))';
  const textY = fillHeight < 20 ? liquidY - 10 : liquidY + 25;


  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <svg width={tubeWidth + 20} height={tubeHeight + 20} viewBox={`-10 -10 ${tubeWidth + 20} ${tubeHeight + 20}`}>
        <defs>
          <clipPath id="tubeClip">
            <path d={tubePath} />
          </clipPath>
           {isPerfectScore && (
            <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
              <stop offset="100%" style={{ stopColor: 'hsl(270, 90%, 65%)' }} />
            </linearGradient>
          )}
        </defs>

        {/* Tube outline */}
        <path
          d={tubePath}
          stroke="hsl(var(--foreground) / 0.5)"
          strokeWidth="3"
          fill="hsl(var(--card))"
        />

        {/* Liquid */}
        <g clipPath="url(#tubeClip)">
            <rect
                x="0"
                y={liquidY}
                width={tubeWidth}
                height={liquidHeight}
                fill={isPerfectScore ? "url(#highlightGradient)" : liquidColor}
                style={{ 
                    transition: 'y 1.5s ease-out, height 1.5s ease-out',
                }}
            />
        </g>
        
        {/* Score Text */}
        <text
          x={tubeWidth / 2}
          y={textY}
          textAnchor="middle"
          fontSize="20"
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
