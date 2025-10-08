import React, { useState, useEffect } from 'react';
import Button from './Button.tsx';
import Card from './Card.tsx';
import { StudySession } from '../../types.ts';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession | null;
}

// Helper para formatar a data para o formato YYYY-MM-DD
const getTodayString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper para formatar a data para o URL do Google Calendar (YYYYMMDDTHHMMSSZ)
const formatDateForGoogleCalendar = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
};

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, session }) => {
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (isOpen) {
        setDate(getTodayString());
        setTime('09:00');
    }
  }, [isOpen]);

  if (!isOpen || !session) {
    return null;
  }

  const handleSchedule = () => {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // O construtor do Date com números trata como tempo local
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Adiciona 1 hora para o fim do evento
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); 

    const formattedStartDate = formatDateForGoogleCalendar(startDateTime);
    const formattedEndDate = formatDateForGoogleCalendar(endDateTime);

    const title = encodeURIComponent(`Revisão de Estudo: ${session.topic}`);
    const details = encodeURIComponent(`Hora de revisar o tópico "${session.topic}". Continue seu aprendizado!`);

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedStartDate}/${formattedEndDate}&details=${details}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">Agendar Revisão</h2>
        <p className="text-gray-300 mb-6">Agende um lembrete para revisar o tópico: <strong className="text-indigo-400">{session.topic}</strong></p>
        
        <div className="flex gap-4 mb-6">
            <div className="flex-1">
                <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-400 mb-1">Data</label>
                <input
                    id="schedule-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
            <div className="flex-1">
                <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-400 mb-1">Hora</label>
                <input
                    id="schedule-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-700/50 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule}>
            Agendar no Google Agenda
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ScheduleModal;