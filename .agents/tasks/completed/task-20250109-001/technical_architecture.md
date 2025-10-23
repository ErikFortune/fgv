# Technical Architecture: Sudoku Puzzle Entry Interface

## Executive Summary

**Project**: Interactive Sudoku puzzle entry interface for FGV Sudoku application
**Phase**: Technical Design - UPDATED for Library + App Architecture
**Status**: ARCHITECTURE UPDATED - Ready for Implementation Phase
**Agent**: Senior Developer

## Architecture Overview

This document defines the technical architecture for implementing an interactive 9x9 Sudoku puzzle entry interface using a **Library + App** approach that allows users to manually input complete Sudoku puzzles into the FGV Sudoku application.

### Architectural Decision: Library + App Approach

**DECISION MADE**: The implementation will use a two-package structure:

1. **`@fgv/ts-sudoku-ui` Library** (✅ ALREADY IMPLEMENTED)
   - Reusable React components for Sudoku puzzle interaction
   - Generic components that can be embedded in any React application
   - Well-designed, tested, and documented component library

2. **`apps/sudoku/` Standalone Application** (🆕 TO BE CREATED)
   - Complete React application using the library components
   - Routing, deployment configuration, and application-level integration
   - Standalone executable that meets all user requirements

**Rationale**:
- Follows monorepo patterns (libraries for reusable code, apps for deployable applications)
- Preserves the valuable, well-implemented component library
- Meets requirements for a complete user-facing application
- Future-ready: allows other applications to use the library components
- Clear separation of concerns: library (components) vs app (routing, deployment)

### Design Philosophy

1. **Consistency First** - Follow established FGV monorepo patterns and React component conventions
2. **Integration-Ready** - Seamlessly integrate with existing @fgv/ts-sudoku-lib and @fgv/ts-res-ui-components
3. **Result Pattern** - Use @fgv/ts-utils Result pattern for all fallible operations
4. **Type Safety** - Leverage TypeScript and proper validation throughout
5. **Testability** - Design for 100% test coverage using established testing patterns

## Technology Stack

### Framework & Libraries
- **React 19.1.1** - UI framework (matches existing ts-res-ui-components)
- **TypeScript 5.8.3** - Type safety and development experience
- **@fgv/ts-sudoku-lib** - Core Sudoku puzzle models and validation
- **@fgv/ts-utils** - Result pattern, validation, and utility functions
- **@fgv/ts-utils-jest** - Testing utilities with Result pattern matchers

### Build & Development
- **Rush.js** - Monorepo management and build orchestration
- **Heft** - Build toolchain (TypeScript compilation, testing, linting)
- **Jest** - Testing framework with React Testing Library
- **ESLint** - Code quality and consistency

## Component Architecture

### Architecture Pattern: Controlled Component with Result Pattern

The design follows React's controlled component pattern combined with FGV's Result pattern for error handling, creating a predictable and type-safe data flow.

```typescript
// Data Flow: User Input → Validation → State Update → UI Render
UserInteraction → ResultValidation → StateManagement → VisualFeedback
```

### Core Components

#### 1. SudokuGridEntry (Main Container)

**Purpose**: Main container component that orchestrates puzzle entry
**Location**: `src/components/SudokuGridEntry.tsx`
**Type**: React Functional Component
**Pattern**: Container Component with State Management

**Responsibilities**:
- Manage overall puzzle state using PuzzleState from @fgv/ts-sudoku-lib
- Coordinate between grid display and user interactions
- Handle export functionality
- Provide reset/clear operations

**State Management**:
```typescript
interface ISudokuGridEntryState {
  puzzle: Puzzle;           // From @fgv/ts-sudoku-lib
  currentState: PuzzleState; // Current puzzle values and notes
  selectedCell: CellId | null; // Currently selected cell
  validationErrors: ValidationError[]; // Real-time validation results
}
```

**Dependencies**:
- SudokuGrid (display)
- SudokuCell (individual cells)
- @fgv/ts-sudoku-lib (Puzzle, PuzzleState)
- @fgv/ts-utils (Result pattern)

#### 2. SudokuGrid (Display Grid)

