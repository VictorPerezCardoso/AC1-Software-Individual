export interface User {
  id: string;
  name: string;
  // NOTA: A senha é armazenada em texto plano, o que é inseguro para produção.
  // Para este exemplo local sem backend, é uma abordagem simplificada.
  password?: string;
}

export interface Resource {
  title: string;
  uri: string;
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
}

export interface StudySession {
  id: string;
  topic: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  resources: Resource[];
  quizResult?: QuizResult;
}

export enum AppView {
  DASHBOARD = 'Dashboard',
  LEARNING = 'Central de Aprendizado',
  HISTORY = 'Histórico de Estudos',
}