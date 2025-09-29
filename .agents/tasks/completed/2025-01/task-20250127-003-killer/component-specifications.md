# Killer Sudoku UI Component Specifications

## Component Hierarchy and Interfaces

### 1. KillerSudokuGrid Component

**Purpose**: Enhanced grid component that adds cage visualization to the existing SudokuGrid

**Location**: `src/components/KillerSudokuGrid.tsx`

**Type**: Wrapper Component (Composition Pattern)

**Interface**:
```typescript
interface IKillerSudokuGridProps extends ISudokuGridProps {
  // Cage display options
  showCages?: boolean;
  cageHighlightMode?: 'none' | 'hover' | 'selected';

  // Cage interaction
  selectedCage?: string;
  onCageSelect?: (cageId: string) => void;
  onCageHover?: (cageId: string | null) => void;

  // Styling options
  cageOverlayClassName?: string;
  cageSumPosition?: 'top-left' | 'top-right' | 'center';
}
```

**Responsibilities**:
- Render existing SudokuGrid component unchanged
- Add SVG cage overlay when `showCages` is enabled
- Coordinate cage interactions with cell interactions
- Provide cage-specific visual feedback

**Dependencies**:
- `SudokuGrid` (existing component)
- `CageOverlay` (new component)
- `usePuzzleSession` (for cage data)

**Consumers**:
- Killer Sudoku puzzle pages
- Puzzle variant selector

---

### 2. CageOverlay Component

**Purpose**: SVG overlay that renders cage boundaries, sums, and interaction areas

**Location**: `src/components/CageOverlay.tsx`

**Type**: Pure Rendering Component

**Interface**:
```typescript
interface ICageOverlayProps {
  // Data from PuzzleSession
  cages: Cage[];
  cellDisplayInfo: ICellDisplayInfo[];

  // Grid configuration
  gridSize: number;
  cellSize: number;

  // Interaction state
  selectedCage?: string;
  highlightedCage?: string;
  highlightMode: 'none' | 'hover' | 'selected';

  // Callbacks
  onCageSelect?: (cageId: string) => void;
  onCageHover?: (cageId: string | null) => void;

  // Display options
  showSums?: boolean;
  sumPosition?: 'top-left' | 'top-right' | 'center';
  className?: string;
}
```

**Responsibilities**:
- Calculate cage boundary paths from cell positions
- Render SVG paths for cage outlines
- Display cage sum totals at appropriate positions
- Handle mouse/touch events for cage interaction
- Provide visual state feedback (valid/invalid/complete)

**Sub-components**:
- `CagePath` - Individual cage boundary rendering
- `CageSumLabel` - Cage total display

**Dependencies**:
- None (pure rendering component)

**Consumers**:
- `KillerSudokuGrid`

---

### 3. CagePath Component

**Purpose**: Renders the SVG path for a single cage boundary

**Location**: `src/components/CagePath.tsx`

**Type**: Pure Rendering Component

**Interface**:
```typescript
interface ICagePathProps {
  cage: Cage;
  cellPositions: Map<CellId, { x: number; y: number; width: number; height: number }>;
  isSelected?: boolean;
  isHighlighted?: boolean;
  validationState: 'valid' | 'invalid' | 'incomplete';
  onSelect?: () => void;
  onHover?: (isHovering: boolean) => void;
  className?: string;
}
```

**Responsibilities**:
- Generate continuous SVG path for cage boundary
- Apply appropriate styling based on state
- Handle pointer events for interaction
- Optimize path calculation for performance

**Dependencies**:
- Cage geometry calculation utilities

**Consumers**:
- `CageOverlay`

---

### 4. CageSumLabel Component

**Purpose**: Displays cage sum total with current progress

**Location**: `src/components/CageSumLabel.tsx`

**Type**: Pure Rendering Component

**Interface**:
```typescript
interface ICageSumLabelProps {
  cage: Cage;
  currentSum: number;
  targetSum: number;
  position: { x: number; y: number };
  validationState: 'valid' | 'invalid' | 'incomplete';
  showProgress?: boolean;
  className?: string;
}
```

**Responsibilities**:
- Display cage target sum
- Show current sum progress (optional)
- Apply styling based on validation state
- Position label appropriately within cage

**Dependencies**:
- None

**Consumers**:
- `CageOverlay`

---

### 5. Enhanced SudokuCell Component

**Purpose**: Extend existing SudokuCell with cage-aware styling

**Location**: Modify existing `src/components/SudokuCell.tsx`

**Type**: Enhancement (not replacement)

**Additional Props**:
```typescript
interface ICageEnhancedProps {
  // Cage membership
  cageId?: string;
  isCageHighlighted?: boolean;
  isCageSelected?: boolean;
  cageValidationState?: 'valid' | 'invalid' | 'incomplete';

  // Visual options
  showCageBorders?: boolean;
  cageHighlightIntensity?: 'subtle' | 'medium' | 'strong';
}
```

