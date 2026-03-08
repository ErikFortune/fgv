# Killer Sudoku Combinations Tool - Technical Design

## Document Overview

This document provides a comprehensive technical architecture for implementing a killer sudoku combinations explorer UI component. The design respects existing patterns in the FGV monorepo and integrates seamlessly with the `@fgv/ts-sudoku-ui` component library and `@fgv/ts-sudoku-lib`.

---

## 1. Component Library Integration

### 1.1 File Structure in `@fgv/ts-sudoku-ui`

Following the existing packlet organization pattern:

```
libraries/ts-sudoku-ui/src/
├── components/
│   ├── KillerCombinationsExplorer.tsx      # Main container component
│   ├── KillerCombinationsPanel.tsx         # Desktop panel variant
│   ├── KillerCombinationsModal.tsx         # Mobile modal variant
│   ├── CombinationCard.tsx                 # Individual combination display
│   └── CombinationGrid.tsx                 # Grid layout for combinations
├── hooks/
│   ├── useKillerCombinations.ts            # Combinations logic hook
│   ├── useCombinationElimination.ts        # Elimination state management
│   └── useKeyboardShortcut.ts              # Keyboard shortcut handling
├── types/
│   └── index.ts                            # Extended with new interfaces
└── index.ts                                # Updated with new exports
```

### 1.2 Export Strategy

Update `/libraries/ts-sudoku-ui/src/index.ts`:

```typescript
// Killer Combinations Explorer components
export { KillerCombinationsExplorer } from './components/KillerCombinationsExplorer';
export { KillerCombinationsPanel } from './components/KillerCombinationsPanel';
export { KillerCombinationsModal } from './components/KillerCombinationsModal';

// Killer Combinations hooks
export { useKillerCombinations } from './hooks/useKillerCombinations';
export { useCombinationElimination } from './hooks/useCombinationElimination';
export { useKeyboardShortcut } from './hooks/useKeyboardShortcut';

// Killer Combinations types
export type {
  IKillerCombinationsExplorerProps,
  ICombinationDisplayInfo,
  IEliminationState,
  IKillerCombinationsMode
} from './types';
```

### 1.3 Dependency Management

**Library Dependencies** (`@fgv/ts-sudoku-ui`):
- Existing: `@fgv/ts-sudoku-lib` (already has `KillerCombinations` class)
- Existing: `@fgv/ts-utils` (Result pattern)
- Existing: `react` and `react-dom` (peer dependencies)
- **No new dependencies needed**

**App Integration** (`apps/sudoku`):
- Already has `@fgv/ts-sudoku-ui` workspace dependency
- **No new dependencies needed**

---

## 2. State Management Architecture

### 2.1 State Layers

Following the existing pattern from `usePuzzleSession`:

```typescript
// State hierarchy:
// 1. Session State (usePuzzleSession) - owns puzzle data
// 2. Combinations State (useKillerCombinations) - computes combinations
// 3. Elimination State (useCombinationElimination) - manages user eliminations
// 4. UI State (local) - panel/modal visibility, animations
```

### 2.2 Elimination State Management

**Storage Strategy:**
- **Session Storage** for eliminated combinations (persists during session)
- **Key format:** `killer-combinations-${puzzleId}-${cageId}`
- **Value format:** `Set<string>` serialized as JSON array

```typescript
interface IEliminationState {
  // Map of cage ID to set of eliminated combination signatures
  eliminated: Map<string, Set<string>>;

  // Persistence operations
  save: (cageId: string, combinations: Set<string>) => void;
  load: (cageId: string) => Set<string>;
  clear: (cageId: string) => void;
  clearAll: () => void;
}
```

**Combination Signature Format:**
```typescript
// Signature: sorted numbers joined by commas
// Examples: "1,5,9" or "2,4,6,8"
function getCombinationSignature(combination: number[]): string {
  return combination.sort((a, b) => a - b).join(',');
}
```

