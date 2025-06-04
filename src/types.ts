export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  questionNumber: number;
  questionText: string;
  questionImageUrl?: string;
  explanation?: string;
  answers: Answer[];
}
