

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
  BookCopy,
  Keyboard,
  Plus,
  Type,
  ArrowRight,
  Target,
  ALargeSmall,
  PenLine,
  Sigma,
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
    name: 'Syllabe d\'attaque',
    slug: 'syllabe-attaque',
    description: "Clique sur l'image dont le nom commence par la syllabe affichée.",
    icon: <Waves />,
    category: 'Phonologie',
    isFixedLevel: 'A',
  },
  {
    name: 'Reconnaissance des lettres',
    slug: 'letter-recognition',
    description: "Appuie sur la bonne touche du clavier correspondant à la lettre affichée.",
    icon: <Type />,
    category: 'Phonologie',
    isFixedLevel: 'A',
  },
  {
    name: 'Lettres et Sons',
    slug: 'lettres-et-sons',
    description: "Associe une lettre au son qu'elle produit en choisissant la bonne image.",
    icon: <Ear />,
    category: 'Phonologie',
    isFixedLevel: 'A',
  },
  {
    name: 'Dictée',
    slug: 'dictee',
    description: 'Écoute un mot et écris-le correctement.',
    icon: <PenLine />,
    category: 'Orthographe',
    allowedLevels: ['B', 'C'],
  },
  {
    name: 'Le son [an]',
    slug: 'son-an',
    description: "Choisis la bonne écriture (an, en, am, em) pour compléter les mots.",
    icon: <ALargeSmall />,
    category: 'Orthographe',
    isFixedLevel: 'B',
  },
  {
    name: 'Sens de lecture',
    slug: 'reading-direction',
    description: 'Appuie sur les objets de gauche à droite, ligne par ligne, pour t\'habituer au sens de la lecture.',
    icon: <ArrowRight />,
    category: 'Lecture / compréhension',
    isFixedLevel: 'A',
  },
  {
    name: 'Premiers mots',
    slug: 'simple-word-reading',
    description: 'Lire des mots simples à voix haute pour s\'entraîner.',
    icon: <Smile />,
    category: 'Lecture / compréhension',
    isFixedLevel: 'B',
  },
  {
    name: 'Lire des phrases',
    slug: 'lire-des-phrases',
    description: "Lis des phrases à voix haute et vérifie ta prononciation avec la reconnaissance vocale.",
    icon: <Mic />,
    category: 'Lecture / compréhension',
    isFixedLevel: 'B',
  },
   {
    name: 'Fluence',
    slug: 'fluence',
    description: "Chronomètre ta lecture d'un texte et calcule ton score de fluence (MCLM).",
    icon: <Rocket />,
    category: 'Lecture / compréhension',
  },
  {
    name: 'Cahier d\'écriture',
    slug: 'writing-notebook',
    description: 'Écris librement chaque jour pour t\'entraîner et garder une trace de tes textes.',
    icon: <BookCopy />,
    category: 'Ecriture',
  },
    {
    name: 'Copie au clavier',
    slug: 'keyboard-copy',
    description: "Recopie des mots simples lettre par lettre en suivant un modèle.",
    icon: <Keyboard />,
    category: 'Ecriture',
    isFixedLevel: 'A',
  },
  {
    name: 'Construction de phrases',
    slug: 'phrase-construction',
    description: "Utilise les mots fournis pour construire une phrase grammaticalement correcte.",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.4 12.3C20.4 12.3 22.5 13.5 22.5 15.8C22.5 18.1 20.4 19.2 20.4 19.2L16.1 19.2C16.1 19.2 15.1 18.2 15.1 16.9C15.1 15.6 16.1 14.6 16.1 14.6L18.3 14.6C18.3 14.6 18.8 14.8 18.8 15.8C18.8 16.7 18.3 16.9 18.3 16.9L16.1 16.9C16.1_  16.9 15.1 15.9 15.1 14.6C15.1 13.3 16.1 12.3 16.1 12.3L20.4 12.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.7 3.6C11.7 3.6 12.8 1.5 15.1 1.5C17.4 1.5 18.5 3.6 18.5 3.6V7.9C18.5 7.9 19.5 8.9 20.8 8.9C22.1 8.9 23.1 7.9 23.1 7.9V9.8C23.1 9.8 22.1 10.8 20.8 10.8C19.5 10.8 18.5 9.8 18.5 9.8V7.9C18.5 7.9 17.5 8.9 16.2 8.9C14.9 8.9 13.8 7.9 13.8 7.9V11.7C13.8 11.7 12.8 12.8 11.5 12.8C10.2 12.8 9.20001 11.7 9.20001 11.7L9.20001 16.1C9.20001 16.1 10.2 17.1 11.5 17.1C12.8 17.1 13.8 16.1 13.8 16.1L13.8 18.3C13.8 18.3 14.8 18.8 15.8 18.8C16.7 18.8 16.9 18.3 16.9 18.3L16.9 20.4C16.9 20.4 15.9 22.5 13.6 22.5C11.3 22.5 10.2 20.4 10.2 20.4L10.2 16.1C10.2 16.1 9.20001 15.1 7.90001 15.1C6.60001 15.1 5.60001 16.1 5.60001 16.1L5.60001 18.3C5.60001 18.3 4.80001 18.8 3.80001 18.8C2.90001 18.8 2.70001 18.3 2.70001 18.3L2.70001 20.4C2.70001 20.4 1.70001 22.5 -0.599991 22.5C-2.89999 22.5 -3.99999 20.4 -3.99999 20.4L-3.99999 16.1C-3.99999 16.1 -4.99999 15.1 -6.29999 15.1C-7.59999 15.1 -8.59999 16.1 -8.59999 16.1L-8.59999 13.8C-8.59999 13.8 -8.09999 12.8 -7.09999 12.8C-6.19999 12.8 -5.99999 13.8 -5.99999 13.8L-5.99999 11.7C-5.99999 11.7 -4.99999 10.7 -6.29999 10.7C-7.59999 10.7 -8.59999 11.7 -8.59999 11.7L-8.59999 9.8C-8.59999 9.8 -7.59999 8.80001 -6.29999 8.80001C-4.99999 8.80001 -3.99999 9.80001 -3.99999 9.80001L-3.99999 5.6C-3.99999 5.6 -2.99999 4.60001 -0.699993 4.60001C1.60001 4.60001 2.70001 5.6 2.70001 5.6L2.70001 7.9C2.70001 7.9 3.70001 8.9 4.90001 8.9C6.20001 8.9 7.20001 7.9 7.20001 7.9L7.20001 5.6C7.20001 5.6 8.20001 4.6 9.50001 4.6C10.8 4.6 11.8 5.6 11.8 5.6L11.7 3.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    category: 'Grammaire',
    allowedLevels: ['B', 'C', 'D'],
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
    name: 'Comptage au clavier',
    slug: 'keyboard-count',
    description: "Compter les objets et taper la réponse directement sur le clavier.",
    icon: <Keyboard />,
    category: 'Nombres et calcul',
    isFixedLevel: 'A',
  },
  {
    name: 'Somme < 10',
    slug: 'somme-dix',
    description: "Calcule des additions simples dont le résultat est inférieur à 10.",
    icon: <Plus />,
    category: 'Nombres et calcul',
    isFixedLevel: 'A',
  },
  {
    name: 'Compléments à 10',
    slug: 'complement-dix',
    description: "Trouve le complément à 10 le plus vite possible.",
    icon: <div className="h-full w-full rounded-full border-4 border-current flex items-center justify-center text-2xl font-bold">10</div>,
    category: 'Nombres et calcul',
    isFixedLevel: 'B',
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
    allowedLevels: ['B', 'C', 'D'],
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
    name: 'La Monnaie',
    slug: 'currency',
    description: 'Apprendre à utiliser les pièces et les billets en euros.',
    icon: <PiggyBank />,
    category: 'Grandeurs et mesures',
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

    if (skillSlug === 'time' && timeSettings) {
        return `Niveau ${timeSettings.level}`;
    }

    if (skillSlug === 'currency' && currSettings) {
        return `Niveau ${String.fromCharCode(65 + currSettings.difficulty)}`;
    }

    if (skillSlug === 'denombrement') {
        return "Niveau A"; // isFixedLevel handles this, but as a fallback.
    }
    
    // Fallback for skills that might not have detailed settings but are level-based
    if (skill?.allowedLevels) {
        // Find student level for this skill if available, otherwise make a guess
         if (scoreValue < 50) return `Niveau ${skill.allowedLevels[0]}`;
         if (scoreValue < 80 && skill.allowedLevels.length > 1) return `Niveau ${skill.allowedLevels[1]}`;
         return `Niveau ${skill.allowedLevels[skill.allowedLevels.length-1]}`;
    }


    // Fallback for any other case where level can't be determined
    return null;
}
