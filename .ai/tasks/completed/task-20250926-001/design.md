# KillerCombinations Helper - API Design

## Executive Summary

This document defines the API design and type definitions for the KillerCombinations helper class, which provides UI assistance functions for killer sudoku puzzle solving. The design follows existing codebase patterns and integrates seamlessly with the current architecture.

## Class Structure

### Main Class: KillerCombinations

```typescript
/**
 * Helper class providing UI assistance functions for killer sudoku puzzle solving.
 * Generates possible totals, number combinations with constraints, and cell-specific
 * possibilities based on current puzzle state.
 * @public
 */
export class KillerCombinations {
  /**
   * Gets all mathematically possible totals for a given cage size.
   * @param cageSize - The number of cells in the cage (1-9)
   * @returns Result containing array of possible totals in ascending order
   */
  public static getPossibleTotals(cageSize: number): Result<number[]>;

  /**
   * Generates all possible number combinations that sum to the target total.
   * @param cageSize - The number of cells in the cage (1-9)
   * @param total - The target sum
   * @param constraints - Optional constraints on numbers that must be included/excluded
   * @returns Result containing array of number combinations (each sorted)
   */
  public static getCombinations(
    cageSize: number,
    total: number,
    constraints?: IKillerConstraints
  ): Result<number[][]>;

  /**
   * Determines possible values for each cell in a killer cage based on current puzzle state.
   * @param puzzle - The puzzle instance
   * @param state - Current puzzle state
   * @param cage - The killer cage to analyze
   * @returns Result containing map of CellId to possible number arrays
   */
  public static getCellPossibilities(
    puzzle: Puzzle,
    state: PuzzleState,
    cage: ICage
  ): Result<Map<CellId, number[]>>;
}
```

## Type Definitions

### Constraints Interface

```typescript
/**
 * Constraints that can be applied when generating killer cage combinations.
 * @public
 */
export interface IKillerConstraints {
  /**
   * Numbers that cannot be present in the combination.
   * Must be unique values between 1-9.
   */
  readonly excludedNumbers?: readonly number[];

  /**
   * Numbers that must be present in the combination.
   * Must be unique values between 1-9.
   */
  readonly requiredNumbers?: readonly number[];
}
```

### Internal Algorithm Types

```typescript
/**
 * @internal
 */
interface ICombinationGenerator {
  generate(cageSize: number, total: number, constraints?: IKillerConstraints): number[][];
}

/**
 * @internal
 */
interface ICombinationCache {
  get(key: string): number[][] | undefined;
  set(key: string, combinations: number[][]): void;
  clear(): void;
}

/**
 * @internal
 */
interface IPossibilityAnalyzer {
  analyze(
    puzzle: Puzzle,
    state: PuzzleState,
    cage: ICage,
    combinations: number[][]
  ): Map<CellId, number[]>;
}
```

## Implementation Architecture

### File Organization

```
src/packlets/common/
├── killerCombinations.ts          # Main KillerCombinations class
├── killerCombinationsTypes.ts     # Public type definitions
└── internal/
    ├── combinationGenerator.ts    # Core algorithm implementation
    ├── combinationCache.ts        # Caching for performance
    └── possibilityAnalyzer.ts     # Cell possibility analysis
```

### Module Exports

```typescript
// From killerCombinations.ts
export { KillerCombinations } from './killerCombinations';
export type { IKillerConstraints } from './killerCombinationsTypes';

// Added to common/index.ts
export { KillerCombinations } from './killerCombinations';
export type { IKillerConstraints } from './killerCombinationsTypes';
```

## Integration Points

### With Existing Classes

1. **Cage Integration**
   - Uses `cage.numCells` for cage size
   - Uses `cage.total` for target sum
   - Uses `cage.cellIds` for cell identification
   - Uses `cage.containedValues(state)` for current values

2. **Puzzle Integration**
   - Uses `puzzle.getCell(cellId)` for cell lookup
   - Uses puzzle structure for sudoku constraint validation

3. **PuzzleState Integration**
   - Uses `state.getCellContents(cellId)` for current cell values
   - Integrates with existing state management patterns

4. **Existing Constants**
   - Uses `totalsByCageSize` for validation and bounds checking
   - Follows existing branded type patterns (`CageId`, `CellId`)

### API Usage Examples

```typescript
// Example 1: Get possible totals for a 3-cell cage
const possibleTotals = KillerCombinations.getPossibleTotals(3);
// Returns: Result<[6, 7, 8, ..., 24]>

// Example 2: Get combinations with constraints
const combinations = KillerCombinations.getCombinations(3, 15, {
  excludedNumbers: [1, 2],
  requiredNumbers: [9]
});
// Returns: Result<[[3, 4, 9], [4, 5, 9], [5, 6, 9], [6, 7, 9]]>

// Example 3: Get cell possibilities for a killer cage
const cage = puzzle.getCage(cageId).orThrow();
const possibilities = KillerCombinations.getCellPossibilities(puzzle, state, cage);
// Returns: Result<Map<CellId, number[]>>
```

## Algorithm Design

### Combination Generation Strategy

1. **Base Algorithm**: Generate all possible combinations of `cageSize` unique numbers (1-9) that sum to `total`
2. **Constraint Filtering**: Apply excluded/required number constraints
3. **Optimization**: Use memoization for frequently requested combinations
4. **Performance**: Target < 100ms for typical UI requests

### Cache Strategy

