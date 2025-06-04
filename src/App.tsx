import QuestionCard from './QuestionCard'
import { useLoadQuestions } from './useLoadQuestions';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';

function QuizApp() {
  // Use react-router's hooks for search params
  const [searchParams, setSearchParams] = useSearchParams();
  const questionNumber = searchParams.get('questionNumber') ? parseInt(searchParams.get('questionNumber')!) : 1;

  const { availableSets, isLoadingQuestions, isLoadingSets, questions, setSelectedSet } = useLoadQuestions();

  const isLoading = isLoadingSets || isLoadingQuestions;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  function handleNextQuestion() {
    const nextQuestionNumber = questionNumber + 1;
    setSearchParams({ questionNumber: nextQuestionNumber.toString() });
  }

  function handlePreviousQuestion() {
    const previousQuestionNumber = questionNumber - 1;
    setSearchParams({ questionNumber: previousQuestionNumber.toString() });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Leben in Deutschland</h1>
      <div className="mb-4">
        <label htmlFor="question-set" className="block text-sm font-medium text-gray-700 mb-2">Select Question Set:</label>
        <select
          id="question-set"
          className="border border-gray-300 rounded-md p-2"
          onChange={(e) => setSelectedSet(e.target.value)}
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
