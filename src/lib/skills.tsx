

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
        <path d="M18.5 6.08579C18.5 5.57599 18.2393 5.1259 17.8028 4.9076C17.3663 4.6893 16.8373 4.74314 16.4586 5.0401L14.4586 6.5401C14.0799 6.83707 13.9241 7.33234 14.0614 7.79463C14.1987 8.25692 14.5986 8.58579 15.0858 8.58579H16.5C16.7761 8.58579 17 8.36193 17 8.08579V7.58579C17 7.0335 17.4477 6.58579 18 6.58579C18.2761 6.58579 18.5 6.36193 18.5 6.08579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 17.9142C5.5 18.424 5.76071 18.8741 6.19722 19.0924C6.63373 19.3107 7.16269 19.2569 7.54142 18.9599L9.54142 17.4599C9.92015 17.1629 10.0759 16.6677 9.93863 16.2054C9.80135 15.7431 9.40139 15.4142 8.91421 15.4142H7.5C7.22386 15.4142 7 15.6381 7 15.9142V16.4142C7 16.9665 6.55228 17.4142 6 17.4142C5.72386 17.4142 5.5 17.6381 5.5 17.9142Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.4586 11.0401C12.0799 11.3371 11.9241 11.8323 12.0614 12.2946C12.1987 12.7569 12.5986 13.0858 13.0858 13.0858H14C14.5523 13.0858 15 12.6381 15 12.0858V11.5858C15 11.3096 14.7761 11.0858 14.5 11.0858C13.9113 11.0858 13.4143 10.7427 13.1557 10.2241" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
