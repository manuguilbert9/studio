
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

  const tubeHeight = 75; // Reduced by 50%
  const tubeWidth = 30; // Reduced by 50%
  const tubeRadius = tubeWidth / 2;
  const liquidY = tubeHeight - (tubeHeight * fillHeight) / 100;
  const liquidHeight = (tubeHeight * fillHeight) / 100;

  const tubePath = `M0,0 V${tubeHeight-tubeRadius} A${tubeRadius},${tubeRadius} 0 0 0 ${tubeWidth},${tubeHeight-tubeRadius} V0 Z`;
  
  const textStyle: React.CSSProperties = isPerfectScore ? {} : { color: liquidColor };

  return (
    <div className="relative flex flex-col items-center justify-center my-2 gap-1">
      <svg width={tubeWidth + 10} height={tubeHeight + 10} viewBox={`-5 -5 ${tubeWidth + 10} ${tubeHeight + 10}`}>
        <defs>
          <clipPath id="tubeClip">
            <path d={tubePath} />
          </clipPath>
           <linearGradient id="glassGradientTube" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                <stop offset="20%" stopColor="white" stopOpacity="0.4" />
                <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.2" />
            </linearGradient>
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
          strokeWidth="2"
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

        {/* Glass highlight effect */}
        <path
            d={tubePath}
            fill="url(#glassGradientTube)"
        />

      </svg>
      <p 
        className={cn(
            "font-headline text-2xl font-bold",
            isPerfectScore && "bg-gradient-highlight text-transparent bg-clip-text"
        )}
        style={textStyle}
       >
        {Math.round(score)}%
      </p>
    </div>
  );
}
