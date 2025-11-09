#!/usr/bin/env node

// Sample 4x4 puzzles generated from screenshot
const { PuzzleDefinitionFactory, STANDARD_CONFIGS } = require('./lib/packlets/common');

console.log('🧩 Sample 4x4 Sudoku Puzzles\n');

// First 4x4 puzzle from screenshot
const puzzle1Description = {
  description: 'Sample 4x4 Sudoku #1',
  type: 'sudoku',
  level: 1,
  cells: '..1....2.2....4.'
};

// Second 4x4 puzzle from screenshot
const puzzle2Description = {
  description: 'Sample 4x4 Sudoku #2',
  type: 'sudoku',
  level: 1,
  cells: '3..1..2.4.......'
};

// Create puzzle definitions
console.log('Creating puzzle definitions...\n');

const puzzle1Result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle4x4, puzzle1Description);
const puzzle2Result = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle4x4, puzzle2Description);

if (puzzle1Result.isSuccess() && puzzle2Result.isSuccess()) {
  const puzzle1 = puzzle1Result.value;
  const puzzle2 = puzzle2Result.value;

  console.log('✅ Puzzle #1:');
  console.log(`  Description: ${puzzle1.description}`);
  console.log(`  Grid: ${puzzle1.totalRows}x${puzzle1.totalColumns}`);
  console.log(`  Cage dimensions: ${puzzle1.cageWidthInCells}x${puzzle1.cageHeightInCells}`);
  console.log(`  Max value: ${puzzle1.maxValue}`);
  console.log(`  Cells: ${puzzle1.cells}`);
  console.log('  Grid layout:');
  for (let row = 0; row < 4; row++) {
    const rowCells = puzzle1.cells.slice(row * 4, (row + 1) * 4).split('');
    console.log(`    ${rowCells.map((c) => (c === '.' ? ' ' : c)).join(' ')}`);
  }

  console.log('\n✅ Puzzle #2:');
  console.log(`  Description: ${puzzle2.description}`);
  console.log(`  Grid: ${puzzle2.totalRows}x${puzzle2.totalColumns}`);
  console.log(`  Cage dimensions: ${puzzle2.cageWidthInCells}x${puzzle2.cageHeightInCells}`);
  console.log(`  Max value: ${puzzle2.maxValue}`);
  console.log(`  Cells: ${puzzle2.cells}`);
  console.log('  Grid layout:');
  for (let row = 0; row < 4; row++) {
    const rowCells = puzzle2.cells.slice(row * 4, (row + 1) * 4).split('');
    console.log(`    ${rowCells.map((c) => (c === '.' ? ' ' : c)).join(' ')}`);
  }

  console.log('\n🎯 Both 4x4 puzzle definitions created successfully!');
  console.log('These can be used with the Sudoku puzzle engine.');
} else {
  console.error('❌ Failed to create puzzle definitions:');
  if (puzzle1Result.isFailure()) {
    console.error(`  Puzzle #1: ${puzzle1Result.message}`);
  }
  if (puzzle2Result.isFailure()) {
    console.error(`  Puzzle #2: ${puzzle2Result.message}`);
  }
}
