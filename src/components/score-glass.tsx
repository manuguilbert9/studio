'use client';

import { useEffect, useState } from 'react';

interface ScoreGlassProps {
  score: number;
}

export function ScoreGlass({ score }: ScoreGlassProps) {
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    // Animate the fill level when the component mounts or score changes
    const animationTimeout = setTimeout(() => setFillHeight(score), 100);
    return () => clearTimeout(animationTimeout);
  }, [score]);

  const glassHeight = 150;
  const glassWidth = 100;
  const liquidY = glassHeight - (glassHeight * fillHeight) / 100;
  const liquidHeight = (glassHeight * fillHeight) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      <svg width={glassWidth + 20} height={glassHeight + 20} viewBox={`-10 -10 ${glassWidth + 20} ${glassHeight + 20}`}>
        {/* Glass outline */}
        <path
          d={`M0,0 L10,${glassHeight} L${glassWidth - 10},${glassHeight} L${glassWidth},0 Z`}
          stroke="hsl(var(--foreground) / 0.5)"
          strokeWidth="3"
          fill="hsl(var(--card))"
        />

        {/* Liquid */}
        <defs>
          <clipPath id="glassClip">
            <path d={`M0,0 L10,${glassHeight} L${glassWidth - 10},${glassHeight} L${glassWidth},0 Z`} />
          </clipPath>
        </defs>

        <rect
          x="0"
          y={liquidY}
          width={glassWidth}
          height={liquidHeight}
          fill="hsl(var(--accent))"
          clipPath="url(#glassClip)"
          style={{ transition: 'y 1.5s ease-out, height 1.5s ease-out' }}
        />
        
        {/* Score Text */}
         <text
          x={glassWidth / 2}
          y={liquidY - 10 > 20 ? liquidY - 10 : 20}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="hsl(var(--accent-foreground))"
          className="font-headline"
          style={{ transition: 'y 1.5s ease-out' }}
        >
          {Math.round(fillHeight)}%
        </text>
      </svg>
    </div>
  );
}