**Purpose**: Renders the 9x9 Sudoku grid with proper visual structure
**Location**: `src/components/SudokuGrid.tsx`
**Type**: React Functional Component
**Pattern**: Presentational Component

**Responsibilities**:
- Render 9x9 grid with visual separation of 3x3 boxes
- Apply CSS Grid layout for proper spacing and borders
- Handle cell selection events
- Display validation state visually

**Props Interface**:
```typescript
interface ISudokuGridProps {
  puzzle: Puzzle;
  state: PuzzleState;
  selectedCell: CellId | null;
  validationErrors: ValidationError[];
  onCellSelect: (cellId: CellId) => void;
  onCellValueChange: (cellId: CellId, value: number | undefined) => void;
}
```

#### 3. SudokuCell (Individual Cell)

**Purpose**: Individual cell component with input handling and validation display
**Location**: `src/components/SudokuCell.tsx`
**Type**: React Functional Component
**Pattern**: Controlled Input Component

**Responsibilities**:
- Display cell value or empty state
- Handle keyboard input (numbers 1-9, Delete/Backspace)
- Show validation errors (highlighting duplicates)
- Manage cell selection state
- Handle immutable cells (pre-filled values)

**Props Interface**:
```typescript
interface ISudokuCellProps {
  cell: Cell;                    // From @fgv/ts-sudoku-lib
  contents: ICellContents;       // Current value and notes
  isSelected: boolean;
  hasValidationError: boolean;
  onSelect: () => void;
  onValueChange: (value: number | undefined) => void;
}
```

### Supporting Components

#### 4. SudokuControls (Action Controls)

**Purpose**: Control panel for grid-wide operations
**Location**: `src/components/SudokuControls.tsx`
**Type**: React Functional Component

**Responsibilities**:
- Clear/Reset functionality with confirmation
- Export puzzle functionality
- Validation status display
- Instructions/help text

#### 5. ValidationDisplay (Error Feedback)

**Purpose**: Display validation errors and puzzle status
**Location**: `src/components/ValidationDisplay.tsx`
**Type**: React Functional Component

**Responsibilities**:
- Show real-time validation status
- List specific validation errors
- Display puzzle completion status

## Data Models & Validation

### Core Data Structures

Using existing @fgv/ts-sudoku-lib models:

```typescript
// Primary data model (existing)
import { Puzzle, PuzzleState, Cell, ICellState } from '@fgv/ts-sudoku-lib';

// Validation results
interface ValidationError {
  cellId: CellId;
  type: 'duplicate-row' | 'duplicate-column' | 'duplicate-section';
  conflictingCells: CellId[];
  message: string;
}
```

### Validation Strategy

**Real-time Validation**: Validate on every input change using existing puzzle.checkIsValid()
**Error Aggregation**: Collect all validation errors for comprehensive feedback
**Visual Feedback**: Highlight conflicting cells immediately

```typescript
// Validation workflow
function validatePuzzleState(puzzle: Puzzle, state: PuzzleState): Result<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Use existing puzzle validation
  const invalidCells = puzzle.getInvalidCells(state);

  // Convert to detailed error information
  return succeed(errors); // Aggregated validation results
}
```

## State Management

### State Architecture: Centralized with Result Pattern

**Pattern**: Single source of truth with Result-based updates
**Location**: Main container component (SudokuGridEntry)
**Update Flow**: User Input → Validation → State Update → Re-render

```typescript
// State update pattern
function updateCellValue(cellId: CellId, value: number | undefined): void {
  const updateResult = puzzle.updateCellValue(cellId, value, currentState);

  updateResult
    .onSuccess((puzzleUpdate) => {
      setState(puzzleUpdate.to);
      setValidationErrors(validatePuzzleState(puzzle, puzzleUpdate.to).orDefault([]));
    })
    .onFailure((error) => {
      // Handle validation errors
      console.error('Cell update failed:', error);
    });
}
```

### Cell Selection Management

```typescript
// Selection state management
const [selectedCell, setSelectedCell] = useState<CellId | null>(null);

// Keyboard navigation support
function handleKeyboardNavigation(direction: NavigationDirection): void {
  if (!selectedCell) return;

  puzzle.getCellNeighbor(selectedCell, direction, 'wrap-around')
    .onSuccess((nextCell) => setSelectedCell(nextCell.id))
    .onFailure(() => {/* Handle navigation limits */});
}
```

