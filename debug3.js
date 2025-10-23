const { Puzzles } = require('./libraries/ts-sudoku-lib/lib/index.js');

const testPuzzle = {
  type: 'sudoku',
  description: 'test',
  rows: 9,
  cols: 9,
  cells: '.'.repeat(81)
};

console.log('Creating puzzle...');
const result = Puzzles.Any.create(testPuzzle);

if (result.isSuccess()) {
  const puzzle = result.value;
  let state = puzzle.initialState;

  console.log('Testing CORRECT diagonal scenario (different sections)...');

  // Place same value on TRUE diagonal cells that are in different sections
  // A1 (0,0) - section SA1
  // E5 (4,4) - section SE4
  // I9 (8,8) - section SG7

  console.log('\n1. Placing 5 in A1 (section SA1)...');
  const update1 = puzzle.updateCellValue('A1', 5, state);
  if (update1.isSuccess()) {
    state = update1.value.to;

    console.log('2. Placing 5 in E5 (section SE4)...');
    const update2 = puzzle.updateCellValue('E5', 5, state);
    if (update2.isSuccess()) {
      state = update2.value.to;

      console.log('3. Placing 5 in I9 (section SG7)...');
      const update3 = puzzle.updateCellValue('I9', 5, state);
      if (update3.isSuccess()) {
        state = update3.value.to;

        // Check validity of each cell
        const cellA1Result = puzzle.getCell('A1');
        const cellE5Result = puzzle.getCell('E5');
        const cellI9Result = puzzle.getCell('I9');

        if (cellA1Result.isSuccess() && cellE5Result.isSuccess() && cellI9Result.isSuccess()) {
          const cellA1 = cellA1Result.value;
          const cellE5 = cellE5Result.value;
          const cellI9 = cellI9Result.value;

          console.log('\n=== CELL VALIDATION RESULTS ===');
          console.log('A1 isValid:', cellA1.isValid(state));
          console.log('E5 isValid:', cellE5.isValid(state));
          console.log('I9 isValid:', cellI9.isValid(state));

          // Check sections
          console.log('\n=== SECTION ANALYSIS ===');
          const a1Section = puzzle.getSection({ row: 0, col: 0 });
          const e5Section = puzzle.getSection({ row: 4, col: 4 });
          const i9Section = puzzle.getSection({ row: 8, col: 8 });

          if (a1Section.isSuccess() && e5Section.isSuccess() && i9Section.isSuccess()) {
            console.log('A1 section:', a1Section.value.id);
            console.log('E5 section:', e5Section.value.id);
            console.log('I9 section:', i9Section.value.id);
          }

          console.log('\n=== EXPECTED BEHAVIOR ===');
          console.log('Standard Sudoku should allow diagonal duplicates in different sections');
          console.log('A1, E5, I9 should all be VALID (true)');

          if (cellA1.isValid(state) && cellE5.isValid(state) && cellI9.isValid(state)) {
            console.log('✅ Standard Sudoku works correctly - diagonal duplicates allowed');
          } else {
            console.log('🚨 BUG: Standard Sudoku incorrectly rejecting diagonal duplicates');
          }
        }
      }
    }
  }

  // Also test the WRONG test case (same section)
  console.log('\n\n=== TESTING ORIGINAL (INCORRECT) TEST CASE ===');
  let state2 = puzzle.initialState;

  console.log('Testing A1, B2, C3 (all in same section SA1)...');
  const update1b = puzzle.updateCellValue('A1', 5, state2);
  if (update1b.isSuccess()) {
    state2 = update1b.value.to;
    const update2b = puzzle.updateCellValue('B2', 5, state2);
    if (update2b.isSuccess()) {
      state2 = update2b.value.to;

      const cellA1Result = puzzle.getCell('A1');
      const cellB2Result = puzzle.getCell('B2');

      if (cellA1Result.isSuccess() && cellB2Result.isSuccess()) {
        const cellA1 = cellA1Result.value;
        const cellB2 = cellB2Result.value;

        console.log('A1 isValid:', cellA1.isValid(state2));
        console.log('B2 isValid:', cellB2.isValid(state2));
        console.log('EXPECTED: Both should be FALSE (same section constraint)');

        const a1Section = puzzle.getSection({ row: 0, col: 0 });
        const b2Section = puzzle.getSection({ row: 1, col: 1 });

        if (a1Section.isSuccess() && b2Section.isSuccess()) {
          console.log('A1 section:', a1Section.value.id);
          console.log('B2 section:', b2Section.value.id);
          console.log('Same section:', a1Section.value.id === b2Section.value.id);
        }
      }
    }
  }
} else {
  console.log('FAILED to create puzzle:', result.message);
}