### 2.3 State Synchronization

**Integration with usePuzzleSession:**

```typescript
// The combinations explorer is a passive observer
// It reads from puzzle session state but doesn't modify it
interface IKillerCombinationsContext {
  session: PuzzleSession | null;           // From usePuzzleSession
  selectedCage: ICage | null;              // Derived from selectedCell
  cageDisplayInfo: ICageDisplayInfo[];     // From usePuzzleSession
}
```

**Reactive Updates:**
- When `selectedCell` changes → compute `selectedCage`
- When `selectedCage` changes → load combinations and elimination state
- When cage values change → recompute valid combinations
- No circular dependencies

---

## 3. Event System Architecture

### 3.1 Cage Selection Detection

**Strategy:** Derive cage selection from existing `selectedCell` state

```typescript
function useSelectedCage(
  session: PuzzleSession | null,
  selectedCell: CellId | null
): ICage | null {
  return useMemo(() => {
    if (!session || !selectedCell) return null;

    // Find killer cage containing the selected cell
    const cage = session.cages.find(
      cage => cage.cageType === 'killer' &&
              cage.cellIds.includes(selectedCell)
    );

    return cage || null;
  }, [session, selectedCell]);
}
```

### 3.2 Keyboard Shortcut Implementation

**Global Keyboard Handler Pattern:**

```typescript
// Hook: useKeyboardShortcut
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    preventDefault?: boolean;
  }
): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = options?.ctrl ? event.ctrlKey : true;
      const matchesMeta = options?.meta ? event.metaKey : true;
      const matchesShift = options?.shift ? event.shiftKey : !event.shiftKey;

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift) {
        if (options?.preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}
```

**Usage in App:**
```typescript
// In PuzzlePage or parent component
const [isExplorerOpen, setIsExplorerOpen] = useState(false);

useKeyboardShortcut('k', () => {
  if (selectedCage) {
    setIsExplorerOpen(prev => !prev);
  }
}, {
  ctrl: true,  // Ctrl on Windows/Linux
  meta: true,  // Cmd on Mac
  preventDefault: true
});
```

### 3.3 Event Communication Pattern

**Unidirectional Data Flow:**

```
User Action (button/shortcut)
    ↓
App State Update (setIsExplorerOpen)
    ↓
Explorer Component Renders
    ↓
Reads puzzle state (read-only)
    ↓
User toggles combination
    ↓
Elimination state updates (session storage)
    ↓
Component re-renders
```

---

## 4. React Component Architecture

### 4.1 Component Hierarchy

```
KillerCombinationsExplorer (Container)
├── Layout Detection (useResponsiveLayout)
├── Mode Selection (panel vs modal)
│
├── KillerCombinationsPanel (Desktop ≥1024px)
│   ├── PanelHeader
│   │   ├── Title
│   │   ├── Cage Info
│   │   └── Close Button
│   ├── PanelBody
│   │   └── CombinationGrid
│   │       └── CombinationCard[] (3 columns)
│   └── PanelFooter (optional stats)
│
└── KillerCombinationsModal (Mobile <1024px)
    ├── ModalOverlay (backdrop)
    ├── ModalDialog
    │   ├── ModalHeader
    │   │   ├── Title
    │   │   ├── Cage Info
    │   │   └── Close Button
    │   ├── ModalBody
    │   │   └── CombinationGrid
    │   │       └── CombinationCard[] (2 columns)
    │   └── ModalFooter (optional stats)
    └── Focus Trap & Scroll Lock
```

### 4.2 Component Props Interfaces

