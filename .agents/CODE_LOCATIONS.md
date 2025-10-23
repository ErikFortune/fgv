# Variable Grid Size - Code Location Reference

## Critical Issues and Exact Code Locations

### 1. SudokuXPuzzle - CRITICAL BUG (sudokuXPuzzle.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/puzzles/sudokuXPuzzle.ts`

**Lines 41-42**: Invalid property names and hardcoded restriction
```typescript
41  if (puzzle.rows !== 9 || puzzle.cols !== 9) {
42    return fail(`Sudoku X puzzle must be 9x9, got ${puzzle.rows}x${puzzle.cols}`);
```

**Problems**:
- References `puzzle.rows` and `puzzle.cols` - these properties do NOT exist
- Should use `puzzle.totalRows` and `puzzle.totalColumns`
- Unnecessary 9x9 restriction (diagonals work for any square)

**Correct Fix**:
```typescript
// Remove lines 41-42 entirely, or replace with:
if (puzzle.totalRows !== puzzle.totalColumns) {
  return fail(`Sudoku X puzzle must be square, got ${puzzle.totalRows}x${puzzle.totalColumns}`);
}
```

**Status**: This appears to be why SudokuX support isn't working at all.

---

### 2. KillerCombinations - Hardcoded 1-9 Range (killerCombinations.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/puzzles/killerCombinations.ts`

#### Location 1: getPossibleTotals() method
**Lines 59-60**:
```typescript
if (!Number.isInteger(cageSize) || cageSize < 1 || cageSize > 9) {
  return fail(`Cage size must be an integer between 1 and 9, got ${cageSize}`);
}
```

#### Location 2: getCombinations() method
**Lines 111-112**:
```typescript
if (!Number.isInteger(cageSize) || cageSize < 1 || cageSize > 9) {
  return fail(`Cage size must be an integer between 1 and 9, got ${cageSize}`);
}
```

#### Location 3: _validateConstraints() - excludedNumbers
**Lines 221-222**:
```typescript
if (!Number.isInteger(num) || num < 1 || num > 9) {
  return fail(`excludedNumbers must contain integers between 1-9, got ${num}`);
}
```

#### Location 4: _validateConstraints() - requiredNumbers
**Lines 242-243**:
```typescript
if (!Number.isInteger(num) || num < 1 || num > 9) {
  return fail(`requiredNumbers must contain integers between 1-9, got ${num}`);
}
```

**Fix Strategy**: 
- All checks should accept `maxValue` parameter
- Pass from caller (getPuzzle context)
- Replace hardcoded 9 with dynamic `maxValue`

---

### 3. common.ts - Incomplete totalsByCageSize Lookup (common.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/common/common.ts`

**Lines 96-107**: Array definition
```typescript
export const totalsByCageSize: readonly { min: number; max: number }[] = [
  { min: 0, max: 0 },      // index 0 (unused)
  { min: 1, max: 9 },      // cage size 1
  { min: 3, max: 17 },     // cage size 2
  { min: 6, max: 24 },     // cage size 3
  { min: 10, max: 30 },    // cage size 4
  { min: 15, max: 35 },    // cage size 5
  { min: 21, max: 39 },    // cage size 6
  { min: 28, max: 42 },    // cage size 7
  { min: 36, max: 44 },    // cage size 8
  { min: 45, max: 45 }     // cage size 9
];
```

**Missing**: Entries for cage sizes 10-25 (needed for larger grids)

**Calculation Formula**:
```
For cage size n:
- min: sum of 1..n = n * (n + 1) / 2
- max: sum of (maxValue - n + 1) to maxValue
      = sum of 1..n where lowest is (maxValue - n + 1)
      = n * (2*maxValue - n + 1) / 2
```

**Required Extension** (for cage sizes 10-25):
```typescript
{ min: 55, max: 45 },      // cage size 10 (10*11/2 to 55+44+...+46)
// ... more entries ...
{ min: 325, max: 325 }     // cage size 25 (25*26/2)
```

