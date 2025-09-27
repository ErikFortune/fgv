import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div>
        <h1>Sudoku Puzzles</h1>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/select" className={`nav-link ${isActive('/select') ? 'active' : ''}`}>
          New Game
        </Link>
      </div>
    </nav>
  );
};
