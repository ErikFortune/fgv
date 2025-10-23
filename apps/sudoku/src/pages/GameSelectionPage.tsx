import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GameTypeInfo {
  id: string;
  name: string;
  description: string;
  features: string[];
}

const gameTypes: GameTypeInfo[] = [
  {
    id: 'standard',
    name: 'Classic Sudoku',
    description: 'The traditional 9x9 Sudoku puzzle with standard rules.',
    features: [
      'Fill each row, column, and 3x3 section with numbers 1-9',
      'No duplicates allowed in rows, columns, or sections',
      'Perfect for beginners and experts alike'
    ]
  },
  {
    id: 'sudoku-x',
    name: 'Sudoku X',
    description: 'Classic Sudoku with diagonal constraints for extra challenge.',
    features: [
      'All classic Sudoku rules apply',
      'Both main diagonals must also contain numbers 1-9',
      'Increased difficulty and strategy required'
    ]
  },
  {
    id: 'killer',
    name: 'Killer Sudoku',
    description: 'Sudoku with sum constraints in colored cages.',
    features: [
      'Classic Sudoku rules plus sum constraints',
      'Caged cells must sum to the specified total',
      'No number can repeat within a cage',
      'Most challenging variant available'
    ]
  }
];

export const GameSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGameTypeSelect = (gameType: string) => {
    navigate(`/puzzle/${gameType}`);
  };

  return (
    <div>
      <h2>Select Game Type</h2>
      <p>Choose the type of Sudoku puzzle you'd like to play:</p>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 my-8">
        {gameTypes.map((gameType) => (
          <div
            key={gameType.id}
            className="border border-gray-200 rounded-lg p-8 text-left cursor-pointer transition-all hover:border-indigo-600 hover:-translate-y-0.5"
            onClick={() => handleGameTypeSelect(gameType.id)}
          >
            <h3 className="mt-0 text-indigo-600">{gameType.name}</h3>
            <p>{gameType.description}</p>
            <ul>
              {gameType.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button className="mt-4">Play {gameType.name}</button>
          </div>
        ))}
      </div>
    </div>
  );
};
