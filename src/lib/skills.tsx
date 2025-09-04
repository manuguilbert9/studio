
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
  GitCompareArrows,
  Waves,
  ListOrdered,
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
    name: 'Dénombrement',
    slug: 'denombrement',
    description: "Dénombrer une quantité inférieure à 20.",
    icon: <ListOrdered />,
  },
  {
    name: 'Lecture Fluide',
    slug: 'reading',
    description: "S'entraîner à lire des textes à voix haute et à chronométrer sa vitesse de lecture.",
    icon: <BookOpenText />,
  },
  {
    name: 'Familles de mots',
    slug: 'word-families',
    description: "Identifier des mots de la même famille. Utiliser les familles de mots pour mémoriser l'orthographe.",
    icon: <Spline />,
  },
  {
    name: 'L\'heure',
    slug: 'time',
    description: "Lire l'heure sur une horloge à aiguilles.",
    icon: <Clock />,
  },
   {
    name: 'Calcul Posé',
    slug: 'long-calculation',
    description: "Additionner/soustraire en colonnes avec ou sans retenue.",
    icon: <SquarePen />,
  },
  {
    name: 'Calcul mental',
    slug: 'mental-calculation',
    description: 'Calculer de tête des additions, soustractions, multiplications et divisions.',
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
