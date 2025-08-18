

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
import { ScoreTube } from './score-tube';
import { Badge } from './ui/badge';
import { difficultyLevelToString } from '@/lib/skills';

interface ScoreHistoryChartProps {
  scoreHistory: Score[];
}

export function ScoreHistoryChart({ scoreHistory }: ScoreHistoryChartProps) {
  // We only show the last 5 scores for clarity
  const chartData = scoreHistory.slice(0, 5).reverse().map(item => ({
    date: item.createdAt ? format(item.createdAt.toDate(), 'd MMM', { locale: fr }) : 'N/A',
    score: item.score,
    difficulty: difficultyLevelToString(item.skill, item.calculationSettings, item.currencySettings, item.timeSettings)
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Votre progression</CardTitle>
        <CardDescription>Voici vos 5 derniers scores et leur niveau.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="flex justify-around items-end gap-2 sm:gap-4 pt-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center gap-2">
                 <div style={{ transform: `scale(${1 - (chartData.length - 1 - index) * 0.1})` }}>
                    <ScoreTube score={item.score} />
                 </div>
                 <p className="text-xs font-medium text-muted-foreground mt-[-1.5rem]">{item.date}</p>
                 {item.difficulty && (
                    <Badge variant="secondary" className="text-xs">{item.difficulty}</Badge>
                 )}
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
