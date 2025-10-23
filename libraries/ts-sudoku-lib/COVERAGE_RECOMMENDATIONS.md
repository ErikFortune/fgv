# Coverage Improvement Recommendations for ts-sudoku-lib

## Current Status
- **Overall Coverage:** 96.27% statements, 94.11% branches, 96.29% functions
- **Tests:** 494 passing tests across 19 test suites
- **Target:** 100% coverage

## Quick Summary

The library is in excellent shape with 96%+ coverage. The remaining gaps fall into clear categories:

1. **Testable Error Cases** (~60% of gaps) - Should have functional tests
2. **Type-Only Exports** (~15% of gaps) - No action needed
3. **Defensive Code** (~15% of gaps) - Should use c8 ignore directives
4. **Infrastructure** (~10% of gaps) - Filesystem operations

## Priority 1: Add Missing Functional Tests (HIGH PRIORITY)

These are testable validation and business logic paths that should have tests:

### 1.1 Killer Sudoku Validation (puzzleDefinitions.ts)

**Add to:** `src/test/unit/common/puzzleDefinitions.test.ts`

```typescript
describe('KillerSudokuValidator', () => {
  const validator = PuzzleDefinitionFactory.getValidator('killer-sudoku')!;
  const config = STANDARD_CONFIGS.puzzle9x9;

  test('rejects cells with insufficient length', () => {
    const result = validator.validateCells('...', config);
    expect(result).toFailWith(/must contain at least/i);
  });

  test('rejects cells without separator', () => {
    const cells = '.'.repeat(81);
    expect(validator.validateCells(cells, config)).toFailWith(/must contain cage definitions/i);
  });

  test('rejects cells with separator in wrong position', () => {
    const cells = '.'.repeat(40) + '|' + '.'.repeat(40);
    expect(validator.validateCells(cells, config)).toFailWith(/must be exactly 81 characters/i);
  });

  test('rejects cells with invalid characters', () => {
    const cells = '.'.repeat(40) + '!' + '.'.repeat(40) + '|cages';
    expect(validator.validateCells(cells, config)).toFailWith(/invalid character/i);
  });
});
```

**Impact:** Covers lines 73-76, 85-88, 104-105 in puzzleDefinitions.ts

### 1.2 Puzzle Type Validation (puzzleDefinitions.ts, anyPuzzle.ts)

**Add to:** `src/test/unit/common/puzzleDefinitions.test.ts`

```typescript
describe('unknown puzzle types', () => {
  test('rejects unknown puzzle type in PuzzleDefinitionFactory', () => {
    const result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
      type: 'bogus-type' as any,
      cells: '.'.repeat(81)
    });
    expect(result).toFailWith(/unknown puzzle type/i);
  });
});
```

**Add to:** `src/test/unit/puzzles/anyPuzzle.test.ts`

```typescript
test('rejects unknown puzzle type in Any.create', () => {
  const def = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9).orThrow();
  const invalidDef = { ...def, type: 'unknown' as any };
  expect(Puzzles.Any.create(invalidDef)).toFailWith(/unknown puzzle type/i);
});
```

**Impact:** Covers line 217-218 in puzzleDefinitions.ts, line 44 in anyPuzzle.ts

### 1.3 Dimension Validation Edge Cases (puzzleDefinitions.ts)

**Add to:** `src/test/unit/common/puzzleDefinitions.test.ts`

```typescript
describe('dimension validation edge cases', () => {
  test('rejects cages smaller than 2x2', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 1,
      cageHeightInCells: 2,
      boardWidthInCages: 3,
      boardHeightInCages: 3
    })).toFailWith(/cage dimensions must be at least 2x2/i);
  });

  test('rejects board dimensions less than 1', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 3,
      cageHeightInCells: 3,
      boardWidthInCages: 0,
      boardHeightInCages: 3
    })).toFailWith(/board dimensions must be positive/i);
  });

  test('rejects cage size resulting in invalid max values', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 1,
      cageHeightInCells: 1,
      boardWidthInCages: 3,
      boardHeightInCages: 3
    })).toFailWith(/cage size must result in values between 2 and 25/i);
  });

  test('rejects grids exceeding 25x25 maximum', () => {
    expect(PuzzleDefinitionFactory.create({
      cageWidthInCells: 26,
      cageHeightInCells: 26,
      boardWidthInCages: 1,
      boardHeightInCages: 1
    })).toFailWith(/must not exceed 25x25/i);
  });
});
```

