import React, { useEffect, useState } from 'react';
import { type Question } from './types';
import { db } from './services/database';

interface QuestionCardProps {
  question: Question;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onNext, onPrevious, hasNext = false, hasPrevious = false }) => {
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showQuestionText, setShowQuestionText] = useState<boolean>(false);
  const [stats, setStats] = useState<{ correctCount: number, incorrectCount: number }>({ correctCount: 0, incorrectCount: 0 });

  // Reset selected answer and hide text whenever the question changes
  useEffect(() => {
    setSelectedAnswerIndex(null);
    setShowQuestionText(false);
    
    // Load stats for this question
    const loadStats = async () => {
      const questionStats = await db.getQuestionStats(question.questionNumber);
      setStats({
        correctCount: questionStats.correctCount,
        incorrectCount: questionStats.incorrectCount
      });
    };
    
    loadStats();
  }, [question.questionNumber]);
  
  const handleAnswerSelection = async (index: number) => {
    setSelectedAnswerIndex(index);
    
    // Record the answer in the database
    const isCorrect = question.answers[index].isCorrect;
    await db.recordAnswer(question.questionNumber, isCorrect);
    
    // Update local stats
    setStats(prev => ({
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      incorrectCount: !isCorrect ? prev.incorrectCount + 1 : prev.incorrectCount,
    }));
  };
  
  const toggleQuestionText = () => {
    setShowQuestionText(prev => !prev);
  };
  
  const isAnswerSelected = selectedAnswerIndex !== null;
  const isCorrectAnswer = isAnswerSelected && question.answers[selectedAnswerIndex].isCorrect;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-gray-500 text-sm">Question {question.questionNumber}</span>
          <div className="text-xs mt-1 text-gray-600">
            <span className="inline-block mr-3">
              <span className="text-green-600">✓</span> {stats.correctCount}
            </span>
            <span className="inline-block">
              <span className="text-red-600">✗</span> {stats.incorrectCount}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        {showQuestionText ? (
          <h2 className="text-xl font-bold mt-1">{question.questionText}</h2>
        ) : (
          <button 
            onClick={toggleQuestionText}
            className="text-blue-500 hover:text-blue-700 text-sm underline font-normal"
            aria-label="Show question text"
          >
            Show question text
          </button>
        )}
        {showQuestionText && (
          <button 
            onClick={toggleQuestionText}
            className="text-blue-500 hover:text-blue-700 text-sm ml-2 underline font-normal"
            aria-label="Hide question text"
          >
            Hide question text
          </button>
        )}
      </div>
      
      {question.questionImageUrl && (
        <div className="mb-4">
          <img 
            src={question.questionImageUrl} 
            alt="Question visual" 
            className="w-full rounded-md"
          />
        </div>
      )}
      
      <div className="space-y-3 mb-6">
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswerIndex === index;
          let bgColor = "bg-white";
          
          // Determine if this answer is correct and we should show it
          const shouldHighlightCorrect = isAnswerSelected && answer.isCorrect;
          
          if (isSelected) {
            bgColor = answer.isCorrect ? "bg-green-100" : "bg-red-100";
          }
          
          return (
            <div 
              key={index}
              className={`flex items-start p-3 border rounded-md ${bgColor} ${
                isSelected ? 'ring-2 ' + (answer.isCorrect ? 'ring-green-500' : 'ring-red-500') : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.questionNumber}`}
                id={`answer-${index}`}
                className="mt-1"
                checked={isSelected}
                onChange={() => handleAnswerSelection(index)}
                disabled={isAnswerSelected}
              />
              <label 
                htmlFor={`answer-${index}`}
                className="ml-3 cursor-pointer flex-grow"
              >
                {answer.text}
              </label>
              
              {(isSelected || shouldHighlightCorrect) && (
                <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                  {answer.isCorrect ? "✓" : (isSelected ? "✗" : "")}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {isAnswerSelected && question.explanation && (
        <div className={`mb-4 p-4 rounded-md ${isCorrectAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-gray-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
