
export interface Question {
  question: string;
  options: string[];
  answer: string;
  image?: string | null;
  hint?: string;
  hour?: number;
  minute?: number;
}

const writingQuestions: Omit<Question, 'question'>[] = [
    { options: ['Voiture', 'Voitrue', 'Vouature', 'Voiturre'], answer: 'Voiture', hint: 'orthographe véhicule' },
    { options: ['Maison', 'Maizon', 'Meison', 'Maisone'], answer: 'Maison', hint: 'orthographe bâtiment' },
    { options: ['Écolle', 'Aicole', 'École', 'Aicolle'], answer: 'École', hint: 'orthographe lieu d\'apprentissage' },
    { options: ['Garçon', 'Garcon', 'Garscon', 'Garçons'], answer: 'Garçon', hint: 'orthographe personne' },
    { options: ['Fille', 'Fiile', 'Fie', 'Fill'], answer: 'Fille', hint: 'orthographe personne' },
    { options: ['Livre', 'Lievre', 'Livre', 'Leavre'], answer: 'Livre', hint: 'orthographe objet' },
    { options: ['Table', 'Tabble', 'Tabel', 'Tabl'], answer: 'Table', hint: 'orthographe meuble' },
    { options: ['Chése', 'Chaize', 'Chèze', 'Chaise'], answer: 'Chaise', hint: 'orthographe meuble' },
    { options: ['Ordinater', 'Ordinateur', 'Ordinatore', 'Ordinatur'], answer: 'Ordinateur', hint: 'orthographe appareil' },
    { options: ['Soleil', 'Solail', 'Soleille', 'Solleil'], answer: 'Soleil', hint: 'orthographe astre' },
];

const calculationQuestions: Omit<Question, 'answer'>[] = [
    { question: 'Combien font 5 + 7 ?', options: ['10', '11', '12', '13'] },
    { question: 'Combien font 15 - 6 ?', options: ['7', '8', '9', '10'] },
    { question: 'Combien font 8 x 2 ?', options: ['14', '16', '18', '20'] },
    { question: 'Combien font 10 + 9 ?', options: ['17', '18', '19', '20'] },
    { question: 'Combien font 20 - 11 ?', options: ['7', '8', '9', '10'] },
    { question: 'Combien font 3 x 4 ?', options: ['10', '11', '12', '13'] },
    { question: 'Combien font 14 + 5 ?', options: ['17', '18', '19', '20'] },
    { question: 'Combien font 18 - 9 ?', options: ['8', '9', '10', '11'] },
    { question: 'Combien font 6 x 3 ?', options: ['16', '17', '18', '19'] },
    { question: 'Combien font 7 + 8 ?', options: ['13', '14', '15', '16'] },
];


function generateTimeQuestion(): Question {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 12) * 5;
    const answer = `${hour}:${minute.toString().padStart(2, '0')}`;

    const options = [answer];
    while (options.length < 4) {
        const wrongHour = Math.floor(Math.random() * 12) + 1;
        const wrongMinute = Math.floor(Math.random() * 12) * 5;
        const wrongOption = `${wrongHour}:${wrongMinute.toString().padStart(2, '0')}`;
        if (!options.includes(wrongOption)) {
            options.push(wrongOption);
        }
    }

    return {
        question: 'Quelle heure est-il sur l\'horloge ?',
        hour,
        minute,
        options: options.sort(() => Math.random() - 0.5),
        answer,
    };
}

export function generateQuestions(skill: string, count: number): Question[] {
  if (skill === 'time') {
    return Array.from({ length: count }, generateTimeQuestion);
  }
  
  if (skill === 'writing') {
     return writingQuestions.slice(0, count).map(q => ({
        ...q,
        question: 'Quel mot est correctement orthographié ?'
     }));
  }

  if (skill === 'calculation') {
      return calculationQuestions.slice(0, count).map(q => {
          const parts = q.question.replace('Combien font ', '').replace(' ?', '').split(' ');
          const num1 = parseInt(parts[0]);
          const op = parts[1];
          const num2 = parseInt(parts[2]);
          let answer;
          if (op === '+') answer = num1 + num2;
          else if (op === '-') answer = num1 - num2;
          else if (op === 'x') answer = num1 * num2;
          return { ...q, answer: answer?.toString() ?? '' };
      });
  }

  // Fallback for other skills for now
  return Array.from({ length: count }, () => ({
    question: 'Ceci est un exemple de question. Choisissez la bonne réponse.',
    options: ['Bonne réponse', 'Mauvaise réponse', 'Mauvaise réponse', 'Mauvaise réponse'],
    answer: 'Bonne réponse',
    hint: 'point d\'interrogation',
  }));
}
