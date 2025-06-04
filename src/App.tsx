import QuestionCard from './QuestionCard'
import { useLoadQuestions } from './useLoadQuestions';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from './services/database';

// Define practice modes
type PracticeMode = 'sequential' | 'performance-based';

function QuizApp() {
  // Use react-router's hooks for search params
  const [searchParams, setSearchParams] = useSearchParams();
  const questionNumber = searchParams.get('questionNumber') ? parseInt(searchParams.get('questionNumber')!) : 1;
  const setFromUrl = searchParams.get('set') || undefined;
  const practiceMode = (searchParams.get('mode') as PracticeMode) || 'sequential';
  
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Use a ref to track mode changes
  const previousMode = useRef<PracticeMode | null>(null);

  const { availableSets, isLoadingQuestions, isLoadingSets, questions, setSelectedSet, selectedSet } = useLoadQuestions(setFromUrl);

  // When available sets load and we have a set in the URL, ensure it's selected
  useEffect(() => {
    if (setFromUrl && availableSets.includes(setFromUrl)) {
      setSelectedSet(setFromUrl);
    }
  }, [availableSets, setFromUrl, setSelectedSet]);

  // Calculate question order when questions change or practice mode changes
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    const updateQuestionOrder = async () => {
      // If practice mode changed, we'll reset to the first question
      const modeChanged = previousMode.current !== null && previousMode.current !== practiceMode;
      previousMode.current = practiceMode;
      
      let orderedNumbers: number[] = [];
      
      if (practiceMode === 'sequential') {
        // Sequential mode - just use question numbers in order
        orderedNumbers = questions.map((q, index) => index + 1);
      } else if (practiceMode === 'performance-based') {
        // Performance mode - sort by success rate
        const stats = await db.getAllQuestionStats();
        
        // Create a map of question numbers to their stats
        const statsMap = new Map();
        stats.forEach(stat => {
          statsMap.set(stat.questionNumber, stat);
        });
        
        // Sort questions by success rate (ascending)
        orderedNumbers = questions.map((q, index) => ({
          index: index + 1,
          questionNumber: q.questionNumber,
          stats: statsMap.get(q.questionNumber) || { questionNumber: q.questionNumber, correctCount: 0, incorrectCount: 0 }
        }))
        .sort((a, b) => {
          // Sort by success rate (lowest first)
          const aRate = db.calculateSuccessRate(a.stats);
          const bRate = db.calculateSuccessRate(b.stats);
          return aRate - bRate;
        })
        .map(item => item.index);
      }
      
      setQuestionOrder(orderedNumbers);
      
      // If the mode changed or we're loading for the first time, go to the first question
      if (modeChanged) {
        // Go to the first question in the new order
        const firstQuestionNumber = orderedNumbers.length > 0 ? orderedNumbers[0] : 1;
        setCurrentQuestionIndex(0);
        
        // Update URL with the first question number
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('questionNumber', firstQuestionNumber.toString());
          return newParams;
        });
      } else {
        // Otherwise find where we are in the current order
        const index = orderedNumbers.findIndex(num => num === questionNumber);
        setCurrentQuestionIndex(index !== -1 ? index : 0);
      }
    };
    
    updateQuestionOrder();
  }, [questions, practiceMode, questionNumber, setSearchParams]);

  const isLoading = isLoadingSets || isLoadingQuestions;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questionOrder.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestionNumber = questionOrder[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('questionNumber', nextQuestionNumber.toString());
        return newParams;
      });
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQuestionNumber = questionOrder[prevIndex];
      setCurrentQuestionIndex(prevIndex);
      
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('questionNumber', prevQuestionNumber.toString());
        return newParams;
      });
    }
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
  
  function handlePracticeModeChange(mode: PracticeMode) {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('mode', mode);
      // Let the effect handle setting the question number
      return newParams;
    });
  }

  // Get the current question based on the order
  const currentQuestion = questions && questionOrder.length > 0 ? 
    questions[questionOrder[currentQuestionIndex] - 1] : null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Leben in Deutschland</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label htmlFor="question-set" className="block text-sm font-medium text-gray-700 mb-2">
            Select Question Set:
          </label>
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
        
        <div>
          <label htmlFor="practice-mode" className="block text-sm font-medium text-gray-700 mb-2">
            Practice Mode:
          </label>
          <select
            id="practice-mode"
            className="border border-gray-300 rounded-md p-2"
            onChange={(e) => handlePracticeModeChange(e.target.value as PracticeMode)}
            value={practiceMode}
          >
            <option value="sequential">Sequential</option>
            <option value="performance-based">Focus on Weak Points</option>
          </select>
        </div>
      </div>
      
      {currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          hasNext={currentQuestionIndex < questionOrder.length - 1}
          hasPrevious={currentQuestionIndex > 0}
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
