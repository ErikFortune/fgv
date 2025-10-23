import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IPuzzleDefinition } from '@fgv/ts-sudoku-lib';
import { SudokuGridEntry } from '@fgv/ts-sudoku-ui';
import { useObservability } from '../contexts';

// Sample puzzles for each type
const samplePuzzles: Record<string, IPuzzleDefinition> = {
  standard: {
    id: 'standard-example',
    description: 'Classic Sudoku Example',
    type: 'sudoku',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    maxValue: 9,
    totalCages: 9,
    basicCageTotal: 45,
    cageWidthInCells: 3,
    cageHeightInCells: 3,
    boardWidthInCages: 3,
    boardHeightInCages: 3,
    cells: '.........9.46.7....768.41..3.97.1.8.7.8...3.1.513.87.2..75.261...54.32.8.........'
  },
  'sudoku-x': {
    id: 'sudoku-x-example',
    description: 'Sudoku X Example',
    type: 'sudoku-x',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    maxValue: 9,
    totalCages: 9,
    basicCageTotal: 45,
    cageWidthInCells: 3,
    cageHeightInCells: 3,
    boardWidthInCages: 3,
    boardHeightInCages: 3,
    cells: '4.....13....6.1.....7..29...76.....2....3..9.9.1....577...1.6..3...5.7...4......1'
  },
  killer: {
    id: 'killer-example',
    description: 'Killer Sudoku Example',
    type: 'killer-sudoku',
    level: 100,
    totalRows: 9,
    totalColumns: 9,
    maxValue: 9,
    totalCages: 9,
    basicCageTotal: 45,
    cageWidthInCells: 3,
    cageHeightInCells: 3,
    boardWidthInCages: 3,
    boardHeightInCages: 3,
    cells:
      'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
  }
};

const gameTypeNames: Record<string, string> = {
  standard: 'Classic Sudoku',
  'sudoku-x': 'Sudoku X',
  killer: 'Killer Sudoku'
};

export const PuzzlePage: React.FC = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const observability = useObservability();
  const [puzzleDesc, setPuzzleDesc] = useState<IPuzzleDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize puzzle based on game type
  useEffect(() => {
    observability.diag.info('Initializing puzzle page', { gameType });

    if (!gameType || !samplePuzzles[gameType]) {
      const errorMsg = `Unknown game type: ${gameType}`;
      observability.diag.error('Failed to initialize puzzle', { gameType, error: errorMsg });
      observability.user.error('Failed to load puzzle. Please select a valid game type.');
      setError(errorMsg);
      return;
    }

    observability.diag.info('Successfully loaded puzzle data', {
      gameType,
      puzzleId: samplePuzzles[gameType].id
    });
    observability.user.success(`Loaded ${gameTypeNames[gameType]} puzzle successfully!`);
    setPuzzleDesc(samplePuzzles[gameType]);
    setError(null);
  }, [gameType]);

  // State management for Sudoku grid
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  const handleStateChange = (valid: boolean, solved: boolean) => {
    setIsValid(valid);
    setIsSolved(solved);
    if (solved) {
      observability.user.success('Congratulations! Puzzle solved!');
    }
  };

  const handleValidationErrors = (errors: string[]) => {
    setValidationErrors(errors);
    if (errors.length > 0) {
      observability.diag.info('Validation errors detected', { errors });
    }
  };

  const handleNewGame = () => {
    observability.diag.info('User requested new game');
    observability.user.info('Starting new game selection...');
    navigate('/select');
  };

  const handleReset = () => {
    observability.diag.info('User requested puzzle reset');
    observability.user.success('Puzzle reset successfully!');
    // Reset functionality - for demonstration - reloading puzzle
    if (puzzleDesc) {
      setPuzzleDesc({ ...puzzleDesc });
    }
  };

  const handleExport = () => {
    if (puzzleDesc) {
      try {
        observability.diag.info('Exporting puzzle data', { puzzleId: puzzleDesc.id, gameType });

        const exportData = {
          puzzle: {
            id: puzzleDesc.id,
            description: puzzleDesc.description,
            type: gameType
          },
          timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const filename = `sudoku-${gameType}-${new Date().toISOString().split('T')[0]}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        observability.diag.info('Export completed successfully', { filename });
        observability.user.success(`Puzzle exported as ${filename}`);
      } catch (error) {
        const errorMsg = `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        observability.diag.error('Export failed', { error: errorMsg, puzzleId: puzzleDesc.id });
        observability.user.error('Failed to export puzzle. Please try again.');
      }
    } else {
      observability.diag.warn('Export requested but no puzzle loaded');
      observability.user.warning('No puzzle loaded to export');
    }
  };

  if (error) {
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleNewGame}>Back to Game Selection</button>
      </div>
    );
  }

  if (!puzzleDesc) {
    return (
      <div>
        <h2>Loading...</h2>
        <p>Setting up your {gameTypeNames[gameType || '']} puzzle...</p>
      </div>
    );
  }

  return (
    <div className="puzzle-container">
      <div className="puzzle-header">
        <div>
          <h2>{gameTypeNames[gameType || '']}</h2>
          <p>{puzzleDesc.description}</p>
        </div>
        <div className="puzzle-actions">
          <button onClick={handleReset}>Reset</button>
          <button onClick={handleExport}>Export</button>
          <button onClick={handleNewGame}>New Game</button>
        </div>
      </div>

      {/* Sudoku Grid Component */}
      <SudokuGridEntry
        initialPuzzleDescription={puzzleDesc}
        onStateChange={handleStateChange}
        onValidationErrors={handleValidationErrors}
      />
    </div>
  );
};
