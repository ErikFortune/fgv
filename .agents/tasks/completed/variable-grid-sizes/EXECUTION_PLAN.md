# Variable Grid Size Implementation - Execution Plan

## Overview

The ts-sudoku-lib codebase has excellent architectural support for variable grid sizes. The framework is largely dimension-agnostic. However, 6 specific areas contain hardcoded 9x9 assumptions that prevent non-standard puzzles from working correctly.

## Implementation Priority

### Phase 1: Critical Fixes (Unblocks Everything)

These fixes are prerequisites for any variable grid size support to work.

#### 1.1 Fix SudokuXPuzzle Property Names and Restriction
**File**: `libraries/ts-sudoku-lib/src/packlets/puzzles/sudokuXPuzzle.ts` (Lines 41-42)

**Current Code**:
```typescript
if (puzzle.rows !== 9 || puzzle.cols !== 9) {
  return fail(`Sudoku X puzzle must be 9x9, got ${puzzle.rows}x${puzzle.cols}`);
}
```

**Issues**:
- `puzzle.rows` and `puzzle.cols` do not exist (should be `puzzle.totalRows` and `puzzle.totalColumns`)
- Hardcoded 9x9 restriction

**Solution**:
```typescript
// Remove restriction - diagonals work for any square grid
if (puzzle.totalRows !== puzzle.totalColumns) {
  return fail(`Sudoku X puzzle must be square, got ${puzzle.totalRows}x${puzzle.totalColumns}`);
}
```

**Effort**: 5 minutes
**Test**: Create 4x4, 6x6, 12x12 SudokuX puzzles

---

#### 1.2 Extend totalsByCageSize Constant
**File**: `libraries/ts-sudoku-lib/src/packlets/common/common.ts` (Lines 96-107)

**Current Code**: Array with indices 0-9 (supporting cage sizes 1-9 only)

**Solution**: Extend to cage sizes 1-25

**Implementation**:
```typescript
function calculateTotalsByCageSize(): { min: number; max: number }[] {
  const result = [
    { min: 0, max: 0 }  // index 0 (unused)
  ];
  
  for (let cageSize = 1; cageSize <= 25; cageSize++) {
    const min = (cageSize * (cageSize + 1)) / 2;
    // For max, we need to know maxValue - for now use 25
    const maxValue = 25;
    const max = (cageSize * (2 * maxValue - cageSize + 1)) / 2;
    result.push({ min, max });
  }
  
  return result;
}

export const totalsByCageSize = calculateTotalsByCageSize();
```

**Alternative**: Hardcode the values (simpler, no runtime calculation)

**Effort**: 15 minutes
**Test**: Verify totals for cage sizes 1-25 are correct

---

#### 1.3 Update KillerCombinations Validation
**File**: `libraries/ts-sudoku-lib/src/packlets/puzzles/killerCombinations.ts` (Lines 59, 111, 221, 242)

**Current**: Hardcoded checks for `cageSize < 1 || cageSize > 9`

**Solution**: Make validation dynamic

**Approach 1 - Context-aware validation**:
- Add `maxValue: number` parameter to all public methods
- Update validation to use `cageSize > maxValue`

**Approach 2 - Remove upper bound entirely**:
- Check against `totalsByCageSize[cageSize]` existence instead
- Let array size naturally limit valid cage sizes

**Recommendation**: Approach 2 (simpler, more elegant)

**Changes**:
```typescript
// Line 59-60: Replace with
const bounds = totalsByCageSize[cageSize];
if (!bounds) {
  return fail(`Cage size ${cageSize} is not supported`);
}

// Line 111-112: Same pattern
// Line 221-222: Same pattern for excludedNumbers
// Line 242-243: Same pattern for requiredNumbers
```

**Effort**: 20 minutes
**Test**: Killer combinations work for all supported cage sizes

---

### Phase 2: Medium Priority (Blocking Larger Puzzles)

These fixes enable specific puzzle types for variable sizes.

#### 2.1 Update KillerSudokuPuzzle Cage Size Validation
**File**: `libraries/ts-sudoku-lib/src/packlets/puzzles/killerSudokuPuzzle.ts` (Line 118)

**Current Code**:
```typescript
if (cells.length < 1 || cells.length > 9) {
  throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
}
```

**Solution**:
```typescript
const maxCageSize = Math.min(__puzzle.maxValue, __puzzle.totalRows);
if (cells.length < 1 || cells.length > maxCageSize) {
  throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
}
```

**Effort**: 5 minutes
**Test**: Killer sudoku works with various grid sizes

---

#### 2.2 Refactor NakedSingles for Dimension Awareness
**File**: `libraries/ts-sudoku-lib/src/packlets/hints/nakedSingles.ts` (Multiple locations)

**Current Issues**:
- Lines 193-203: Hard-limits cell ID parsing to A-I, 1-9
- Lines 209, 219: Hardcoded 9 loops
- Lines 229-230: Hardcoded 3x3 box dimensions
- Lines 130-134, 155-156: Explanation text references "1-9" and "3x3 box"

**Solution Strategy**:
1. Change method signature to accept `puzzle: Puzzle` parameter
2. Use `puzzle.totalRows`, `puzzle.totalColumns`, `puzzle.cageHeightInCells`, `puzzle.cageWidthInCells`
3. Update explanation templates dynamically

**Implementation Steps**:

