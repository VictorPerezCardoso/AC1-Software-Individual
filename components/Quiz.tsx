import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizQuestion } from '../types';
import Button from './shared/Button';
import Card from './shared/Card';
import Confetti from './shared/Confetti';

// Hook para Text-to-Speech
const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        
        // Cancela qualquer fala anterior
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    const cancel = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    useEffect(() => {
        // Cleanup: Garante que a fala pare se o componente for desmontado
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return { speak, cancel, isSpeaking };
};

// Ícone de Alto-falante
const SpeakerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

// Ícone de Parar
const StopIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563C9.252 14.437 9 14.185 9 13.874V9.563Z" />
    </svg>
);

const getMotivationalMessage = (score: number, totalQuestions: number): string => {
  if (totalQuestions === 0) return "O quiz foi concluído. Continue sua jornada de aprendizado!";
  
  const percentage = (score / totalQuestions) * 100;

  if (percentage === 100) {
    return "Incrível! Você dominou completamente este tópico. Continue com esse excelente trabalho!";
  }
  if (percentage >= 70) {
    return "Excelente resultado! Você tem um ótimo conhecimento sobre o assunto. Continue estudando para aperfeiçoar ainda mais!";
  }
  if (percentage >= 50) {
    return "Bom trabalho! Você está no caminho certo. Revise os pontos que errou para fortalecer seu conhecimento.";
  }
  return "Não desanime! Cada erro é uma oportunidade de aprendizado. Revise os materiais e tente novamente. Você consegue!";
};


interface QuizProps {
  topic: string;
  questions: QuizQuestion[];
  onFinish: (score: number) => void;
  onProgressUpdate: (progress: { currentQuestionIndex: number; answers: (string | null)[] }) => void;
  initialProgress?: { currentQuestionIndex: number; answers: (string | null)[] } | null;
}

const Quiz: React.FC<QuizProps> = ({ topic, questions, onFinish, onProgressUpdate, initialProgress }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialProgress?.currentQuestionIndex ?? 0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    initialProgress?.answers ?? Array(questions.length).fill(null)
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const { speak, cancel, isSpeaking } = useTextToSpeech();

  // Recalculate score on initial load from saved progress and set initial view
  useEffect(() => {
    let initialScore = 0;
    answers.forEach((answer, index) => {
      if (answer && questions[index] && answer === questions[index].correctAnswer) {
        initialScore++;
      }
    });
    setScore(initialScore);

    const currentAnswer = answers[currentQuestionIndex];
    if (currentAnswer) {
      setSelectedAnswer(currentAnswer);
      setShowFeedback(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Report progress up to App component instead of saving directly
  useEffect(() => {
    if (isFinished) return;
    onProgressUpdate({ currentQuestionIndex, answers });
  }, [currentQuestionIndex, answers, isFinished, onProgressUpdate]);

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleAnswer = (option: string) => {
    if (showFeedback) return;
    
    const isAlreadyAnswered = !!answers[currentQuestionIndex];
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = option;
    setAnswers(newAnswers);

    setSelectedAnswer(option);
    setShowFeedback(true);

    if (option === currentQuestion.correctAnswer && !isAlreadyAnswered) {
      setScore(score + 1);
    } else if (option !== currentQuestion.correctAnswer && isAlreadyAnswered && questions[currentQuestionIndex].correctAnswer === answers[currentQuestionIndex]) {
        // This logic handles changing a correct answer to an incorrect one.
        // This case is unlikely with the current UI but good for robustness.
        setScore(score - 1);
    }
  };

  const handleNext = () => {
    cancel(); // Para a fala ao avançar
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const nextAnswer = answers[nextIndex];
      setSelectedAnswer(nextAnswer);
      setShowFeedback(!!nextAnswer);
    } else {
      setIsFinished(true);
    }
  };
  
  const handleFinishQuiz = () => {
    onFinish(score);
  };

  const handleSpeakQuestion = () => {
    if (!currentQuestion) return;
    if (isSpeaking) {
        cancel();
    } else {
        const textToSpeak = `${currentQuestion.question}. Opções: ${currentQuestion.options.join('. ')}`;
        speak(textToSpeak);
    }
  };


  if (isFinished) {
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    
    let particleCount = 0;
    if (percentage === 100) {
        particleCount = 150; // Grande celebração para pontuação perfeita
    } else if (percentage >= 70) {
        particleCount = 75; // Celebração média
    } else if (percentage >= 50) {
        particleCount = 30; // Pequena celebração
    }

    const motivationalMessage = getMotivationalMessage(score, questions.length);
    return (
      <>
        <Confetti particleCount={particleCount} />
        <Card className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Concluído!</h3>
          <p className="text-lg text-gray-300 mb-4">Tópico: {topic}</p>
          <p className="text-4xl font-bold text-indigo-400 mb-6">
            Sua Pontuação: {score} / {questions.length}
          </p>
          <p className="text-lg text-gray-300 mb-6 italic">
            "{motivationalMessage}"
          </p>
          <Button onClick={handleFinishQuiz}>Voltar ao Início</Button>
        </Card>
      </>
    );
  }

  if (!currentQuestion) {
    return <Card><p className="text-center p-4">Carregando pergunta...</p></Card>;
  }

  return (
    <Card>
      <div className="mb-4">
        <p className="text-sm text-indigo-400">Pergunta {currentQuestionIndex + 1} de {questions.length}</p>
        <div className="flex items-center gap-3 mt-1">
            <h3 className="text-xl font-semibold text-white flex-grow">{currentQuestion.question}</h3>
            <button onClick={handleSpeakQuestion} title="Ler pergunta em voz alta" className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-white/10">
                {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
            </button>
        </div>
      </div>
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          let buttonClass = 'bg-gray-700/50 hover:bg-gray-600/50';
          if (showFeedback) {
            if (option === currentQuestion.correctAnswer) {
              buttonClass = 'bg-green-500/50 text-white';
            } else if (isSelected) {
              buttonClass = 'bg-red-500/50 text-white';
            }
          }
          return (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showFeedback}
              className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${buttonClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <div className="mt-4 text-center">
          <p className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? 'Correto!' : 'Incorreto!'}
          </p>
          {!isCorrect && <p className="text-gray-300">A resposta correta era: {currentQuestion.correctAnswer}</p>}
          <Button onClick={handleNext} className="mt-4">
            {currentQuestionIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default Quiz;