## User Interaction Design

### Input Handling Strategy

**Primary Input**: Keyboard numbers 1-9
**Secondary Actions**: Delete/Backspace for clearing
**Navigation**: Arrow keys for cell navigation
**Selection**: Mouse/touch for cell selection

```typescript
// Input handling in SudokuCell
function handleKeyDown(event: React.KeyboardEvent): void {
  const key = event.key;

  if (key >= '1' && key <= '9') {
    const value = parseInt(key, 10);
    onValueChange(value);
  } else if (key === 'Delete' || key === 'Backspace') {
    onValueChange(undefined);
  } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    // Handle navigation via parent component
    onNavigate(key as NavigationDirection);
  }
}
```

### Validation Feedback

**Visual Indicators**:
- Error cells: Red background/border
- Selected cell: Blue border/background
- Empty cells: Light gray background
- Immutable cells: Dark gray background

**Error Display**:
- Real-time highlighting of duplicate numbers
- Error summary in ValidationDisplay component
- Tooltip/aria-label for accessibility

## Integration Points

### 1. @fgv/ts-sudoku-lib Integration

**Primary Models**:
- `Puzzle` - Core puzzle structure and validation
- `PuzzleState` - Current state of cell values
- `Cell` - Individual cell with constraints
- `ICellState` - Cell value and notes interface

**Key Operations**:
```typescript
// Puzzle creation for entry (empty puzzle)
const emptyPuzzle = Puzzle.create({
  id: 'manual-entry',
  description: 'Manual Entry Puzzle',
  rows: 9,
  cols: 9,
  cells: Array(81).fill('.') // Empty puzzle
}).orThrow();

// State updates
puzzle.updateCellValue(cellId, value, currentState)
  .onSuccess((update) => setState(update.to));

// Validation
const isValid = puzzle.checkIsValid(currentState);
const invalidCells = puzzle.getInvalidCells(currentState);
```

### 2. Export Functionality

**Format**: Compatible with @fgv/ts-sudoku-lib puzzle format
**Output**: PuzzleState that can be saved/loaded

```typescript
// Export current puzzle state
function exportPuzzle(): Result<IPuzzleDescription> {
  return succeed({
    id: generateId(),
    description: 'User Entered Puzzle',
    rows: 9,
    cols: 9,
    cells: convertStateToStringArray(currentState)
  });
}
```

### 3. Monorepo Integration

**Two-Package Structure**:

#### Library Package: `@fgv/ts-sudoku-ui` (✅ IMPLEMENTED)
**Location**: `libraries/ts-sudoku-ui/`
**Dependencies**:
- @fgv/ts-sudoku-lib (workspace:*)
- @fgv/ts-utils (workspace:*)
- @fgv/ts-utils-jest (workspace:*)
- React/React-DOM (peerDependencies)

#### Application Package: `apps/sudoku/` (🆕 TO BE CREATED)
**Location**: `apps/sudoku/`
**Dependencies**:
- @fgv/ts-sudoku-ui (workspace:*)
- @fgv/ts-sudoku-lib (workspace:*) [transitive through library]
- @fgv/ts-utils (workspace:*) [transitive through library]
- React/React-DOM (direct dependencies for the app)
- Routing, build, and deployment dependencies

## CSS Architecture

### Styling Strategy: CSS-in-JS with Emotion/Styled-Components

Following @fgv/ts-res-ui-components patterns:

```typescript
// Grid layout using CSS Grid
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 1px;
  background-color: #333; /* Grid lines */
  border: 2px solid #333;
  width: 450px;
  height: 450px;
`;

