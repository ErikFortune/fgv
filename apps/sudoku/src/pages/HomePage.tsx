import React from 'react';
import { Link } from 'react-router-dom';
import { LoggingDemo } from '../components/LoggingDemo';

export const HomePage: React.FC = () => {
  return (
    <div>
      <h2>Welcome to Sudoku Puzzles</h2>
      <p>
        Challenge yourself with different types of Sudoku puzzles. Choose from classic Sudoku, Sudoku X (with
        diagonal constraints), or Killer Sudoku (with sum constraints).
      </p>

      <div style={{ margin: '2rem 0' }}>
        <Link to="/select">
          <button style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>Start Playing</button>
        </Link>
      </div>

      <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Game Types Available:</h3>
        <ul>
          <li>
            <strong>Classic Sudoku:</strong> The traditional 9x9 grid with numbers 1-9 in each row, column,
            and 3x3 section.
          </li>
          <li>
            <strong>Sudoku X:</strong> Classic Sudoku with the additional constraint that both main diagonals
            must also contain numbers 1-9.
          </li>
          <li>
            <strong>Killer Sudoku:</strong> Sudoku with cages that have sum constraints - groups of cells that
            must add up to a specific total.
          </li>
        </ul>
      </div>

      {/* Logging Implementation Demo */}
      <LoggingDemo />
    </div>
  );
};
