
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
import type { CalculationSettings, CurrencySettings, TimeSettings, CalendarSettings, NumberLevelSettings, CountSettings } from './questions';

export type SkillCategory =
  | "Phonologie"
  | "Lecture / compréhension"
  | "Ecriture"
  | "Orthographe"
  | "Grammaire"
  | "Conjugaison"
  | "Vocabulaire"
  | "Nombres et calcul"
  | "Grandeurs et mesures"
  | "Organisation et gestion de données"
  | "Espace et géométrie"
  | "Problèmes";


export interface Skill {
  name: string;
  slug: string;
  description: string;
  icon: ReactElement;
  category: SkillCategory;
}

export type SkillLevel = 'A' | 'B' | 'C' | 'D';

export const skills: Skill[] = [
  {
    name: 'Écoute les nombres',
    slug: 'ecoute-les-nombres',
    description: "Associer un nombre à l'oral < 20 à sa représentation chiffrée.",
    icon: <Ear />,
    category: 'Nombres et calcul',
  },
  {
    name: 'Dénombrement',
    slug: 'denombrement',
    description: "Dénombrer une quantité inférieure à 20.",
    icon: <ListOrdered />,
    category: 'Nombres et calcul',
  },
  {
    name: "J'écoute entre 70 et 99",
    slug: 'nombres-complexes',
    description: 'Reconnaître les nombres complexes (70-99) à l\'oral et à l\'écrit.',
    icon: <GitCompareArrows />,
    category: 'Nombres et calcul',
  },
  {
    name: 'Lire les nombres',
    slug: 'lire-les-nombres',
    description: "Associer un nombre écrit en chiffres à son énoncé oral.",
    icon: <BookOpenText />,
    category: 'Nombres et calcul',
  },
  {
    name: 'Familles de mots',
    slug: 'word-families',
    description: "Identifier des mots de la même famille. Utiliser les familles de mots pour mémoriser l'orthographe.",
    icon: <Spline />,
    category: 'Vocabulaire',
  },
  {
    name: 'L\'heure',
    slug: 'time',
    description: "Lire l'heure sur une horloge à aiguilles.",
    icon: <Clock />,
    category: 'Grandeurs et mesures',
  },
   {
    name: 'Calcul Posé',
    slug: 'long-calculation',
    description: "Additionner/soustraire en colonnes avec ou sans retenue.",
    icon: <SquarePen />,
    category: 'Nombres et calcul',
  },
  {
    name: 'Calcul mental',
    slug: 'mental-calculation',
    description: 'Calculer de tête des additions, soustractions, multiplications et divisions.',
    icon: <Calculator />,
    category: 'Nombres et calcul',
  },
  {
    name: 'Calendrier',
    slug: 'calendar',
    description: 'Se repérer dans le temps, lire les dates et les durées.',
    icon: <CalendarDays />,
    category: 'Grandeurs et mesures',
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
    calendarSettings?: CalendarSettings,
    numberLevelSettings?: NumberLevelSettings,
    countSettings?: CountSettings
): string | null {
    if (skillSlug === 'time' && timeSettings) {
        return `Niveau ${timeSettings.difficulty + 1}`;
    }
    if (skillSlug === 'calendar' && calendarSettings) {
        return `Niveau ${calendarSettings.level}`;
    }
     if (skillSlug === 'lire-les-nombres' && numberLevelSettings) {
        const levels = ['A', 'B', 'C', 'D'];
        return `Niveau ${levels[numberLevelSettings.difficulty] || 'A'}`;
    }
     if (skillSlug === 'denombrement') {
        return "Niveau A";
    }
    if (skillSlug === 'ecoute-les-nombres') {
        return "Niveau A";
    }
    if (skillSlug === 'nombres-complexes') {
        return "Niveau B";
    }
    if (skillSlug === 'word-families') {
        return "Niveau B";
    }
    if (skillSlug === 'mental-calculation' || skillSlug === 'long-calculation') {
        // These exercises are controlled by a SkillLevel A-D set on the student
        // This should be retrieved from student data, not settings object.
        // For now, let's assume a default if no other info.
        return "Niveau B";
    }
    // Fallback for any other case
    return "Niveau A";
}