**Impact:** Covers lines 326-327, 334-335, 340-341 in puzzleDefinitions.ts

### 1.4 Non-Standard Grid Sizes (collections.ts)

**Add to:** `src/test/unit/collections.test.ts`

```typescript
describe('non-standard grid sizes', () => {
  test('handles 16x16 grid (256 cells)', () => {
    const puzzleData = {
      id: 'test-16x16',
      description: '16x16 Sudoku',
      type: 'sudoku' as const,
      level: 1,
      cells: '.'.repeat(256)
    };

    const collection = PuzzleCollection.create({ puzzles: [puzzleData] }).orThrow();
    expect(collection.getPuzzle('test-16x16')).toSucceed();
  });

  test('handles 25x25 grid (625 cells)', () => {
    const puzzleData = {
      id: 'test-25x25',
      description: '25x25 Sudoku',
      type: 'sudoku' as const,
      level: 1,
      cells: '.'.repeat(625)
    };

    const collection = PuzzleCollection.create({ puzzles: [puzzleData] }).orThrow();
    expect(collection.getPuzzle('test-25x25')).toSucceed();
  });

  test('handles non-square grids', () => {
    const puzzleData = {
      id: 'test-nonsquare',
      description: 'Non-square puzzle',
      type: 'sudoku' as const,
      level: 1,
      cells: '.'.repeat(15) // Not a perfect square
    };

    const collection = PuzzleCollection.create({ puzzles: [puzzleData] }).orThrow();
    expect(collection.getPuzzle('test-nonsquare')).toSucceed();
  });
});
```

**Impact:** Covers lines 116-153 in collections.ts

### 1.5 Sudoku X Non-Square Validation (sudokuXPuzzle.ts)

**Add to:** `src/test/unit/puzzles/sudokuXPuzzle.test.ts`

```typescript
test('rejects non-square Sudoku X grids', () => {
  const def = PuzzleDefinitionFactory.create({
    cageWidthInCells: 3,
    cageHeightInCells: 2,
    boardWidthInCages: 2,
    boardHeightInCages: 3
  }, {
    type: 'sudoku-x'
  }).orThrow();

  expect(SudokuXPuzzle.create(def)).toFailWith(/must be square/i);
});
```

**Impact:** Covers lines 43-44 in sudokuXPuzzle.ts

### 1.6 Killer Sudoku Cage Validation (killerSudokuPuzzle.ts)

**Add to:** `src/test/unit/puzzles/killerSudokuState.test.ts`

```typescript
test('validates cage IDs', () => {
  const def = createKillerDef();
  // Create definition with invalid cage ID that will fail conversion
  const invalidDef = {
    ...def,
    cages: [{ ...def.cages![0], id: '' as CageId }]
  };
  expect(KillerSudokuPuzzle.create(invalidDef)).toFail();
});

test('validates cage totals match sums', () => {
  const def = createKillerDef();
  const invalidDef = {
    ...def,
    cages: [{ ...def.cages![0], total: 10, sum: 20 }]
  };
  expect(KillerSudokuPuzzle.create(invalidDef)).toFail();
});
```

**Impact:** Covers lines 60-61, 75-78 in killerSudokuPuzzle.ts

### 1.7 Invalid Cell ID Formats (converters.ts)

**Add to:** `src/test/unit/common/ids.test.ts`

```typescript
describe('invalid cell IDs', () => {
  test('rejects completely invalid format', () => {
    expect(Converters.cellId.convert('INVALID')).toFail();
  });

  test('rejects numeric-only format', () => {
    expect(Converters.cellId.convert('123')).toFail();
  });

  test('rejects special characters', () => {
    expect(Converters.cellId.convert('A@1')).toFail();
  });
});
```

**Impact:** Covers lines 64-65 in converters.ts

### 1.8 Large Grid Cell IDs (ids.ts)

**Add to:** `src/test/unit/common/ids.test.ts`

```typescript
describe('large grid support', () => {
  test('handles columns >= 26 (double letters)', () => {
    expect(Ids.cellId({ row: 0, col: 26 })).toSucceedAndSatisfy((id) => {
      // Column 26 should use double-letter format
      expect(id).toMatch(/^[A-Z]{2}\d+$/);
    });
  });

  test('parses double-letter cell IDs', () => {
    const result = parseCellId('AA01');
    expect(result).toBeDefined();
    expect(result?.row).toBe(26);
    expect(result?.col).toBe(0);
  });

  test('handles rows >= 26', () => {
    expect(Ids.cellId({ row: 26, col: 0 })).toSucceed();
  });
});
```

