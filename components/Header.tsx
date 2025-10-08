import React from 'react';
import { AppView, User } from '../types.ts';
import Button from './shared/Button.tsx';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, currentUser, onLogout }) => {
  const navItems = Object.values(AppView);

  return (
    <header className="bg-gray-900/30 backdrop-blur-md text-white p-4 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          COTES
        </h1>
        <nav className="hidden md:flex space-x-2 bg-gray-800/50 p-1 rounded-lg">
          {navItems.map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                currentView === view
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              {view}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
            <span className="text-gray-300 hidden sm:block">Olá, {currentUser.name}</span>
            <Button onClick={onLogout} variant="secondary" className="px-3 py-2 text-sm">
                Sair
            </Button>
        </div>
      </div>
       <nav className="md:hidden mt-4 flex justify-center space-x-2 bg-gray-800/50 p-1 rounded-lg">
          {navItems.map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-300 flex-1 ${
                currentView === view
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              {view}
            </button>
          ))}
        </nav>
    </header>
  );
};

export default Header;