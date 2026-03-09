# Killer Sudoku UI - Architecture Design

**Task ID**: task-20250921-001
**Date**: September 28, 2024
**Phase**: Design (COMPLETED)
**Agent**: Senior Developer

## Executive Summary

This document outlines the technical architecture for implementing Killer Sudoku UI components within the FGV monorepo ecosystem. The design emphasizes modularity, type safety, performance, and seamless integration with existing libraries (`@fgv/ts-sudoku-lib`, `@fgv/ts-utils`).

## System Architecture Overview

### High-Level Component Structure

```
@fgv/ts-sudoku-ui/
├── src/
│   ├── components/           # React UI Components
│   │   ├── KillerSudokuGame/ # Main game component
│   │   ├── SudokuGrid/       # Grid rendering
│   │   ├── SudokuCell/       # Individual cell component
│   │   ├── SudokuCage/       # Cage visualization
│   │   └── Controls/         # Game controls (undo/redo, etc.)
│   ├── hooks/               # React hooks for state management
│   ├── types/               # TypeScript interfaces
│   ├── styles/              # Styling system
│   ├── utils/               # UI-specific utilities
│   └── index.ts             # Public API exports
```

## Core Component Architecture

### 1. KillerSudokuGame Component (Main Container)

**Responsibilities:**
- Orchestrates overall game state
- Manages puzzle lifecycle (load, reset, solve)
- Coordinates between grid, cages, and controls
- Handles user actions and validation

**Props Interface:**
```typescript
interface IKillerSudokuGameProps {
  puzzle: KillerSudokuPuzzle;          // From @fgv/ts-sudoku-lib
  onCellChange?: (change: ICellChange) => void;
  onPuzzleComplete?: (completion: IPuzzleCompletion) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  showHints?: boolean;
}

interface ICellChange {
  row: number;
  col: number;
  value: number | null;
  isValid: boolean;
}

interface IPuzzleCompletion {
  solved: boolean;
  timeElapsed: number;
  moveCount: number;
}
```

**State Management:**
```typescript
interface IGameState {
  currentGrid: SudokuGrid;             // Current puzzle state
  originalPuzzle: KillerSudokuPuzzle;  // Immutable original
  selectedCell: ICellPosition | null;  // Currently selected cell
  history: IGameAction[];              // For undo/redo
  validationErrors: IValidationError[];
  isComplete: boolean;
  isLoading: boolean;
}
```

### 2. SudokuGrid Component

**Responsibilities:**
- Renders 9x9 sudoku grid structure
- Manages cell layout and positioning
- Handles grid-level interactions
- Coordinates cage overlay rendering

**Props Interface:**
```typescript
interface ISudokuGridProps {
  grid: SudokuGrid;
  cages: ISudokuCage[];
  selectedCell: ICellPosition | null;
  validationErrors: IValidationError[];
  onCellSelect: (position: ICellPosition) => void;
  onCellValueChange: (position: ICellPosition, value: number | null) => void;
  className?: string;
  disabled?: boolean;
}

interface ICellPosition {
  row: number;
  col: number;
}

interface ISudokuCage {
  id: string;
  cells: ICellPosition[];
  targetSum: number;
  currentSum: number;
  isValid: boolean;
}
```

### 3. SudokuCell Component

**Responsibilities:**
- Renders individual cell with number/candidates
- Handles cell-specific user input
- Displays validation states
- Manages cell appearance and interactions

**Props Interface:**
```typescript
interface ISudokuCellProps {
  position: ICellPosition;
  value: number | null;
  isGiven: boolean;                    // Pre-filled cell
  isSelected: boolean;
  isHighlighted: boolean;              // Related cells (same row/col/cage)
  hasError: boolean;
  belongsToCages: string[];            // Cage IDs
  candidates?: number[];               // Candidate numbers
  onSelect: (position: ICellPosition) => void;
  onValueChange: (position: ICellPosition, value: number | null) => void;
  disabled?: boolean;
}
```

