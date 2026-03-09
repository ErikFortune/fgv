# KillerCombinations Helper - Requirements Analysis

## Executive Summary

Implement a comprehensive KillerCombinations helper class providing UI assistance functions for killer sudoku puzzle solving. The helper will generate possible totals, number combinations with constraints, and cell-specific possibilities based on current puzzle state.

## Functional Requirements

### FR1: Get Possible Totals
**Function**: `getPossibleTotals(cageSize: number): Result<number[]>`

**Purpose**: Given a cage size, return all mathematically possible totals that can be achieved.

**Input Validation**:
- cageSize must be between 1 and 9 (standard sudoku constraint)
- Must handle edge cases (invalid inputs return failure)

**Output**: Array of possible totals in ascending order

**Business Rules**:
- Use existing `totalsByCageSize` data as foundation
- Return all integers from min to max for the given cage size
- Empty cage (size 0) returns empty array

### FR2: Get Combinations
**Function**: `getCombinations(cageSize: number, total: number, constraints?: Constraints): Result<number[][]>`

**Purpose**: Generate all possible number combinations that sum to the target total with optional constraints.

**Input Validation**:
- cageSize: 1-9
- total: must be within valid range for cage size (use totalsByCageSize)
- constraints: optional constraint object

**Constraint Types**:
```typescript
interface Constraints {
  excludedNumbers?: number[];  // Numbers that cannot be present
  requiredNumbers?: number[];  // Numbers that must be present
}
```

**Output**: Array of number combinations (each combination is a sorted array)

**Business Rules**:
- Each number 1-9 can appear at most once per combination
- All combinations must sum to exact total
- Combinations must respect both excluded and required number constraints
- Return combinations sorted lexicographically
- Empty result if no valid combinations exist

### FR3: Get Cell Possibilities
**Function**: `getCellPossibilities(puzzle: Puzzle, state: PuzzleState, cage: Cage): Result<Map<CellId, number[]>>`

**Purpose**: Given current puzzle state, determine possible values for each cell in a killer cage.

**Input Validation**:
- puzzle: valid Puzzle instance
- state: valid PuzzleState instance
- cage: valid Cage instance with type 'killer'

**Output**: Map of CellId to possible number arrays

**Business Rules**:
- Consider already placed values in the cage
- Consider sudoku constraints (row, column, section uniqueness)
- Consider killer constraint (cage total)
- Use getCombinations internally with current cage constraints
- Empty array for cell if no valid possibilities exist

## Technical Requirements

### TR1: Result Pattern Compliance
- All functions must return `Result<T>` types
- Use proper error messages with context
- Follow existing codebase error handling patterns

### TR2: Type Safety
- Use existing branded types (`CageId`, `CellId`)
- Integrate with existing `Cage`, `Puzzle`, `PuzzleState` classes
- Define new types as needed with proper type safety

### TR3: Performance Requirements
- Combination generation should be efficient for typical cage sizes (2-6 cells)
- Cache commonly requested combinations if beneficial
- Optimize for UI responsiveness (< 100ms for typical requests)

### TR4: Integration Requirements
- Integrate with existing `Cage` class methods (`containsValue`, `containedValues`)
- Use existing `totalsByCageSize` constant
- Follow packlet organization (place in `common/` packlet)

## Quality Requirements

### QR1: Test Coverage
- 100% test coverage using Jest with Result matchers
- Test all success cases, error cases, and edge cases
- Test constraint combinations and integration scenarios

### QR2: Code Quality
- Follow existing TypeScript patterns and linting rules
- Use consistent naming conventions
- Comprehensive JSDoc documentation
- No `any` types allowed

### QR3: API Design
- Consistent with existing library patterns
- Clear separation of concerns
- Composable functions that work together
- Intuitive parameter ordering

## Exit Criteria

### Functional Completeness
- [ ] All three functions implemented and working correctly
- [ ] Constraint system working for excluded/required numbers
- [ ] Integration with existing Puzzle/PuzzleState/Cage classes complete
- [ ] Performance meets requirements for typical use cases

### Quality Gates
- [ ] 100% test coverage achieved
- [ ] All linting rules pass
- [ ] API documentation complete
- [ ] Integration tests with existing killer sudoku infrastructure pass

### Validation Criteria
- [ ] Manual verification with known killer sudoku scenarios
- [ ] Edge case handling verified (empty cages, impossible constraints)
- [ ] Error handling verified for all invalid inputs
- [ ] Type safety verified - no runtime type errors possible

## Dependencies and Constraints

### Internal Dependencies
- Existing `Cage`, `Puzzle`, `PuzzleState` classes
- `totalsByCageSize` constant
- Result pattern from `@fgv/ts-utils`
- Branded types (`CageId`, `CellId`)

### External Dependencies
- No new external dependencies required
- Leverage existing `@fgv/ts-utils` library

### Constraints
- Must maintain backward compatibility
- Must follow existing architectural patterns
- Must not modify existing public APIs
- Must fit within current packlet structure

## Implementation Approach

### Phase 1: Core Algorithm Implementation
1. Implement combination generation algorithm
2. Add constraint filtering logic
3. Create efficient data structures for caching

### Phase 2: API Implementation
1. Implement the three main functions with Result pattern
2. Add proper input validation and error handling
3. Integrate with existing type system

### Phase 3: Integration & Testing
1. Integrate with existing Cage/Puzzle classes
2. Implement comprehensive test suite
3. Validate with real killer sudoku scenarios

## Risk Analysis

### Technical Risks
- **Combinatorial explosion**: Large cages (7-9 cells) may generate many combinations
  - *Mitigation*: Optimize algorithm, add reasonable limits
- **Integration complexity**: Deep integration with existing puzzle state
  - *Mitigation*: Use existing patterns, thorough testing

### Quality Risks
- **Test coverage**: Complex constraint combinations may be hard to test
  - *Mitigation*: Systematic test planning, edge case identification
- **Performance**: Real-time UI usage requires fast response
  - *Mitigation*: Performance testing, optimization if needed

## Success Metrics

### Functionality
- All three functions work correctly for typical killer sudoku scenarios
- Constraint system handles complex combinations correctly
- Integration with existing infrastructure is seamless

### Quality
- 100% test coverage maintained
- No regressions in existing functionality
- Performance meets UI responsiveness requirements

### Usability
- API is intuitive for UI development
- Error messages are helpful for debugging
- Documentation is complete and accurate