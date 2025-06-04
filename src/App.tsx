import QuestionCard from './QuestionCard'
import { useLoadQuestions } from './useLoadQuestions';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

function QuizApp() {
  // Use react-router's hooks for search params
  const [searchParams, setSearchParams] = useSearchParams();
  const questionNumber = searchParams.get('questionNumber') ? parseInt(searchParams.get('questionNumber')!) : 1;
  const setFromUrl = searchParams.get('set') || undefined;

  const { availableSets, isLoadingQuestions, isLoadingSets, questions, setSelectedSet, selectedSet } = useLoadQuestions(setFromUrl);

  // When available sets load and we have a set in the URL, ensure it's selected
  useEffect(() => {
    if (setFromUrl && availableSets.includes(setFromUrl)) {
      setSelectedSet(setFromUrl);
    }
  }, [availableSets, setFromUrl, setSelectedSet]);

  const isLoading = isLoadingSets || isLoadingQuestions;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  function handleNextQuestion() {
    const nextQuestionNumber = questionNumber + 1;
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('questionNumber', nextQuestionNumber.toString());
      return newParams;
    });
  }

  function handlePreviousQuestion() {
    const previousQuestionNumber = questionNumber - 1;
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('questionNumber', previousQuestionNumber.toString());
      return newParams;
    });
  }

  function handleSetChange(set: string) {
    setSelectedSet(set);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('set', set);
      newParams.set('questionNumber', '1'); // Reset to first question when changing sets
      return newParams;
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Leben in Deutschland</h1>
      <div className="mb-4">
        <label htmlFor="question-set" className="block text-sm font-medium text-gray-700 mb-2">Select Question Set:</label>
        <select
          id="question-set"
          className="border border-gray-300 rounded-md p-2"
          onChange={(e) => handleSetChange(e.target.value)}
          value={selectedSet || ""}
        >
          <option value="">-- Select a set --</option>
          {availableSets.map((set) => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
      </div>
      {questions && questions.length > 0 ? (
        <QuestionCard
          question={questions[questionNumber - 1]}
          hasNext={questionNumber < questions.length}
          hasPrevious={questionNumber > 1}
          onNext={() => handleNextQuestion()}
          onPrevious={() => handlePreviousQuestion()}
        />
      ) : (
        <p>No questions available for the selected set.</p>
      )}
    </div>
  );
}

// Main App component that sets up the router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuizApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