**Step 2.2a: Pass Puzzle to _findRelatedCells**
```typescript
private _findRelatedCells(cellId: CellId, value: number, state: PuzzleState, puzzle: Puzzle): CellId[] {
  // ... cell parsing logic remains similar
  
  // Same row
  for (let c = 0; c < puzzle.totalColumns; c++) {
    // ...
  }
  
  // Same column
  for (let r = 0; r < puzzle.totalRows; r++) {
    // ...
  }
  
  // Same box
  const boxStartRow = Math.floor(row / puzzle.cageHeightInCells) * puzzle.cageHeightInCells;
  const boxStartCol = Math.floor(col / puzzle.cageWidthInCells) * puzzle.cageWidthInCells;
  
  for (let r = boxStartRow; r < boxStartRow + puzzle.cageHeightInCells; r++) {
    for (let c = boxStartCol; c < boxStartCol + puzzle.cageWidthInCells; c++) {
      // ...
    }
  }
}
```

**Step 2.2b: Update Caller in _createNakedSingleHint**
```typescript
const relatedCells = this._findRelatedCells(cellId, value, state, puzzle);
```

**Step 2.2c: Update Explanation Text**
```typescript
const maxValue = puzzle.maxValue;
const boxDim = `${puzzle.cageHeightInCells}x${puzzle.cageWidthInCells}`;

const explanations = [
  this.createExplanation(
    'detailed',
    'Naked Single Analysis',
    `Cell ${cellId} has only one possible candidate: ${value}. ` +
    `All other values (1-${maxValue}) are eliminated by existing numbers ` +
    `in the same row, column, or ${boxDim} section.`,
    // ... rest of steps
  ),
  // ... other explanations
];
```

**Effort**: 40 minutes
**Test**: NakedSingles hints work for 4x4, 6x6, 9x9, 12x12 puzzles

---

### Phase 3: Enhancement (Nice to Have)

#### 3.1 Improve PuzzleCollection Configuration Detection
**File**: `libraries/ts-sudoku-lib/src/packlets/collections/collections.ts` (Lines 99-125)

**Current Limitation**: Only supports 4 predefined sizes, falls back to 9x9

**Solution Options**:

**Option A - Add metadata to file format** (recommended for long-term):
```typescript
interface IPuzzleFileData {
  // ... existing fields ...
  dimensions?: {
    cageWidthInCells: number;
    cageHeightInCells: number;
    boardWidthInCages: number;
    boardHeightInCages: number;
  };
}
```

**Option B - Better heuristic detection**:
```typescript
private _detectDimensions(totalCells: number): Result<IPuzzleDimensions> {
  // Calculate possible factorizations
  const sqrtCells = Math.sqrt(totalCells);
  if (!Number.isInteger(sqrtCells)) {
    return fail(`Cannot auto-detect dimensions for ${totalCells} cells`);
  }
  
  // For known configurations
  const knownConfigs = [
    { cells: 16, config: STANDARD_CONFIGS.puzzle4x4 },
    { cells: 36, config: STANDARD_CONFIGS.puzzle6x6 },
    // ... more
  ];
  
  const known = knownConfigs.find(k => k.cells === totalCells);
  if (known) return succeed(known.config);
  
  // Fallback: assume square grid with square sections
  // Requires more sophisticated logic
  return fail(`Cannot auto-detect dimensions for ${totalCells} cells`);
}
```

**Effort**: 30-60 minutes
**Test**: Load puzzles of various sizes from collection

---

## Implementation Checklist

### Phase 1: Critical
- [ ] Fix SudokuXPuzzle (5 min)
- [ ] Extend totalsByCageSize (15 min)
- [ ] Update KillerCombinations validation (20 min)
- [ ] **Phase 1 Total: 40 minutes**

### Phase 2: Medium
- [ ] Update KillerSudokuPuzzle (5 min)
- [ ] Refactor NakedSingles (40 min)
- [ ] **Phase 2 Total: 45 minutes**

### Phase 3: Enhancement
- [ ] Improve PuzzleCollection (30-60 min)
- [ ] **Phase 3 Total: 30-60 minutes**

**Total Effort**: 2-3 hours for full implementation

---

## Testing Strategy

### Unit Tests to Update/Add

1. **SudokuXPuzzle tests**:
   - Add tests for 4x4, 6x6, 12x12 SudokuX creation
   - Verify diagonal cage cells are correct

2. **KillerCombinations tests**:
   - Add tests for cage sizes 10-25
   - Verify totals calculations are correct

3. **NakedSingles tests**:
   - Test with 4x4, 6x6, 12x12 grids
   - Verify related cells calculated correctly for different box sizes
   - Verify explanation text is dimension-aware

4. **Integration tests**:
   - Create and solve puzzles of various sizes
   - Verify hint generation works across all sizes

### Manual Testing

1. Create 4x4, 6x6, 8x8, 10x10, 12x12 standard sudoku
2. Create 4x4, 9x9 Sudoku X puzzles
3. Create 4x4, 6x6, 9x9 Killer Sudoku puzzles
4. Generate hints for each and verify correctness

---

## Risk Analysis

### Low Risk Changes
- SudokuXPuzzle fix (critical bug, clear solution)
- totalsByCageSize extension (deterministic calculations)
- KillerCombinations refactoring (changes internal validation only)

### Medium Risk Changes
- NakedSingles refactoring (affects hint generation, impacts UI)
- Need to ensure backward compatibility

### Mitigation
- All changes are backward compatible with 9x9 puzzles
- Comprehensive test coverage before commit
- Test with both standard and extended sizes

---

## Success Criteria

- [ ] All standard 9x9 puzzles work identically (backward compatibility)
- [ ] 4x4, 6x6, 12x12 puzzles can be created and solved
- [ ] Hints generate correctly for all supported sizes
- [ ] All existing tests pass
- [ ] New tests added for variable size support
- [ ] No hardcoded 9x9 assumptions remaining in core library

