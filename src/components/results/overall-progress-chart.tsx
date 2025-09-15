
'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
    mclm: {
        label: "MCLM",
        color: "hsl(var(--chart-1))"
    }
};

export function OverallProgressChart({ allScores }: OverallProgressChartProps) {
    const [selectedSkill, setSelectedSkill] = React.useState<string>('all');
    
    const { generalScores, fluenceScores } = React.useMemo(() => {
        const general: Score[] = [];
        const fluence: Score[] = [];
        allScores.forEach(score => {
            if (score.skill === 'fluence') {
                fluence.push(score);
            } else {
                general.push(score);
            }
        });
        return { generalScores: general, fluenceScores: fluence };
    }, [allScores]);

    const availableSkills = React.useMemo(() => {
        const uniqueSlugs = new Set(generalScores.map(s => s.skill));
        return skills.filter(s => uniqueSlugs.has(s.slug) && s.slug !== 'fluence');
    }, [generalScores]);
    
    const generalChartData = React.useMemo(() => {
        const filteredScores = selectedSkill === 'all'
            ? generalScores
            : generalScores.filter(s => s.skill === selectedSkill);
        
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

    }, [generalScores, selectedSkill]);

    const fluenceChartData = React.useMemo(() => {
        return fluenceScores
            .map(item => ({
                date: new Date(item.createdAt),
                mclm: item.score
            }))
            .sort((a,b) => a.date.getTime() - b.date.getTime())
            .map(item => ({
                ...item,
                date: format(item.date, 'd MMM yy', { locale: fr })
            }));
    }, [fluenceScores]);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline text-2xl">Progression Globale</CardTitle>
                        <CardDescription>
                            L'historique de tes résultats (hors fluence) au fil du temps.
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
                    {generalChartData.length > 1 ? (
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <AreaChart accessibilityLayer data={generalChartData} margin={{ left: 12, right: 12 }}>
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

            {fluenceChartData.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Progression en Fluence</CardTitle>
                        <CardDescription>
                            L'historique de tes scores de lecture (Mots Corrects Lus par Minute).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart accessibilityLayer data={fluenceChartData} margin={{ left: 12, right: 12 }}>
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
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="mclm"
                                    fill="var(--color-mclm)"
                                    radius={8}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
