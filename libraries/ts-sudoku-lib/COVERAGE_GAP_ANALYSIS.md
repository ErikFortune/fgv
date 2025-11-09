# ts-sudoku-lib Coverage Gap Analysis

**Analysis Date:** 2025-10-19
**Current Coverage:** 96.27% statements, 94.11% branches, 96.29% functions
**Target Coverage:** 100%
**Remaining Gaps:** ~3.73% statements, ~5.89% branches, ~3.71% functions

## Executive Summary

Total coverage is at 96.27%, with 494 passing tests. The library is very close to 100% coverage. Most gaps fall into these categories:
- **Missing functional tests** (testable error cases and edge conditions)
- **Defensive coding** (internal consistency checks)
- **Type-only exports** (TypeScript type definitions with no runtime code)
- **Infrastructure code** (filesystem operations)

---

## Detailed Gap Analysis by File

### 1. collections/collections.ts (79.79% coverage)

**Uncovered Lines:** 116-153, 173-174

#### Gap Analysis:

**Lines 116-153: Non-standard puzzle size configuration logic**
- **Category:** Business Logic (MEDIUM priority)
- **Description:** Logic for handling non-standard puzzle sizes (16x16, 25x25, etc.)
- **Action Required:** Add functional tests for non-standard grid sizes
- **Recommended Tests:**
  ```typescript
  // Test non-square grid fallback
  test('handles 16-cell non-square grid', () => {
    const fileData = {
      id: 'test-16-nonsquare',
      type: 'sudoku',
      cells: '.' + 'x'.repeat(15), // 16 cells that don't form a standard grid
      // ...
    };
    expect(collection._convertToDefinition(fileData)).toSucceed();
  });

  // Test 16x16 grid (256 cells)
  test('handles 16x16 grid size', () => {
    const fileData = {
      id: 'test-16x16',
      type: 'sudoku',
      cells: '.'.repeat(256),
      // ...
    };
    expect(collection._convertToDefinition(fileData)).toSucceed();
  });

  // Test 25x25 grid (625 cells)
  test('handles 25x25 grid size', () => {
    const fileData = {
      id: 'test-25x25',
      type: 'sudoku',
      cells: '.'.repeat(625),
      // ...
    };
    expect(collection._convertToDefinition(fileData)).toSucceed();
  });
  ```

**Lines 173-174: Puzzle not found error**
- **Category:** Validation Logic (LOW priority)
- **Description:** Error path when puzzle ID doesn't exist
- **Status:** Already tested in collections.test.ts line 62-64
- **Action Required:** Test for intermittent coverage issue
- **Individual file test:** `rushx test --test-path-pattern=collections.test`

---

### 2. common/puzzleDefinitions.ts (79.47% coverage)

**Uncovered Lines:** 73-76, 85-88, 104-105, 217-218, 256-309, 326-327, 334-335, 340-341, 357-358, 364-365, 371-372

#### Gap Analysis:

**Lines 73-76: KillerSudokuValidator - cell count validation**
- **Category:** Validation Logic (HIGH priority)
- **Description:** Validates minimum cell count for killer sudoku
- **Action Required:** Add test with cells too short
  ```typescript
  test('validates killer sudoku minimum cell count', () => {
    const validator = new KillerSudokuValidator();
    const result = validator.validateCells('...', STANDARD_CONFIGS.puzzle9x9);
    expect(result).toFailWith(/must contain at least/i);
  });
  ```

**Lines 85-88: KillerSudokuValidator - separator validation**
- **Category:** Validation Logic (HIGH priority)
- **Description:** Validates presence and position of cage separator
- **Action Required:** Add tests for missing/misplaced separator
  ```typescript
  test('validates killer sudoku separator presence', () => {
    const cells = '.'.repeat(81); // No separator
    expect(validator.validateCells(cells, config)).toFailWith(/must contain cage definitions/i);
  });

  test('validates killer sudoku separator position', () => {
    const cells = '.'.repeat(40) + '|' + '.'.repeat(40); // Wrong position
    expect(validator.validateCells(cells, config)).toFailWith(/must be exactly 81 characters/i);
  });
  ```