### 4. SudokuCage Component

**Responsibilities:**
- Renders cage boundaries and styling
- Displays cage sum labels
- Provides visual feedback for cage validation
- Handles cage-specific interactions

**Props Interface:**
```typescript
interface ISudokuCageProps {
  cage: ISudokuCage;
  cellSize: number;                    // For precise positioning
  gridOffset: IGridOffset;             // Grid positioning context
  isHighlighted: boolean;
  showSum: boolean;
  onCageSelect?: (cageId: string) => void;
  className?: string;
}

interface IGridOffset {
  x: number;
  y: number;
  cellSize: number;
}
```

### 5. Game Controls Component

**Responsibilities:**
- Provides undo/redo functionality
- Number input pad (optional)
- Game actions (reset, hint, solve)
- Status display

**Props Interface:**
```typescript
interface IGameControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNumberSelect?: (number: number) => void;
  selectedNumber?: number | null;
  showNumberPad?: boolean;
  disabled?: boolean;
}
```

## State Management Strategy

### Custom Hook: useKillerSudokuGame

**Purpose:** Centralizes game logic and state management using React hooks pattern.

```typescript
interface IUseKillerSudokuGameProps {
  initialPuzzle: KillerSudokuPuzzle;
  onPuzzleComplete?: (completion: IPuzzleCompletion) => void;
  onError?: (error: string) => void;
}

interface IUseKillerSudokuGameReturn {
  // State
  gameState: IGameState;

  // Actions
  selectCell: (position: ICellPosition) => void;
  setCellValue: (position: ICellPosition, value: number | null) => Result<void>;
  undo: () => Result<void>;
  redo: () => Result<void>;
  reset: () => void;

  // Computed values
  isComplete: boolean;
  hasErrors: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Validation
  validatePuzzle: () => Result<IValidationResult>;
  getCageForCell: (position: ICellPosition) => ISudokuCage | null;
}
```

### Integration with @fgv/ts-sudoku-lib

**Puzzle Engine Integration:**
```typescript
// Wrapper for sudoku library integration
class KillerSudokuEngine {
  private puzzle: KillerSudokuPuzzle;

  constructor(puzzle: KillerSudokuPuzzle) {
    this.puzzle = puzzle;
  }

  public validateMove(position: ICellPosition, value: number): Result<IValidationResult> {
    // Use @fgv/ts-sudoku-lib validation
    return this.puzzle.validateCell(position.row, position.col, value)
      .onSuccess(isValid => {
        const cageValidation = this.validateCageConstraints(position, value);
        return this.combineValidationResults(isValid, cageValidation);
      });
  }

  public validateCageConstraints(position: ICellPosition, value: number): Result<ICageValidation> {
    // Implement killer sudoku specific cage validation
    const cage = this.getCageForPosition(position);
    if (!cage) return succeed({ isValid: true, message: '' });

    return this.checkCageSum(cage, position, value);
  }

  private checkCageSum(cage: ISudokuCage, position: ICellPosition, value: number): Result<ICageValidation> {
    // Implementation for cage sum validation
    const currentSum = this.calculateCageSum(cage, position, value);

    if (currentSum > cage.targetSum) {
      return succeed({
        isValid: false,
        message: `Cage sum (${currentSum}) exceeds target (${cage.targetSum})`
      });
    }

    return succeed({ isValid: true, message: '' });
  }
}
```

## Styling Architecture

### CSS-in-JS with Styled Components Pattern

**Theme System:**
```typescript
interface ISudokuTheme {
  colors: {
    cellBorder: string;
    cellBackground: string;
    cellSelected: string;
    cellError: string;
    cellGiven: string;
    cageBorder: string;
    cageBackground: string;
    text: string;
    textGiven: string;
    textError: string;
  };

  spacing: {
    cellSize: number;
    cellGap: number;
    cageBorderWidth: number;
    gridPadding: number;
  };

  typography: {
    cellFont: string;
    cageLabelFont: string;
    fontSize: {
      cell: number;
      cageLabel: number;
      candidate: number;
    };
  };
}
```

