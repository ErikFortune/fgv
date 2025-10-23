# Senior Developer Agent Request - API Design Phase

## Context
We are in Phase 2 of implementing the KillerCombinations helper for the ts-sudoku-lib. Requirements have been confirmed and we need to design the API and type definitions.

## Task
Design the API and type definitions for the KillerCombinations helper based on the confirmed requirements.

## Requirements Summary
From the requirements analysis, we need to implement:

1. **getPossibleTotals(cageSize: number): Result<number[]>**
2. **getCombinations(cageSize: number, total: number, constraints?: Constraints): Result<number[][]>**
3. **getCellPossibilities(puzzle: Puzzle, state: PuzzleState, cage: Cage): Result<Map<CellId, number[]>>**

## Key Design Considerations

### Constraints Interface
```typescript
interface Constraints {
  excludedNumbers?: number[];  // Numbers that cannot be present
  requiredNumbers?: number[];  // Numbers that must be present
}
```

### Integration Points
- Must integrate with existing `Cage`, `Puzzle`, `PuzzleState` classes
- Use existing `totalsByCageSize` constant
- Use existing branded types (`CageId`, `CellId`)
- Place in `common` packlet alongside existing puzzle infrastructure

### Technical Requirements
- All functions return `Result<T>` types following existing patterns
- Use existing type system and branded types
- Performance optimized for UI responsiveness (< 100ms)
- Follow existing architectural patterns

## Expected Deliverables
1. Complete class structure and method signatures
2. Type definitions for Constraints and any new supporting types
3. Integration approach with existing classes
4. File placement and module organization
5. API documentation structure

## Existing Codebase Context
- Location: `/Users/erik/Development/cursor/fgv-sudoku/libraries/ts-sudoku-lib`
- Target packlet: `src/packlets/common/`
- Follow existing patterns in puzzle.ts, cage.ts, puzzleSession.ts

Please design the comprehensive API following the established patterns in the codebase.