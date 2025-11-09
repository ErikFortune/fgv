#!/usr/bin/env node

// Sample 6x6 puzzle generated from screenshot
const { PuzzleDefinitionFactory, STANDARD_CONFIGS } = require('./lib/packlets/common');

console.log('🧩 Sample 6x6 Sudoku Puzzle\n');

// 6x6 puzzle from screenshot
// Row by row: 62..5.3, ......, 5....3, ..6..2, ....346, 3.6...
const puzzle6x6Description = {
  description: 'Sample 6x6 Sudoku #1',
  type: 'sudoku',
  level: 2,
  cells: '62..533....5....3..6..2....3463.6...'
};

// Create puzzle definition
console.log('Creating 6x6 puzzle definition...\n');

const puzzleResult = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle6x6, puzzle6x6Description);

if (puzzleResult.isSuccess()) {
  const puzzle = puzzleResult.value;

  console.log('✅ 6x6 Puzzle:');
  console.log(`  Description: ${puzzle.description}`);
  console.log(`  Grid: ${puzzle.totalRows}x${puzzle.totalColumns}`);
  console.log(`  Cage dimensions: ${puzzle.cageWidthInCells}x${puzzle.cageHeightInCells} (3 wide x 2 high)`);
  console.log(`  Board dimensions: ${puzzle.boardWidthInCages}x${puzzle.boardHeightInCages} cages`);
  console.log(`  Max value: ${puzzle.maxValue}`);
  console.log(`  Cage total: ${puzzle.basicCageTotal} (sum 1+2+3+4+5+6)`);
  console.log(`  Cells: ${puzzle.cells}`);
  console.log('  Grid layout:');

  for (let row = 0; row < 6; row++) {
    const rowCells = puzzle.cells.slice(row * 6, (row + 1) * 6).split('');
    const displayRow = rowCells.map((c) => (c === '.' ? ' ' : c)).join(' ');
    console.log(`    ${displayRow}`);

    // Show cage boundaries after rows 1, 3, 5
    if (row === 1 || row === 3) {
      console.log('    -----------'); // Horizontal cage separator
    }
  }

  console.log('\n  Cage structure (3x2 sections):');
  console.log('    Top left    | Top right');
  console.log('    (rows 0-1)  | (rows 0-1)');
  console.log('    -----------');
  console.log('    Mid left    | Mid right');
  console.log('    (rows 2-3)  | (rows 2-3)');
  console.log('    -----------');
  console.log('    Bot left    | Bot right');
  console.log('    (rows 4-5)  | (rows 4-5)');

  console.log('\n🎯 6x6 puzzle definition created successfully!');
  console.log('This puzzle uses 3x2 cage dimensions with 2x3 cage layout.');
} else {
  console.error('❌ Failed to create 6x6 puzzle definition:');
  console.error(`  Error: ${puzzleResult.message}`);
}
