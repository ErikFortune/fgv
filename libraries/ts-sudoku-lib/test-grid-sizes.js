#!/usr/bin/env node

// Test script to verify all grid sizes work correctly
const { PuzzleDefinitionFactory, STANDARD_CONFIGS } = require('./lib/packlets/common');
const Puzzles = require('./lib/packlets/puzzles');

console.log('🧩 Testing Variable Grid Size Support\n');

// Test all standard configurations
const configurations = [
  { name: '4x4', config: STANDARD_CONFIGS.puzzle4x4, expectedMax: 4, cells: '.'.repeat(16) },
  { name: '6x6', config: STANDARD_CONFIGS.puzzle6x6, expectedMax: 6, cells: '.'.repeat(36) },
  { name: '9x9', config: STANDARD_CONFIGS.puzzle9x9, expectedMax: 9, cells: '.'.repeat(81) },
  { name: '12x12', config: STANDARD_CONFIGS.puzzle12x12, expectedMax: 12, cells: '.'.repeat(144) }
];

let allTestsPassed = true;

for (const { name, config, expectedMax, cells } of configurations) {
  console.log(`📐 Testing ${name} grid...`);

  try {
    // Create puzzle definition
    const puzzleDefResult = PuzzleDefinitionFactory.create(config, {
      description: `Test ${name} Sudoku`,
      type: 'sudoku',
      level: 1,
      cells: cells
    });

    if (puzzleDefResult.isFailure()) {
      console.error(`  ❌ Failed to create ${name} definition: ${puzzleDefResult.message}`);
      allTestsPassed = false;
      continue;
    }

    const puzzleDef = puzzleDefResult.value;

    // Verify calculations
    const expectedRows = config.cageHeightInCells * config.boardHeightInCages;
    const expectedCols = config.cageWidthInCells * config.boardWidthInCages;
    const expectedTotal = (expectedMax * (expectedMax + 1)) / 2;

    if (puzzleDef.totalRows !== expectedRows) {
      console.error(`  ❌ Wrong row count: expected ${expectedRows}, got ${puzzleDef.totalRows}`);
      allTestsPassed = false;
    }

    if (puzzleDef.totalColumns !== expectedCols) {
      console.error(`  ❌ Wrong column count: expected ${expectedCols}, got ${puzzleDef.totalColumns}`);
      allTestsPassed = false;
    }

    if (puzzleDef.maxValue !== expectedMax) {
      console.error(`  ❌ Wrong max value: expected ${expectedMax}, got ${puzzleDef.maxValue}`);
      allTestsPassed = false;
    }

    if (puzzleDef.basicCageTotal !== expectedTotal) {
      console.error(`  ❌ Wrong cage total: expected ${expectedTotal}, got ${puzzleDef.basicCageTotal}`);
      allTestsPassed = false;
    }

    // Debug: Log section IDs being generated
    console.log(`    Cage dimensions: ${config.cageWidthInCells}x${config.cageHeightInCells}`);
    console.log(`    Board dimensions: ${config.boardWidthInCages}x${config.boardHeightInCages}`);

    // Create actual puzzle
    const puzzleResult = Puzzles.Sudoku.create(puzzleDef);
    if (puzzleResult.isFailure()) {
      console.error(`  ❌ Failed to create ${name} puzzle: ${puzzleResult.message}`);
      allTestsPassed = false;
      continue;
    }

    const puzzle = puzzleResult.value;

    // Verify puzzle properties
    if (puzzle.numRows !== expectedRows || puzzle.numColumns !== expectedCols) {
      console.error(`  ❌ Puzzle dimensions mismatch`);
      allTestsPassed = false;
    }

    console.log(
      `  ✅ ${name}: ${expectedRows}x${expectedCols} grid, max value ${expectedMax}, cage total ${expectedTotal}`
    );
  } catch (error) {
    console.error(`  ❌ Error testing ${name}: ${error.message}`);
    allTestsPassed = false;
  }
}

// Test Sudoku X with 9x9
console.log(`\n🔥 Testing Sudoku X (9x9 with diagonal constraints)...`);
try {
  const sudokuXDef = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    description: 'Test Sudoku X',
    type: 'sudoku-x',
    level: 1,
    cells: '.'.repeat(81)
  });

  if (sudokuXDef.isSuccess()) {
    const puzzleResult = Puzzles.SudokuX.create(sudokuXDef.value);
    if (puzzleResult.isSuccess()) {
      const puzzle = puzzleResult.value;

      // Check for diagonal cages
      const x1Result = puzzle.getCage('X1');
      const x2Result = puzzle.getCage('X2');

      if (x1Result.isSuccess() && x2Result.isSuccess()) {
        console.log(`  ✅ Sudoku X: 9x9 grid with diagonal constraints (X1 & X2 cages)`);
      } else {
        console.error(`  ❌ Sudoku X missing diagonal cages`);
        allTestsPassed = false;
      }
    } else {
      console.error(`  ❌ Failed to create Sudoku X puzzle: ${puzzleResult.message}`);
      allTestsPassed = false;
    }
  } else {
    console.error(`  ❌ Failed to create Sudoku X definition: ${sudokuXDef.message}`);
    allTestsPassed = false;
  }
} catch (error) {
  console.error(`  ❌ Error testing Sudoku X: ${error.message}`);
  allTestsPassed = false;
}

console.log(`\n${allTestsPassed ? '🎉 All grid size tests passed!' : '💥 Some tests failed'}`);
process.exit(allTestsPassed ? 0 : 1);
