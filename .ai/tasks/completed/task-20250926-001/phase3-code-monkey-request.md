# Code Monkey Agent Request - Core Algorithm Implementation

## Context
We are in Phase 3 of implementing the KillerCombinations helper for the ts-sudoku-lib. Requirements have been confirmed and API design is complete. Now we need to implement the core algorithm and main functionality.

## Task
Implement the KillerCombinations helper class based on the confirmed requirements and approved API design.

## Implementation Requirements

### Primary Files to Create
1. `src/packlets/common/killerCombinations.ts` - Main KillerCombinations class
2. `src/packlets/common/killerCombinationsTypes.ts` - Type definitions
3. `src/packlets/common/internal/combinationGenerator.ts` - Core algorithm
4. `src/packlets/common/internal/combinationCache.ts` - Caching implementation
5. `src/packlets/common/internal/possibilityAnalyzer.ts` - Cell possibility analysis

### API to Implement
Based on the design document, implement these three main methods:

```typescript
export class KillerCombinations {
  public static getPossibleTotals(cageSize: number): Result<number[]>;

  public static getCombinations(
    cageSize: number,
    total: number,
    constraints?: IKillerConstraints
  ): Result<number[][]>;

  public static getCellPossibilities(
    puzzle: Puzzle,
    state: PuzzleState,
    cage: ICage
  ): Result<Map<CellId, number[]>>;
}
```

### Key Implementation Guidelines

1. **Follow Result Pattern**: All functions return `Result<T>` with proper error handling
2. **Use Existing Types**: Integrate with `CageId`, `CellId`, `ICage`, `Puzzle`, `PuzzleState`
3. **Use Existing Constants**: Leverage `totalsByCageSize` for validation
4. **Performance Focus**: Implement caching for combination generation
5. **Input Validation**: Comprehensive validation with descriptive error messages

### Integration Requirements
- Use existing `cage.containedValues(state)` for current cage values
- Use existing `puzzle.getCell(cellId)` for cell lookup
- Use existing `state.getCellContents(cellId)` for cell state
- Follow existing file organization patterns in the common packlet

### Algorithm Specifications

#### Combination Generation
- Generate all unique combinations of numbers 1-9 that sum to target total
- Apply excluded/required number constraints
- Return combinations sorted lexicographically
- Use efficient recursive or iterative algorithm

#### Cell Possibility Analysis
- Start with valid combinations for the cage total
- Filter by current sudoku constraints (row, column, section)
- Consider already placed values in the cage
- Return map of CellId to possible values

### Performance Requirements
- Cache frequently requested combinations
- Target < 100ms response time for typical UI requests
- Efficient constraint checking during generation
- Memory-conscious implementation

### Error Handling Examples
```typescript
// Input validation
if (cageSize < 1 || cageSize > 9) {
  return fail(`Cage size must be between 1 and 9, got ${cageSize}`);
}

// Business logic validation
const bounds = totalsByCageSize[cageSize];
if (total < bounds.min || total > bounds.max) {
  return fail(`Total ${total} invalid for cage size ${cageSize}. Range: ${bounds.min}-${bounds.max}`);
}

// Integration validation
if (cage.cageType !== 'killer') {
  return fail(`Expected killer cage, got ${cage.cageType}`);
}
```

## Files to Update
- `src/packlets/common/index.ts` - Add exports for new classes and types
- Ensure proper internal organization in `internal/` subdirectory

## Quality Requirements
- Follow existing TypeScript patterns and linting rules
- Use proper JSDoc documentation
- No `any` types allowed
- Maintain type safety throughout
- Follow existing naming conventions

## Expected Deliverables
1. Complete implementation of all three main functions
2. Supporting internal classes for algorithms and caching
3. Proper type definitions and exports
4. Integration with existing codebase patterns
5. Comprehensive input validation and error handling

Please implement the complete KillerCombinations helper following the approved design and requirements.