```typescript
class CombinationCache {
  private static readonly _cache = new Map<string, number[][]>();

  private static _generateKey(
    cageSize: number,
    total: number,
    constraints?: IKillerConstraints
  ): string {
    const excluded = constraints?.excludedNumbers?.sort().join(',') ?? '';
    const required = constraints?.requiredNumbers?.sort().join(',') ?? '';
    return `${cageSize}:${total}:${excluded}:${required}`;
  }
}
```

### Cell Possibility Analysis

1. **Get Valid Combinations**: Use `getCombinations()` with current cage constraints
2. **Apply Sudoku Constraints**: Filter based on row/column/section constraints
3. **Apply Cage State**: Consider already placed values in the cage
4. **Return Possibilities**: Map each cell to its possible values

## Error Handling

### Input Validation

```typescript
// Cage size validation
if (cageSize < 1 || cageSize > 9) {
  return fail(`Cage size must be between 1 and 9, got ${cageSize}`);
}

// Total validation using existing constants
const bounds = totalsByCageSize[cageSize];
if (total < bounds.min || total > bounds.max) {
  return fail(
    `Total ${total} is invalid for cage size ${cageSize}. ` +
    `Valid range: ${bounds.min}-${bounds.max}`
  );
}

// Constraint validation
if (constraints?.excludedNumbers?.some(n => n < 1 || n > 9)) {
  return fail('Excluded numbers must be between 1 and 9');
}

// Cage type validation
if (cage.cageType !== 'killer') {
  return fail(`Expected killer cage, got ${cage.cageType}`);
}
```

### Error Message Patterns

Following existing codebase patterns for consistent error messaging:

```typescript
// Context-rich error messages
return fail(`Cage ${cage.id}: No valid combinations found for total ${total} with ${cageSize} cells`);

// Validation error messages
return fail(`getCombinations: Invalid cage size ${cageSize} (must be 1-9)`);

// Integration error messages
return fail(`getCellPossibilities: Failed to analyze cage ${cage.id}: ${underlyingError}`);
```

## Performance Considerations

### Caching Strategy
- Cache combination results for repeated requests
- Use string-based cache keys for constraints
- Implement cache size limits to prevent memory issues
- Clear cache on application state changes if needed

### Algorithm Optimization
- Early termination for impossible combinations
- Efficient constraint checking during generation
- Minimize object allocation in hot paths
- Use Set operations for fast constraint checking

### Memory Management
- Reuse arrays where possible
- Avoid deep object nesting in cache entries
- Implement cache eviction for long-running applications

## Testing Strategy

### Unit Tests Structure

```typescript
describe('KillerCombinations', () => {
  describe('getPossibleTotals', () => {
    // Test all cage sizes 1-9
    // Test edge cases (0, negative, > 9)
    // Test return value ordering
  });

  describe('getCombinations', () => {
    // Test basic combination generation
    // Test constraint application
    // Test impossible combinations
    // Test constraint edge cases
    // Test performance with large cages
  });

  describe('getCellPossibilities', () => {
    // Test with empty cages
    // Test with partially filled cages
    // Test with sudoku constraints
    // Test integration scenarios
  });
});
```

### Test Data Strategy
- Use existing test puzzle fixtures
- Create specific killer cage scenarios
- Test with real-world killer sudoku puzzles
- Validate against known mathematical constraints

## API Documentation

### JSDoc Patterns

Following existing codebase documentation patterns:

```typescript
/**
 * Generates all possible number combinations that sum to the target total.
 *
 * Each combination contains unique numbers from 1-9 that sum exactly to the
 * specified total. Combinations respect both excluded and required number
 * constraints if provided.
 *
 * @param cageSize - The number of cells in the cage (must be 1-9)
 * @param total - The target sum (must be valid for the cage size)
 * @param constraints - Optional constraints on included/excluded numbers
 * @returns Result containing array of combinations, each sorted in ascending order
 *
 * @example
 * ```typescript
 * // Get all combinations for a 3-cell cage with total 15
 * const result = KillerCombinations.getCombinations(3, 15);
 * if (result.isSuccess()) {
 *   console.log(result.value); // [[1,5,9], [1,6,8], [2,4,9], ...]
 * }
 *
 * // With constraints - exclude 1 and 2, require 9
 * const constrained = KillerCombinations.getCombinations(3, 15, {
 *   excludedNumbers: [1, 2],
 *   requiredNumbers: [9]
 * });
 * ```
 */
```

## Quality Assurance

### Code Quality Requirements
- Follow existing TypeScript patterns and linting rules
- Use consistent naming conventions matching the codebase
- Maintain 100% test coverage
- No `any` types allowed
- Comprehensive JSDoc documentation

### Integration Requirements
- Must not break existing functionality
- Must integrate cleanly with existing Cage/Puzzle/PuzzleState APIs
- Must follow existing error handling patterns
- Must use existing branded types and interfaces

### Performance Requirements
- Typical requests (cage size 2-6) must complete in < 100ms
- Memory usage must be reasonable for typical UI scenarios
- Cache must be efficient and not cause memory leaks
- Algorithm must scale appropriately for larger cages

## Summary

The KillerCombinations helper provides a clean, type-safe API for killer sudoku UI assistance. The design:

1. **Follows Existing Patterns**: Uses Result pattern, branded types, and established error handling
2. **Integrates Cleanly**: Works with existing Cage, Puzzle, and PuzzleState classes
3. **Provides Performance**: Includes caching and optimization for UI responsiveness
4. **Maintains Quality**: Comprehensive validation, testing, and documentation
5. **Enables Future Growth**: Extensible design for additional killer sudoku features

The API is ready for implementation with clear interfaces, error handling, and integration points defined.