**Impact:** Covers lines 42-48, 60-63, 88-92 in ids.ts

## Priority 2: Add c8 Ignore Directives (MEDIUM PRIORITY)

These are defensive code paths that should be documented with c8 ignore directives:

### 2.1 Hint System Error Paths (hints.ts)

Lines 118-119, 181-182, 189-190, 193-194, 200-201, 204-205 are all defensive error handling for provider creation/registration that should never fail under normal circumstances.

```typescript
// Around line 187
if (finalConfig.enableNakedSingles) {
  const nakedProvider = NakedSinglesProvider.create();
  /* c8 ignore next 3 - defensive coding: provider creation should not fail */
  if (nakedProvider.isFailure()) {
    return fail(`Failed to create naked singles provider: ${nakedProvider.message}`);
  }
  const registerResult = registry.registerProvider(nakedProvider.value);
  /* c8 ignore next 3 - defensive coding: provider registration should not fail */
  if (registerResult.isFailure()) {
    return fail(`Failed to register naked singles provider: ${registerResult.message}`);
  }
}

// Similar for hidden singles around line 197-206
```

**Impact:** Covers 12 lines in hints.ts

### 2.2 Cage ID Creation Defensive Code (puzzle.ts)

Lines 109-114 handle errors from cage ID creation which should not fail:

```typescript
/* c8 ignore next 6 - defensive coding: cage ID creation validated earlier */
const cageIdResult = Ids.cageId(killerCage.id);
if (cageIdResult.isFailure()) {
  return fail(`Failed to create cage ID for killer cage ${killerCage.id}: ${cageIdResult.message}`);
}
const cageId = cageIdResult.value;
```

**Impact:** Covers 6 lines in puzzle.ts

### 2.3 Cell Consistency Check (puzzle.ts)

Lines 271-272 check for consistency between puzzle and state:

```typescript
/* c8 ignore next 2 - defensive coding: state should always match puzzle structure */
if (!this._state.containsCell(cellId)) {
  return fail(`Puzzle state does not contain cell ${cellId}`);
```

**Impact:** Covers 2 lines in puzzle.ts

## Priority 3: Test Utilities and Infrastructure (LOW PRIORITY)

### 3.1 Combination Cache LRU Behavior (combinationCache.ts)

**Add to:** `src/test/unit/puzzles/killerCombinations.test.ts`

```typescript
describe('CombinationCache', () => {
  afterEach(() => {
    CombinationCache.clear();
  });

  test('evicts cache when max size reached', () => {
    // Fill cache to max (1000 entries)
    for (let i = 0; i < 1000; i++) {
      CombinationCache.set(`key-${i}`, [[1, 2, 3]]);
    }
    expect(CombinationCache.size()).toBe(1000);

    // Adding one more should trigger clear
    CombinationCache.set('key-overflow', [[4, 5, 6]]);
    expect(CombinationCache.size()).toBeLessThan(1000);
  });

  test('clear() empties the cache', () => {
    CombinationCache.set('test-key', [[1, 2, 3]]);
    expect(CombinationCache.size()).toBeGreaterThan(0);
    CombinationCache.clear();
    expect(CombinationCache.size()).toBe(0);
  });

  test('size() returns current cache size', () => {
    CombinationCache.clear();
    expect(CombinationCache.size()).toBe(0);
    CombinationCache.set('key1', [[1, 2]]);
    expect(CombinationCache.size()).toBe(1);
    CombinationCache.set('key2', [[3, 4]]);
    expect(CombinationCache.size()).toBe(2);
  });
});
```

**Impact:** Covers lines 61-62, 73-74, 80-81 in combinationCache.ts

### 3.2 Filesystem Operations (filesystem.ts)

This requires actual file I/O. Consider whether this is worth testing or documenting as untested infrastructure:

**Option A - Add integration test:**
```typescript
test('loadJsonPuzzlesFileSync loads from filesystem', () => {
  const testFile = 'src/packlets/collections/data/puzzles.json';
  expect(loadJsonPuzzlesFileSync(testFile)).toSucceed();
});
```