**Responsibilities**:
- Add cage-specific CSS classes
- Provide visual feedback for cage membership
- Maintain all existing SudokuCell functionality
- Handle cage-related accessibility attributes

**Dependencies**:
- Existing SudokuCell implementation

**Consumers**:
- `KillerSudokuGrid` (via SudokuGrid)

---

### 6. Enhanced usePuzzleSession Hook

**Purpose**: Expose cage-related data and operations

**Location**: Extend existing `src/hooks/usePuzzleSession.ts`

**Type**: Hook Enhancement

**Additional Return Values**:
```typescript
interface IKillerSudokuSessionState {
  // Cage data (direct from PuzzleSession)
  cages: Cage[];

  // Cage utilities
  getCageForCell: (cellId: CellId) => Cage | undefined;
  getCageValidationState: (cageId: string) => 'valid' | 'invalid' | 'incomplete';
  getCageCurrentSum: (cageId: string) => number;
  getCageCompletedCells: (cageId: string) => CellId[];

  // Cage interaction state
  selectedCage: string | null;
  setSelectedCage: (cageId: string | null) => void;
}
```

**Responsibilities**:
- Expose `session.cages` directly (no transformation)
- Provide convenience methods for cage operations
- Calculate cage validation states
- Manage cage selection state
- Maintain all existing hook functionality

**Dependencies**:
- Existing usePuzzleSession implementation
- PuzzleSession cage API

**Consumers**:
- Components that need cage data

---

## Utility Functions and Types

### 1. Cage Geometry Utilities

**Location**: `src/utils/cageGeometry.ts`

**Purpose**: Calculate cage boundary paths and positions

**Functions**:
```typescript
// Calculate SVG path for cage boundary
export function calculateCagePath(
  cage: Cage,
  cellPositions: Map<CellId, CellPosition>
): string;

// Find optimal position for cage sum label
export function calculateSumLabelPosition(
  cage: Cage,
  cellPositions: Map<CellId, CellPosition>,
  position: 'top-left' | 'top-right' | 'center'
): { x: number; y: number };

// Check if point is inside cage boundary
export function isPointInCage(
  point: { x: number; y: number },
  cage: Cage,
  cellPositions: Map<CellId, CellPosition>
): boolean;
```

### 2. Type Definitions

**Location**: `src/types/killer-sudoku.ts`

**Types**:
```typescript
export interface ICageDisplayInfo {
  cage: Cage;
  currentSum: number;
  validationState: 'valid' | 'invalid' | 'incomplete';
  completedCells: CellId[];
  path: string; // SVG path for boundary
  sumPosition: { x: number; y: number };
}

export interface ICageInteractionState {
  selectedCage: string | null;
  highlightedCage: string | null;
  interactionMode: 'none' | 'hover' | 'selected';
}

export type CageValidationState = 'valid' | 'invalid' | 'incomplete';
export type CageHighlightMode = 'none' | 'hover' | 'selected';
export type CageSumPosition = 'top-left' | 'top-right' | 'center';
```

## Component Interaction Flow

### 1. Data Flow
```
PuzzleSession.cages → usePuzzleSession → KillerSudokuGrid → CageOverlay → CagePath/CageSumLabel
```

### 2. Event Flow
```
User Interaction → CageOverlay → KillerSudokuGrid → usePuzzleSession → PuzzleSession
```

### 3. Update Flow
```
PuzzleSession Update → usePuzzleSession Re-render → Component Tree Re-render
```

## Integration Strategy

### 1. Backward Compatibility
- All existing SudokuGrid functionality preserved
- usePuzzleSession hook remains fully compatible
- No breaking changes to existing components

### 2. Progressive Enhancement
- KillerSudokuGrid can be used as drop-in replacement for SudokuGrid
- Cage features are opt-in via props
- Graceful degradation when cage data is not available

### 3. Testing Strategy
- Unit tests for each new component
- Integration tests for cage interaction
- Visual regression tests for cage rendering
- Accessibility tests for cage interaction

## Performance Considerations

### 1. SVG Rendering Optimization
- Memoize cage path calculations
- Use React.memo for CagePath components
- Implement efficient re-rendering strategies

### 2. Event Handling Optimization
- Debounce hover events
- Use efficient hit testing for cage selection
- Minimize re-renders during interaction

### 3. Memory Management
- Clean up event listeners
- Efficient data structures for cage lookups
- Minimize object creation in render cycles

## Accessibility Features

### 1. Screen Reader Support
- ARIA labels for cage information
- Accessible descriptions for cage validation states
- Keyboard navigation support for cage traversal

### 2. Keyboard Interaction
- Tab navigation between cages
- Arrow key navigation within cages
- Escape key to clear cage selection

### 3. Visual Accessibility
- High contrast support for cage boundaries
- Pattern-based validation states (not just color)
- Customizable cage highlight intensity

This component specification provides a clear roadmap for implementing Killer Sudoku UI features while leveraging the existing PuzzleSession capabilities and maintaining the quality patterns of the current codebase.