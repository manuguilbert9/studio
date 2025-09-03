
'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface AnalogClockProps extends React.HTMLAttributes<SVGSVGElement> {
  hour: number;
  minute: number;
  showMinuteCircle?: boolean;
  matchColors?: boolean;
  coloredHands?: boolean;
  onHourClick?: (hour: number) => void;
  onMinuteClick?: (minute: number) => void;
}

export const AnalogClock = React.forwardRef<SVGSVGElement, AnalogClockProps>(
    ({ hour, minute, showMinuteCircle = true, matchColors = true, coloredHands = true, onHourClick, onMinuteClick, ...props }, ref) => {
    const hourAngle = (hour % 12 + minute / 60) * 30;
    const minuteAngle = minute * 6;
    
    const hourColor = "#ef4444"; // red-500
    const minuteColor = "#3b82f6"; // blue-500

    return (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto my-4">
            <svg ref={ref} viewBox="0 0 200 200" className="w-full h-full" {...props}>
                
                {/* Main clock face */}
                <circle cx="100" cy="100" r="98" fill="hsl(var(--card))" />

                {/* Backgrounds */}
                {matchColors && (
                    <>
                        <circle cx="100" cy="100" r="98" fill={minuteColor} fillOpacity="0.3" />
                        <circle cx="100" cy="100" r="70" fill={hourColor} fillOpacity="0.5" />
                    </>
                )}
                
                {/* Optional guide lines */}
                {!matchColors && <>
                    <circle cx="100" cy="100" r="98" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="1" fill="none" />
                    <circle cx="100" cy="100" r="70" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="1" fill="none" />
                </>}


                {/* Minute Markers and Numbers */}
                {Array.from({ length: 60 }).map((_, i) => {
                    const angle = i * 6;
                    const isFiveMinuteMark = i % 5 === 0;

                    if (showMinuteCircle) {
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
                                className={cn(
                                    "text-[10px] sm:text-xs font-bold",
                                    onMinuteClick && "cursor-pointer hover:opacity-70 transition-opacity"
                                )}
                                fill={matchColors || coloredHands ? minuteColor : "hsl(var(--foreground))"}
                                onClick={() => onMinuteClick?.(i)}
                            >
                                {i === 0 ? "00" : i}
                            </text>
                            );
                        }
                    } else { // For level 4, show markers but not numbers
                        const x1 = 100 + (isFiveMinuteMark ? 84 : 86) * Math.cos((angle - 90) * Math.PI / 180);
                        const y1 = 100 + (isFiveMinuteMark ? 84 : 86) * Math.sin((angle - 90) * Math.PI / 180);
                        const x2 = 100 + 88 * Math.cos((angle - 90) * Math.PI / 180);
                        const y2 = 100 + 88 * Math.sin((angle - 90) * Math.PI / 180);
                        
                        // Clickable area for minutes
                        const clickRadius = 8;
                        const clickX = 100 + 86 * Math.cos((angle - 90) * Math.PI / 180);
                        const clickY = 100 + 86 * Math.sin((angle - 90) * Math.PI / 180);
                        
                        return (
                             <g key={`min-marker-${i}`} onClick={() => onMinuteClick?.(i)} className={cn(onMinuteClick && "cursor-pointer")}>
                                {/* Invisible larger circle for easier clicking */}
                                <circle cx={clickX} cy={clickY} r={clickRadius} fill="transparent" />
                                 {isFiveMinuteMark ? (
                                    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" className="stroke-muted-foreground" />
                                 ) : (
                                    <circle cx={x2} cy={y2} r="1" className="fill-muted-foreground" />
                                 )}
                             </g>
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
                        onHourClick && "cursor-pointer hover:opacity-70 transition-opacity"
                    )}
                    fill={matchColors || coloredHands ? hourColor : "hsl(var(--foreground))"}
                    onClick={() => onHourClick?.(num)}
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
                stroke={coloredHands ? hourColor : "hsl(var(--foreground))"}
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
                stroke={coloredHands ? minuteColor : "hsl(var(--foreground))"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.8"
                />

                {/* Center Pin */}
                <circle cx="100" cy="100" r="3" fill="hsl(var(--foreground))" />
            </svg>
        </div>
    );
});

AnalogClock.displayName = "AnalogClock";
