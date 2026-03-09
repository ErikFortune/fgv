# Variable Grid Size Analysis for ts-sudoku-lib

## Executive Summary

The ts-sudoku-lib codebase has a **WELL-DESIGNED architecture** with **excellent support for variable grid sizes**. The core framework is already dimension-agnostic. However, there are several **specific areas where hardcoded assumptions** need to be updated to fully support non-9x9 puzzles.

## Key Findings

### 1. Core Architecture - Excellent Foundation

The `IPuzzleDefinition` interface and `PuzzleDefinitionFactory` provide a flexible dimensional system:

```typescript
interface IPuzzleDimensions {
  readonly cageWidthInCells: number;      // e.g., 3 for 9x9
  readonly cageHeightInCells: number;     // e.g., 3 for 9x9
  readonly boardWidthInCages: number;     // e.g., 3 for 9x9 (3 cages × 3 cells = 9)
  readonly boardHeightInCages: number;    // e.g., 3 for 9x9
}

interface IPuzzleDefinition extends IPuzzleDimensions {
  readonly totalRows: number;             // cageHeightInCells * boardHeightInCages
  readonly totalColumns: number;          // cageWidthInCells * boardWidthInCages
  readonly maxValue: number;              // cageWidthInCells * cageHeightInCells
  readonly totalCages: number;            // boardWidthInCages * boardHeightInCages
  readonly basicCageTotal: number;        // Sum of 1..maxValue
}
```

**Status**: The interface completely eliminates hardcoded assumptions about grid size. Supports 4x4 through 25x25 (validator enforces max).

### 2. Puzzle Class (puzzle.ts) - Dimension-Agnostic

The `Puzzle` base class successfully creates rows, columns, and sections dynamically based on `IPuzzleDefinition`:

- Uses `puzzle.totalRows` and `puzzle.totalColumns` instead of hardcoded values
- Creates row/column/section cages using the dimensional parameters
- Cell parsing and validation use `puzzle.maxValue`
- Alphanumeric value parsing (1-9, A-Z) supports up to maxValue (25+)

**Status**: No hardcoded 9x9 assumptions in core puzzle logic.

### 3. Problem Area 1: SudokuXPuzzle Class (sudokuXPuzzle.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/puzzles/sudokuXPuzzle.ts`

**Lines 41-42**: Hardcoded 9x9 constraint
```typescript
if (puzzle.rows !== 9 || puzzle.cols !== 9) {
  return fail(`Sudoku X puzzle must be 9x9, got ${puzzle.rows}x${puzzle.cols}`);
}
```

**Issue**: 
- Uses non-existent `puzzle.rows` and `puzzle.cols` properties (should be `puzzle.totalRows` and `puzzle.totalColumns`)
- Unnecessarily restricts Sudoku X to 9x9
- Diagonal logic in `_getXCages()` is dimension-agnostic and works for any square grid

**Impact**: Sudoku X puzzles cannot be created for other sizes (though the restriction appears to be a bug since the property names are wrong).

**Fix Required**: 
- Remove the size restriction OR
- Make it dimension-agnostic by removing the check (diagonals work for any square)
- Use correct property names: `puzzle.totalRows` and `puzzle.totalColumns`

---

### 4. Problem Area 2: KillerCombinations Class (killerCombinations.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/puzzles/killerCombinations.ts`

**Lines 59, 111, 221, 242**: Hardcoded 1-9 range constraint

```typescript
if (!Number.isInteger(cageSize) || cageSize < 1 || cageSize > 9) {
  return fail(`Cage size must be an integer between 1 and 9, got ${cageSize}`);
}

// Similar checks in:
// Line 111: getCombinations()
// Line 221: _validateConstraints() - excludedNumbers
// Line 242: _validateConstraints() - requiredNumbers
```

**Root Cause**: The `totalsByCageSize` constant in `common.ts` only defines entries for cage sizes 1-9:

```typescript
export const totalsByCageSize: readonly { min: number; max: number }[] = [
  { min: 0, max: 0 },      // index 0 (unused)
  { min: 1, max: 9 },      // cage size 1
  { min: 3, max: 17 },     // cage size 2
  { min: 6, max: 24 },     // cage size 3
  // ... up to index 9
  { min: 45, max: 45 }     // cage size 9
];
```

**Impact**: 
- Cannot use killer sudoku with grids larger than 9x9
- Constraint values (1-9) are hardcoded in validation instead of using `maxValue`
- All 4 validation sites need updating

**Fix Required**:
- Extend `totalsByCageSize` to support cage sizes up to 25
- Replace hardcoded `1...9` ranges with `1...puzzle.maxValue`
- Update all validation checks to use dynamic `maxValue`

---

### 5. Problem Area 3: KillerSudokuPuzzle Class (killerSudokuPuzzle.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/puzzles/killerSudokuPuzzle.ts`

**Line 118**: Hardcoded 1-9 range
```typescript
if (cells.length < 1 || cells.length > 9) {
  throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
}
```

**Impact**: Killer sudoku cages are restricted to 1-9 cells (works for 9x9 with 3x3 boxes, but limiting for larger puzzles).

**Fix Required**: Use `puzzle.maxValue` or `puzzle.totalRows` to determine the maximum valid cage size.

---

### 6. Problem Area 4: NakedSingles Hint Provider (nakedSingles.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/hints/nakedSingles.ts`

**Lines 209, 219, 229-230**: Hardcoded 9x9 assumptions

