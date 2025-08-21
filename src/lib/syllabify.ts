
// utils/syllabify.ts
export type ModeAlgo = "STD" | "LC";               // coupe entre (STD) ou après (LC) doublettes
export type TypeSyllabes = "ECRITES" | "ORALES";       // garder/supprimer e caducs
export interface Options {
  modeAlgo: ModeAlgo;          // "STD" | "LC"
  typeSyllabes: TypeSyllabes;      // "ECRITES" | "ORALES"
  lecteurDebutant: boolean;    // true = sépare i+V (et partiellement u+V)
}

const VOWELS = "aàâäeéèêëiîïoôöuùûüyÿœæ";
const LETTER = /[a-zàâäéèêëïîôöùûüÿœæç'-]/i;

// Noyaux vocaliques possibles (ordre = du plus long au plus court)
const VOW_TRIG = ["eau", "ieu"];           // à compléter si tu veux
const VOW_DIGR = [
  "œu","ai","ei","oi","ui","au","eu","ou","ie","io","ia","ua","ue","uo"
];

// Digrammes/trigrammes consonantiques indivisibles
const CONS_DIGR = ["ch","ph","th","sh","gn","qu","gu","ck","sch"];

// Attaques licites (clusters autorisés en début de syllabe)
const ONSET_OK = new Set([
  "pr","pl","br","bl","tr","dr","cr","cl","gr","gl","fr","fl","vr",
  "qu","gu","gn","ch","ph","th","sch","sk","sp","st" // tu peux enlever/ajouter
]);

// Doublettes (comptent pour 2 consonnes, mais règle STD/LC à l’endroit de la coupe)
const DOUBLES = new Set(["bb","cc","dd","ff","gg","ll","mm","nn","pp","rr","ss","tt"]);

// Exceptions ILL (ill = /j/ après voyelle SAUF ces mots -> ill = /il/)
const ILL_EXC = new Set(["ville","mille","tranquille","villa","village","villégiature"]);

function isVowelChar(ch: string) {
  return ch.length === 1 && VOWELS.includes(ch.toLowerCase());
}

function isWordToken(tok: string) {
  // contient au moins une lettre
  return /[a-zàâäéèêëïîôöùûüÿœæç]/i.test(tok);
}

function tokenizeKeepDelims(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of input) {
    if (LETTER.test(ch)) {
      cur += ch;
    } else {
      if (cur) out.push(cur);
      out.push(ch);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

function normalizeWord(w: string) {
  // garde les accents, juste uniformisation d’apostrophes
  return w.replace(/[’]/g, "'"); 
}

/** Supprime quelques e-caducs “sûrs” pour le mode ORALES */
function dropSchwasForOral(w: string): string {
  // -ent verbal final
  if (/ent$/i.test(w) && w.length > 3) w = w.replace(/ent$/i, "");
  // -e final non accentué
  w = w.replace(/e$/i, "");
  // e caduc entre deux consonnes (simple heuristique, évite début/fin)
  w = w.replace(/([bcdfghjklmnpqrstvwxzç])e([bcdfghjklmnpqrstvwxzç])/gi, "$1$2");
  return w;
}

/** Renvoie les positions [start,end) des noyaux (voyelles simples/digrammes/trigrammes) */
function detectNuclei(w: string, lecteurDebutant: boolean): Array<[number, number]> {
  const s = w.toLowerCase();
  const nuclei: Array<[number, number]> = [];
  let i = 0;

  const matchSeq = (list: string[], pos: number) => {
    for (const pat of list) {
      if (s.startsWith(pat, pos)) return pat.length;
    }
    return 0;
  };

  while (i < s.length) {
    // 1) trigrammes, digrammes vocaliques (greedy)
    let len = matchSeq(VOW_TRIG, i);
    if (!len) len = matchSeq(VOW_DIGR, i);

    // 2) cas ILL (après voyelle) -> traite "ill" comme glide /j/ sauf exceptions
    if (!len && i > 0 && s.startsWith("ill", i) && !ILL_EXC.has(s)) {
      // "ill" n'est PAS un noyau, on le laissera à l’attaque de la syllabe suivante
      // rien à faire ici, on continue la recherche sur la voyelle simple ci-dessous
    }

    // 3) voyelle simple
    if (!len && isVowelChar(s[i])) {
      len = 1;
      // gestion de 'y'
      if (s[i] === "y") {
        const prev = i > 0 ? s[i - 1] : "";
        const next = i + 1 < s.length ? s[i + 1] : "";
        const prevIsCons = prev && !isVowelChar(prev);
        const nextIsCons = next && !isVowelChar(next);
        if (!(prevIsCons && nextIsCons)) {
          // y entre voyelles -> glide -> pas noyau, passe au caractère suivant
          len = 0;
        }
      }
      // lecteur débutant : sépare i+V et partiellement u+V
      if (len === 1 && lecteurDebutant) {
        const next = s[i + 1];
        if (s[i] === "i" && next && isVowelChar(next)) {
          // i seul comme noyau
          len = 1;
        } else if (s[i] === "u" && next && isVowelChar(next)) {
          // heuristique : si pas "qu"/"gu" juste avant, accepte u seul
          const prev = s[i - 1] ?? "";
          if (!(prev === "q" || (prev === "g" && /[eiy]/.test(next)))) {
            len = 1;
          }
        }
      }
    }

    if (len) {
      nuclei.push([i, i + len]);
      i += len;
    } else {
      i += 1;
    }
  }

  // si aucune voyelle repérée, tout le mot = 1 “syllabe”
  if (nuclei.length === 0 && w.length > 0) nuclei.push([0, w.length]);
  return nuclei;
}

/** Découpe entre deux noyaux selon 1C / 2C / 3C + doublettes + digrammes consonnes */
function cutBetween(w: string, prev: [number, number], next: [number, number], opt: Options): number {
  const s = w.toLowerCase();
  const from = prev[1];
  const to = next[0];
  if (from >= to) return from; // rien entre noyaux

  // Tokenise la “consonnerie” en tenant compte des digrammes/trigrammes
  const segs: string[] = [];
  let i = from;
  while (i < to) {
    let picked = "";
    for (const dg of CONS_DIGR) {
      if (s.startsWith(dg, i)) { picked = dg; break; }
    }
    if (picked) { segs.push(picked); i += picked.length; }
    else { segs.push(s[i]); i += 1; }
  }

  // Cas simple : 1 “consonne” -> va à l’attaque suivante
  if (segs.length === 1) return from;

  // Doublettes : appliquer STD/LC
  const rawMid = s.slice(from, to);
  if (rawMid.length >= 2) {
    const dbl = rawMid.slice(0, 2);
    if (DOUBLES.has(dbl)) {
      return opt.modeAlgo === "STD" ? from + 1 : from; // STD: som|me ; LC: so|mme
    }
  }

  // 2 segments : teste si le 2e forme une attaque licite avec la voyelle suivante
  if (segs.length === 2) {
    const onset = segs.join("");
    if (ONSET_OK.has(onset)) return from; 
    return from + segs[0].length;
  }
  
  // 3+ segments : si les 2 derniers peuvent être attaque -> C|CC sinon CC|C
  if (segs.length >= 3) {
      const lastTwo = segs.slice(1).join("");
      if (ONSET_OK.has(lastTwo)) return from;
      
      const lastThree = segs.slice(1).join("");
       if (ONSET_OK.has(lastThree)) return from;

      return from + segs[0].length;
  }

  return from;
}

/** Découpe un mot en syllabes (retourne un tableau de chaînes) */
export function segmentWord(word: string, opt: Options): string[] {
  if (!word) return [];
  let w = normalizeWord(word);

  if (opt.typeSyllabes === "ORALES") {
    w = dropSchwasForOral(w);
    if (!w) return [word]; // si tout a sauté (cas limite)
  }

  const nuclei = detectNuclei(w, opt.lecteurDebutant);
  if (nuclei.length <= 1) {
    return [w];
  }
  
  const sylls: string[] = [];
  let currentPos = 0;

  for (let i = 0; i < nuclei.length -1; i++) {
    const cutPoint = cutBetween(w, nuclei[i], nuclei[i+1], opt);
    sylls.push(w.slice(currentPos, cutPoint));
    currentPos = cutPoint;
  }
  sylls.push(w.slice(currentPos));

  // Option : recoller si une “syllabe” vide (sécurité)
  return sylls.filter(s => s.length > 0);
}

/** Segmente un texte en conservant espaces/ponctuation */
export function segmentText(input: string, opt: Options): Array<string | string[]> {
  if (!input) return [];
  const tokens = tokenizeKeepDelims(input);
  return tokens.map(t => (isWordToken(t) ? segmentWord(t, opt) : t));
}
