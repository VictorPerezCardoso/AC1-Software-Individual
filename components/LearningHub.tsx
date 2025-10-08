
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Resource, StudySession } from '../types.ts';
import Button from './shared/Button.tsx';
import Card from './shared/Card.tsx';
import Spinner from './shared/Spinner.tsx';

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

// Ícones
const SpeakerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);
const StopIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563C9.252 14.437 9 14.185 9 13.874V9.563Z" />
    </svg>
);
const PauseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" />
    </svg>
);
const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653z" />
    </svg>
);


interface LearningHubProps {
  activeSession: StudySession | null;
  startSession: (topic: string) => void;
  stopSession: () => void;
  addResourceToSession: (resource: Resource) => void;
  initialTopic?: string | null;
  onTopicConsumed: () => void;
  duration: number;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  suggestedResources: Resource[];
  isLoadingResources: boolean;
  resourcesError: string | null;
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const LearningHub: React.FC<LearningHubProps> = ({ 
    activeSession, 
    startSession, 
    stopSession, 
    addResourceToSession, 
    initialTopic, 
    onTopicConsumed,
    duration,
    isPaused,
    setIsPaused,
    suggestedResources,
    isLoadingResources,
    resourcesError
}) => {
  const [topic, setTopic] = useState('');
  const { speak, cancel, isSpeaking } = useTextToSpeech();
  const [speakingUri, setSpeakingUri] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      onTopicConsumed();
    }
  }, [initialTopic, onTopicConsumed]);
  
  const handleStartSession = () => {
    if (!topic) return;
    startSession(topic);
  }

  const handleSpeak = (resource: Resource) => {
    const currentlySpeaking = isSpeaking && speakingUri === resource.uri;
    if (currentlySpeaking) {
        cancel();
        setSpeakingUri(null);
    } else {
        const textToSpeak = `${resource.title}. ${resource.description}`;
        speak(textToSpeak);
        setSpeakingUri(resource.uri);
    }
  };
  
  // Sincroniza o estado local com o hook
  useEffect(() => {
      if (!isSpeaking) {
          setSpeakingUri(null);
      }
  }, [isSpeaking])

  const isResourceSavedInSession = (uri: string) => {
    return activeSession?.resources.some(r => r.uri === uri) ?? false;
  }

  if (activeSession) {
    return (
        <div className="p-6 space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Sessão de Estudo Ativa</h2>
                        <p className="text-indigo-400">{activeSession.topic}</p>
                    </div>
                    <div className="flex items-center gap-4">
                         <p className="text-2xl font-mono tracking-wider bg-gray-800/50 px-4 py-2 rounded-lg">{formatDuration(duration)}</p>
                         <Button onClick={() => setIsPaused(!isPaused)} variant="secondary" className="p-2 aspect-square">
                            {isPaused ? <PlayIcon /> : <PauseIcon />}
                         </Button>
                    </div>
                </div>
                <Button onClick={stopSession} variant="secondary" className="w-full">
                    Finalizar Sessão e Fazer o Quiz
                </Button>
            </Card>

            {resourcesError && <Card className="bg-red-500/20 text-red-300">{resourcesError}</Card>}

            {isLoadingResources && <div className="flex flex-col items-center justify-center p-8"><Spinner /><p className="mt-2 text-gray-400">Buscando os melhores recursos...</p></div>}
            
            {suggestedResources.length > 0 && (
                <Card>
                    <h3 className="text-xl font-semibold mb-4 text-white">Recursos Sugeridos para "{activeSession.topic}"</h3>
                    <ul className="space-y-4">
                    {suggestedResources.map((resource) => {
                        const isSaved = isResourceSavedInSession(resource.uri);
                        const isThisSpeaking = speakingUri === resource.uri;
                        return (
                            <li key={resource.uri} className={`bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-300 ${isSaved ? 'ring-2 ring-indigo-500/80' : 'ring-0 ring-transparent'}`}>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-indigo-400" title={resource.title}>
                                        {resource.title}
                                    </h4>
                                    <p className="text-gray-300 mt-1 text-sm">
                                        {resource.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                                    <a href={resource.uri} target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm px-4 py-1.5 rounded-lg transition-all duration-300">
                                        Abrir
                                    </a>
                                     <button onClick={() => handleSpeak(resource)} title="Ler em voz alta" className="p-2 rounded-full hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-colors">
                                        {isThisSpeaking ? <StopIcon /> : <SpeakerIcon />}
                                    </button>
                                    <Button
                                        onClick={() => addResourceToSession(resource)}
                                        disabled={isSaved}
                                        className={`text-sm px-4 py-1.5 whitespace-nowrap ${isSaved ? 'bg-green-600 hover:bg-green-600 cursor-default' : ''}`}
                                    >
                                        {isSaved ? 'Salvo' : 'Salvar na Sessão'}
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                    </ul>
                </Card>
            )}
        </div>
    )
  }

  return (
    <div className="p-6">
        <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Comece a Estudar</h2>
            <div className="flex flex-col sm:flex-row gap-4">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Qual tópico você quer dominar hoje?"
                className="flex-grow bg-gray-700/50 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Button onClick={handleStartSession} disabled={!topic}>
                Iniciar Sessão de Estudo
            </Button>
            </div>
        </Card>
    </div>
  );
};

export default LearningHub;