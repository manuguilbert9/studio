

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const numberToFrench: { [key: number]: string } = {
    0: "zéro", 1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq",
    6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix",
    11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze",
    16: "seize", 17: "dix-sept", 18: "dix-huit", 19: "dix-neuf", 20: "vingt",
    21: "vingt-et-un", 22: "vingt-deux", 23: "vingt-trois", 24: "vingt-quatre", 25: "vingt-cinq",
    26: "vingt-six", 27: "vingt-sept", 28: "vingt-huit", 29: "vingt-neuf", 30: "trente",
    31: "trente-et-un", 32: "trente-deux", 33: "trente-trois", 34: "trente-quatre", 35: "trente-cinq",
    36: "trente-six", 37: "trente-sept", 38: "trente-huit", 39: "trente-neuf", 40: "quarante",
    41: "quarante-et-un", 42: "quarante-deux", 43: "quarante-trois", 44: "quarante-quatre", 45: "quarante-cinq",
    46: "quarante-six", 47: "quarante-sept", 48: "quarante-huit", 49: "quarante-neuf", 50: "cinquante",
    51: "cinquante-et-un", 52: "cinquante-deux", 53: "cinquante-trois", 54: "cinquante-quatre", 55: "cinquante-cinq",
    56: "cinquante-six", 57: "cinquante-sept", 58: "cinquante-huit", 59: "cinquante-neuf", 60: "soixante",
    61: "soixante-et-un", 62: "soixante-deux", 63: "soixante-trois", 64: "soixante-quatre", 65: "soixante-cinq",
    66: "soixante-six", 67: "soixante-sept", 68: "soixante-huit", 69: "soixante-neuf", 70: "soixante-dix",
    71: "soixante-et-onze", 72: "soixante-douze", 73: "soixante-treize", 74: "soixante-quatorze", 75: "soixante-quinze",
    76: "soixante-seize", 77: "soixante-dix-sept", 78: "soixante-dix-huit", 79: "soixante-dix-neuf", 80: "quatre-vingts",
    81: "quatre-vingt-un", 82: "quatre-vingt-deux", 83: "quatre-vingt-trois", 84: "quatre-vingt-quatre", 85: "quatre-vingt-cinq",
    86: "quatre-vingt-six", 87: "quatre-vingt-sept", 88: "quatre-vingt-huit", 89: "quatre-vingt-neuf", 90: "quatre-vingt-dix",
    91: "quatre-vingt-onze", 92: "quatre-vingt-douze", 93: "quatre-vingt-treize", 94: "quatre-vingt-quatorze", 95: "quatre-vingt-quinze",
    96: "quatre-vingt-seize", 97: "quatre-vingt-dix-sept", 98: "quatre-vingt-dix-huit", 99: "quatre-vingt-dix-neuf", 100: "cent"
};


// A more generic function to convert any number to French words
export function numberToWords(num: number): string {
    if (numberToFrench[num] !== undefined) {
        return numberToFrench[num];
    }

    if (num < 0 || num > 999999999) {
        return "nombre hors limites";
    }

    if (num === 0) return "zéro";

    let words = "";
    
    if (num >= 1000000) {
        const millions = Math.floor(num / 1000000);
        words += numberToWords(millions) + " million" + (millions > 1 ? "s" : "");
        num %= 1000000;
        if (num > 0) words += " ";
    }
    
    if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        if (thousands > 1) {
            words += numberToWords(thousands) + " ";
        }
        words += "mille";
        num %= 1000;
        if (num > 0) words += " ";
    }

    if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        if (hundreds > 1) {
             words += numberToFrench[hundreds] + " ";
        }
        words += "cent";
        if (num % 100 !== 0) words += " "; else if (hundreds > 1) words += "s";
        num %= 100;
    }

    if (num > 0) {
        if (words !== "") words += "";
        if (numberToFrench[num]) {
            words += numberToFrench[num];
        } else {
            const tens = Math.floor(num / 10) * 10;
            const units = num % 10;
            words += numberToFrench[tens] + (units === 1 ? "-et-" : "-") + numberToFrench[units];
        }
    }
    return words.trim();
}

/**
 * Converts a hex color string to an HSL string for Tailwind CSS variables.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns The HSL color string (e.g., "H S% L%").
 */
export function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}
