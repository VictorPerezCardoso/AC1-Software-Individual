import React, { useState } from 'react';
import { User } from '../types';
import Card from './shared/Card';
import Button from './shared/Button';

// Helper para formatar nomes de usuário longos para exibição.
const formatUserName = (name: string, maxLength: number = 12): string => {
  const trimmedName = name.trim();
  if (trimmedName.length <= maxLength) {
    return trimmedName;
  }

  const words = trimmedName.split(/\s+/);

  if (words.length > 1) {
    const firstName = words[0];
    const lastNameInitial = words[words.length - 1][0];
    let formatted = `${firstName} ${lastNameInitial}.`;

    if (formatted.length > maxLength) {
      const maxFirstNameLength = maxLength - 4; // Espaço para "... L."
      if (maxFirstNameLength < 1) {
        return `${trimmedName.substring(0, maxLength - 1)}…`;
      }
      formatted = `${firstName.substring(0, maxFirstNameLength)}… ${lastNameInitial}.`;
    }
    return formatted;
  }

  return `${trimmedName.substring(0, maxLength - 1)}…`;
};


interface AuthProps {
  users: User[];
  onLogin: (id: string, passwordAttempt: string) => boolean;
  onRegister: (name: string, password: string) => boolean;
}

const Auth: React.FC<AuthProps> = ({ users, onLogin, onRegister }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setPasswordAttempt('');
    setLoginError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && !onLogin(selectedUserId, passwordAttempt)) {
      setLoginError('Senha incorreta. Tente novamente.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerPassword.trim()) {
      setRegisterError('Nome e senha são obrigatórios.');
      return;
    }
    if (!onRegister(registerName, registerPassword)) {
      setRegisterError('Este nome de usuário já existe.');
    } else {
        setRegisterName('');
        setRegisterPassword('');
        setRegisterError(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          COTES Controle de Tempo e Estudo - AI
        </h1>

        {/* Login Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-4 text-center">Quem está estudando?</h2>
          {users.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`p-4 rounded-lg text-center transition-all duration-200 ${
                    selectedUserId === user.id
                      ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-400'
                      : 'bg-gray-700/50 hover:bg-gray-600/50 text-white'
                  }`}
                  title={user.name}
                >
                  <span className="text-lg font-medium">{formatUserName(user.name)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">Nenhum perfil encontrado. Crie um abaixo!</p>
          )}
        </div>

        {selectedUserId && (
          <form onSubmit={handleLoginSubmit} className="mb-8 animate-fade-in">
            <input
              type="password"
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              placeholder="Digite sua senha"
              autoFocus
              className="w-full bg-gray-700/50 text-white rounded-md p-3 mb-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {loginError && <p className="text-red-400 text-sm mb-3">{loginError}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        )}

        {/* Registration Section */}
        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-gray-300 mb-4 text-center">Criar nova conta</h2>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="Nome de usuário"
              className="w-full bg-gray-700/50 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-gray-700/50 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {registerError && <p className="text-red-400 text-sm">{registerError}</p>}
            <Button type="submit" variant="secondary" className="w-full">Cadastrar</Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Auth;