---

### 4. KillerSudokuPuzzle - Hardcoded Cage Size (killerSudokuPuzzle.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/puzzles/killerSudokuPuzzle.ts`

**Lines 118-120**: Cage size validation
```typescript
if (cells.length < 1 || cells.length > 9) {
  throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
}
```

**Context**: This is inside `_getCages()` method that processes killer cage definitions

**Fix**: Replace with:
```typescript
if (cells.length < 1 || cells.length > __puzzle.maxValue) {
  throw new Error(`invalid cell count ${cells.length} for cage ${cageId}`);
}
```

**Note**: The `__puzzle` parameter is already available (currently unused/prefixed with __)

---

### 5. NakedSingles - Multiple Hardcoded 9x9 Assumptions (nakedSingles.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/hints/nakedSingles.ts`

#### Issue 5a: Cell ID Parsing Limits (Lines 179-203)

**Lines 193-203**:
```typescript
if (
  rowChar < 'A'.charCodeAt(0) ||
  rowChar > 'I'.charCodeAt(0) ||        // HARDCODED: A-I (9 rows)
  colChar < '1'.charCodeAt(0) ||
  colChar > '9'.charCodeAt(0)           // HARDCODED: 1-9 (9 columns)
) {
  return relatedCells;
}

const row = rowChar - 'A'.charCodeAt(0); // A=0, B=1, ..., I=8
const col = colChar - '1'.charCodeAt(0); // 1=0, 2=1, ..., 9=8
```

**Problem**: Hard-limits cell ID parsing to 9x9 grids. Won't parse cells like J1 or A10.

**Fix Required**: 
- Accept `Puzzle` parameter or `totalRows`, `totalColumns`
- Dynamically calculate limits
- Handle multi-character column numbers for grids > 9x9

#### Issue 5b: Row Iteration (Line 209)

**Lines 209-216**:
```typescript
for (let c = 0; c < 9; c++) {          // HARDCODED: 9 columns
  if (c !== col) {
    const checkIdResult = Ids.cellId({ row, col: c });
    if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
      relatedCells.push(checkIdResult.value);
    }
  }
}
```

**Fix**: Use puzzle dimensions
```typescript
for (let c = 0; c < puzzle.totalColumns; c++) {
```

#### Issue 5c: Column Iteration (Line 219)

**Lines 219-226**:
```typescript
for (let r = 0; r < 9; r++) {          // HARDCODED: 9 rows
  if (r !== row) {
    const checkIdResult = Ids.cellId({ row: r, col });
    if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
      relatedCells.push(checkIdResult.value);
    }
  }
}
```

**Fix**: Use puzzle dimensions
```typescript
for (let r = 0; r < puzzle.totalRows; r++) {
```

#### Issue 5d: Section/Box Iteration (Lines 229-241)

**Lines 229-241**:
```typescript
const boxStartRow = Math.floor(row / 3) * 3;    // HARDCODED: 3x3 box
const boxStartCol = Math.floor(col / 3) * 3;

for (let r = boxStartRow; r < boxStartRow + 3; r++) {     // HARDCODED: +3
  for (let c = boxStartCol; c < boxStartCol + 3; c++) {   // HARDCODED: +3
    if (r !== row || c !== col) {
      const checkIdResult = Ids.cellId({ row: r, col: c });
      if (checkIdResult.isSuccess() && state.hasValue(checkIdResult.value)) {
        relatedCells.push(checkIdResult.value);
      }
    }
  }
}
```

**Fix**: Use puzzle dimensions
```typescript
const boxStartRow = Math.floor(row / puzzle.cageHeightInCells) * puzzle.cageHeightInCells;
const boxStartCol = Math.floor(col / puzzle.cageWidthInCells) * puzzle.cageWidthInCells;

for (let r = boxStartRow; r < boxStartRow + puzzle.cageHeightInCells; r++) {
  for (let c = boxStartCol; c < boxStartCol + puzzle.cageWidthInCells; c++) {
```

