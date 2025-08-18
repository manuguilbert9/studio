
'use client';

import { cn } from "@/lib/utils";

interface AnalogClockProps {
  hour: number;
  minute: number;
  showMinuteCircle?: boolean;
  matchColors?: boolean;
}

export function AnalogClock({ hour, minute, showMinuteCircle = true, matchColors = true }: AnalogClockProps) {
  const hourAngle = (hour % 12 + minute / 60) * 30;
  const minuteAngle = minute * 6;
  
  const hourColor = "hsl(var(--destructive))";
  const minuteColor = "hsl(var(--ring))";

  return (
    <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto my-4">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Backgrounds */}
        <circle cx="100" cy="100" r="98" fill={minuteColor} fillOpacity="0.3" />
        <circle cx="100" cy="100" r="70" fill={hourColor} fillOpacity="0.5" />
        <circle cx="100" cy="100" r="70" stroke={hourColor} strokeWidth="1.5" fill="none" />

        {/* Minute Markers and Numbers */}
        {showMinuteCircle && Array.from({ length: 60 }).map((_, i) => {
          const angle = i * 6;
          const isFiveMinuteMark = i % 5 === 0;
          const x1 = 100 + (isFiveMinuteMark ? 80 : 84) * Math.cos((angle - 90) * Math.PI / 180);
          const y1 = 100 + (isFiveMinuteMark ? 80 : 84) * Math.sin((angle - 90) * Math.PI / 180);
          const x2 = 100 + 88 * Math.cos((angle - 90) * Math.PI / 180);
          const y2 = 100 + 88 * Math.sin((angle - 90) * Math.PI / 180);

          if (isFiveMinuteMark) {
            const numX = 100 + 90 * Math.cos((angle - 90) * Math.PI / 180);
            const numY = 100 + 90 * Math.sin((angle - 90) * Math.PI / 180);
            return (
              <text
                key={`min-num-${i}`}
                x={numX}
                y={numY}
                dy="0.35em"
                textAnchor="middle"
                className={cn("text-[10px] sm:text-xs font-bold", matchColors ? "fill-ring" : "fill-foreground")}
              >
                {i}
              </text>
            );
          } else {
             return (
                 <circle key={`min-dot-${i}`} cx={x2} cy={y2} r="1" className={cn(matchColors ? "fill-ring" : "fill-muted-foreground")} />
             )
          }
        })}

        {/* Hour Numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const num = i === 0 ? 12 : i;
          const angle = (num - 3) * 30; // -3 to align 12 at the top
          const x = 100 + 55 * Math.cos(angle * Math.PI / 180);
          const y = 100 + 55 * Math.sin(angle * Math.PI / 180);
          return (
            <text
              key={`hour-${num}`}
              x={x}
              y={y}
              dy=".35em"
              textAnchor="middle"
              className={cn("text-base sm:text-xl font-bold",
                 matchColors ? "fill-destructive" : "fill-foreground"
              )}
            >
              {num}
            </text>
          )
        })}

        {/* Hands */}
        {/* Hour Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 40 * Math.cos((hourAngle - 90) * Math.PI / 180)}
          y2={100 + 40 * Math.sin((hourAngle - 90) * Math.PI / 180)}
          stroke={matchColors ? hourColor : "hsl(var(--foreground))"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        {/* Minute Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 65 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
          y2={100 + 65 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
          stroke={matchColors ? minuteColor : "hsl(var(--foreground))"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Center Pin */}
        <circle cx="100" cy="100" r="3" fill="hsl(var(--foreground))" />
      </svg>
    </div>
  );
}