```typescript
// Main explorer props
export interface IKillerCombinationsExplorerProps {
  // Required: current puzzle session
  readonly session: PuzzleSession | null;

  // Required: selected cage to explore
  readonly selectedCage: ICage | null;

  // Required: control visibility
  readonly isOpen: boolean;
  readonly onClose: () => void;

  // Optional: responsive breakpoint override
  readonly mobileBreakpoint?: number;

  // Optional: styling
  readonly className?: string;
}

// Combination display info
export interface ICombinationDisplayInfo {
  readonly combination: number[];
  readonly signature: string;
  readonly isEliminated: boolean;
}

// Elimination state
export interface IEliminationState {
  readonly eliminatedSignatures: Set<string>;
  readonly toggleElimination: (signature: string) => void;
  readonly clearAll: () => void;
}

// Mode determination
export type IKillerCombinationsMode = 'panel' | 'modal';
```

### 4.3 Custom Hooks Design

#### useKillerCombinations

```typescript
export function useKillerCombinations(
  session: PuzzleSession | null,
  cage: ICage | null
): Result<ICombinationDisplayInfo[]> {
  return useMemo(() => {
    if (!session || !cage || cage.cageType !== 'killer') {
      return fail('Invalid session or cage');
    }

    // Get current cage constraints
    const concreteCage = cage as Cage;
    const currentValues = concreteCage.containedValues(session.state);
    const constraints: IKillerConstraints = {
      excludedNumbers: Array.from(currentValues)
    };

    // Get valid combinations from library
    return KillerCombinations.getCombinations(
      cage.numCells,
      cage.total,
      constraints
    ).onSuccess(combinations => {
      const displayInfo = combinations.map(combo => ({
        combination: combo,
        signature: getCombinationSignature(combo),
        isEliminated: false // Will be enhanced by elimination state
      }));
      return succeed(displayInfo);
    });
  }, [session, cage]);
}
```

#### useCombinationElimination

```typescript
export function useCombinationElimination(
  puzzleId: string | undefined,
  cageId: string | undefined
): IEliminationState {
  const [eliminated, setEliminated] = useState<Set<string>>(() => {
    if (!puzzleId || !cageId) return new Set();
    return loadFromSessionStorage(puzzleId, cageId);
  });

  const toggleElimination = useCallback((signature: string) => {
    setEliminated(prev => {
      const next = new Set(prev);
      if (next.has(signature)) {
        next.delete(signature);
      } else {
        next.add(signature);
      }

      // Persist to session storage
      if (puzzleId && cageId) {
        saveToSessionStorage(puzzleId, cageId, next);
      }

      return next;
    });
  }, [puzzleId, cageId]);

  const clearAll = useCallback(() => {
    setEliminated(new Set());
    if (puzzleId && cageId) {
      clearFromSessionStorage(puzzleId, cageId);
    }
  }, [puzzleId, cageId]);

  return {
    eliminatedSignatures: eliminated,
    toggleElimination,
    clearAll
  };
}
```

### 4.4 Performance Optimization

**Memoization Strategy:**

```typescript
// Expensive computations memoized
const combinations = useMemo(() => {
  return computeCombinations(cage, constraints);
}, [cage, constraints]);

// Display info with elimination state
const displayCombinations = useMemo(() => {
  return combinations.map(combo => ({
    ...combo,
    isEliminated: eliminationState.eliminatedSignatures.has(combo.signature)
  }));
}, [combinations, eliminationState.eliminatedSignatures]);

// Virtual scrolling for large lists (if needed)
// Use react-window or similar if >50 combinations
```

**Render Optimization:**
```typescript
// Use React.memo for CombinationCard
export const CombinationCard = React.memo<ICombinationCardProps>(
  ({ combination, isEliminated, onToggle }) => {
    // Component implementation
  },
  (prev, next) => {
    // Custom comparison for optimal re-renders
    return prev.combination.signature === next.combination.signature &&
           prev.isEliminated === next.isEliminated;
  }
);
```

---

## 5. Styling Architecture

### 5.1 Technology Choice: Tailwind CSS

**Rationale:**
- ✅ Already used in existing components (SudokuCell, ValidationDisplay)
- ✅ Already configured in both library and app
- ✅ Consistent with codebase patterns
- ✅ No additional dependencies

### 5.2 Responsive Breakpoints

