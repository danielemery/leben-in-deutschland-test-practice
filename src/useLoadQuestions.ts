import { useEffect, useState } from "react";
import type { Question } from "./types";

export function useLoadQuestions() {
  // Load questions from the public folder
  const [questionSets, setQuestionSets] = useState<Record<string, () => Promise<{ default: Question[] }>> | undefined>(undefined);
  const [isLoadingSets, setIsLoadingSets] = useState<boolean>(true);
  const [selectedSet, setSelectedSet] = useState<string | undefined>(undefined);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  const [questions, setQuestions] = useState<Question[] | undefined>(undefined);

  useEffect(() => {
    const loadQuestionSets = async () => {
      setIsLoadingSets(true);
      const questionFiles = await import.meta.glob<{ default: Question[] }>('/public/data/*.json');
      setQuestionSets(questionFiles);
      setIsLoadingSets(false);
    };
    loadQuestionSets();
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedSet || !questionSets) return;

      setIsLoadingQuestions(true);
      try {
        const loadSet = questionSets[selectedSet];
        if (loadSet) {
          const questionsData = await loadSet();
          setQuestions(questionsData.default as Question[]);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        setQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [selectedSet, questionSets]);

  return {
    isLoadingSets,
    isLoadingQuestions,
    questions,
    availableSets: questionSets ? Object.keys(questionSets) : [],
    setSelectedSet
  };
}