// 3x3 section boundaries
const SudokuCell = styled.button<{isSelected: boolean, hasError: boolean}>`
  background-color: ${props =>
    props.hasError ? '#ffebee' :
    props.isSelected ? '#e3f2fd' :
    '#fff'};
  border: 1px solid #ddd;
  border-right: ${props => (props.col + 1) % 3 === 0 ? '2px solid #333' : '1px solid #ddd'};
  border-bottom: ${props => (props.row + 1) % 3 === 0 ? '2px solid #333' : '1px solid #ddd'};
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
`;
```

### Responsive Design

**Desktop First**: Optimized for keyboard input
**Mobile Considerations**: Touch-friendly cell selection
**Accessibility**: Proper ARIA labels and keyboard navigation

## Testing Strategy

### Component Testing Approach

Following FGV patterns with @fgv/ts-utils-jest:

```typescript
// Example test structure
describe('SudokuGridEntry', () => {
  let testPuzzle: Puzzle;

  beforeEach(() => {
    testPuzzle = createEmptyPuzzle().orThrow();
  });

  test('should update cell value successfully', () => {
    const { getByTestId } = render(<SudokuGridEntry puzzle={testPuzzle} />);

    const cell = getByTestId('sudoku-cell-r0c0');
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: '5' });

    expect(cell).toHaveValue('5');
  });

  test('should validate and highlight duplicate entries', () => {
    // Test validation error display
    expect(component.validatePuzzle()).toSucceedAndSatisfy((result) => {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('duplicate-row');
    });
  });
});
```

### Testing Coverage Requirements

- **Unit Tests**: 100% coverage for all components
- **Integration Tests**: Grid interaction and validation
- **Accessibility Tests**: Keyboard navigation and screen readers
- **Performance Tests**: Rendering and state update timing

## Performance Considerations

### Optimization Strategies

**React Optimization**:
- React.memo for SudokuCell (prevents unnecessary re-renders)
- useCallback for event handlers
- useMemo for computed validation state

**State Updates**:
- Debounced validation for rapid input
- Minimal state updates (only changed cells)

```typescript
// Optimized cell component
const SudokuCell = React.memo<ISudokuCellProps>(({ cell, contents, onValueChange }) => {
  const handleValueChange = useCallback((value: number | undefined) => {
    onValueChange(value);
  }, [onValueChange]);

  return (
    <CellInput
      value={contents.value}
      onChange={handleValueChange}
    />
  );
});
```

## Error Handling

### Error Handling Strategy

**Result Pattern**: All operations return Result<T> for consistent error handling
**User Feedback**: Clear error messages for validation failures
**Graceful Degradation**: Continue operating despite non-critical errors

```typescript
// Error handling example
function handleCellUpdate(cellId: CellId, value: number | undefined): void {
  const updateResult = puzzle.updateCellValue(cellId, value, currentState);

  updateResult
    .onSuccess((update) => {
      setState(update.to);
      // Clear any previous errors for this cell
      clearErrorsForCell(cellId);
    })
    .onFailure((error) => {
      // Display error to user without breaking the interface
      showValidationError(`Cannot update cell ${cellId}: ${error}`);
    });
}
```

## Security Considerations

### Input Validation

**Client-Side**: TypeScript types and runtime validation
**Sanitization**: Numbers only (1-9), no injection possible
**Validation**: All inputs validated against Sudoku rules

### Data Handling

**No Persistence**: Entry interface doesn't store data permanently
**Export Safety**: Generated data is validated before export
**Type Safety**: Full TypeScript coverage prevents runtime errors

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:
- Tab between controls
- Arrow keys for cell navigation
- Enter/Space for selection

**Screen Reader Support**:
- ARIA labels for all interactive elements
- Live regions for validation feedback
- Proper heading structure

**Visual Accessibility**:
- High contrast colors
- Clear focus indicators
- Scalable text

```typescript
// Accessibility implementation
<div
  role="grid"
  aria-label="Sudoku puzzle entry grid"
  tabIndex={0}
  onKeyDown={handleGridKeyDown}
>
  {cells.map((cell) => (
    <div
      key={cell.id}
      role="gridcell"
      aria-label={`Row ${cell.row + 1}, Column ${cell.col + 1}, ${cell.value || 'empty'}`}
      aria-selected={selectedCell === cell.id}
      tabIndex={selectedCell === cell.id ? 0 : -1}
    >
      {cell.value}
    </div>
  ))}
