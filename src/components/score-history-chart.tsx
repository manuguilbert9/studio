'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Score } from './exercise-workspace';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScoreGlass } from './score-glass';

interface ScoreHistoryChartProps {
  scoreHistory: Score[];
}

export function ScoreHistoryChart({ scoreHistory }: ScoreHistoryChartProps) {
  // We only show the last 5 scores for clarity
  const chartData = scoreHistory.slice(0, 5).reverse().map(item => ({
    date: item.createdAt ? format(item.createdAt.toDate(), 'd MMM', { locale: fr }) : 'N/A',
    score: item.score,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Votre progression</CardTitle>
        <CardDescription>Voici vos 5 derniers scores.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="flex justify-around items-end gap-2 sm:gap-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                 <div style={{ transform: `scale(${1 - (chartData.length - 1 - index) * 0.1})` }}>
                    <ScoreGlass score={item.score} />
                 </div>
                 <p className="text-sm font-medium text-muted-foreground mt-[-1rem]">{item.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Aucun historique de score pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
}