import questions from '../questions.json';

export type StateName = keyof typeof questions.stateQuestions;
export const availableStates = Object.keys(questions.stateQuestions) as StateName[];

export function useQuestions(selectedState?: string) {
  if (availableStates.includes(selectedState as StateName)) {
    return {
      questions: [...questions.generalQuestions, ...(questions.stateQuestions[selectedState as StateName])],
    };
  }
  return {
    questions: [...questions.generalQuestions],
    error: 'Please select a valid state to get started.',
  };
}
