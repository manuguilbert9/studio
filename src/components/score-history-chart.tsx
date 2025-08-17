'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Score } from './exercise-workspace';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ScoreHistoryChartProps {
  scoreHistory: Score[];
}

const chartConfig = {
  score: {
    label: 'Score (%)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function ScoreHistoryChart({ scoreHistory }: ScoreHistoryChartProps) {
  const chartData = scoreHistory.map(item => ({
    date: item.createdAt ? format(item.createdAt.toDate(), 'd MMM yyyy', { locale: fr }) : 'N/A',
    score: item.score,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Votre progression</CardTitle>
        <CardDescription>Voici vos scores pour les derniers exercices.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
               <YAxis 
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="score" fill="var(--color-score)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