</div>
```

## Migration & Deployment

### Two-Package Implementation Strategy

#### Phase 1: Library Package (✅ COMPLETED)
**Package**: `@fgv/ts-sudoku-ui`
**Location**: `libraries/ts-sudoku-ui/`
**Status**: Already implemented with complete components

#### Phase 2: Application Package (🆕 TO BE CREATED)
**Package**: `apps/sudoku/`
**Location**: `apps/sudoku/`
**Rush Configuration**: Add to rush.json projects array

### Implementation Steps for Application

1. **App Structure Setup**: Create apps/sudoku/ directory with React app structure
2. **Dependency Configuration**: Configure to use @fgv/ts-sudoku-ui library
3. **Application Integration**: Wire up library components with routing and app logic
4. **Build Configuration**: Set up build and deployment configuration
5. **Testing**: Application-level integration tests
6. **Documentation**: Usage and deployment documentation

## Future Considerations

### Extensibility Points

**Multiple Puzzle Types**: Interface designed to support different Sudoku variants
**Theming**: CSS-in-JS enables easy theming
**Mobile Optimization**: Touch-first interaction patterns
**Collaboration**: Multi-user editing support

### Technical Debt Prevention

**Pattern Consistency**: Follow established FGV patterns
**Type Safety**: Full TypeScript coverage
**Testing**: Comprehensive test suite
**Documentation**: Clear API documentation

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| React version compatibility | Low | Medium | Use established component patterns |
| Performance with complex validation | Medium | Low | Implement debouncing and memoization |
| Accessibility compliance | Low | High | Follow WCAG guidelines, use testing tools |
| Integration issues | Low | Medium | Use existing library interfaces |

### Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| State management complexity | Medium | Medium | Use Result pattern consistently |
| CSS layout issues | Low | Low | Use CSS Grid with testing |
| Keyboard navigation bugs | Medium | Medium | Comprehensive keyboard testing |

## Success Metrics

### Technical Success Criteria

1. **Functionality**: Users can enter complete 9x9 puzzles efficiently
2. **Validation**: Real-time duplicate detection and highlighting
3. **Performance**: < 100ms response time for all interactions
4. **Accessibility**: Full keyboard navigation support
5. **Integration**: Seamless integration with existing codebase
6. **Testing**: 100% test coverage achieved
7. **Code Quality**: Passes all linting and type checking

### User Experience Success Criteria

1. **Efficiency**: Users can enter puzzles faster than paper alternatives
2. **Error Prevention**: Validation catches mistakes immediately
3. **Intuitive Interface**: Minimal learning curve for Sudoku players
4. **Accessibility**: Usable by users with disabilities

## Implementation Roadmap

### Phase 1: Library Components (✅ COMPLETED)
- ✅ Set up @fgv/ts-sudoku-ui package structure and dependencies
- ✅ Implement basic Puzzle and PuzzleState integration
- ✅ Create SudokuGridEntry, SudokuGrid, SudokuCell components
- ✅ Implement cell selection, value input, and keyboard navigation
- ✅ Add real-time validation and error display
- ✅ Implement reset/clear functionality and export capabilities
- ✅ Comprehensive testing suite with 100% coverage

### Phase 2: Standalone Application (🆕 TO BE IMPLEMENTED)
**Goal**: Create deployable React application using the library

#### Week 1: Application Foundation
- Create apps/sudoku/ directory structure
- Set up React application configuration
- Configure build system and dependencies
- Integrate @fgv/ts-sudoku-ui library components

#### Week 2: Application Features
- Implement application routing and navigation
- Add application-level state management
- Create deployment configuration
- Application-level testing and validation

#### Week 3: Polish & Deployment
- Performance optimization and testing
- Production build configuration
- Documentation and deployment guides
- User acceptance testing

## Conclusion

This architecture provides a solid foundation for implementing an intuitive, maintainable Sudoku puzzle entry interface that seamlessly integrates with the existing FGV monorepo ecosystem. The design emphasizes consistency with established patterns, type safety, comprehensive testing, and excellent user experience while maintaining the flexibility for future enhancements.

The implementation follows React best practices, leverages the powerful @fgv/ts-sudoku-lib for puzzle logic, and uses the Result pattern for robust error handling. The modular component architecture ensures maintainability and testability while providing clear separation of concerns.