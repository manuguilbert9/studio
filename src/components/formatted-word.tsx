
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { syllabify } from 'syllabificate';

interface FormattedWordProps {
  word: string;
  className?: string;
}

const parseWord = (word: string): React.ReactNode[] => {
  const syllables = syllabify(word.replace(/\|.*?\|/g, '').replace(/\(.*?\)/g, ''));
  const silentLettersMatch = word.match(/\((.*?)\)/);
  const silentLetters = silentLettersMatch ? silentLettersMatch[1] : '';

  let nodes: React.ReactNode[] = [];
  let charIndex = 0;
  let keyIndex = 0;

  if (syllables.length === 0) {
    return [word];
  }
  
  const originalWordOnly = word.replace(/\(.*?\)/, '');

  syllables.forEach((syllable, i) => {
    const colorClass = i % 2 === 0 ? 'syllable-a' : 'syllable-b';
    const syllableContent = originalWordOnly.substring(charIndex, charIndex + syllable.length);
    nodes.push(
      <span key={`syl-${keyIndex++}`} className={colorClass}>
        {syllableContent}
      </span>
    );
    charIndex += syllable.length;
  });

  if (silentLetters) {
    nodes.push(
      <span key={`silent-${keyIndex++}`} className="letter-muette">
        {silentLetters}
      </span>
    );
  }

  return nodes;
};


export function FormattedWord({ word, className }: FormattedWordProps) {
  if (!word) return null;

  // If word has specific syllable markers, use them
  if (word.includes('|')) {
     const parts = word.replace(/\(.*?\)/g, '').split(/\|/g).filter(Boolean);
     const silentLettersMatch = word.match(/\((.*?)\)/);
     const silentLetters = silentLettersMatch ? silentLettersMatch[1] : '';

     return (
        <span className={cn(className, "font-body")}>
            {parts.map((part, index) => (
                <span key={index} className={index % 2 === 0 ? 'syllable-a' : 'syllable-b'}>{part}</span>
            ))}
            {silentLetters && <span className="letter-muette">{silentLetters}</span>}
        </span>
     )
  }
  
  // Otherwise, use automatic syllabification
  const formatted = parseWord(word);

  return (
    <span className={cn(className, "font-body")}>
      {formatted.map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)}
    </span>
  );
}