**Component Styling:**
```typescript
// Styled components for consistent theming
const StyledSudokuGrid = styled.div<{ theme: ISudokuTheme }>`
  display: grid;
  grid-template-columns: repeat(9, ${props => props.theme.spacing.cellSize}px);
  grid-template-rows: repeat(9, ${props => props.theme.spacing.cellSize}px);
  gap: ${props => props.theme.spacing.cellGap}px;
  padding: ${props => props.theme.spacing.gridPadding}px;
  border: 2px solid ${props => props.theme.colors.cellBorder};
  position: relative;
`;

const StyledSudokuCell = styled.div<{
  isSelected: boolean;
  hasError: boolean;
  isGiven: boolean;
  theme: ISudokuTheme;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.theme.colors.cellBorder};
  background-color: ${props => {
    if (props.hasError) return props.theme.colors.cellError;
    if (props.isSelected) return props.theme.colors.cellSelected;
    if (props.isGiven) return props.theme.colors.cellGiven;
    return props.theme.colors.cellBackground;
  }};
  font-size: ${props => props.theme.typography.fontSize.cell}px;
  font-family: ${props => props.theme.typography.cellFont};
  color: ${props => {
    if (props.hasError) return props.theme.colors.textError;
    if (props.isGiven) return props.theme.colors.textGiven;
    return props.theme.colors.text;
  }};
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.isSelected ?
      props.theme.colors.cellSelected :
      lighten(0.1, props.theme.colors.cellBackground)};
  }
`;
```

### Cage Visualization Strategy

**SVG Overlay Approach:**
- Use SVG overlays for cage boundary rendering
- Allows complex cage shapes and precise positioning
- Maintains scalability and visual quality

```typescript
interface ICageRenderingProps {
  cage: ISudokuCage;
  cellSize: number;
  gridOffset: IGridOffset;
}

const CageBoundary: React.FC<ICageRenderingProps> = ({ cage, cellSize, gridOffset }) => {
  const pathData = generateCagePath(cage.cells, cellSize);
  const labelPosition = calculateLabelPosition(cage.cells, cellSize);

  return (
    <svg
      className="cage-overlay"
      style={{
        position: 'absolute',
        top: gridOffset.y,
        left: gridOffset.x,
        pointerEvents: 'none'
      }}
    >
      <path
        d={pathData}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="cage-boundary"
      />
      <text
        x={labelPosition.x}
        y={labelPosition.y}
        className="cage-label"
        fontSize="12"
      >
        {cage.targetSum}
      </text>
    </svg>
  );
};
```

## Performance Optimization Strategy

### 1. Memoization Strategy
```typescript
// Memoize expensive computations
const MemoizedSudokuCell = React.memo(SudokuCell, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});

const MemoizedSudokuCage = React.memo(SudokuCage, (prevProps, nextProps) => {
  return (
    prevProps.cage.currentSum === nextProps.cage.currentSum &&
    prevProps.cage.isValid === nextProps.cage.isValid &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});
```

### 2. Event Handling Optimization
```typescript
// Debounced validation for real-time feedback
const useDebouncedValidation = (gameState: IGameState, delay: number = 100) => {
  const [validationResult, setValidationResult] = useState<IValidationResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const engine = new KillerSudokuEngine(gameState.originalPuzzle);
      const result = engine.validatePuzzle(gameState.currentGrid);
      if (result.isSuccess()) {
        setValidationResult(result.value);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState.currentGrid, delay]);

  return validationResult;
};
```

### 3. Rendering Optimization
```typescript
// Virtual scrolling for large puzzles (future extension)
// Efficient cage path generation with caching
const cagePathCache = new Map<string, string>();

