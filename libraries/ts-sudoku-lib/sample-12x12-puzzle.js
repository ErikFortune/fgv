#!/usr/bin/env node

// Sample 12x12 puzzle generated from screenshot
const { PuzzleDefinitionFactory, STANDARD_CONFIGS } = require('./lib/packlets/common');

console.log('🧩 Sample 12x12 Sudoku Puzzle\n');

// 12x12 puzzle from screenshot
// Note: A=10, B=11, C=12 in standard 12x12 Sudoku
// Rebuilding with exact 12 chars per row (total 144):
// Row 0:  ..1.6.2.A7..  (12 chars)
// Row 1:  62.5B....1..  (12 chars)
// Row 2:  .8....C3B.62  (12 chars)
// Row 3:  A97.2.6..B5.  (12 chars)
// Row 4:  .5......37C.  (12 chars) - was missing final .
// Row 5:  3B....7...9.  (12 chars) - was missing final .
// Row 6:  57B.4.....1.  (12 chars) - was missing final .
// Row 7:  8.....A.9...  (12 chars) - was missing final .
// Row 8:  .4..97...6..  (12 chars)
// Row 9:  .1C.......B.  (12 chars) - was missing final .
// Row 10: 4....2.C....  (12 chars) - was missing final .
// Row 11: ....5C..7126  (12 chars)

const puzzle12x12Description = {
  description: 'Sample 12x12 Sudoku #1',
  type: 'sudoku',
  level: 3,
  cells:
    '..1.6.2.A7..62.5B....1...8....C3B.62A97.2.6..B5..5......37C.3B....7...9.57B.4.....1.8.....A.9....4..97...6...1C.......B.4....2.C........5C..7126'
};

// Create puzzle definition
console.log('Creating 12x12 puzzle definition...\n');

const puzzleResult = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle12x12, puzzle12x12Description);

if (puzzleResult.isSuccess()) {
  const puzzle = puzzleResult.value;

  console.log('✅ 12x12 Puzzle:');
  console.log(`  Description: ${puzzle.description}`);
  console.log(`  Grid: ${puzzle.totalRows}x${puzzle.totalColumns}`);
  console.log(`  Cage dimensions: ${puzzle.cageWidthInCells}x${puzzle.cageHeightInCells} (4 wide x 3 high)`);
  console.log(`  Board dimensions: ${puzzle.boardWidthInCages}x${puzzle.boardHeightInCages} cages`);
  console.log(`  Max value: ${puzzle.maxValue}`);
  console.log(`  Cage total: ${puzzle.basicCageTotal} (sum 1+2+...+12 = 78)`);
  console.log(`  Cells: ${puzzle.cells}`);
  console.log('\n  Grid layout:');

  for (let row = 0; row < 12; row++) {
    const rowCells = puzzle.cells.slice(row * 12, (row + 1) * 12).split('');
    const displayRow = rowCells.map((c) => (c === '.' ? ' ' : c)).join(' ');
    console.log(`    ${displayRow}`);

    // Show cage boundaries after rows 2, 5, 8
    if (row === 2 || row === 5 || row === 8) {
      console.log('    -----------------------------------------------'); // Horizontal cage separator
    }
  }

  console.log('\n  Cage structure (4x3 sections):');
  console.log('    Each cage is 4 cells wide × 3 cells high');
  console.log('    Grid has 3×4 = 12 total cages');
  console.log('    Values: 1,2,3,4,5,6,7,8,9,A(10),B(11),C(12)');

  console.log('\n🎯 12x12 puzzle definition created successfully!');
  console.log('This puzzle uses 4x3 cage dimensions with 3x4 cage layout.');
  console.log('Each cage must contain all values 1-12 (represented as 1-9,A,B,C).');
} else {
  console.error('❌ Failed to create 12x12 puzzle definition:');
  console.error(`  Error: ${puzzleResult.message}`);
}