**Lines 104-105: KillerSudokuValidator - invalid character check**
- **Category:** Validation Logic (HIGH priority)
- **Description:** Validates only legal characters in grid
- **Action Required:** Add test with invalid character
  ```typescript
  test('validates killer sudoku character validity', () => {
    const cells = '.'.repeat(40) + '!' + '.'.repeat(40) + '|cages';
    expect(validator.validateCells(cells, config)).toFailWith(/invalid character/i);
  });
  ```

**Lines 217-218: PuzzleDefinitionFactory - unknown puzzle type**
- **Category:** Validation Logic (MEDIUM priority)
- **Description:** Error for unrecognized puzzle type
- **Action Required:** Add test with invalid type
  ```typescript
  test('rejects unknown puzzle type', () => {
    const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
      type: 'bogus-type' as any,
      cells: '.'.repeat(81)
    });
    expect(result).toFailWith(/unknown puzzle type/i);
  });
  ```

**Lines 256-309: PuzzleDefinitionFactory.createKiller**
- **Category:** Business Logic (LOW priority)
- **Description:** Killer sudoku creation with cage constraints
- **Status:** May not be used in current codebase
- **Action Required:** Either add tests or mark as deprecated/internal
- **Note:** This appears to be an alternative API that may not be actively used

**Lines 326-327, 334-335, 340-341: Dimension validation edge cases**
- **Category:** Validation Logic (MEDIUM priority)
- **Description:** Various dimension validation failures
- **Action Required:** Add tests for edge cases
  ```typescript
  test('rejects 1x1 cages', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 1,
      cageHeightInCells: 2,
      boardWidthInCages: 3,
      boardHeightInCages: 3
    })).toFailWith(/cage dimensions must be at least 2x2/i);
  });

  test('rejects board dimensions < 1', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 3,
      cageHeightInCells: 3,
      boardWidthInCages: 0,
      boardHeightInCages: 3
    })).toFailWith(/board dimensions must be positive/i);
  });

  test('rejects cage size too small', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 1,
      cageHeightInCells: 1,
      boardWidthInCages: 3,
      boardHeightInCages: 3
    })).toFailWith(/cage size must result in values between 2 and 25/i);
  });
  ```

**Lines 357-358, 364-365, 371-372: Validator registry methods**
- **Category:** Infrastructure (LOW priority)
- **Description:** Public API methods for custom validators
- **Action Required:** Add tests if this API is intended for external use
  ```typescript
  test('getValidator returns correct validator', () => {
    const validator = PuzzleDefinitionFactory.getValidator('killer-sudoku');
    expect(validator).toBeInstanceOf(KillerSudokuValidator);
  });

  test('registerValidator allows custom validators', () => {
    const customValidator = new StandardSudokuValidator();
    PuzzleDefinitionFactory.registerValidator('custom' as any, customValidator);
    expect(PuzzleDefinitionFactory.getValidator('custom' as any)).toBe(customValidator);
  });
  ```

---

### 3. common/ids.ts (89.71% coverage)

**Uncovered Lines:** 42-48, 60-63, 77-78, 88-92

#### Gap Analysis:

**Lines 42-48: columnToLetters for columns >= 26**
- **Category:** Business Logic (LOW priority)
- **Description:** Handles double-letter column identifiers (AA, AB, etc.)
- **Action Required:** Add test for large grids (>26 columns)
  ```typescript
  test('handles column indices >= 26', () => {
    // Column 26 should be 'AA'
    expect(Ids.cellId({ row: 0, col: 26 })).toSucceedWith('A27' as CellId);
  });
  ```

**Lines 60-63, 88-92: parseCellId for double letters**
- **Category:** Business Logic (LOW priority)
- **Description:** Parses double-letter cell IDs
- **Action Required:** Add test for parsing large grid cells
  ```typescript
  test('parses double-letter cell IDs', () => {
    const result = parseCellId('AA01');
    expect(result).toBeDefined();
    expect(result?.row).toBe(26);
    expect(result?.col).toBe(0);
  });
  ```

**Lines 77-78: Defensive error handling in cellIds**
- **Category:** Defensive Coding (LOW priority)
- **Description:** Already has c8 ignore directive
- **Action Required:** None (properly marked)

---

### 4. common/converters.ts (97.87% coverage)