```typescript
// Line 209: Same row iteration
for (let c = 0; c < 9; c++) {
  if (c !== col) { /* ... */ }
}

// Line 219: Same column iteration
for (let r = 0; r < 9; r++) {
  if (r !== row) { /* ... */ }
}

// Lines 229-230: 3x3 box hardcoded
const boxStartRow = Math.floor(row / 3) * 3;
const boxStartCol = Math.floor(col / 3) * 3;

for (let r = boxStartRow; r < boxStartRow + 3; r++) {
  for (let c = boxStartCol; c < boxStartCol + 3; c++) { /* ... */ }
}
```

**Also hardcoded in cell ID parsing** (lines 193-203):
```typescript
if (
  rowChar < 'A'.charCodeAt(0) ||
  rowChar > 'I'.charCodeAt(0) ||    // Hard-limits to A-I (9 rows)
  colChar < '1'.charCodeAt(0) ||
  colChar > '9'.charCodeAt(0)       // Hard-limits to 1-9 (9 columns)
) {
  return relatedCells;
}
```

**Explanations also hardcoded** (lines 131, 134, 155): References to "1-9", "3x3 box", etc.

**Impact**:
- Hint generation only works for 9x9 grids
- Cell related finding fails for larger grids
- Explanation text is 9x9-specific

**Fix Required**:
- Pass `Puzzle` instance to access `totalRows`, `totalColumns`, `cageHeightInCells`, `cageWidthInCells`
- Use dynamic loop bounds and box calculation
- Update explanation text to be dimension-aware

---

### 7. Problem Area 5: common.ts Constants (common.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/common/common.ts`

**Line 96-107**: `totalsByCageSize` array only has 10 entries (indices 0-9, supporting cage sizes 1-9)

```typescript
export const totalsByCageSize: readonly { min: number; max: number }[] = [
  { min: 0, max: 0 },
  { min: 1, max: 9 },
  { min: 3, max: 17 },
  // ... (missing entries for cage sizes 10-25)
];
```

**Fix Required**: Extend to support cage sizes up to 25 (for 25x25 grids).

Formula for min/max totals:
- **min**: Sum of 1..n = n(n+1)/2
- **max**: Sum of (maxValue-n+1)..maxValue = Sum of 1..n where values are offset

---

### 8. Problem Area 6: PuzzleCollection (collections.ts)

**File**: `/libraries/ts-sudoku-lib/src/packlets/collections/collections.ts`

**Lines 112-116**: Configuration detection via hardcoded cell counts

```typescript
if (totalCells === 16) config = STANDARD_CONFIGS.puzzle4x4;
else if (totalCells === 36) config = STANDARD_CONFIGS.puzzle6x6;
else if (totalCells === 81) config = STANDARD_CONFIGS.puzzle9x9;
else if (totalCells === 144) config = STANDARD_CONFIGS.puzzle12x12;
else config = STANDARD_CONFIGS.puzzle9x9; // fallback
```

**Issue**: 
- Limited to known configurations
- No way to load custom-sized puzzles from files
- Falls back to 9x9, which may be incorrect

**Fix Required**: 
- Add metadata to puzzle file format (or calculate from cell string format)
- Support custom dimensions in PuzzleDefinition
- Better fallback strategy

---

## Summary Table

| Component | Issue | Severity | Lines | Status |
|-----------|-------|----------|-------|--------|
| **SudokuXPuzzle** | Wrong property names + 9x9 restriction | CRITICAL | 41-42 | Bug exists |
| **KillerCombinations** | Hardcoded 1-9 range | HIGH | 59,111,221,242 | 4 locations |
| **KillerSudokuPuzzle** | Hardcoded cage size limit | MEDIUM | 118 | 1 location |
| **NakedSingles** | 9x9 loops + cell ID limits | HIGH | 209,219,229-230,193-203 | Multiple |
| **common.ts** | `totalsByCageSize` incomplete | HIGH | 96-107 | Missing entries |
| **PuzzleCollection** | Hardcoded config detection | MEDIUM | 112-116 | Fallback issue |

---

## Architecture Strengths

1. **IPuzzleDefinition Interface**: Fully dimensional, eliminates all hardcoded size assumptions
2. **Puzzle Base Class**: Already dimension-agnostic for core functionality
3. **Dimension-aware Factory**: `PuzzleDefinitionFactory` validates and creates puzzles for any valid size
4. **Cell/Cage System**: Uses dynamic collections, no size assumptions
5. **Alphanumeric Encoding**: Supports values 1-9, A-Z, a-z (up to 52+ values for large grids)

---

## Recommendations for Variable Grid Size Support

### High Priority (Blocking Variable Grids)
1. **Fix SudokuXPuzzle property names and remove 9x9 restriction**
2. **Extend `totalsByCageSize` to support cage sizes 1-25**
3. **Update KillerCombinations validation to use dynamic `maxValue`**
4. **Refactor NakedSingles to accept Puzzle context for dynamic bounds**

### Medium Priority (Needed for Full Support)
5. **Update KillerSudokuPuzzle cage validation**
6. **Improve PuzzleCollection configuration detection**
7. **Make all hint providers dimension-aware** (check other hint types too)
8. **Update explanation text to be dynamic**

### Low Priority (QoL Improvements)
9. **Support metadata-based grid size detection**
10. **Add standard configs for additional grid sizes (6x6, 8x8, 10x10)**

---

## Files That Need No Changes

- ✅ Cell ID generation (ids.ts) - Uses dynamic character codes
- ✅ Cage creation (cage.ts) - Fully dynamic
- ✅ Puzzle Session (puzzleSession.ts) - Accesses dimension properties correctly
- ✅ PuzzleState (puzzleState.ts) - No size assumptions
- ✅ All core validation - Uses maxValue and dimension parameters
