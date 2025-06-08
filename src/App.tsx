import QuestionCard from './QuestionCard'
import { useQuestions, availableStates, type StateName } from './useQuestions';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from './services/database';
import InfoCard from './InfoCard';

// Define practice modes
type PracticeMode = 'sequential' | 'performance-based';

function QuizApp() {
  // Use react-router's hooks for search params
  const [searchParams, setSearchParams] = useSearchParams();
  const questionNumber = searchParams.get('questionNumber') ? parseInt(searchParams.get('questionNumber')!) : 1;
  const stateFromUrl = searchParams.get('set') || undefined;
  const practiceMode = (searchParams.get('mode') as PracticeMode) || 'sequential';

  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Use a ref to track mode changes
  const previousMode = useRef<PracticeMode | null>(null);

  const { questions, error } = useQuestions(stateFromUrl);

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
        orderedNumbers = questions.map((_q, index) => index + 1);
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
  // Ignoring this because questions only change when the user selects a different state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceMode, questionNumber, setSearchParams]);

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

  function handleStateChanged(set: StateName) {
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
            Select State:
          </label>
          <select
            id="question-set"
            className="border border-gray-300 rounded-md p-2"
            onChange={(e) => handleStateChanged(e.target.value as StateName)}
            value={stateFromUrl || ""}
          >
            <option value="">-- Select a set --</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>{state}</option>
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

      {error ? (
        <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4 max-w-md w-full">
          <p className="font-bold">Information</p>
          <p>{error}</p>
        </div>
      ) : currentQuestion ? (
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

      <InfoCard title='About this tool' className='mt-4' sections={[
        {
          title: 'Where does the question data come from?',
          content: `The questions are scraped from the official "Leben in Deutschland" practice page: https://oet.bamf.de/ords/oetut/f?p=514:1::::::`
        },
        {
          title: 'Where are these question statistics saved?',
          content: 'The question statistics are saved in your browser using IndexedDB. This means they will persist across sessions, but only on this device and browser.'
        },
        {
          title: 'How does the focus on weak points work?',
          content: `In this mode, questions are simply sorted by how many times you have answered them correctly minus the number of times you have answered incorrectly. This means that questions you have answered correctly by chance will still be practiced, but questions you have answered incorrectly will be prioritized.`
        },
        {
          title: `What's with the show question text option?`,
          content: 'The official site has a mixture of questions in picture and text format (mostly pictures). The picture is being shown by default as its true to the original site. The text has been added as an option both for accessibility and to allow the use of translation tools when practicing (it was sourced by simply passing the image through ocr using tesseract.js).',
        },
        {
          title: 'Is this open source?',
          content: `Yes! You can find the source code on GitHub at https://github.com/danielemery/leben-in-deutschland-test-practice`
        },
        {
          title: 'What about feature X?',
          content: `If you find any bugs or have suggestions for improvements, please open an issue on GitHub (https://github.com/danielemery/leben-in-deutschland-test-practice). Pull requests are also welcome!`
        },
        {
          title: 'Why does this exist?',
          content: `I needed to get ready for my Leben in Deutschland test and couldn't find a good free site or app without ads. I quickly threw this together for myself and thought someone else might get value out of it.`
        }
      ]} />
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
