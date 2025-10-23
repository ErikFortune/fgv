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

  console.log('Testing diagonal constraint scenario...');

  // Place same value on diagonal cells (A1, B2, C3)
  console.log('\n1. Placing 5 in A1...');
  const update1 = puzzle.updateCellValue('A1', 5, state);
  if (update1.isSuccess()) {
    state = update1.value.to;

    console.log('2. Placing 5 in B2...');
    const update2 = puzzle.updateCellValue('B2', 5, state);
    if (update2.isSuccess()) {
      state = update2.value.to;

      console.log('3. Placing 5 in C3...');
      const update3 = puzzle.updateCellValue('C3', 5, state);
      if (update3.isSuccess()) {
        state = update3.value.to;

        // Check validity of each cell
        const cellA1Result = puzzle.getCell('A1');
        const cellB2Result = puzzle.getCell('B2');
        const cellC3Result = puzzle.getCell('C3');

        if (cellA1Result.isSuccess() && cellB2Result.isSuccess() && cellC3Result.isSuccess()) {
          const cellA1 = cellA1Result.value;
          const cellB2 = cellB2Result.value;
          const cellC3 = cellC3Result.value;

          console.log('\n=== CELL VALIDATION RESULTS ===');
          console.log('A1 isValid:', cellA1.isValid(state));
          console.log('B2 isValid:', cellB2.isValid(state));
          console.log('C3 isValid:', cellC3.isValid(state));

          // Debug each cell's constraints
          console.log('\n=== CELL A1 ANALYSIS ===');
          console.log('A1 cages count:', cellA1.cages.length);
          console.log(
            'A1 cage types:',
            cellA1.cages.map((c) => c.cageType)
          );
          console.log(
            'A1 cage IDs:',
            cellA1.cages.map((c) => c.id)
          );

          // Check if any cage contains value 5 (excluding A1 itself)
          cellA1.cages.forEach((cage) => {
            const containsValue = cage.containsValue(5, state, ['A1']);
            console.log(`  - Cage ${cage.id} (${cage.cageType}) contains value 5:`, containsValue);
          });

          console.log('\n=== EXPECTED BEHAVIOR ===');
          console.log('Standard Sudoku should allow diagonal duplicates');
          console.log('A1, B2, C3 should all be VALID (true)');

          if (!cellA1.isValid(state) || !cellB2.isValid(state) || !cellC3.isValid(state)) {
            console.log('🚨 BUG CONFIRMED: Diagonal constraint incorrectly applied to Standard Sudoku!');
          } else {
            console.log('✅ Working correctly');
          }
        }
      }
    }
  }
} else {
  console.log('FAILED to create puzzle:', result.message);
}
