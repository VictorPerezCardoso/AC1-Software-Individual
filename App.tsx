
import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import LearningHub from './components/LearningHub.tsx';
import StudyHistory from './components/KnowledgeBase.tsx';
import Quiz from './components/Quiz.tsx';
import Dashboard from './components/Dashboard.tsx';
import Auth from './components/Auth.tsx';
import { AppView, Resource, StudySession, QuizQuestion, User } from './types.ts';
import { generateQuiz, getLearningResources } from './services/geminiService.ts';
import Spinner from './components/shared/Spinner.tsx';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [studyHistory, setStudyHistory] = useState<StudySession[]>([]);
  
  // Active Session State - Lifted from LearningHub to App
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [suggestedResources, setSuggestedResources] = useState<Resource[]>([]);
  const [isLoadingSuggestedResources, setIsLoadingSuggestedResources] = useState(false);
  const [suggestedResourcesError, setSuggestedResourcesError] = useState<string | null>(null);

  const [sessionForQuiz, setSessionForQuiz] = useState<StudySession | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [savedQuizState, setSavedQuizState] = useState<{ currentQuestionIndex: number; answers: (string | null)[] } | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<'normal' | 'hard'>('normal');


  const [topicToContinue, setTopicToContinue] = useState<string | null>(null);

  // Load users from localStorage on initial render
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('cotes_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
    }
  }, []);

  // Load user-specific data when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setStudyHistory([]);
      setSessionForQuiz(null);
      setQuizQuestions(null);
      setSavedQuizState(null);
      setActiveSession(null);
      return;
    }

    try {
      const savedHistory = localStorage.getItem(`studyHistory_${currentUser.id}`);
      if (savedHistory) {
        // FIX: Re-hydrate date objects from string representations in localStorage.
        const parsedHistory: any[] = JSON.parse(savedHistory);
        const historyWithDates: StudySession[] = parsedHistory.map((session) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : null,
        }));
        setStudyHistory(historyWithDates);
      } else {
        setStudyHistory([]);
      }

      const savedQuiz = localStorage.getItem(`quizInProgress_${currentUser.id}`);
      if (savedQuiz) {
        const { session, questions, progress } = JSON.parse(savedQuiz);
        // FIX: Also re-hydrate dates for quiz sessions.
        const sessionWithDates: StudySession = {
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : null,
        };
        setSessionForQuiz(sessionWithDates);
        setQuizQuestions(questions);
        setSavedQuizState(progress);
      } else {
        setSessionForQuiz(null);
        setQuizQuestions(null);
        setSavedQuizState(null);
      }
    } catch (error) {
      console.error("Failed to load user data from localStorage", error);
      localStorage.removeItem(`studyHistory_${currentUser.id}`);
      localStorage.removeItem(`quizInProgress_${currentUser.id}`);
    }
  }, [currentUser]);

  // Save user-specific history to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`studyHistory_${currentUser.id}`, JSON.stringify(studyHistory));
      } catch (error) {
        console.error("Failed to save study history to localStorage", error);
      }
    }
  }, [studyHistory, currentUser]);

  // Effect for the session timer
  useEffect(() => {
    let timer: number;
    if (activeSession && !isSessionPaused) {
      timer = window.setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(timer);
  }, [activeSession, isSessionPaused]);

  const handleLogin = (id: string, passwordAttempt: string): boolean => {
    const user = users.find(u => u.id === id);
    if (user && user.password === passwordAttempt) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleRegister = (name: string, password: string): boolean => {
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return false; // User already exists
    }
    const newUser: User = { id: `user-${Date.now()}`, name, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('cotes_users', JSON.stringify(updatedUsers));
    setCurrentUser(newUser);
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.DASHBOARD); // Reset view on logout
  };
  
  const handleQuizProgressUpdate = (progress: { currentQuestionIndex: number; answers: (string | null)[] }) => {
    if (!currentUser || !sessionForQuiz) return;
    const progressToSave = {
      session: sessionForQuiz,
      questions: quizQuestions,
      progress: progress,
    };
    try {
      localStorage.setItem(`quizInProgress_${currentUser.id}`, JSON.stringify(progressToSave));
    } catch (error) {
      console.error("Failed to save quiz progress", error);
    }
  };

  const findResourcesForSession = async (topic: string) => {
    setIsLoadingSuggestedResources(true);
    setSuggestedResourcesError(null);
    setSuggestedResources([]);
    try {
        const foundResources = await getLearningResources(topic);
        setSuggestedResources(foundResources);
    } catch (err) {
        setSuggestedResourcesError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsLoadingSuggestedResources(false);
    }
  };

  const startSession = (topic: string) => {
    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      topic,
      startTime: new Date(),
      endTime: null,
      durationMinutes: 0,
      resources: [],
    };
    setActiveSession(newSession);
    
    // Reset session-related state
    setSessionDuration(0);
    setIsSessionPaused(false);

    // Fetch resources for the new session
    findResourcesForSession(topic);
    
    setCurrentView(AppView.LEARNING);
  };
  
  const stopSession = async () => {
    if (!activeSession) return;
    
    const endTime = new Date();
    const durationMinutes = Math.round(sessionDuration / 60);
    const finishedSession = { ...activeSession, endTime, durationMinutes };
    
    // Lógica de dificuldade: se o usuário já estudou este tópico e salvou recursos nesta sessão, o quiz será difícil.
    const previousSessionsOnTopic = studyHistory.filter(s => s.topic.toLowerCase() === activeSession.topic.toLowerCase()).length;
    const difficulty: 'normal' | 'hard' = previousSessionsOnTopic > 0 && activeSession.resources.length > 0 ? 'hard' : 'normal';

    setActiveSession(null);
    setSavedQuizState(null);
    setSessionForQuiz(finishedSession);
    setQuizDifficulty(difficulty);
    
    // Reset timer/resource states
    setSessionDuration(0);
    setIsSessionPaused(false);
    setSuggestedResources([]);
    setSuggestedResourcesError(null);

    setIsLoadingQuiz(true);
    
    try {
        const questions = await generateQuiz(finishedSession.topic, finishedSession.resources, difficulty);
        setQuizQuestions(questions);
    } catch (error) {
        console.error("Failed to generate quiz:", error);
        saveQuizResults(0, 0); 
    } finally {
        setIsLoadingQuiz(false);
    }
  };

  const addResourceToSession = (resource: Resource) => {
    if (activeSession && !activeSession.resources.some(r => r.uri === resource.uri)) {
      setActiveSession(prev => prev ? { ...prev, resources: [...prev.resources, resource] } : null);
    }
  };

  const saveQuizResults = (score: number, totalQuestions: number) => {
    if (!sessionForQuiz || !currentUser) return;
    
    const sessionWithQuiz = { 
        ...sessionForQuiz, 
        quizResult: { score, totalQuestions }
    };

    setStudyHistory(prev => [...prev, sessionWithQuiz]);
    setSessionForQuiz(null);
    setQuizQuestions(null);
    localStorage.removeItem(`quizInProgress_${currentUser.id}`);
    setCurrentView(AppView.HISTORY);
  }

  const continueSession = (topic: string) => {
    setTopicToContinue(topic);
    setCurrentView(AppView.LEARNING);
  };

  const deleteSession = (sessionId: string) => {
    setStudyHistory(prev => prev.filter(session => session.id !== sessionId));
  };
  
  const deleteAllHistory = () => {
    setStudyHistory([]);
  };

  const renderContent = () => {
    if (sessionForQuiz) {
        if (isLoadingQuiz && !savedQuizState) {
            const message = quizDifficulty === 'hard'
                ? "Aumentando o desafio! Preparando um quiz mais difícil..."
                : "Preparando seu quiz personalizado...";
            return <div className="flex flex-col items-center justify-center p-10"><Spinner /><p className="mt-4">{message}</p></div>;
        }
        if (quizQuestions) {
            return <div className="p-6 max-w-2xl mx-auto">
                <Quiz 
                    topic={sessionForQuiz.topic} 
                    questions={quizQuestions} 
                    onFinish={(score) => saveQuizResults(score, quizQuestions.length)}
                    onProgressUpdate={handleQuizProgressUpdate}
                    initialProgress={savedQuizState}
                />
            </div>
        }
        return <div className="text-center p-10">Não foi possível gerar o quiz. A sessão foi salva.</div>;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard studyHistory={studyHistory} deleteAllHistory={deleteAllHistory} userName={currentUser!.name} />;
      case AppView.LEARNING:
        return <LearningHub 
            activeSession={activeSession}
            startSession={startSession}
            stopSession={stopSession}
            addResourceToSession={addResourceToSession}
            initialTopic={topicToContinue}
            onTopicConsumed={() => setTopicToContinue(null)}
            duration={sessionDuration}
            isPaused={isSessionPaused}
            setIsPaused={setIsSessionPaused}
            suggestedResources={suggestedResources}
            isLoadingResources={isLoadingSuggestedResources}
            resourcesError={suggestedResourcesError}
        />;
      case AppView.HISTORY:
        return <StudyHistory 
            studyHistory={studyHistory} 
            continueSession={continueSession}
            deleteSession={deleteSession}
        />;
      default:
        return <Dashboard studyHistory={studyHistory} deleteAllHistory={deleteAllHistory} userName={currentUser!.name} />;
    }
  };

  const backgroundStyle = "min-h-screen bg-gray-900 text-white font-sans bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900";

  if (!currentUser) {
    return (
      <div className={backgroundStyle}>
        <Auth users={users} onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className={backgroundStyle}>
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;