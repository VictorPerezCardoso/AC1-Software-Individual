import React, { useState } from 'react';
import { StudySession } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import ConfirmationModal from './shared/ConfirmationModal.tsx';
import ScheduleModal from './shared/ScheduleModal.tsx';

interface StudyHistoryProps {
  studyHistory: StudySession[];
  continueSession: (topic: string) => void;
  deleteSession: (sessionId: string) => void;
}

const formatSimpleDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
}

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);


const StudyHistory: React.FC<StudyHistoryProps> = ({ studyHistory, continueSession, deleteSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [sessionToSchedule, setSessionToSchedule] = useState<StudySession | null>(null);

  const filteredHistory = studyHistory.filter(session =>
    session.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
        deleteSession(sessionToDelete.id);
        setSessionToDelete(null);
    }
  }

  return (
    <>
      <div className="p-6">
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Meu Histórico de Estudos</h2>
          <input
            type="text"
            placeholder="Pesquisar por tópico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700/50 text-white rounded-md p-3 mb-6 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {filteredHistory.length > 0 ? (
            <div className="space-y-6">
              {filteredHistory.slice().reverse().map((session) => (
                <Card key={session.id} className="bg-gray-800/30">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-indigo-400">{session.topic}</h3>
                          <p className="text-sm text-gray-400">{formatSimpleDate(session.startTime)}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-semibold text-white">{session.durationMinutes} minutos</p>
                          {session.quizResult && (
                             <p className="text-sm text-green-400 font-bold">
                                  Quiz: {session.quizResult.score}/{session.quizResult.totalQuestions}
                              </p>
                          )}
                      </div>
                  </div>
                  {session.resources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                          <h4 className="font-semibold text-gray-300 mb-2">Recursos Salvos:</h4>
                          <ul className="space-y-2 max-h-24 overflow-y-auto pr-2">
                             {session.resources.map(res => (
                                 <li key={res.uri}>
                                     <a href={res.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline truncate block">
                                      {res.title}
                                     </a>
                                 </li>
                             ))}
                          </ul>
                      </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button onClick={() => continueSession(session.topic)} className="w-full">
                          Continuar Estudando
                      </Button>
                      <Button onClick={() => setSessionToSchedule(session)} variant="secondary" className="w-full">
                          <CalendarIcon /> Agendar Revisão
                      </Button>
                      <Button onClick={() => setSessionToDelete(session)} variant="secondary" className="w-full bg-red-800/50 hover:bg-red-700/50">
                          Excluir
                      </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">
              Nenhuma sessão de estudo registrada ainda. Inicie uma na Central de Aprendizado!
            </p>
          )}
        </Card>
      </div>
      <ConfirmationModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza de que deseja excluir permanentemente a sessão de estudos sobre "${sessionToDelete?.topic}"?`}
      />
      <ScheduleModal
        isOpen={!!sessionToSchedule}
        onClose={() => setSessionToSchedule(null)}
        session={sessionToSchedule}
      />
    </>
  );
};

export default StudyHistory;