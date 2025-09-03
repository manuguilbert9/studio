

import { type ReactElement } from 'react';
import {
  BookOpenText,
  Calculator,
  Clock,
  FilePenLine,
  PiggyBank,
  Ear,
  SquarePen,
  Spline,
} from 'lucide-react';
import type { CalculationSettings, CurrencySettings, TimeSettings } from './questions';


export interface Skill {
  name: string;
  slug: string;
  description: string;
  icon: ReactElement;
}

export type SkillLevel = 'A' | 'B' | 'C' | 'D';

export const skills: Skill[] = [
  {
    name: 'Dictée',
    slug: 'dictation',
    description: "Écoutez le mot et écrivez-le correctement.",
    icon: <Ear />,
  },
  {
    name: 'Familles de mots',
    slug: 'word-families',
    description: "Relie les mots qui appartiennent à la même famille.",
    icon: <Spline />,
  },
  {
    name: 'L\'heure',
    slug: 'time',
    description: 'Apprenez à lire les horloges analogiques et numériques.',
    icon: <Clock />,
  },
  {
    name: 'Monnaie',
    slug: 'currency',
    description: "Entraînez-vous à compter l'argent et à rendre la monnaie.",
    icon: <PiggyBank />,
  },
   {
    name: 'Calcul Posé',
    slug: 'long-calculation',
    description: 'Entraînez-vous aux additions et soustractions posées.',
    icon: <SquarePen />,
  },
  {
    name: 'Lecture',
    slug: 'reading',
    description: 'Améliorez vos compétences en compréhension de lecture.',
    icon: <BookOpenText />,
  },
  {
    name: 'Calcul',
    slug: 'calculation',
    description: "Aiguisez vos compétences en addition et soustraction.",
    icon: <Calculator />,
  },
];

export function getSkillBySlug(slug: string): Skill | undefined {
  return skills.find((skill) => skill.slug === slug);
}


export function difficultyLevelToString(
    skillSlug: string,
    calcSettings?: CalculationSettings,
    currSettings?: CurrencySettings,
    timeSettings?: TimeSettings
): string | null {
    if (skillSlug === 'calculation' && calcSettings) {
        const { operations, numberSize, complexity } = calcSettings;
        const total = operations + numberSize + complexity;
        if (total <= 3) return "Niveau 1";
        if (total <= 6) return "Niveau 2";
        if (total <= 9) return "Niveau 3";
        return "Niveau 4";
    }
    if (skillSlug === 'currency' && currSettings) {
        return `Niveau ${currSettings.difficulty + 1}`;
    }
    if (skillSlug === 'time' && timeSettings) {
        return `Niveau ${timeSettings.difficulty + 1}`;
    }
    return null;
}
