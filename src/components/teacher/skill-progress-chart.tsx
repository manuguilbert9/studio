

'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { Score } from '@/services/scores';
import { type Skill, difficultyLevelToString } from '@/lib/skills';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SkillProgressChartProps {
  skill: Skill;
  scores: Score[];
  onDeleteScore: (scoreId: string) => void;
}

export function SkillProgressChart({ skill, scores, onDeleteScore }: SkillProgressChartProps) {
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const chartData = React.useMemo(() => {
    return scores.map(s => ({
      date: new Date(s.createdAt),
      score: Math.round(s.score),
      level: difficultyLevelToString(s.skill, s.score, s.calculationSettings, s.currencySettings, s.timeSettings, s.calendarSettings, s.numberLevelSettings, s.countSettings)
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scores]);

  const isMCLM = skill.slug === 'fluence' || skill.slug === 'reading-race';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{skill.name}</CardTitle>
        <CardDescription className="text-xs">{scores.length} session(s)</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ChartContainer
          config={{
            score: { label: isMCLM ? 'MCLM' : 'Score', color: "hsl(var(--primary))" },
          }}
          className="h-40 w-full"
        >
          {chartData.length > 2 ? (
            <AreaChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis hide dataKey="date" />
              <YAxis hide domain={isMCLM ? [0, 'dataMax + 10'] : [0, 100]} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col">
                        <span>{format(item.payload.date, 'd MMM yy', { locale: fr })}</span>
                        <span>{isMCLM ? `${value} MCLM` : `${value}%`}</span>
                        {item.payload.level && <span className="text-xs text-muted-foreground">{item.payload.level}</span>}
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="score"
                type="monotone"
                fill="var(--color-score)"
                fillOpacity={0.4}
                stroke="var(--color-score)"
              />
            </AreaChart>
          ) : (
             <BarChart accessibilityLayer data={chartData}>
               <CartesianGrid vertical={false} />
                <XAxis hide dataKey="date" />
                <YAxis hide domain={isMCLM ? [0, 'dataMax + 10'] : [0, 100]} />
                <ChartTooltip
                    cursor={false}
                    content={
                    <ChartTooltipContent
                        formatter={(value, name, item) => (
                        <div className="flex flex-col">
                            <span>{format(item.payload.date, 'd MMM yy', { locale: fr })}</span>
                            <span>{isMCLM ? `${value} MCLM` : `${value}%`}</span>
                            {item.payload.level && <span className="text-xs text-muted-foreground">{item.payload.level}</span>}
                        </div>
                        )}
                    />
                    }
                />
               <Bar dataKey="score" fill="var(--color-score)" radius={4} />
             </BarChart>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" className="w-full" onClick={() => setIsDetailOpen(!isDetailOpen)}>
            <FileText className="mr-2 h-4 w-4" />
            Historique
            {isDetailOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
       {isDetailOpen && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Score</TableHead>
                <TableHead className="text-xs text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map(score => (
                <TableRow key={score.id}>
                  <TableCell className="text-xs">{format(new Date(score.createdAt), 'd/MM/yy', { locale: fr })}</TableCell>
                  <TableCell className="text-xs">{isMCLM ? `${score.score} MCLM` : `${Math.round(score.score)}%`}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce résultat ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteScore(score.id)} className="bg-destructive hover:bg-destructive/90">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
