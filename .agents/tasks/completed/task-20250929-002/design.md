# Technical Design: Logging System Migration

## Task ID
task-20250929-002

## Design Overview

This design specifies the migration from legacy custom logging interfaces to the standardized ILogReporter pattern from @fgv/ts-utils. The migration is split into two phases: library migration (ts-sudoku-lib) and UI context implementation (ts-sudoku-ui). This is a **clean migration with NO backward compatibility** - existing code will be updated directly to use the new interfaces.

### Key Design Principles
1. **Direct Migration**: No compatibility wrappers or shims
2. **Proven Pattern**: Model UI on ts-res-ui-components ObservabilityContext
3. **Minimal Scope**: Only 2 files use logging in lib, 2 in UI
4. **Optional Logging**: Maintain optional logger pattern with NoOpLogger defaults
5. **Result Integration**: Enable `.report(reporter)` pattern for automatic logging

---

## Phase 1: Library Migration (ts-sudoku-lib)

### 1.1 Architecture Changes

#### Current State
```typescript
// libraries/ts-sudoku-lib/src/packlets/common/logging.ts
export interface ISudokuLoggingContext {
  readonly logger?: Logging.ILogger;
}

export const DefaultSudokuLoggingContext: ISudokuLoggingContext = {
  logger: undefined
};

export function logIfAvailable(
  context: ISudokuLoggingContext | undefined,
  level: 'detail' | 'info' | 'warn' | 'error',
  message?: unknown,
  ...parameters: unknown[]
): void;
```

#### Target State
```typescript
// libraries/ts-sudoku-lib/src/packlets/common/logging.ts
import { Logging } from '@fgv/ts-utils';

/**
 * Default no-op logger for use when diagnostic logging is not needed.
 * @public
 */
export const DefaultSudokuLogger: Logging.ILogReporter = new Logging.LogReporter({
  logger: new Logging.NoOpLogger()
});
```

### 1.2 API Changes

#### Breaking Changes
| Old API | New API | Impact |
|---------|---------|--------|
| `ISudokuLoggingContext` | `Logging.ILogReporter` | Direct type replacement |
| `DefaultSudokuLoggingContext` | `DefaultSudokuLogger` | Constant replacement |
| `logIfAvailable(context, level, msg)` | `logger.log(level, msg)` | Direct method calls |

#### Migration Pattern
```typescript
// OLD: Using logIfAvailable
logIfAvailable(context, 'info', `Generated ${count} hints`);

// NEW: Direct logger usage
logger.info(`Generated ${count} hints`);

// OLD: Optional context check
if (context?.logger) {
  context.logger.info(message);
}

// NEW: Always safe - NoOpLogger handles suppression
logger.info(message);
```

### 1.3 File Modifications

#### File: `libraries/ts-sudoku-lib/src/packlets/common/logging.ts`
**Action**: Complete rewrite

**Content**:
```typescript
/*
 * MIT License [license header...]
 */

import { Logging } from '@fgv/ts-utils';

/**
 * Default no-op logger for use when diagnostic logging is not needed.
 * @public
 */
export const DefaultSudokuLogger: Logging.ILogReporter = new Logging.LogReporter({
  logger: new Logging.NoOpLogger()
});
```

**Rationale**:
- Complete replacement is cleaner than incremental updates
- File is only 80 lines, all of which become obsolete
- New implementation is 20 lines vs 80 lines (simpler)

#### File: `libraries/ts-sudoku-lib/src/packlets/common/index.ts`
**Action**: Update exports

**Changes**:
```typescript
// Remove old exports
- export * from './logging';

// Add new export (no type alias needed - use Logging.ILogReporter directly)
+ export { DefaultSudokuLogger } from './logging';
```

#### File: `libraries/ts-sudoku-lib/src/packlets/hints/interfaces.ts`
**Action**: Update interface signatures

**Changes**:
```typescript
// Line 26: Update import (remove ISudokuLoggingContext, add Logging import)
- import { Puzzle, PuzzleState, ISudokuLoggingContext } from '../common';
+ import { Puzzle, PuzzleState } from '../common';
+ import { Logging } from '@fgv/ts-utils';

// Line 165: Update parameter type
  validateHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
-   loggingContext?: ISudokuLoggingContext
+   logger?: Logging.ILogReporter
  ): Result<void>;

// Line 180: Update parameter type
  applyHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
-   loggingContext?: ISudokuLoggingContext
+   logger?: Logging.ILogReporter
  ): Result<readonly import('../common').ICellState[]>;
```

#### File: `libraries/ts-sudoku-lib/src/packlets/hints/hints.ts`
**Action**: Update implementation