Following existing pattern from `useResponsiveLayout`:

```typescript
const BREAKPOINTS = {
  mobile: 768,    // Existing
  tablet: 1024,   // Existing - USED FOR PANEL/MODAL SWITCH
  desktop: 1280   // New - for wider layouts
};

// Component uses 1024px as the panel/modal breakpoint
const mode: IKillerCombinationsMode =
  screenWidth >= 1024 ? 'panel' : 'modal';
```

### 5.3 Tailwind Class Patterns

**Panel Variant (Desktop ≥1024px):**
```typescript
const panelClasses = classNames(
  'fixed right-0 top-16 bottom-0',
  'w-96 max-w-md',
  'bg-white dark:bg-gray-800',
  'border-l border-gray-200 dark:border-gray-700',
  'shadow-2xl',
  'transform transition-transform duration-300 ease-in-out',
  isOpen ? 'translate-x-0' : 'translate-x-full',
  'z-40'
);
```

**Modal Variant (Mobile <1024px):**
```typescript
const modalClasses = classNames(
  'fixed inset-0 z-50',
  'flex items-end sm:items-center justify-center',
  'p-4',
  'bg-black bg-opacity-50',
  'transition-opacity duration-300',
  isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
);

const modalDialogClasses = classNames(
  'bg-white dark:bg-gray-800',
  'rounded-t-2xl sm:rounded-2xl',
  'w-full max-w-lg',
  'max-h-[85vh]',
  'overflow-hidden',
  'transform transition-transform duration-300',
  isOpen ? 'translate-y-0' : 'translate-y-full'
);
```

**Combination Grid:**
```typescript
const gridClasses = classNames(
  'grid gap-2 p-4',
  'grid-cols-2 sm:grid-cols-2',      // Mobile: 2 columns
  'lg:grid-cols-3',                   // Desktop panel: 3 columns
  'overflow-y-auto'
);
```

**Combination Card:**
```typescript
const cardClasses = classNames(
  'px-3 py-2',
  'rounded-lg border-2',
  'transition-all duration-200',
  'cursor-pointer select-none',
  'hover:shadow-md',
  isEliminated
    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50 line-through'
    : 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
);
```

### 5.4 Animation Strategy

**CSS Transitions (preferred for simplicity):**
```css
/* Panel slide-in/out */
.panel-enter {
  transform: translateX(100%);
}
.panel-enter-active {
  transform: translateX(0);
  transition: transform 300ms ease-in-out;
}
.panel-exit {
  transform: translateX(0);
}
.panel-exit-active {
  transform: translateX(100%);
  transition: transform 300ms ease-in-out;
}

/* Modal fade-in/out */
.modal-enter {
  opacity: 0;
}
.modal-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in-out;
}

/* Card toggle animation */
.card-eliminate {
  animation: strikethrough 200ms ease-in-out;
}
@keyframes strikethrough {
  0% { opacity: 1; }
  50% { opacity: 0.5; transform: scale(0.95); }
  100% { opacity: 0.5; }
}
```

### 5.5 Theme Integration

**Dark Mode Support:**
```typescript
// Use existing dark mode classes from Tailwind
// Classes automatically adapt: bg-white dark:bg-gray-800

// Check system preference (if needed)
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Or use existing theme context from app (if available)
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

Following the existing pattern from `@fgv/ts-utils-jest`:

**Test Files:**
```
src/test/unit/
├── components/
│   ├── KillerCombinationsExplorer.test.tsx
│   ├── KillerCombinationsPanel.test.tsx
│   ├── KillerCombinationsModal.test.tsx
│   ├── CombinationCard.test.tsx
│   └── CombinationGrid.test.tsx
├── hooks/
│   ├── useKillerCombinations.test.ts
│   ├── useCombinationElimination.test.ts
│   └── useKeyboardShortcut.test.ts
```

**Test Patterns:**

```typescript
import '@fgv/ts-utils-jest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('useKillerCombinations', () => {
  test('should return valid combinations for cage', () => {
    const { result } = renderHook(() =>
      useKillerCombinations(mockSession, mockCage)
    );

    expect(result.current).toSucceedAndSatisfy((combinations) => {
      expect(combinations).toHaveLength(expectedCount);
      expect(combinations[0].combination).toEqual([1, 5, 9]);
    });
  });

  test('should fail with invalid cage', () => {
    const { result } = renderHook(() =>
      useKillerCombinations(mockSession, null)
    );

    expect(result.current).toFailWith(/invalid.*cage/i);
  });
});