const generateCagePath = (cells: ICellPosition[], cellSize: number): string => {
  const cacheKey = `${cells.map(c => `${c.row},${c.col}`).join('|')}-${cellSize}`;

  if (cagePathCache.has(cacheKey)) {
    return cagePathCache.get(cacheKey)!;
  }

  const path = computeCageBoundaryPath(cells, cellSize);
  cagePathCache.set(cacheKey, path);
  return path;
};
```

## Error Handling & Validation

### Result Pattern Integration
All game operations return `Result<T>` for consistent error handling:

```typescript
class GameController {
  public setCellValue(position: ICellPosition, value: number | null): Result<IGameState> {
    return this.validatePosition(position)
      .onSuccess(() => this.validateValue(value))
      .onSuccess(() => this.applyMove(position, value))
      .onSuccess((newState) => this.validateGameState(newState))
      .withErrorFormat((error) => `Failed to set cell ${position.row},${position.col}: ${error}`);
  }

  private validatePosition(position: ICellPosition): Result<void> {
    if (position.row < 0 || position.row >= 9 || position.col < 0 || position.col >= 9) {
      return fail(`Invalid position: ${position.row},${position.col}`);
    }
    return succeed(undefined);
  }

  private validateValue(value: number | null): Result<void> {
    if (value !== null && (value < 1 || value > 9)) {
      return fail(`Invalid value: ${value}. Must be 1-9 or null`);
    }
    return succeed(undefined);
  }
}
```

### User-Friendly Error Display
```typescript
interface IErrorDisplayProps {
  errors: IValidationError[];
  onDismiss: (errorId: string) => void;
}

const ErrorDisplay: React.FC<IErrorDisplayProps> = ({ errors, onDismiss }) => {
  return (
    <div className="error-container">
      {errors.map(error => (
        <div key={error.id} className={`error-message ${error.severity}`}>
          <span>{error.message}</span>
          <button onClick={() => onDismiss(error.id)}>×</button>
        </div>
      ))}
    </div>
  );
};
```

## Accessibility Implementation

### Keyboard Navigation
```typescript
const useKeyboardNavigation = (gridSize: number, onCellSelect: (pos: ICellPosition) => void) => {
  const [currentPosition, setCurrentPosition] = useState<ICellPosition>({ row: 0, col: 0 });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setCurrentPosition(prev => ({
          ...prev,
          row: Math.max(0, prev.row - 1)
        }));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setCurrentPosition(prev => ({
          ...prev,
          row: Math.min(gridSize - 1, prev.row + 1)
        }));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setCurrentPosition(prev => ({
          ...prev,
          col: Math.max(0, prev.col - 1)
        }));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setCurrentPosition(prev => ({
          ...prev,
          col: Math.min(gridSize - 1, prev.col + 1)
        }));
        break;
    }
  }, [gridSize]);

  useEffect(() => {
    onCellSelect(currentPosition);
  }, [currentPosition, onCellSelect]);

  return { currentPosition, handleKeyDown };
};
```

### Screen Reader Support
```typescript
// ARIA labels and roles for accessibility
const SudokuCell: React.FC<ISudokuCellProps> = (props) => {
  const ariaLabel = useMemo(() => {
    const { position, value, belongsToCages, hasError } = props;
    const cageInfo = belongsToCages.length > 0 ?
      ` in cage with sum ${getCageSum(belongsToCages[0])}` : '';
    const errorInfo = hasError ? ' (error)' : '';
    const valueInfo = value ? ` value ${value}` : ' empty';

    return `Cell row ${position.row + 1} column ${position.col + 1}${valueInfo}${cageInfo}${errorInfo}`;
  }, [props.position, props.value, props.belongsToCages, props.hasError]);

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      tabIndex={props.isSelected ? 0 : -1}
      {...otherProps}
    >
      {props.value}
    </div>
  );
};
```

## Testing Strategy

### Component Testing Architecture
```typescript
// Test utilities for killer sudoku components
export const TestUtils = {
  createMockPuzzle: (): KillerSudokuPuzzle => {
    // Create standardized test puzzle
  },

  createMockCage: (cells: ICellPosition[], targetSum: number): ISudokuCage => {
    return {
      id: `cage-${Math.random()}`,
      cells,
      targetSum,
      currentSum: 0,
      isValid: true
    };
  },

  simulateUserInput: (container: HTMLElement, position: ICellPosition, value: number) => {
    // Simulate realistic user interactions
  }
};

