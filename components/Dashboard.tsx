
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Text } from 'recharts';
import { StudySession } from '../types.ts';
import Card from './shared/Card.tsx';
import Button from './shared/Button.tsx';
import ConfirmationModal from './shared/ConfirmationModal.tsx';

interface DashboardProps {
  studyHistory: StudySession[];
  deleteAllHistory: () => void;
  userName: string;
}

const COLORS = ['#818cf8', '#a78bfa', '#34d399', '#f59e0b', '#ec4899', '#60a5fa', '#f87171'];

const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value > 0) {
        return (
            <Text x={x + width / 2} y={y} fill="#e5e7eb" textAnchor="middle" dy={-6} fontSize={12}>
                {value}
            </Text>
        );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ studyHistory, deleteAllHistory, userName }) => {
  const [timeFilter, setTimeFilter] = useState('all'); // '7days', '30days', 'all'
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return studyHistory.filter(session => {
      if (timeFilter === 'all') return true;
      const sessionDate = new Date(session.startTime);
      const daysDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24);
      if (timeFilter === '7days') return daysDiff <= 7;
      if (timeFilter === '30days') return daysDiff <= 30;
      return true;
    });
  }, [studyHistory, timeFilter]);

  const pieChartData = useMemo(() => {
    const topicTotals = filteredSessions
      .reduce((acc, session) => {
        const normalizedTopic = session.topic.trim().toLowerCase();
        acc[normalizedTopic] = (acc[normalizedTopic] || 0) + session.durationMinutes;
        return acc;
      }, {} as Record<string, number>);

    const topicDisplayNames = filteredSessions.reduce((acc, session) => {
        const normalizedTopic = session.topic.trim().toLowerCase();
        if (!acc[normalizedTopic]) {
            acc[normalizedTopic] = session.topic.trim();
        }
        return acc;
    }, {} as Record<string, string>);

    return Object.entries(topicTotals)
      .map(([normalizedTopic, duration]) => ({ 
          topic: topicDisplayNames[normalizedTopic] || normalizedTopic, 
          displayDuration: duration === 0 ? 0.1 : duration,
          actualDuration: duration
      }))
      .sort((a, b) => b.displayDuration - a.displayDuration);
  }, [filteredSessions]);

  const { barChartData, topicsWithQuizzes } = useMemo(() => {
    const sessionsWithQuiz = filteredSessions
      .filter(s => s.quizResult && s.quizResult.totalQuestions > 0)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const topicsWithQuizzes = [...new Set(sessionsWithQuiz.map(s => s.topic))];

    const dataMap = new Map<string, { [key: string]: number }>();

    sessionsWithQuiz.forEach(session => {
      const date = new Date(session.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dataMap.has(date)) {
        dataMap.set(date, {});
      }
      const dayData = dataMap.get(date)!;
      dayData[session.topic] = session.quizResult!.score;
    });

    const barChartData = Array.from(dataMap.entries()).map(([date, scores]) => ({
      date,
      ...scores,
    }));
    
    return { barChartData, topicsWithQuizzes };
  }, [filteredSessions]);
  
  const handleConfirmClear = () => {
    deleteAllHistory();
    setIsClearHistoryModalOpen(false);
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 sm:mb-0">
                  Bem-vindo de volta, {userName}!
                </h2>
                <p className="text-gray-400">Aqui está o resumo dos seus estudos.</p>
              </div>
              <div className="flex gap-4 items-center mt-4 sm:mt-0">
                  <select 
                      value={timeFilter}
                      onChange={e => setTimeFilter(e.target.value)}
                      className="bg-gray-700/50 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                      <option value="all">Todo o período</option>
                      <option value="7days">Últimos 7 dias</option>
                      <option value="30days">Últimos 30 dias</option>
                  </select>
                  <Button onClick={() => setIsClearHistoryModalOpen(true)} variant="secondary" className="bg-red-800/50 hover:bg-red-700/50">
                      Limpar Histórico
                  </Button>
              </div>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-4 mt-6">Tempo de Estudo por Tópico</h3>
          {pieChartData.length > 0 ? (
            <div className="w-full h-[320px] sm:h-[400px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={5}
                    fill="#8884d8"
                    dataKey="displayDuration"
                    nameKey="topic"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }} 
                      formatter={(value: number, name: string, props: any) => {
                          const { payload } = props;
                          return [`${payload.actualDuration} minutos`, name];
                      }}
                  />
                  <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl text-gray-400">Nenhum dado de estudo para exibir.</h3>
              <p className="text-gray-500 mt-2">Comece uma nova sessão na Central de Aprendizado!</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-white mb-4">Progresso nos Quizzes por Tópico</h3>
          {barChartData.length > 0 ? (
            <div className="w-full h-[320px] sm:h-[400px]">
                <ResponsiveContainer>
                    <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" label={{ value: 'Acertos', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }} 
                            formatter={(value: number, name: string) => [`${value} acertos`, name]}
                            labelStyle={{ color: '#d1d5db' }}
                        />
                        <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                        {topicsWithQuizzes.map((topic, index) => (
                            <Bar key={topic} dataKey={topic} fill={COLORS[index % COLORS.length]} label={renderCustomBarLabel} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16">
                <h3 className="text-xl text-gray-400">Nenhum quiz foi concluído neste período.</h3>
                <p className="text-gray-500 mt-2">Finalize uma sessão de estudos para ver seu progresso!</p>
            </div>
          )}
        </Card>

      </div>
      <ConfirmationModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar todo o histórico?"
        message="Tem certeza de que deseja apagar todo o seu histórico de estudos? Esta ação não pode ser desfeita."
      />
    </>
  );
};

export default Dashboard;