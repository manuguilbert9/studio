import { type ReactElement } from 'react';
import {
  BookOpenText,
  Calculator,
  Clock,
  FilePenLine,
  PiggyBank,
} from 'lucide-react';

export interface Skill {
  name: string;
  slug: string;
  description: string;
  icon: ReactElement;
}

export const skills: Skill[] = [
  {
    name: 'Écriture',
    slug: 'writing',
    description: "Pratiquez l'orthographe et la grammaire.",
    icon: <FilePenLine />,
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
