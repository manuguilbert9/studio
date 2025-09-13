

'use client';

import type { Score } from '@/services/scores';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { difficultyLevelToString } from '@/lib/skills';

interface ScoreHistoryChartProps {
  scoreHistory: Score[];
}

export function ScoreHistoryChart({ scoreHistory }: ScoreHistoryChartProps) {
  // We only show the last 10 scores for clarity
  const chartData = scoreHistory.slice(0, 10).reverse().map(item => ({
    date: item.createdAt ? format(new Date(item.createdAt), 'd MMM', { locale: fr }) : 'N/A',
    score: item.score,
    difficulty: difficultyLevelToString(item.skill, item.score, item.calculationSettings, item.currencySettings, item.timeSettings, item.calendarSettings, item.numberLevelSettings, item.countSettings)
  }));

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="w-full mt-4 bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Ton historique</CardTitle>
        <CardDescription>Tes 10 derniers exercices.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                 <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}%`}
                 />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                        formatter={(value, name, item) => (
                           <>
                              <div className="flex flex-col gap-0.5">
                                 <span className="font-bold text-lg">{value}%</span>
                                 {item.payload.difficulty && <span className="text-xs text-muted-foreground">{item.payload.difficulty}</span>}
                              </div>
                           </>
                        )}
                        indicator="line"
                    />
                  }
                />
                <Area
                  dataKey="score"
                  type="monotone"
                  fill="var(--color-score)"
                  fillOpacity={0.4}
                  stroke="var(--color-score)"
                  stackId="a"
                />
              </AreaChart>
          </ChartContainer>
        ) : (
          <p className="text-center text-muted-foreground">Aucun historique de score pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