**Uncovered Lines:** 64-65

#### Gap Analysis:

**Lines 64-65: Invalid cell ID validation**
- **Category:** Validation Logic (MEDIUM priority)
- **Action Required:** Add test with invalid cell ID format
  ```typescript
  test('rejects invalid cell ID format', () => {
    expect(Converters.cellId.convert('INVALID')).toFail();
    expect(Converters.cellId.convert('99')).toFail();
  });
  ```

---

### 5. common/common.ts (98.63% coverage)

**Uncovered Lines:** 105-106

#### Gap Analysis:

**Lines 105-106: Branch for totalValueInRange comparison**
- **Category:** Defensive Coding or Intermittent Coverage
- **Action Required:** Test for intermittent coverage
- **Individual file test:** `rushx test --test-path-pattern=puzzle.test`

---

### 6. common/puzzle.ts (98.61% coverage)

**Uncovered Lines:** 109-114, 271-272

#### Gap Analysis:

**Lines 109-114: Error creating killer cage IDs**
- **Category:** Defensive Coding (LOW priority)
- **Description:** Error path when cage ID creation fails
- **Note:** This should not fail unless there's a bug in Ids.cageId
- **Action Required:** Consider c8 ignore directive
  ```typescript
  /* c8 ignore next 6 - defensive coding: cage ID creation should not fail */
  const cageIdResult = Ids.cageId(killerCage.id);
  if (cageIdResult.isFailure()) {
    return fail(`Failed to create cage ID for killer cage ${killerCage.id}: ${cageIdResult.message}`);
  }
  ```

**Lines 271-272: Puzzle state not containing cell**
- **Category:** Defensive Coding (LOW priority)
- **Description:** Consistency check between puzzle and state
- **Action Required:** Test or add c8 ignore
  ```typescript
  test('detects inconsistency between puzzle and state', () => {
    // This would require corrupting internal state
    // Consider defensive coding directive
  });
  ```

---

### 7. common/puzzleSession.ts (99.53% coverage)

**Uncovered Lines:** 82-83

#### Gap Analysis:

**Lines 82-83: Branch in puzzle state verification**
- **Category:** Intermittent Coverage (likely)
- **Action Required:** Test for intermittent coverage
- **Individual file test:** `rushx test --test-path-pattern=puzzleSession.test`

---

### 8. files/filesystem.ts (92.5% coverage)

**Uncovered Lines:** 38-40

#### Gap Analysis:

**Lines 38-40: Filesystem loading function**
- **Category:** Infrastructure (LOW priority)
- **Description:** Filesystem operations not tested
- **Note:** This is a public API but requires filesystem setup
- **Action Required:** Add integration test or document as untested infrastructure
  ```typescript
  test('loadJsonPuzzlesFileSync loads file from disk', () => {
    const result = loadJsonPuzzlesFileSync('path/to/test/puzzles.json');
    expect(result).toSucceed();
  });
  ```

---

### 9. hints/hints.ts (96.83% coverage)

**Uncovered Lines:** 118-119, 181-182, 189-190, 193-194, 200-201, 204-205

#### Gap Analysis:

**Lines 118-119, 181-182, 189-190, 193-194, 200-201, 204-205: Error paths in HintSystem.create**
- **Category:** Defensive Coding (LOW priority)
- **Description:** Error handling for hint provider creation/registration failures
- **Note:** These would only fail if the provider constructors are broken
- **Action Required:** Consider c8 ignore or test provider failures
  ```typescript
  // These are defensive - the constructors should not fail
  /* c8 ignore next 2 - defensive coding: provider creation should succeed */
  if (nakedProvider.isFailure()) {
    return fail(`Failed to create naked singles provider: ${nakedProvider.message}`);
  }
  ```

---

### 10. hints/baseHintProvider.ts (99.3% coverage)

**Uncovered Lines:** 209-210

#### Gap Analysis:

**Lines 209-210: Branch in hint generation**
- **Category:** Intermittent Coverage (likely)
- **Action Required:** Test for intermittent coverage
- **Individual file test:** `rushx test --test-path-pattern=nakedSingles.test`

---

### 11. hints/nakedSingles.ts (99.17% coverage)

**Uncovered Lines:** 186-187