describe('CombinationCard', () => {
  test('should toggle elimination state on click', async () => {
    const onToggle = jest.fn();
    render(
      <CombinationCard
        combination={{ combination: [1,2,3], signature: '1,2,3', isEliminated: false }}
        onToggle={onToggle}
      />
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith('1,2,3');
  });
});
```

### 6.2 Integration Tests

**Test Scenarios:**

```typescript
describe('KillerCombinationsExplorer Integration', () => {
  test('should display combinations when cage is selected', () => {
    const mockSession = createMockKillerSession();
    const mockCage = mockSession.cages[0];

    render(
      <KillerCombinationsExplorer
        session={mockSession}
        selectedCage={mockCage}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    // Verify combinations are displayed
    expect(screen.getByText('1, 5, 9')).toBeInTheDocument();
    expect(screen.getByText('2, 4, 9')).toBeInTheDocument();
  });

  test('should persist elimination state in session storage', async () => {
    const mockPuzzleId = 'test-puzzle';
    const mockCageId = 'cage-1';

    const { rerender } = render(
      <TestComponent puzzleId={mockPuzzleId} cageId={mockCageId} />
    );

    // Toggle elimination
    await userEvent.click(screen.getByText('1, 5, 9'));

    // Verify session storage
    const stored = sessionStorage.getItem(
      `killer-combinations-${mockPuzzleId}-${mockCageId}`
    );
    expect(JSON.parse(stored)).toContain('1,5,9');

    // Unmount and remount - should restore state
    rerender(<TestComponent puzzleId={mockPuzzleId} cageId={mockCageId} />);
    expect(screen.getByText('1, 5, 9')).toHaveClass('eliminated');
  });

  test('should switch between panel and modal based on viewport', () => {
    const { container } = render(<KillerCombinationsExplorer {...props} />);

    // Desktop: should render panel
    global.innerWidth = 1200;
    fireEvent(window, new Event('resize'));
    expect(container.querySelector('.panel')).toBeInTheDocument();

    // Mobile: should render modal
    global.innerWidth = 800;
    fireEvent(window, new Event('resize'));
    expect(container.querySelector('.modal')).toBeInTheDocument();
  });
});
```

### 6.3 Accessibility Testing

**ARIA and Keyboard Navigation:**

```typescript
describe('Accessibility', () => {
  test('should have proper ARIA labels', () => {
    render(<KillerCombinationsExplorer {...props} />);

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Killer Sudoku Combinations Explorer'
    );
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('should trap focus in modal', async () => {
    render(<KillerCombinationsModal {...props} isOpen={true} />);

    const firstElement = screen.getAllByRole('button')[0];
    const lastElement = screen.getAllByRole('button').slice(-1)[0];

    // Tab from last to first
    lastElement.focus();
    await userEvent.tab();
    expect(firstElement).toHaveFocus();
  });

  test('should handle keyboard shortcuts', async () => {
    const onClose = jest.fn();
    render(<KillerCombinationsExplorer {...props} onClose={onClose} />);

    // Escape to close
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  test('should announce changes to screen readers', () => {
    render(<KillerCombinationsExplorer {...props} />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
```

### 6.4 Mock Data and Utilities

**Test Utilities:**

```typescript
// src/test/unit/testUtils/killerCombinationsMocks.ts
export function createMockKillerSession(): PuzzleSession {
  const puzzleDesc: IPuzzleDescription = {
    id: 'test-killer',
    description: 'Test Killer Sudoku',
    type: 'killer-sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: '.'.repeat(81),
    cages: [
      { cells: [0, 1, 2], total: 15 },
      { cells: [3, 4, 5], total: 24 }
    ]
  };

  return Puzzles.Killer.create(puzzleDesc)
    .onSuccess(puzzle => PuzzleSession.create(puzzle))
    .orThrow();
}

export function createMockCage(total: number, numCells: number): ICage {
  const cellIds = Array.from({ length: numCells }, (_, i) => i as CellId);
  return new Cage({
    id: `cage-${total}-${numCells}`,
    cageType: 'killer',
    total,
    cellIds
  });
}
```

### 6.5 Coverage Requirements

Following monorepo guidelines:
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

**Strategy:**
1. Write functional tests first (success cases, error cases, edge cases)
2. Run `rushx coverage` to identify gaps
3. Add tests for missed branches
4. Use `/* c8 ignore */` only for defensive code paths (with approval)

---

## 7. Build & Bundle Considerations

### 7.1 Code Splitting Strategy

**Library Bundle:**
- Components exported separately from `@fgv/ts-sudoku-ui`
- Tree-shakeable exports (named exports, no side effects)
- `"sideEffects": false` in package.json (already set)

**App Bundle:**
```typescript
// Lazy load the combinations explorer
const KillerCombinationsExplorer = React.lazy(() =>
  import('@fgv/ts-sudoku-ui').then(module => ({
    default: module.KillerCombinationsExplorer
  }))
);

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  {isExplorerOpen && (
    <KillerCombinationsExplorer {...props} />
  )}
</Suspense>
```

### 7.2 Tree Shaking Considerations

**Ensure optimal tree shaking:**
```typescript
// ✅ Good: Named exports
export { KillerCombinationsExplorer } from './components/KillerCombinationsExplorer';

// ❌ Bad: Barrel exports with re-exports
export * from './components';

// ✅ Good: Explicit imports
import { KillerCombinations } from '@fgv/ts-sudoku-lib';

// ❌ Bad: Namespace imports
import * as Lib from '@fgv/ts-sudoku-lib';
```

### 7.3 Bundle Size Optimization

**Target Bundle Size:**
- Combinations Explorer components: ~15-20KB (gzipped)
- No external dependencies beyond existing
- Leverage existing library code (KillerCombinations)

**Optimization Techniques:**
1. **Component lazy loading** (shown above)
2. **Memoization** of expensive computations
3. **Virtual scrolling** if >50 combinations (use react-window if needed)
4. **CSS purging** via Tailwind's JIT mode (already enabled)

---

## 8. Implementation Phases

### Phase 1: Core Hooks and Logic
1. ✅ Implement `useKillerCombinations` hook
2. ✅ Implement `useCombinationElimination` hook with session storage
3. ✅ Implement `useKeyboardShortcut` hook
4. ✅ Write unit tests for hooks (100% coverage)

### Phase 2: UI Components
1. ✅ Implement `CombinationCard` component
2. ✅ Implement `CombinationGrid` component
3. ✅ Implement `KillerCombinationsPanel` (desktop)
4. ✅ Implement `KillerCombinationsModal` (mobile)
5. ✅ Write component unit tests

### Phase 3: Integration
1. ✅ Implement `KillerCombinationsExplorer` container
2. ✅ Integrate with responsive layout detection
3. ✅ Integrate with puzzle session state
4. ✅ Write integration tests

### Phase 4: App Integration
1. ✅ Add toolbar button in `apps/sudoku`
2. ✅ Wire up keyboard shortcut (Ctrl/Cmd+K)
3. ✅ Test end-to-end functionality
4. ✅ Verify responsive behavior

### Phase 5: Polish
1. ✅ Add animations and transitions
2. ✅ Verify accessibility (ARIA, keyboard nav, screen readers)
3. ✅ Performance optimization
4. ✅ Documentation updates

---

## 9. Integration Points Summary

### 9.1 Library Exports (`@fgv/ts-sudoku-ui`)

**New Exports:**
```typescript
// Components
export { KillerCombinationsExplorer } from './components/KillerCombinationsExplorer';
export { KillerCombinationsPanel } from './components/KillerCombinationsPanel';
export { KillerCombinationsModal } from './components/KillerCombinationsModal';

// Hooks
export { useKillerCombinations } from './hooks/useKillerCombinations';
export { useCombinationElimination } from './hooks/useCombinationElimination';
export { useKeyboardShortcut } from './hooks/useKeyboardShortcut';

// Types
export type {
  IKillerCombinationsExplorerProps,
  ICombinationDisplayInfo,
  IEliminationState
} from './types';
```

### 9.2 App Integration (`apps/sudoku`)

**PuzzlePage.tsx Integration:**
```typescript
import {
  KillerCombinationsExplorer,
  useKeyboardShortcut
} from '@fgv/ts-sudoku-ui';

export function PuzzlePage() {
  const { session, selectedCell, ... } = usePuzzleSession(puzzleDesc);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  // Derive selected cage
  const selectedCage = useMemo(() => {
    if (!session || !selectedCell) return null;
    return session.cages.find(
      cage => cage.cageType === 'killer' &&
              cage.cellIds.includes(selectedCell)
    );
  }, [session, selectedCell]);

  // Keyboard shortcut
  useKeyboardShortcut('k', () => {
    if (selectedCage) {
      setIsExplorerOpen(prev => !prev);
    }
  }, { ctrl: true, meta: true, preventDefault: true });

  return (
    <div>
      <SudokuGridEntry {...puzzleProps} />

      {/* Toolbar button */}
      <button
        onClick={() => setIsExplorerOpen(true)}
        disabled={!selectedCage}
      >
        Combinations (Ctrl+K)
      </button>

      {/* Combinations Explorer */}
      <KillerCombinationsExplorer
        session={session}
        selectedCage={selectedCage}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
      />
    </div>
  );
}
```

### 9.3 Backwards Compatibility

**No Breaking Changes:**
- ✅ All new exports are additive
- ✅ No modifications to existing interfaces
- ✅ No changes to existing component APIs
- ✅ No new peer dependencies
- ✅ Existing apps continue to work without changes

---

## 10. Risk Assessment and Mitigation

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Large combination sets cause performance issues | Medium | High | Implement virtual scrolling for >50 combinations; memoize computations |
| Session storage quota exceeded | Low | Medium | Implement cleanup strategy; warn users at 80% quota |
| Keyboard shortcut conflicts | Low | Low | Use Ctrl/Cmd+K (common pattern); make configurable |
| Responsive layout edge cases | Medium | Medium | Test thoroughly at breakpoint boundaries; use existing `useResponsiveLayout` |
| Dark mode inconsistencies | Low | Low | Use established Tailwind dark: classes; test in both modes |

### 10.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users confused by elimination feature | Medium | Medium | Add onboarding tooltip; clear visual feedback |
| Modal covers important puzzle area on mobile | Low | Medium | Use bottom sheet pattern; translucent backdrop |
| Too many combinations overwhelm users | High | Medium | Group by constraints; add search/filter (future) |

### 10.3 Dependencies and Constraints

**Dependencies:**
- ✅ `@fgv/ts-sudoku-lib` (KillerCombinations class) - stable, tested
- ✅ `@fgv/ts-utils` (Result pattern) - stable, tested
- ✅ React ≥18 - peer dependency, already used

**Constraints:**
- ✅ Must work with existing puzzle session state (read-only)
- ✅ Must support both desktop and mobile layouts
- ✅ Must maintain 100% test coverage
- ✅ Must follow existing Tailwind patterns

---

## 11. Success Criteria

### 11.1 Functional Requirements

- ✅ Display all valid combinations for selected killer cage
- ✅ Allow manual toggle of combinations (eliminated/possible)
- ✅ Switch between panel (desktop) and modal (mobile) at 1024px
- ✅ Activate via toolbar button or Ctrl/Cmd+K shortcut
- ✅ Persist elimination state in session storage
- ✅ Update combinations when cage values change

### 11.2 Non-Functional Requirements

- ✅ **Performance:** Render <50ms for up to 100 combinations
- ✅ **Accessibility:** WCAG 2.1 Level AA compliance
- ✅ **Responsive:** Works 320px-3840px viewports
- ✅ **Test Coverage:** 100% across all metrics
- ✅ **Bundle Size:** <20KB gzipped for new code
- ✅ **Browser Support:** Modern browsers (ES2020+)

### 11.3 Quality Gates

1. ✅ All unit tests pass with 100% coverage
2. ✅ All integration tests pass
3. ✅ Accessibility audit passes (axe-core)
4. ✅ Visual regression tests pass
5. ✅ Performance benchmarks met
6. ✅ Code review approved
7. ✅ Documentation complete

---

## 12. Future Enhancements

### 12.1 Phase 2 Features (Post-MVP)

1. **Combination Filtering**
   - Filter by specific numbers
   - Filter by number count
   - Search combinations

2. **Smart Suggestions**
   - Highlight unique combinations
   - Show cell possibilities
   - Suggest next eliminations

3. **Persistence Options**
   - Save eliminations to puzzle file
   - Share elimination state
   - Undo/redo for eliminations

4. **Advanced UI**
   - Drag-to-eliminate multiple
   - Combination grouping
   - Statistics panel

### 12.2 Technical Debt Prevention

- ✅ Follow Result pattern consistently (no exceptions)
- ✅ Use proper TypeScript types (no `any`)
- ✅ Maintain test coverage at 100%
- ✅ Document all public APIs
- ✅ Review and refactor before adding features

---

## 13. Appendix

### 13.1 File Checklist

**New Files to Create:**
- [ ] `/libraries/ts-sudoku-ui/src/components/KillerCombinationsExplorer.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/components/KillerCombinationsPanel.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/components/KillerCombinationsModal.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/components/CombinationCard.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/components/CombinationGrid.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/hooks/useKillerCombinations.ts`
- [ ] `/libraries/ts-sudoku-ui/src/hooks/useCombinationElimination.ts`
- [ ] `/libraries/ts-sudoku-ui/src/hooks/useKeyboardShortcut.ts`

**Files to Modify:**
- [ ] `/libraries/ts-sudoku-ui/src/index.ts` (add exports)
- [ ] `/libraries/ts-sudoku-ui/src/types/index.ts` (add interfaces)

**Test Files to Create:**
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/components/KillerCombinationsExplorer.test.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/components/KillerCombinationsPanel.test.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/components/KillerCombinationsModal.test.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/components/CombinationCard.test.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/components/CombinationGrid.test.tsx`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/hooks/useKillerCombinations.test.ts`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/hooks/useCombinationElimination.test.ts`
- [ ] `/libraries/ts-sudoku-ui/src/test/unit/hooks/useKeyboardShortcut.test.ts`

### 13.2 Key Design Decisions

1. **Panel vs Modal at 1024px** - Aligns with existing tablet breakpoint
2. **Session Storage for persistence** - Simple, session-scoped, no backend needed
3. **Read-only puzzle integration** - Minimizes coupling, prevents circular dependencies
4. **Tailwind CSS** - Consistent with existing components
5. **No new dependencies** - Leverages existing monorepo packages
6. **Lazy loading support** - Optimizes bundle size for app
7. **Result pattern throughout** - Maintains codebase consistency

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-07
- **Author:** Claude Code (Senior Developer Agent)
- **Status:** Ready for Implementation Review
