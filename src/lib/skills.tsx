
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
  CalendarDays,
} from 'lucide-react';
import type { CalculationSettings, CurrencySettings, TimeSettings, CalendarSettings } from './questions';


export interface Skill {
  name: string;
  slug: string;
  description: string;
  icon: ReactElement;
}

export type SkillLevel = 'A' | 'B' | 'C' | 'D';

export const skills: Skill[] = [
  {
    name: 'Écoute les nombres',
    slug: 'ecoute-les-nombres',
    description: "Associer un nombre à l'oral < 20 à sa représentation chiffrée.",
    icon: <Ear />,
  },
  {
    name: 'Dénombrement',
    slug: 'denombrement',
    description: "Dénombrer une quantité inférieure à 20.",
    icon: <ListOrdered />,
  },
  {
    name: "J'écoute entre 70 et 99",
    slug: 'nombres-complexes',
    description: 'Reconnaître les nombres complexes (70-99) à l\'oral et à l\'écrit.',
    icon: <GitCompareArrows />,
  },
  {
    name: 'Lire les nombres',
    slug: 'lire-les-nombres',
    description: "Associer un nombre écrit en chiffres à son énoncé oral.",
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
  {
    name: 'Calendrier',
    slug: 'calendar',
    description: 'Se repérer dans le temps, lire les dates et les durées.',
    icon: <CalendarDays />,
  },
];

export function getSkillBySlug(slug: string): Skill | undefined {
  return skills.find((skill) => skill.slug === slug);
}


export function difficultyLevelToString(
    skillSlug: string,
    calcSettings?: CalculationSettings,
    currSettings?: CurrencySettings,
    timeSettings?: TimeSettings,
    calendarSettings?: CalendarSettings
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
    if (skillSlug === 'calendar' && calendarSettings) {
        return `Niveau ${calendarSettings.level}`;
    }
    return null;
}
