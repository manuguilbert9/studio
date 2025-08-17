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
    name: 'Writing',
    slug: 'writing',
    description: 'Practice spelling and grammar.',
    icon: <FilePenLine />,
  },
  {
    name: 'Time',
    slug: 'time',
    description: 'Learn to read analog and digital clocks.',
    icon: <Clock />,
  },
  {
    name: 'Currency',
    slug: 'currency',
    description: 'Practice counting money and making change.',
    icon: <PiggyBank />,
  },
  {
    name: 'Reading',
    slug: 'reading',
    description: 'Improve reading comprehension skills.',
    icon: <BookOpenText />,
  },
  {
    name: 'Calculation',
    slug: 'calculation',
    description: 'Sharpen your addition and subtraction skills.',
    icon: <Calculator />,
  },
];

export function getSkillBySlug(slug: string): Skill | undefined {
  return skills.find((skill) => skill.slug === slug);
}
