

'use client';

import type { Score } from '@/services/scores';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { difficultyLevelToString } from '@/lib/skills';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';


// Function to get color based on score
const getScoreColorClass = (score: number) => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};


interface ScoreHistoryDisplayProps {
  scoreHistory: Score[];
}

export function ScoreHistoryDisplay({ scoreHistory }: ScoreHistoryDisplayProps) {
  // We only show the last 5 scores for clarity
  const chartData = scoreHistory.slice(0, 5).map(item => ({
    date: item.createdAt ? format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr }) : 'N/A',
    score: item.score,
    difficulty: difficultyLevelToString(item.skill, item.score, item.calculationSettings, item.currencySettings, item.timeSettings, item.calendarSettings, item.numberLevelSettings, item.countSettings)
  }));

  return (
    <Card className="w-full mt-4 bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Ton historique récent</CardTitle>
        <CardDescription>Tes 5 derniers exercices.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card shadow-sm">
                 <div className="relative w-full h-20 flex items-center justify-center">
                    <span className={cn("absolute h-10 w-10 rounded-full", getScoreColorClass(item.score))}></span>
                    <span className="relative font-bold text-lg text-white">{Math.round(item.score)}%</span>
                 </div>
                 <p className="text-xs font-medium text-muted-foreground">{item.date}</p>
                 {item.difficulty && (
                    <Badge variant="outline" className="text-xs">{item.difficulty}</Badge>
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
