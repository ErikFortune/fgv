import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="flex flex-col md:flex-row justify-between items-center py-4 border-b border-gray-200 mb-8 gap-4 md:gap-0">
      <div>
        <h1>Sudoku Puzzles</h1>
      </div>
      <div className="flex gap-4">
        <Link
          to="/"
          className={`no-underline px-4 py-2 rounded transition-colors ${
            isActive('/') ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100'
          }`}
        >
          Home
        </Link>
        <Link
          to="/select"
          className={`no-underline px-4 py-2 rounded transition-colors ${
            isActive('/select') ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100'
          }`}
        >
          New Game
        </Link>
      </div>
    </nav>
  );
};