// Example component test
describe('KillerSudokuGame', () => {
  let mockPuzzle: KillerSudokuPuzzle;

  beforeEach(() => {
    mockPuzzle = TestUtils.createMockPuzzle();
  });

  test('should render complete puzzle with cages', () => {
    const { container } = render(<KillerSudokuGame puzzle={mockPuzzle} />);

    expect(container.querySelector('.sudoku-grid')).toBeInTheDocument();
    expect(container.querySelectorAll('.sudoku-cell')).toHaveLength(81);
    expect(container.querySelectorAll('.cage-boundary')).toHaveLength(mockPuzzle.cages.length);
  });

  test('should handle cell value changes', () => {
    const onCellChange = jest.fn();
    const { container } = render(
      <KillerSudokuGame puzzle={mockPuzzle} onCellChange={onCellChange} />
    );

    TestUtils.simulateUserInput(container, { row: 0, col: 0 }, 5);

    expect(onCellChange).toHaveBeenCalledWith({
      row: 0,
      col: 0,
      value: 5,
      isValid: expect.any(Boolean)
    });
  });
});
```

## Integration Points

### Library Dependencies
```typescript
// Integration with @fgv/ts-sudoku-lib
import {
  KillerSudokuPuzzle,
  SudokuGrid,
  ValidationEngine
} from '@fgv/ts-sudoku-lib';

// Integration with @fgv/ts-utils
import {
  Result,
  succeed,
  fail,
  mapResults
} from '@fgv/ts-utils';

// Type-safe integration layer
interface ILibraryIntegration {
  puzzleEngine: ValidationEngine;

  validateMove(position: ICellPosition, value: number): Result<boolean>;
  generateHint(): Result<IHint>;
  solvePuzzle(): Result<SudokuGrid>;
}
```

### Export Strategy
```typescript
// Public API exports (src/index.ts)
export {
  // Main components
  KillerSudokuGame,
  SudokuGrid,
  SudokuCell,
  SudokuCage,
  GameControls,

  // Hooks
  useKillerSudokuGame,
  useKeyboardNavigation,

  // Types
  type IKillerSudokuGameProps,
  type ISudokuGridProps,
  type ISudokuCellProps,
  type ICellPosition,
  type ISudokuCage,
  type IGameState,

  // Utilities
  KillerSudokuEngine,
  TestUtils,

  // Theme
  type ISudokuTheme,
  defaultTheme
} from './components';
```

## Risk Mitigation

### Technical Risks
1. **Complex Cage Rendering**: Start with simple rectangular cages, extend to complex shapes
2. **Performance with Large Puzzles**: Implement efficient rendering and memoization
3. **Browser Compatibility**: Use progressive enhancement and polyfills

### Implementation Risks
1. **Library Integration**: Create comprehensive integration tests
2. **State Management Complexity**: Use established patterns (hooks + Result pattern)
3. **Accessibility Compliance**: Implement from the start, not as afterthought

## Future Extensions

### Planned Enhancements
- Support for irregular cage shapes
- Animated hints and solving steps
- Multiple difficulty levels
- Puzzle generation interface
- Mobile-specific optimizations
- Multiplayer support

### Architectural Flexibility
The modular design supports:
- Easy component substitution
- Theme customization
- Feature flags for experimental functionality
- Progressive enhancement of capabilities

This architecture provides a solid foundation for implementing a comprehensive, performant, and maintainable Killer Sudoku UI library that integrates seamlessly with the FGV monorepo ecosystem.