**Option B - Add c8 ignore as infrastructure:**
```typescript
/* c8 ignore next 3 - filesystem I/O not tested in unit tests */
export function loadJsonPuzzlesFileSync(path: string): Result<IPuzzlesFile> {
  return JsonFile.convertJsonFileSync(path, puzzlesFile);
}
```

**Impact:** Covers lines 38-40 in filesystem.ts

### 3.3 Validator Registry API (puzzleDefinitions.ts)

**Add to:** `src/test/unit/common/puzzleDefinitions.test.ts`

```typescript
describe('validator registry', () => {
  test('getValidator returns correct validator for each type', () => {
    expect(PuzzleDefinitionFactory.getValidator('sudoku')).toBeDefined();
    expect(PuzzleDefinitionFactory.getValidator('killer-sudoku')).toBeDefined();
    expect(PuzzleDefinitionFactory.getValidator('sudoku-x')).toBeDefined();
  });

  test('registerValidator allows custom validators', () => {
    const customValidator = new StandardSudokuValidator();
    PuzzleDefinitionFactory.registerValidator('custom' as any, customValidator);
    expect(PuzzleDefinitionFactory.getValidator('custom' as any)).toBe(customValidator);
  });

  test('getStandardConfigs returns all configurations', () => {
    const configs = PuzzleDefinitionFactory.getStandardConfigs();
    expect(configs.puzzle4x4).toBeDefined();
    expect(configs.puzzle6x6).toBeDefined();
    expect(configs.puzzle9x9).toBeDefined();
    expect(configs.puzzle12x12).toBeDefined();
  });
});
```

**Impact:** Covers lines 357-358, 364-365, 371-372 in puzzleDefinitions.ts

## Priority 4: Investigate Potential Intermittent Coverage

Several files show very high coverage (99%+) with just a few lines uncovered. These may be intermittent coverage issues. Test by:

1. Running full test suite multiple times
2. Comparing results to identify inconsistency
3. If confirmed intermittent, add c8 ignore directive

**Files to investigate:**
- common/common.ts (lines 105-106)
- common/puzzleSession.ts (lines 82-83)
- hints/baseHintProvider.ts (lines 209-210)
- hints/nakedSingles.ts (lines 186-187)
- hints/hiddenSingles.ts (lines 295-297, 301)
- hints/explanations.ts (branches at 300-303)
- puzzles/killerCombinations.ts (line 189)
- puzzles/internal/combinationGenerator.ts (line 70)
- puzzles/internal/possibilityAnalyzer.ts (lines 93-94)

**Test command:**
```bash
# Run tests 5 times and compare coverage
for i in {1..5}; do rushx test 2>&1 | grep "All files" >> coverage-results.txt; done
```

## No Action Required

### Type-Only Exports
- **puzzles/killerCombinationsTypes.ts** - 0% coverage expected (TypeScript interfaces only)

## Implementation Plan

### Week 1: High Priority Tests (Estimated 3-4 hours)
1. ✅ Killer sudoku validation tests (1 hour)
2. ✅ Puzzle type validation tests (30 min)
3. ✅ Dimension validation tests (1 hour)
4. ✅ Non-standard grid size tests (1 hour)
5. ✅ Cell ID validation tests (30 min)

**Expected coverage after Week 1:** ~97.5%

### Week 2: Defensive Code Documentation (Estimated 1 hour)
1. ✅ Add c8 ignore directives to hint system (30 min)
2. ✅ Add c8 ignore directives to puzzle.ts (15 min)
3. ✅ Review and document all defensive code (15 min)

**Expected coverage after Week 2:** ~98.5%

### Week 3: Utilities and Investigation (Estimated 2-3 hours)
1. ✅ Cache utility tests (30 min)
2. ✅ Validator registry tests (30 min)
3. ✅ Large grid ID tests (30 min)
4. ✅ Investigate intermittent coverage (1 hour)
5. ✅ Document or test filesystem operations (30 min)

**Expected coverage after Week 3:** 100%

## Success Criteria

- [ ] All statements: 100%
- [ ] All branches: 100%
- [ ] All functions: 100%
- [ ] All coverage directives documented with clear reasons
- [ ] No testable business/validation logic skipped
- [ ] All defensive code clearly marked

## Notes

- Current 96% coverage indicates very well-tested codebase
- Most gaps are in error handling and edge cases
- No critical business logic appears untested
- Type-only file should potentially be excluded from coverage metrics
- Several potential intermittent coverage issues should be investigated
