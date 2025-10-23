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
  console.log('SUCCESS - Puzzle created');
  console.log('- Type:', puzzle.type);
  console.log('- Constructor:', puzzle.constructor.name);
  console.log('- Total cages:', puzzle.cages.length);

  const cageTypes = {};
  puzzle.cages.forEach((cage) => {
    cageTypes[cage.cageType] = (cageTypes[cage.cageType] || 0) + 1;
  });
  console.log('- Cage counts by type:', cageTypes);

  const hasX1 = puzzle.cages.some((c) => c.id === 'X1');
  const hasX2 = puzzle.cages.some((c) => c.id === 'X2');
  console.log('- Has X1 diagonal cage:', hasX1);
  console.log('- Has X2 diagonal cage:', hasX2);

  if (hasX1 || hasX2) {
    console.log('🚨 BUG FOUND: Standard Sudoku has diagonal cages!');
  } else {
    console.log('✅ Standard Sudoku correctly has no diagonal cages');
  }
} else {
  console.log('FAILED to create puzzle:', result.message);
}