#### Gap Analysis:

**Lines 186-187: Branch in technique detection**
- **Category:** Intermittent Coverage (likely)
- **Action Required:** Test for intermittent coverage

---

### 12. hints/hiddenSingles.ts (98.7% coverage)

**Uncovered Lines:** 295-297, 301

#### Gap Analysis:

**Lines 295-297, 301: Error handling branches**
- **Category:** Defensive Coding or Intermittent Coverage
- **Action Required:** Test for intermittent coverage
- **Individual file test:** `rushx test --test-path-pattern=hiddenSingles.test`

---

### 13. hints/explanations.ts (100% coverage with branch gap)

**Uncovered Branches:** 300-303

#### Gap Analysis:

**Lines 300-303: Conditional branch**
- **Category:** Intermittent Coverage (likely)
- **Current Coverage:** 100% statements but branch not hit
- **Action Required:** Test for intermittent coverage

---

### 14. hints/puzzleSessionHints.ts (100% coverage with branch gap)

**Uncovered Branches:** 579

#### Gap Analysis:

**Line 579: Conditional branch**
- **Category:** Intermittent Coverage (likely)
- **Current Coverage:** 100% statements but branch not hit

---

### 15. puzzles/killerCombinationsTypes.ts (0% coverage)

**Uncovered Lines:** 1-41

#### Gap Analysis:

**All lines: TypeScript interface definition**
- **Category:** Type-only export (NO ACTION REQUIRED)
- **Description:** This file contains only TypeScript type definitions with no runtime code
- **Action Required:** None - TypeScript interfaces have no runtime code to cover

---

### 16. puzzles/anyPuzzle.ts (98% coverage)

**Uncovered Lines:** 44

#### Gap Analysis:

**Line 44: Unknown puzzle type error**
- **Category:** Validation Logic (MEDIUM priority)
- **Action Required:** Add test with invalid puzzle type
  ```typescript
  test('rejects unknown puzzle type', () => {
    const def = { ...validDef, type: 'unknown-type' as any };
    expect(Puzzles.Any.create(def)).toFailWith(/unknown puzzle type/i);
  });
  ```

---

### 17. puzzles/killerCombinations.ts (99.61% coverage)

**Uncovered Lines:** 189

#### Gap Analysis:

**Line 189: Branch in constraint validation**
- **Category:** Intermittent Coverage or edge case
- **Action Required:** Test for intermittent coverage or add edge case test

---

### 18. puzzles/killerSudokuPuzzle.ts (96.07% coverage)

**Uncovered Lines:** 60-61, 75-78

#### Gap Analysis:

**Lines 60-61: Cage ID validation error**
- **Category:** Validation Logic (MEDIUM priority)
- **Action Required:** Add test with invalid cage data

**Lines 75-78: Cage total/sum validation**
- **Category:** Validation Logic (MEDIUM priority)
- **Action Required:** Add test with mismatched total/sum

---

### 19. puzzles/sudokuXPuzzle.ts (97.33% coverage)

**Uncovered Lines:** 43-44

#### Gap Analysis:

**Lines 43-44: Non-square grid validation**
- **Category:** Validation Logic (MEDIUM priority)
- **Action Required:** Add test with non-square dimensions
  ```typescript
  test('rejects non-square Sudoku X grids', () => {
    const def = {
      ...standardDef,
      cageWidthInCells: 3,
      cageHeightInCells: 2, // Non-square
      type: 'sudoku-x' as const
    };
    expect(SudokuXPuzzle.create(def)).toFailWith(/must be square/i);
  });
  ```

---

### 20. puzzles/internal/combinationCache.ts (92.68% coverage)

**Uncovered Lines:** 61-62, 73-74, 80-81

#### Gap Analysis:

**Lines 61-62: Cache clear on max size**
- **Category:** Business Logic (LOW priority)
- **Description:** LRU cache eviction
- **Action Required:** Add test that fills cache beyond max size
  ```typescript
  test('clears cache when max size reached', () => {
    // Fill cache to max
    for (let i = 0; i < 1000; i++) {
      CombinationCache.set(`key-${i}`, [[1, 2, 3]]);
    }
    expect(CombinationCache.size()).toBe(1000);

    // Adding one more should clear and reset
    CombinationCache.set('key-overflow', [[4, 5, 6]]);
    expect(CombinationCache.size()).toBe(1);
  });
  ```