**Changes**:
```typescript
// Line 26: Update imports
- import { ICellState, Puzzle, PuzzleState, ISudokuLoggingContext, logIfAvailable } from '../common';
+ import { ICellState, Puzzle, PuzzleState, DefaultSudokuLogger } from '../common';
+ import { Logging } from '@fgv/ts-utils';

// Line 42: Update config interface
export interface IHintsEngineConfig {
  readonly enableNakedSingles?: boolean;
  readonly enableHiddenSingles?: boolean;
  readonly defaultExplanationLevel?: ExplanationLevel;
- readonly loggingContext?: ISudokuLoggingContext;
+ readonly logger?: Logging.ILogReporter;
}

// Line 62: Update method signature
  validateHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
-   loggingContext?: ISudokuLoggingContext
+   logger?: Logging.ILogReporter
  ): Result<void> {
    // Implementation unchanged - no logging in this method
  }

// Line 108: Update method signature and logging calls
  applyHint(
    hint: IHint,
    puzzle: Puzzle,
    state: PuzzleState,
-   loggingContext?: ISudokuLoggingContext
+   logger?: Logging.ILogReporter
  ): Result<readonly ICellState[]> {
+   const log = logger ?? DefaultSudokuLogger;

-   logIfAvailable(
-     loggingContext,
-     'detail',
-     `Applying hint: ${hint.techniqueName} affecting ${hint.cellActions.length} cell(s)`
-   );
+   log.detail(`Applying hint: ${hint.techniqueName} affecting ${hint.cellActions.length} cell(s)`);

    // ... implementation ...

-   logIfAvailable(
-     loggingContext,
-     'info',
-     `Successfully applied hint: ${hint.techniqueName}, updated ${updates.length} cell(s)`
-   );
+   log.info(`Successfully applied hint: ${hint.techniqueName}, updated ${updates.length} cell(s)`);
  }

// Line 251: Update logging calls in generateAllHints
  generateAllHints(
    puzzle: Puzzle,
    state: PuzzleState,
    options?: IHintGenerationOptions
  ): Result<readonly IHint[]> {
+   const log = this._config.logger ?? DefaultSudokuLogger;

-   logIfAvailable(this._config.loggingContext, 'detail', 'Generating hints for puzzle state');
+   log.detail('Generating hints for puzzle state');

    return this._registry
      .generateAllHints(puzzle, state, options)
+     .report(log, {
+       success: {
+         level: 'info',
+         message: (hints) => `Generated ${hints.length} hint(s) using ${
+           new Set(hints.map((h) => h.techniqueId)).size
+         } technique(s)`
+       },
+       failure: {
+         level: 'warn',
+         message: (msg) => `Failed to generate hints: ${msg}`
+       }
+     });
  }
```

### 1.4 Testing Strategy

#### Test Updates Required
1. **Unit Tests**: Any tests that create `ISudokuLoggingContext` need updates
2. **Spy Tests**: Tests that spy on logging need to use `InMemoryLogger`

**Example Test Migration**:
```typescript
// OLD: Creating test context
const testContext: ISudokuLoggingContext = {
  logger: new Logging.InMemoryLogger('detail')
};
engine = HintsEngine.create({ loggingContext: testContext }).orThrow();

// NEW: Using ILogReporter directly
const testLogger: Logging.ILogReporter = new Logging.LogReporter({
  logger: new Logging.InMemoryLogger('detail')
});
engine = HintsEngine.create({ logger: testLogger }).orThrow();

// Access logged messages
expect(testLogger['_logger'].logged).toContain('Generated 5 hint(s)');
```

#### Coverage Targets
- Maintain 100% coverage
- All logging paths must be tested
- Both optional logger (undefined) and provided logger paths

---

## Phase 2: UI Diagnostic Logger Context (ts-sudoku-ui)

### 2.1 Architecture Overview

#### Simplified Approach
Since ts-sudoku-ui only needs diagnostic logging for development/debugging:
- **Direct ILogReporter** - no wrapper needed
- **Single logger** - diagnostic logging only
- **React Context** - for dependency injection throughout component tree
- **Simple hook** - `useDiagnosticLogger()` for component access

#### Why Not Full ObservabilityContext?
- No current need for user-facing messages (YAGNI principle)
- Simpler is better for diagnostic-only use case
- Easy to upgrade later if user messages are needed
- Clear intent: "this is for diagnostics"

#### Centralized Logger Management
**Critical Design Principle: Single Logger Instance**

The entire application should use a **single logger instance** provided at the root level:

```typescript
// ✅ GOOD: Single logger configured at app root
function App() {
  const logger = useMemo(() => new Logging.LogReporter({
    logger: new Logging.ConsoleLogger('info')
  }), []);

  return (
    <DiagnosticLoggerProvider logger={logger}>
      <SudokuApp />
    </DiagnosticLoggerProvider>
  );
}
```

**Benefits:**
- **Single point of configuration**: Change logger once, affects entire app
- **Easy to enhance**: Want to save logs? Update one place
- **Easy to display**: Want a diagnostics panel? Single logger to tap into
- **Consistent behavior**: All components use same logging configuration