#### Issue 5e: Explanation Text Hardcoded (Lines 130-134, 155-156)

**Lines 130-131** (detailed explanation):
```typescript
`Cell ${cellId} has only one possible candidate: ${value}. All other values (1-9) are ` +
`eliminated by existing numbers in the same row, column, or 3x3 box.`,
```

**Lines 134**:
```typescript
`Check which values 1-9 are already used in the same row, column, and 3x3 box`,
```

**Lines 155-156** (educational explanation):
```typescript
`In cell ${cellId}, the value ${value} is the only number from 1-9 that doesn't already appear in the ` +
`same row, column, or 3x3 box. This makes it a "naked" single because the solution is immediately visible.`,
```

**Lines 156-157**:
```typescript
`Scan the 3x3 box containing ${cellId} and note which numbers 1-9 are already placed`,
```

**Fix**: Make dynamic based on `puzzle.maxValue` and box dimensions

---

### 6. PuzzleCollection - Hardcoded Configuration Detection (collections.ts)

**File**: `/Users/erik/Development/cursor/variable-grid-sizes/libraries/ts-sudoku-lib/src/packlets/collections/collections.ts`

**Lines 99-125** (_convertToDefinition method):
```typescript
private _convertToDefinition(fileData: Files.Model.IPuzzleFileData): Result<IPuzzleDefinition> {
  // Determine standard config based on cell count
  let config: {
    cageWidthInCells: number;
    cageHeightInCells: number;
    boardWidthInCages: number;
    boardHeightInCages: number;
  };

  // For killer sudoku, cells includes cage definitions after '|' separator
  const gridCells = fileData.type === 'killer-sudoku' ? fileData.cells.split('|')[0] : fileData.cells;
  const totalCells = gridCells.length;

  if (totalCells === 16) config = STANDARD_CONFIGS.puzzle4x4;
  else if (totalCells === 36) config = STANDARD_CONFIGS.puzzle6x6;
  else if (totalCells === 81) config = STANDARD_CONFIGS.puzzle9x9;
  else if (totalCells === 144) config = STANDARD_CONFIGS.puzzle12x12;
  else config = STANDARD_CONFIGS.puzzle9x9; // fallback

  return PuzzleDefinitionFactory.create(config, {
    // ...
  });
}
```

**Problems**:
1. Assumes file data contains no metadata about dimensions
2. Limited to 4 predefined sizes
3. Falls back to 9x9 for unknown sizes (dangerous)
4. Cannot load custom-sized puzzles

**Fix Strategy**:
- Add `dimensions` field to `IPuzzleFileData`
- Or: Support dimension detection from file metadata
- Or: Add dimensions as URL parameters/query
- Remove hardcoded fallback

---

## Summary of Required Changes

| File | Lines | Type | Priority |
|------|-------|------|----------|
| sudokuXPuzzle.ts | 41-42 | Fix property names + remove restriction | CRITICAL |
| common.ts | 96-107 | Extend array to cage sizes 1-25 | HIGH |
| killerCombinations.ts | 59, 111, 221, 242 | Replace hardcoded 9 with maxValue | HIGH |
| nakedSingles.ts | 193-203, 209, 219, 229-230, 130-131, 134, 155-156 | Make dimension-aware | HIGH |
| killerSudokuPuzzle.ts | 118 | Use maxValue | MEDIUM |
| collections.ts | 99-125 | Add metadata support | MEDIUM |

---

## Testing Approach

After fixes:
1. Test SudokuX creation with 4x4, 6x6, 9x9, 12x12
2. Test KillerCombinations with cage sizes 1-25
3. Test KillerSudoku with various grid sizes
4. Test NakedSingles hint generation for non-9x9 grids
5. Test PuzzleCollection loading of various grid sizes