**Lines 73-74, 80-81: clear() and size() methods**
- **Category:** Infrastructure (LOW priority)
- **Description:** Testing/debugging utilities
- **Action Required:** Add simple utility method tests
  ```typescript
  test('clear() empties the cache', () => {
    CombinationCache.set('key', [[1, 2, 3]]);
    expect(CombinationCache.size()).toBeGreaterThan(0);
    CombinationCache.clear();
    expect(CombinationCache.size()).toBe(0);
  });
  ```

---

### 21. puzzles/internal/combinationGenerator.ts (99.45% coverage)

**Uncovered Lines:** 70

#### Gap Analysis:

**Line 70: Branch in recursion**
- **Category:** Intermittent Coverage (likely)
- **Action Required:** Test for intermittent coverage

---

### 22. puzzles/internal/possibilityAnalyzer.ts (98.56% coverage)

**Uncovered Lines:** 93-94

#### Gap Analysis:

**Lines 93-94: Branch in analysis logic**
- **Category:** Intermittent Coverage (likely)
- **Action Required:** Test for intermittent coverage

---

## Summary of Required Actions

### High Priority - Missing Functional Tests (Business/Validation Logic)

1. **KillerSudokuValidator** (puzzleDefinitions.ts):
   - Test minimum cell count validation
   - Test separator presence/position
   - Test invalid characters

2. **PuzzleCollection** (collections.ts):
   - Test non-standard grid sizes (16x16, 25x25)
   - Test non-square grids

3. **Validation Edge Cases**:
   - Unknown puzzle types
   - Dimension validation failures
   - Invalid cell IDs

### Medium Priority - Testable Edge Cases

1. **Puzzle size edge cases** (ids.ts, converters.ts)
2. **Killer sudoku validation** (killerSudokuPuzzle.ts)
3. **SudokuX non-square grids** (sudokuXPuzzle.ts)
4. **Validator registry API** (puzzleDefinitions.ts)

### Low Priority - Infrastructure and Utilities

1. **CombinationCache LRU behavior** (combinationCache.ts)
2. **Filesystem operations** (filesystem.ts)
3. **Custom validator registration** (puzzleDefinitions.ts)

### Defensive Coding - Consider c8 Ignore Directives

1. **Hint system error paths** (hints.ts lines 118-119, 181-205)
2. **Cage ID creation errors** (puzzle.ts lines 109-114)
3. **Cell consistency checks** (puzzle.ts lines 271-272)

### Intermittent Coverage - Requires Investigation

Test these files individually to determine if coverage is intermittent:
1. collections.test.ts (lines 173-174)
2. puzzleSession.test.ts (line 82-83)
3. hints tests (various branch misses)

**Command to test for intermittent coverage:**
```bash
rushx test --test-path-pattern=<filename>.test
```

### No Action Required

1. **killerCombinationsTypes.ts** - Type-only exports (0% is expected)

---

## Recommendations for Achieving 100% Coverage

### Phase 1: Add High-Priority Functional Tests (Estimated: 2-3 hours)
- Focus on validation logic in puzzleDefinitions.ts
- Test non-standard grid sizes in collections.ts
- Test error cases for puzzle types

### Phase 2: Test Intermittent Coverage (Estimated: 1 hour)
- Run individual test files to identify intermittent issues
- Add c8 ignore directives for confirmed intermittent coverage

### Phase 3: Add Defensive Coding Directives (Estimated: 30 minutes)
- Add c8 ignore with clear comments for defensive code
- Focus on error paths that should never occur in normal operation

### Phase 4: Complete Remaining Tests (Estimated: 1-2 hours)
- Infrastructure tests (filesystem, cache)
- Utility methods
- Edge cases

**Total Estimated Effort:** 4.5-6.5 hours to reach 100% coverage

---

## Notes

- Current coverage (96.27%) is excellent and indicates well-tested code
- Most gaps are in error handling and edge cases
- No critical business logic appears untested
- Type-only file (killerCombinationsTypes.ts) should not count against coverage
- Several gaps may be intermittent coverage issues rather than missing tests