**Anti-pattern to Avoid:**
```typescript
// ❌ BAD: Creating loggers in multiple components
function ComponentA() {
  const logger = new Logging.LogReporter({ logger: new Logging.ConsoleLogger('info') });
  // ...
}

function ComponentB() {
  const logger = new Logging.LogReporter({ logger: new Logging.ConsoleLogger('info') });
  // ...
}
// Now if you want to change logging behavior, you have to update N components!
```

**Implementation Pattern:**
- Provide logger at app root via `DiagnosticLoggerProvider`
- All components use `useDiagnosticLogger()` hook
- Logger flows through context to entire component tree
- To change logging behavior: update ONE place at app root

### 2.2 React Context Design

No separate interfaces or implementations needed - just use ILogReporter directly.

### 2.3 React Context Implementation

#### File: `libraries/ts-sudoku-ui/src/contexts/DiagnosticLoggerContext.tsx` (NEW)
```typescript
/*
 * MIT License [license header...]
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Logging } from '@fgv/ts-utils';

/**
 * Default diagnostic logger (no-op for production).
 * @public
 */
export const DefaultDiagnosticLogger: Logging.ILogReporter = new Logging.LogReporter({
  logger: new Logging.NoOpLogger()
});

/**
 * React context for diagnostic logging.
 * Provides access to diagnostic logger throughout the component tree.
 * @public
 */
export const DiagnosticLoggerContext: React.Context<Logging.ILogReporter> =
  createContext<Logging.ILogReporter>(DefaultDiagnosticLogger);

/**
 * Props for the DiagnosticLoggerProvider component.
 * @public
 */
export interface IDiagnosticLoggerProviderProps {
  /** Child components that will have access to the diagnostic logger */
  children: ReactNode;
  /** Optional logger to provide (defaults to no-op logger) */
  logger?: Logging.ILogReporter;
}

/**
 * Provider component that makes diagnostic logger available to all child components.
 *
 * @example
 * ```tsx
 * // Basic usage with default no-op logger
 * <DiagnosticLoggerProvider>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 *
 * // Console logging for development
 * const consoleLogger = new Logging.LogReporter({
 *   logger: new Logging.ConsoleLogger('info')
 * });
 * <DiagnosticLoggerProvider logger={consoleLogger}>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 *
 * // In-memory logger for tests
 * const testLogger = new Logging.LogReporter({
 *   logger: new Logging.InMemoryLogger('detail')
 * });
 * <DiagnosticLoggerProvider logger={testLogger}>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 * ```
 *
 * @param props - Provider configuration
 * @returns JSX provider element
 * @public
 */
export const DiagnosticLoggerProvider: React.FC<IDiagnosticLoggerProviderProps> = ({
  children,
  logger = DefaultDiagnosticLogger
}) => <DiagnosticLoggerContext.Provider value={logger}>{children}</DiagnosticLoggerContext.Provider>;

/**
 * Hook to access the current diagnostic logger.
 *
 * Provides access to diagnostic logging for development and debugging.
 *
 * @example
 * ```tsx
 * function CageOverlay({ cages }: ICageOverlayProps) {
 *   const log = useDiagnosticLogger();
 *
 *   useEffect(() => {
 *     log.info('CageOverlay rendered', {
 *       cageCount: cages.length,
 *       cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
 *     });
 *   }, [cages, log]);
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @returns The current diagnostic logger
 * @public
 */
export const useDiagnosticLogger = (): Logging.ILogReporter => {
  return useContext(DiagnosticLoggerContext);
};
```

#### File: `libraries/ts-sudoku-ui/src/contexts/index.ts` (UPDATE)
```typescript
// Add new exports
export {
  DiagnosticLoggerContext,
  DiagnosticLoggerProvider,
  useDiagnosticLogger,
  DefaultDiagnosticLogger
} from './DiagnosticLoggerContext';
export type { IDiagnosticLoggerProviderProps } from './DiagnosticLoggerContext';
```

### 2.5 Component Migrations

#### File: `libraries/ts-sudoku-ui/src/utils/CageLookupManager.ts`
**Current Logging** (Line 165):
```typescript
console.log(
  `Generated ${this._segmentPatterns.length} unique segment patterns from 256 neighbor combinations`
);
```

**Migration Strategy**:
This is a **singleton constructor** logging - difficult to inject context. Two options:

**Option A: Remove the log** (RECOMMENDED)
- This is initialization logging that happens once
- Not critical for debugging
- Simplifies the singleton pattern

**Option B: Static logger**
```typescript
import { DefaultSudokuLogger } from '@fgv/ts-sudoku-lib';

// In _generateLookupTables():
DefaultSudokuLogger.info(
  `Generated ${this._segmentPatterns.length} unique segment patterns from 256 neighbor combinations`
);
```

**Decision**: Use Option A (remove) - initialization logging in singletons is not worth the complexity.

#### File: `libraries/ts-sudoku-ui/src/components/CageOverlay.tsx`
**Current Logging** (Lines 93-98):
```typescript
console.log('CageOverlay rendered with:', {
  cageCount: cages.length,
  gridSize,
  cellSize,
  cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
});

// Line 53:
console.warn(`Invalid CellId format: ${cellId}`);
```

**Migration**:
```typescript
// Add imports
import { useDiagnosticLogger } from '../contexts/DiagnosticLoggerContext';

// In component body (line 91, after props destructuring):
const log = useDiagnosticLogger();

// Replace console.log (lines 93-98):
React.useEffect(() => {
  log.info('CageOverlay rendered', {
    cageCount: cages.length,
    gridSize,
    cellSize,
    cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
  });
}, [cages, gridSize, cellSize, log]);

// Replace console.warn (line 53 in getCellPosition helper):
// Option 1: Accept logger parameter
function getCellPosition(cellId: CellId, logger: Logging.ILogReporter): { row: number; col: number } {
  // ... validation ...

  // Fallback - should not happen with valid CellIds
  logger.warn(`Invalid CellId format: ${cellId}`);
  return { row: 0, col: 0 };
}

// Then use in component:
const { row, col } = getCellPosition(cellId, log);

// Option 2: Remove helper function entirely and inline
// (only 4 lines of logic, called in 2 places)
```

**Decision**: Use Option 2 (inline) - helper function is small and only called twice.

**Full Component Migration**:
```typescript
// Line 25: Add import
import { useDiagnosticLogger } from '../contexts/DiagnosticLoggerContext';

// Line 35-55: Inline getCellPosition logic, remove console.warn
// Just remove the helper and inline the logic where needed

// Line 91: Add hook
export const CageOverlay: React.FC<ICageOverlayProps> = ({ cages, gridSize, cellSize, className }) => {
  const log = useDiagnosticLogger();

  // Lines 93-98: Replace console.log with useEffect
  React.useEffect(() => {
    log.info('CageOverlay rendered', {
      cageCount: cages.length,
      gridSize,
      cellSize,
      cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
    });
  }, [cages, gridSize, cellSize, log]);

  // Rest of component unchanged
```

### 2.4 Export Organization

#### File: `libraries/ts-sudoku-ui/src/index.ts` (UPDATE)
```typescript
// Add new exports
export * from './contexts/DiagnosticLoggerContext';
```

---

## Phase 3: Integration & Testing

### 3.1 Integration Points

#### Library → UI Integration
```typescript
// UI component using library with logging
import { HintsEngine } from '@fgv/ts-sudoku-lib';
import { useDiagnosticLogger } from '@fgv/ts-sudoku-ui';

function HintPanel() {
  const log = useDiagnosticLogger();

  // Pass diagnostic logger to library
  const engine = React.useMemo(() => {
    return HintsEngine.create({
      logger: log,
      enableNakedSingles: true
    }).orThrow();
  }, [log]);

  // Library now logs through diagnostic logger
}
```

#### Result Pattern Integration
```typescript
// Basic automatic logging with .report()
const result = hintsEngine
  .generateAllHints(puzzle, state)
  .report(log); // Logs failure at 'error', success suppressed by default

// Custom log levels
hintsEngine
  .generateAllHints(puzzle, state)
  .report(log, {
    success: 'info',  // Log success at info level
    failure: 'warn'   // Log failure at warn level
  });

// Custom message formatting
hintsEngine
  .generateAllHints(puzzle, state)
  .report(log, {
    success: {
      level: 'info',
      message: (hints) => `Generated ${hints.length} hints`
    },
    failure: {
      level: 'warn',
      message: (msg) => `Hint generation failed: ${msg}`
    }
  });

// Manual logging for complex cases
log.info('User requested hint generation');
result.onSuccess((hints) => {
  log.info(`Generated ${hints.length} hints`);
});
```

#### Logger Initialization Pattern
**Prefer initialization-time logger injection over per-method parameters:**

```typescript
// ✅ GOOD: Logger provided at initialization
class MyProcessor {
  constructor(
    private readonly data: Data,
    private readonly logger?: Logging.ILogReporter
  ) {
    this.logger = logger ?? DefaultSudokuLogger;
  }

  public process(): Result<Output> {
    this.logger.info('Starting processing');
    return this._doProcess()
      .report(this.logger, { success: 'info', failure: 'error' });
  }
}

// ❌ AVOID: Logger passed on every method call
class MyProcessor {
  public process(data: Data, logger?: Logging.ILogReporter): Result<Output> {
    const log = logger ?? DefaultSudokuLogger;
    log.info('Starting processing');
    // ...
  }
}

// Exception: When logger is truly method-specific
interface IHintEngine {
  // OK: Different callers may want different logging per operation
  applyHint(hint: IHint, puzzle: Puzzle, state: PuzzleState, logger?: Logging.ILogReporter): Result<void>;
}
```

### 3.2 Testing Strategy

#### Library Tests
1. **Existing Tests**: Update all tests using `ISudokuLoggingContext`
2. **Logger Tests**: Test with `InMemoryLogger` to verify logging
3. **No-Op Tests**: Test with `NoOpLogger` to verify optional behavior

```typescript
// Test with logging enabled
describe('HintsEngine with logging', () => {
  let logger: Logging.ILogReporter;
  let memoryLogger: Logging.InMemoryLogger;

  beforeEach(() => {
    memoryLogger = new Logging.InMemoryLogger('detail');
    logger = new Logging.LogReporter({ logger: memoryLogger });
  });

  test('logs hint generation', () => {
    const engine = HintsEngine.create({ logger }).orThrow();
    engine.generateAllHints(puzzle, state);

    expect(memoryLogger.logged).toContain('Generating hints for puzzle state');
  });
});

// Test without logging
describe('HintsEngine without logging', () => {
  test('works with default no-op logger', () => {
    const engine = HintsEngine.create({}).orThrow();
    expect(engine.generateAllHints(puzzle, state)).toSucceed();
  });
});
```

#### UI Tests
1. **Provider Tests**: Verify context propagation
2. **Hook Tests**: Verify `useDiagnosticLogger` returns correct logger
3. **Component Tests**: Verify components log correctly

```typescript
// Test provider
describe('DiagnosticLoggerProvider', () => {
  test('provides default no-op logger', () => {
    let receivedLogger: Logging.ILogReporter | undefined;

    function TestComponent() {
      receivedLogger = useDiagnosticLogger();
      return null;
    }

    render(
      <DiagnosticLoggerProvider>
        <TestComponent />
      </DiagnosticLoggerProvider>
    );

    expect(receivedLogger).toBeDefined();
    expect(receivedLogger).toBe(DefaultDiagnosticLogger);
  });

  test('provides custom logger', () => {
    const customLogger = new Logging.LogReporter({
      logger: new Logging.ConsoleLogger('info')
    });
    let receivedLogger: Logging.ILogReporter | undefined;

    function TestComponent() {
      receivedLogger = useDiagnosticLogger();
      return null;
    }

    render(
      <DiagnosticLoggerProvider logger={customLogger}>
        <TestComponent />
      </DiagnosticLoggerProvider>
    );

    expect(receivedLogger).toBe(customLogger);
  });
});

// Test component integration
describe('CageOverlay', () => {
  test('logs render information', () => {
    const memoryLogger = new Logging.InMemoryLogger('detail');
    const testLogger = new Logging.LogReporter({ logger: memoryLogger });

    render(
      <DiagnosticLoggerProvider logger={testLogger}>
        <CageOverlay cages={testCages} gridSize={testGridSize} cellSize={50} />
      </DiagnosticLoggerProvider>
    );

    expect(memoryLogger.logged.some(msg => msg.includes('CageOverlay rendered'))).toBe(true);
  });

  test('works with no-op logger', () => {
    render(
      <DiagnosticLoggerProvider>
        <CageOverlay cages={testCages} gridSize={testGridSize} cellSize={50} />
      </DiagnosticLoggerProvider>
    );

    // Should render without errors
    expect(screen.getByTestId('cage-overlay')).toBeInTheDocument();
  });
});
```

### 3.3 Coverage Targets
- Maintain 100% coverage requirement
- All logging paths tested
- Both provided and default logger scenarios
- React context propagation tested

---

## Phase 4: Migration Sequencing

### Sequence Overview
```
Phase 1: Library (ts-sudoku-lib)
  ├─ Step 1.1: Update logging.ts
  ├─ Step 1.2: Update common/index.ts exports
  ├─ Step 1.3: Update hints/interfaces.ts
  ├─ Step 1.4: Update hints/hints.ts
  ├─ Step 1.5: Update library tests
  └─ Step 1.6: Verify 100% coverage

Phase 2: UI Context (ts-sudoku-ui)
  ├─ Step 2.1: Create contexts/DiagnosticLoggerContext.tsx
  ├─ Step 2.2: Update contexts/index.ts exports
  └─ Step 2.3: Update src/index.ts exports

Phase 3: Component Migration (ts-sudoku-ui)
  ├─ Step 3.1: Update CageLookupManager.ts (remove console.log)
  ├─ Step 3.2: Update CageOverlay.tsx
  ├─ Step 3.3: Update component tests
  └─ Step 3.4: Verify 100% coverage

Phase 4: Integration Validation
  ├─ Step 4.1: Test library + UI integration
  ├─ Step 4.2: Test Result.report() pattern
  ├─ Step 4.3: User verification
  └─ Step 4.4: Final review
```

### Detailed Steps

#### Phase 1: Library Migration

**Step 1.1: Update logging.ts**
- File: `libraries/ts-sudoku-lib/src/packlets/common/logging.ts`
- Action: Complete rewrite (see section 1.3)
- Dependencies: None
- Verification: File compiles

**Step 1.2: Update common exports**
- File: `libraries/ts-sudoku-lib/src/packlets/common/index.ts`
- Action: Update exports (see section 1.3)
- Dependencies: Step 1.1
- Verification: Public API exports correctly

**Step 1.3: Update interfaces**
- File: `libraries/ts-sudoku-lib/src/packlets/hints/interfaces.ts`
- Action: Update parameter types (see section 1.3)
- Dependencies: Steps 1.1, 1.2
- Verification: File compiles

**Step 1.4: Update implementation**
- File: `libraries/ts-sudoku-lib/src/packlets/hints/hints.ts`
- Action: Update logging calls (see section 1.3)
- Dependencies: Steps 1.1-1.3
- Verification: File compiles, no lint errors

**Step 1.5: Update tests**
- Files: All test files in `libraries/ts-sudoku-lib/src/test/`
- Action: Update test contexts and spies (see section 1.4)
- Dependencies: Steps 1.1-1.4
- Verification: All tests pass

**Step 1.6: Verify coverage**
- Command: `cd libraries/ts-sudoku-lib && rushx coverage`
- Target: 100% coverage maintained
- Dependencies: Steps 1.1-1.5
- Verification: Coverage report shows 100%

#### Phase 2: UI Context Implementation

**Step 2.1: Create React context**
- File: `libraries/ts-sudoku-ui/src/contexts/DiagnosticLoggerContext.tsx`
- Action: Create context, provider, and hook (see section 2.3)
- Dependencies: None
- Verification: File compiles

**Step 2.2-2.3: Update exports**
- Files: `contexts/index.ts`, `src/index.ts`
- Action: Add new exports (see section 2.4)
- Dependencies: Step 2.1
- Verification: Public API exports correctly

#### Phase 3: Component Migration

**Step 3.1: Update CageLookupManager**
- File: `libraries/ts-sudoku-ui/src/utils/CageLookupManager.ts`
- Action: Remove console.log (see section 2.5)
- Dependencies: None
- Verification: File compiles, tests pass

**Step 3.2: Update CageOverlay**
- File: `libraries/ts-sudoku-ui/src/components/CageOverlay.tsx`
- Action: Add useObservability, replace console logging (see section 2.5)
- Dependencies: Phase 2 complete
- Verification: File compiles, renders correctly

**Step 3.3: Update tests**
- Files: Test files for affected components
- Action: Add provider wrappers, test logging (see section 3.2)
- Dependencies: Steps 3.1-3.2
- Verification: All tests pass

**Step 3.4: Verify coverage**
- Command: `cd libraries/ts-sudoku-ui && rushx coverage`
- Target: 100% coverage maintained
- Dependencies: Steps 3.1-3.3
- Verification: Coverage report shows 100%

#### Phase 4: Integration Validation

**Step 4.1: Integration testing**
- Action: Test library logger passed from UI context
- Dependencies: All previous phases
- Verification: Logging flows through correctly

**Step 4.2: Result pattern testing**
- Action: Test `.report(reporter)` integration
- Dependencies: All previous phases
- Verification: Results log automatically

**Step 4.3: User verification**
- Action: User reviews logging behavior in running app
- Dependencies: All previous phases
- Verification: User approves behavior

**Step 4.4: Final review**
- Action: Review all code changes, documentation
- Dependencies: All previous phases
- Verification: All exit criteria met

---

## Risk Assessment & Mitigation

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes affect downstream consumers | HIGH | HIGH | Minimal library usage, communicate breaking changes |
| Missing logging calls during migration | MEDIUM | LOW | Grep for console.log/warn, test coverage verification |
| Test failures due to context misuse | MEDIUM | MEDIUM | Comprehensive test examples, follow ts-res-ui pattern |
| Coverage gaps after migration | LOW | HIGH | Systematic testing, verify 100% before completion |

### Detailed Risks & Mitigations

#### R1: Breaking API Changes (HIGH/HIGH)
**Risk**: `ISudokuLoggingContext` is public API, consumers will break

**Mitigation**:
1. Limited scope: Only hints package uses logging
2. Clear migration guide in PR description
3. Version bump to indicate breaking change
4. Check for external consumers before merge

**Escalation**: If external consumers exist, coordinate migration

#### R2: Incomplete Console.log Removal (MEDIUM/LOW)
**Risk**: Missing some console.log calls during migration

**Mitigation**:
1. Grep for all console.log/warn/error in UI
2. Review git diff for all console references
3. ESLint rule to prevent future console usage (optional)

**Detection**:
```bash
# Search for console usage
grep -r "console\." libraries/ts-sudoku-ui/src/
```

#### R3: React Context Propagation Issues (MEDIUM/MEDIUM)
**Risk**: Components don't receive observability context correctly

**Mitigation**:
1. Follow proven ts-res-ui-components pattern exactly
2. Test context propagation explicitly
3. Test with both default and custom contexts
4. Document provider usage clearly

**Validation**: Integration tests with nested components

#### R4: Test Coverage Gaps (LOW/HIGH)
**Risk**: Migration reduces test coverage below 100%

**Mitigation**:
1. Run coverage after each phase
2. Test both optional and provided logger paths
3. Test logging suppression with NoOpLogger
4. Use InMemoryLogger to verify log content

**Validation**: `rushx coverage` shows 100% before completion

---

## Exit Criteria Checklist

### Phase 1: Library Migration
- [ ] `ISudokuLoggingContext` completely removed
- [ ] All files use `Logging.ILogReporter` directly (no type alias)
- [ ] `logIfAvailable` helper removed
- [ ] All tests updated and passing
- [ ] 100% test coverage maintained
- [ ] No lint violations
- [ ] Public API exports updated

### Phase 2: UI Context Implementation
- [ ] `DiagnosticLoggerContext` React context created
- [ ] `DiagnosticLoggerProvider` component created
- [ ] `useDiagnosticLogger` hook created
- [ ] `DefaultDiagnosticLogger` constant exported
- [ ] All exports added to index files
- [ ] Files compile with no errors

### Phase 3: Component Migration
- [ ] `CageLookupManager` console.log removed
- [ ] `CageOverlay` using diagnostic logger
- [ ] All helper functions updated or removed
- [ ] Component tests updated
- [ ] 100% test coverage maintained
- [ ] Components render correctly with context

### Phase 4: Integration & Validation
- [ ] Library logger integrates with UI context
- [ ] Result.report() pattern working
- [ ] All tests passing across both packages
- [ ] User verification complete
- [ ] Documentation updated
- [ ] Code review approved

---

## Documentation Requirements

### 1. Migration Guide
Create migration guide for consumers:
```markdown
# Migration Guide: Logging System

## Breaking Changes

### ts-sudoku-lib
- `ISudokuLoggingContext` → `Logging.ILogReporter` (use directly from @fgv/ts-utils)
- `DefaultSudokuLoggingContext` → `DefaultSudokuLogger`
- `logIfAvailable()` → Direct logger methods

### Migration Example
```typescript
// OLD
const context: ISudokuLoggingContext = {
  logger: new Logging.ConsoleLogger('info')
};
const engine = HintsEngine.create({ loggingContext: context });

// NEW
const logger: Logging.ILogReporter = new Logging.LogReporter({
  logger: new Logging.ConsoleLogger('info')
});
const engine = HintsEngine.create({ logger });
```

### ts-sudoku-ui
- New observability context available
- Wrap components in `ObservabilityProvider`
- Use `useObservability()` hook in components
```

### 2. API Documentation
Update TSDoc comments:
- `DefaultSudokuLogger` constant
- All observability interfaces
- React context and hooks

### 3. README Updates
Update library README files:
- Document new logging approach
- Provide usage examples
- Link to migration guide

---

## Implementation Notes

### Simplification Decisions

1. **Direct ILogReporter Instead of ObservabilityContext**:
   - YAGNI: No current need for user-facing messages
   - Simpler: Direct logger via React Context
   - Clear intent: "this is for diagnostics"
   - Easy upgrade path: Can add user logger later if needed
   - Fewer files: 1 file vs 5 files

2. **Single Logger Instance for Entire App**:
   - Configure logger once at app root
   - All components access via `useDiagnosticLogger()` hook
   - Single point of configuration for entire app
   - Benefits:
     - Add diagnostics panel: tap into single logger
     - Save to file: update one place
     - Change log level: affects entire app instantly
   - Avoid creating loggers in individual components

3. **Singleton Logging Removal**: Remove CageLookupManager log
   - Initialization logging not worth complexity
   - Singleton pattern makes context injection awkward
   - One-time message provides minimal value

4. **Helper Function Inlining**: Inline getCellPosition
   - Only 4 lines of logic
   - Called in 2 places
   - Removes need for logger parameter passing

5. **Logger Initialization Pattern**:
   - Prefer passing logger at object construction
   - Avoid passing logger on every method call
   - Store logger as instance field for reuse
   - Exception: When different callers need different logging per operation

### Performance Considerations

1. **NoOpLogger Efficiency**:
   - Zero overhead when logging disabled
   - No string formatting for suppressed logs
   - Safe to call in hot paths

2. **React Hook Dependencies**:
   - `useDiagnosticLogger()` should be included in dependencies
   - Logger reference is stable
   - No unnecessary re-renders

3. **Memory Logger for Tests**:
   - `InMemoryLogger` stores all messages
   - Clear between tests to avoid memory growth
   - Use `TestObservabilityContext` for silent tests

### TypeScript Considerations

1. **No Type Alias**:
   - Use `Logging.ILogReporter` directly from @fgv/ts-utils
   - No need for custom type alias
   - Simpler and more explicit

2. **Generic Type Parameter**:
   - `ILogReporter` interface (no generic needed in usage)
   - Works for all use cases
   - Matches ts-res-ui-components pattern

3. **Optional Parameters**:
   - `logger?: Logging.ILogReporter` maintains optional pattern
   - Default to `DefaultSudokuLogger` in implementation
   - Clear contract in signatures

---

## Testing Checklist

### Library Tests
- [ ] Test with `InMemoryLogger` to verify log content
- [ ] Test with `NoOpLogger` to verify optional behavior
- [ ] Test with `ConsoleLogger` for integration
- [ ] Test logger parameter propagation
- [ ] Test undefined logger (uses default)
- [ ] Verify 100% coverage of logging paths

### UI Tests
- [ ] Test `ObservabilityProvider` with default context
- [ ] Test `ObservabilityProvider` with custom context
- [ ] Test `useObservability` hook returns context
- [ ] Test components log correctly
- [ ] Test components work with no-op logger
- [ ] Test context propagation through component tree
- [ ] Verify 100% coverage of new code

### Integration Tests
- [ ] Test library logger from UI context
- [ ] Test Result.report() with logger
- [ ] Test logging from nested components
- [ ] Test with different log levels
- [ ] Test policy behavior (doNotUpgrade)

---

## Completion Criteria

### Technical Criteria
1. All code compiles with no errors
2. All tests pass with 100% coverage
3. No lint violations
4. Public API exports correct
5. Documentation complete

### Functional Criteria
1. Library logging works with LogReporter
2. UI components use observability context
3. Console logs replaced with structured logging
4. Optional logging behavior maintained
5. Result.report() integration working

### Quality Criteria
1. Code follows monorepo patterns
2. Tests are comprehensive
3. Documentation is clear
4. Migration guide provided
5. User verification complete

---

## Appendix: File Manifest

### New Files (ts-sudoku-ui)
```
libraries/ts-sudoku-ui/src/
└── contexts/
    └── DiagnosticLoggerContext.tsx (NEW - ~90 lines)
```

### Modified Files (ts-sudoku-lib)
```
libraries/ts-sudoku-lib/src/
├── packlets/
│   ├── common/
│   │   ├── logging.ts          (REWRITE - 80→20 lines)
│   │   └── index.ts           (MODIFY - exports)
│   └── hints/
│       ├── interfaces.ts       (MODIFY - types)
│       └── hints.ts           (MODIFY - implementation)
└── test/
    └── unit/
        └── hints/
            └── *.test.ts       (MODIFY - test contexts)
```

### Modified Files (ts-sudoku-ui)
```
libraries/ts-sudoku-ui/src/
├── components/
│   └── CageOverlay.tsx         (MODIFY - use context)
├── utils/
│   └── CageLookupManager.ts    (MODIFY - remove log)
├── contexts/
│   └── index.ts               (MODIFY - exports)
├── index.ts                    (MODIFY - exports)
└── test/
    └── *.test.tsx             (MODIFY - add providers)
```

### Total Impact
- **New files**: 1 (~90 lines)
- **Modified files**: ~10 files
- **Lines removed**: ~80 lines (logging.ts rewrite)
- **Lines added**: ~150 lines (context + implementation changes)
- **Net change**: ~+70 lines

---

## Success Metrics

### Quantitative
- 100% test coverage maintained in both packages
- Zero lint violations
- All tests passing (current baseline)
- Build time unchanged (no performance impact)

### Qualitative
- Code clarity improved (simpler logging pattern)
- Maintainability improved (standard pattern across monorepo)
- Developer experience improved (easier to debug with structured logging)
- Integration with Result pattern enabled

### User Acceptance
- User verifies diagnostic logging meets debugging needs
- User confirms no breaking changes to app integration
- User approves final implementation

---

## Reference Documentation

### External References
1. **@fgv/ts-utils Logging**:
   - ILogger interface
   - LogReporter implementation
   - NoOpLogger, ConsoleLogger, InMemoryLogger

2. **ts-res-ui-components Pattern**:
   - IObservabilityContext (reference for structure)
   - ObservabilityProvider pattern
   - useObservability hook pattern

3. **Result Pattern**:
   - `.report(reporter)` method
   - IResultReporter interface
   - MessageLogLevel types

### Internal References
1. **Requirements**: `.agents/tasks/active/task-20250929-002/requirements.md`
2. **Current Lib Logging**: `libraries/ts-sudoku-lib/src/packlets/common/logging.ts`
3. **Current UI Usage**: `libraries/ts-sudoku-ui/src/components/CageOverlay.tsx`
4. **Reference Pattern**: `libraries/ts-res-ui-components/src/utils/observability/`

---

## End of Design Document

This design provides a complete specification for migrating from legacy logging to ILogReporter. The design is broken down into actionable phases with specific file changes, test requirements, and validation criteria. Implementation should follow the phases in order, verifying each phase before proceeding to the next.