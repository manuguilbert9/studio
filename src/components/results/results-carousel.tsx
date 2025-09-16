
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Score } from '@/services/scores';
import { getSkillBySlug, allSkillCategories, type SkillCategory } from '@/lib/skills';
import { ScoreTube } from '../score-tube';
import { Rocket } from 'lucide-react';


interface ResultCardProps {
    skillSlug: string;
    averageScore: number;
    count: number;
}

function ResultCard({ skillSlug, averageScore, count }: ResultCardProps) {
    const skill = getSkillBySlug(skillSlug);
    if (!skill) return null;

    return (
        <Card className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="text-primary [&>svg]:h-12 [&>svg]:w-12 mb-2">
                {skill.icon}
            </div>
            <h3 className="font-headline text-xl">{skill.name}</h3>
            {skill.slug === 'fluence' || skill.slug === 'reading-race' ? (
                <div className="flex flex-col items-center justify-center mt-2">
                    <Rocket className="h-10 w-10 text-muted-foreground" />
                    <p className="text-2xl font-bold font-headline mt-1">{averageScore}</p>
                    <p className="text-xs text-muted-foreground">MCLM</p>
                </div>
            ) : (
                <ScoreTube score={averageScore} />
            )}
            <p className="text-xs text-muted-foreground mt-1">({count} {count > 1 ? 'exercices' : 'exercice'})</p>
        </Card>
    )
}

interface ResultsCarouselProps {
    title: string;
    subtitle: string;
    icon: React.ReactElement;
    scores: Score[];
    onPrevious: () => void;
    onNext: () => void;
    isNextDisabled: boolean;
}

export function ResultsCarousel({ title, subtitle, icon, scores, onPrevious, onNext, isNextDisabled }: ResultsCarouselProps) {
    
    const resultsBySkill = React.useMemo(() => {
        const grouped: Record<string, { totalScore: number; count: number, category: SkillCategory }> = {};
        
        scores.forEach(score => {
            const skill = getSkillBySlug(score.skill);
            if(skill) {
                if (!grouped[score.skill]) {
                    grouped[score.skill] = { totalScore: 0, count: 0, category: skill.category };
                }
                grouped[score.skill].totalScore += score.score;
                grouped[score.skill].count += 1;
            }
        });

        const results = Object.entries(grouped).map(([skillSlug, data]) => ({
            skillSlug,
            averageScore: Math.round(data.totalScore / data.count),
            count: data.count,
            category: data.category,
        }));
        
        // Sort by category order, then by skill name
        return results.sort((a,b) => {
            const categoryAIndex = allSkillCategories.indexOf(a.category);
            const categoryBIndex = allSkillCategories.indexOf(b.category);
            if (categoryAIndex !== categoryBIndex) {
                return categoryAIndex - categoryBIndex;
            }
            return a.skillSlug.localeCompare(b.skillSlug);
        });

    }, [scores]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-primary bg-primary/10 p-3 rounded-lg">
                            {React.cloneElement(icon, { className: "h-6 w-6" })}
                        </div>
                        <div>
                            <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                            <CardDescription>{subtitle}</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={onPrevious}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={onNext} disabled={isNextDisabled}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {resultsBySkill.length > 0 ? (
                    <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {resultsBySkill.map(result => (
                                <CarouselItem key={result.skillSlug} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-4">
                                    <ResultCard {...result} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex"/>
                    </Carousel>
                ) : (
                    <div className="h-48 flex items-center justify-center">
                        <p className="text-muted-foreground text-center">Aucun exercice réalisé pour cette période.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
