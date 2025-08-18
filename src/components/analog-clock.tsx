
'use client';

import { cn } from "@/lib/utils";

interface AnalogClockProps {
  hour: number;
  minute: number;
  showMinuteCircle?: boolean;
  matchColors?: boolean;
}

export function AnalogClock({ hour, minute, showMinuteCircle = false, matchColors = false }: AnalogClockProps) {
  const hourAngle = (hour % 12 + minute / 60) * 30;
  const minuteAngle = minute * 6;

  return (
    <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto my-4">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Clock Face */}
        <circle cx="100" cy="100" r="95" fill="var(--card)" stroke="var(--foreground)" strokeWidth="3" filter="url(#shadow)" />

        {/* Hour and Minute Markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const x1 = 100 + 85 * Math.cos(angle * Math.PI / 180);
          const y1 = 100 + 85 * Math.sin(angle * Math.PI / 180);
          const x2 = 100 + 92 * Math.cos(angle * Math.PI / 180);
          const y2 = 100 + 92 * Math.sin(angle * Math.PI / 180);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted-foreground)" strokeWidth="2" />;
        })}
        
        {/* Optional Minute Circle */}
        {showMinuteCircle && Array.from({ length: 60 }).map((_, i) => {
          const angle = i * 6;
          const isHourMark = i % 5 === 0;
          const x1 = 100 + (isHourMark ? 88 : 90) * Math.cos(angle * Math.PI / 180);
          const y1 = 100 + (isHourMark ? 88 : 90) * Math.sin(angle * Math.PI / 180);
          const x2 = 100 + 92 * Math.cos(angle * Math.PI / 180);
          const y2 = 100 + 92 * Math.sin(angle * Math.PI / 180);
          return <line key={`min-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted-foreground)" strokeWidth={isHourMark ? 2 : 1} />;
        })}


        {/* Hour Numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i - 2) * 30;
          const num = i + 1;
          const x = 100 + 60 * Math.cos(angle * Math.PI / 180);
          const y = 100 + 60 * Math.sin(angle * Math.PI / 180);
          return (
            <text 
              key={`hour-${num}`}
              x={x} 
              y={y} 
              dy=".3em"
              textAnchor="middle"
              className={cn("text-xl font-numbers font-bold fill-current",
                 matchColors ? "text-destructive" : "text-foreground"
              )}
            >
              {num}
            </text>
          )
        })}
        
         {/* Optional Minute Numbers */}
        {showMinuteCircle && Array.from({ length: 12 }).map((_, i) => {
          const angle = (i - 2) * 30;
           const num = (i + 1) * 5 % 60;
          const x = 100 + 78 * Math.cos(angle * Math.PI / 180);
          const y = 100 + 78 * Math.sin(angle * Math.PI / 180);
          return (
            <text 
              key={`min-num-${i}`}
              x={x} 
              y={y} 
              dy=".3em"
              textAnchor="middle"
              className={cn("text-xs font-numbers font-bold fill-current",
                 matchColors ? "text-ring" : "text-muted-foreground"
              )}
            >
              {num === 0 ? "00" : num}
            </text>
          )
        })}


        {/* Hour Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 40 * Math.cos((hourAngle - 90) * Math.PI / 180)}
          y2={100 + 40 * Math.sin((hourAngle - 90) * Math.PI / 180)}
          stroke={matchColors ? "hsl(var(--destructive))" : "hsl(var(--foreground))"}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Minute Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 75 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
          y2={100 + 75 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
          stroke={matchColors ? "hsl(var(--ring))" : "hsl(var(--foreground))"}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Center Pin */}
        <circle cx="100" cy="100" r="5" fill="var(--foreground)" />
      </svg>
    </div>
  );
}
