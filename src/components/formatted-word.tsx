
import { cn } from '@/lib/utils';
import React from 'react';

interface FormattedWordProps {
  word: string;
  className?: string;
}

// Simple parser for our custom format: | for syllables, () for silent letters
const parseWord = (word: string) => {
  const parts: { type: 'syllable' | 'silent' | 'normal'; content: string }[] = [];
  let currentSegment = '';
  let inSilent = false;

  for (let i = 0; i < word.length; i++) {
    const char = word[i];

    if (char === '(') {
      if (currentSegment) {
        parts.push({ type: 'normal', content: currentSegment });
        currentSegment = '';
      }
      inSilent = true;
    } else if (char === ')') {
      if (currentSegment) {
        parts.push({ type: 'silent', content: currentSegment });
        currentSegment = '';
      }
      inSilent = false;
    } else if (char === '|' && !inSilent) {
        if (currentSegment) {
            parts.push({ type: 'normal', content: currentSegment });
            currentSegment = '';
        }
        parts.push({ type: 'normal', content: '|' }); // keep separator for styling
    } else {
      currentSegment += char;
    }
  }

  if (currentSegment) {
    parts.push({ type: 'normal', content: currentSegment });
  }
  
  return parts;
};

export const FormattedWord: React.FC<FormattedWordProps> = ({ word, className }) => {
  const parsedParts = parseWord(word);
  let syllableColorToggle = false;

  return (
    <span className={cn('font-body font-semibold tracking-wide', className)}>
      {parsedParts.map((part, index) => {
        if (part.type === 'silent') {
          return (
            <span key={index} className="letter-muette">
              {part.content}
            </span>
          );
        }
        
        // Handle syllable coloring
        const syllables = part.content.split('|');
        return syllables.map((syllable, sylIndex) => {
            if (syllable === '') return null; // Can happen with leading/trailing |
            
            syllableColorToggle = !syllableColorToggle;
            const syllableClass = syllableColorToggle ? 'syllable-a' : 'syllable-b';

            return <React.Fragment key={`${index}-${sylIndex}`}>
                <span className={syllableClass}>{syllable}</span>
                {sylIndex < syllables.length - 1 && <span className="text-transparent">|</span>}
            </React.Fragment>
        });

      })}
    </span>
  );
};
