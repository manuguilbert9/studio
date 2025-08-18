'use client';

interface AnalogClockProps {
  hour: number;
  minute: number;
}

export function AnalogClock({ hour, minute }: AnalogClockProps) {
  const hourAngle = (hour % 12 + minute / 60) * 30;
  const minuteAngle = minute * 6;

  return (
    <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto my-4">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Clock Face */}
        <circle cx="100" cy="100" r="95" fill="var(--card)" stroke="var(--foreground)" strokeWidth="4" />

        {/* Hour and Minute Markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const x1 = 100 + 80 * Math.cos(angle * Math.PI / 180);
          const y1 = 100 + 80 * Math.sin(angle * Math.PI / 180);
          const x2 = 100 + 90 * Math.cos(angle * Math.PI / 180);
          const y2 = 100 + 90 * Math.sin(angle * Math.PI / 180);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted-foreground)" strokeWidth="3" />;
        })}

        {/* Numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i - 2) * 30;
          const x = 100 + 72 * Math.cos(angle * Math.PI / 180);
          const y = 100 + 72 * Math.sin(angle * Math.PI / 180);
          return (
            <text 
              key={i} 
              x={x} 
              y={y} 
              dy=".3em"
              textAnchor="middle"
              className="text-xl font-numbers font-bold fill-current text-foreground"
            >
              {(i === 0 ? 12 : i) + 1}
            </text>
          )
        })}


        {/* Hour Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 50 * Math.cos((hourAngle - 90) * Math.PI / 180)}
          y2={100 + 50 * Math.sin((hourAngle - 90) * Math.PI / 180)}
          stroke="hsl(var(--destructive))"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Minute Hand */}
        <line
          x1="100"
          y1="100"
          x2={100 + 75 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
          y2={100 + 75 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
          stroke="hsl(var(--ring))"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Center Pin */}
        <circle cx="100" cy="100" r="5" fill="var(--foreground)" />
      </svg>
    </div>
  );
}
