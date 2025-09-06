

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
  Rocket,
  Mic,
  Smile,
} from 'lucide-react';
import type { CalculationSettings, CurrencySettings, TimeSettings, CalendarSettings, NumberLevelSettings, CountSettings, ReadingRaceSettings } from './questions';

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

export const allSkillCategories: SkillCategory[] = [
    "Phonologie",
    "Lecture / compréhension",
    "Ecriture",
    "Orthographe",
    "Grammaire",
    "Conjugaison",
    "Vocabulaire",
    "Nombres et calcul",
    "Grandeurs et mesures",
    "Organisation et gestion de données",
    "Espace et géométrie",
    "Problèmes"
];


export interface Skill {
  name: string;
  slug: string;
  description: string;
  icon: ReactElement;
  category: SkillCategory;
  isFixedLevel?: SkillLevel;
  allowedLevels?: SkillLevel[];
}

export type SkillLevel = 'A' | 'B' | 'C' | 'D';

export const skills: Skill[] = [
  {
    name: 'Premiers mots',
    slug: 'simple-word-reading',
    description: 'Lire des mots simples à voix haute pour s\'entraîner.',
    icon: <Smile />,
    category: 'Lecture / compréhension',
    isFixedLevel: 'B',
  },
  {
    name: 'Course de lecture',
    slug: 'reading-race',
    description: "Lis un texte à voix haute et fais avancer ton personnage jusqu'à la ligne d'arrivée.",
    icon: <Rocket />,
    category: 'Lecture / compréhension',
  },
  {
    name: 'Lire les nombres',
    slug: 'lire-les-nombres',
    description: "Associer un nombre écrit en chiffres à son énoncé oral.",
    icon: <BookOpenText />,
    category: 'Nombres et calcul',
    allowedLevels: ['A', 'B', 'C', 'D'],
  },
  {
    name: 'Écoute les nombres',
    slug: 'ecoute-les-nombres',
    description: "Associer un nombre à l'oral < 20 à sa représentation chiffrée.",
    icon: <Ear />,
    category: 'Nombres et calcul',
    isFixedLevel: 'A',
  },
  {
    name: 'Dénombrement',
    slug: 'denombrement',
    description: "Dénombrer une quantité inférieure à 20.",
    icon: <ListOrdered />,
    category: 'Nombres et calcul',
    isFixedLevel: 'A',
  },
  {
    name: "J'écoute entre 60 et 99",
    slug: 'nombres-complexes',
    description: 'Reconnaître les nombres complexes (60-99) à l\'oral et à l\'écrit.',
    icon: <GitCompareArrows />,
    category: 'Nombres et calcul',
    isFixedLevel: 'B',
  },
  {
    name: 'Familles de mots',
    slug: 'word-families',
    description: "Identifier des mots de la même famille. Utiliser les familles de mots pour mémoriser l'orthographe.",
    icon: <Spline />,
    category: 'Vocabulaire',
    allowedLevels: ['B', 'C', 'D'],
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
    allowedLevels: ['A', 'B', 'C', 'D'],
  },
  {
    name: 'Calendrier',
    slug: 'calendar',
    description: 'Se repérer dans le temps, lire les dates et les durées.',
    icon: <CalendarDays />,
    category: 'Grandeurs et mesures',
    allowedLevels: ['A', 'B', 'C', 'D'],
  },
];

export function getSkillBySlug(slug: string): Skill | undefined {
  return skills.find((skill) => skill.slug === slug);
}


export function difficultyLevelToString(
    skillSlug: string,
    scoreValue: number, // Pass the score value directly
    calcSettings?: CalculationSettings,
    currSettings?: CurrencySettings,
    timeSettings?: TimeSettings,
    calendarSettings?: CalendarSettings,
    numberLevelSettings?: NumberLevelSettings,
    countSettings?: CountSettings,
    readingRaceSettings?: ReadingRaceSettings
): string | null {
    const skill = getSkillBySlug(skillSlug);
    if (skill?.isFixedLevel) {
        return `Niveau ${skill.isFixedLevel}`;
    }

    if (readingRaceSettings?.level) {
        return readingRaceSettings.level;
    }
    if (numberLevelSettings?.level) {
        return `Niveau ${numberLevelSettings.level}`;
    }
     if (calendarSettings?.level) {
        return `Niveau ${calendarSettings.level}`;
    }

    if (skill?.allowedLevels) {
        // For skills with selectable levels but no specific settings object for the result (e.g. mental-calculation)
        if (scoreValue < 50) return "Niveau A";
        if (scoreValue < 80) return "Niveau B";
        return "Niveau C";
    }

    if (skillSlug === 'time' && timeSettings) {
        const levels: SkillLevel[] = ['A', 'B', 'C', 'D'];
        return `Niveau ${levels[timeSettings.difficulty] || 'A'}`;
    }

    if (skillSlug === 'denombrement') {
        return "Niveau A"; // isFixedLevel handles this, but as a fallback.
    }

    // Fallback for any other case where level can't be determined
    return null;
}
