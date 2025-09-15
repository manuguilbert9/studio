
'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Score } from '@/services/scores';
import { getSkillBySlug, skills } from '@/lib/skills';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OverallProgressChartProps {
    allScores: Score[];
}

const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--primary))",
    },
};

export function OverallProgressChart({ allScores }: OverallProgressChartProps) {
    const [selectedSkill, setSelectedSkill] = React.useState<string>('all');

    const availableSkills = React.useMemo(() => {
        const uniqueSlugs = new Set(allScores.map(s => s.skill));
        return skills.filter(s => uniqueSlugs.has(s.slug));
    }, [allScores]);
    
    const chartData = React.useMemo(() => {
        const filteredScores = selectedSkill === 'all'
            ? allScores 
            : allScores.filter(s => s.skill === selectedSkill);
        
        return filteredScores
            .map(item => ({
                date: new Date(item.createdAt),
                score: item.score
            }))
            .sort((a,b) => a.date.getTime() - b.date.getTime())
            .map(item => ({
                ...item,
                date: format(item.date, 'd MMM yy', { locale: fr })
            }));

    }, [allScores, selectedSkill]);

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="font-headline text-2xl">Progression Globale</CardTitle>
                    <CardDescription>
                        L'historique complet de tes résultats au fil du temps.
                    </CardDescription>
                </div>
                <div className="w-full sm:w-64">
                    <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrer par exercice..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les exercices</SelectItem>
                            {availableSkills.map(skill => (
                                <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length > 1 ? (
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value}
                                minTickGap={20}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Area
                                dataKey="score"
                                type="monotone"
                                fill="var(--color-score)"
                                fillOpacity={0.4}
                                stroke="var(--color-score)"
                            />
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-muted-foreground text-center">
                            Pas assez de données pour afficher un graphique. Continue à t'entraîner !
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
