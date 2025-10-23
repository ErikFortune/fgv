const path = require('path');
const libPath = path.join(__dirname, 'lib');
require.main.paths.unshift(libPath);

try {
  const Puzzles = require('./lib/packlets/puzzles');
  const { PuzzleSession } = require('./lib/packlets/common');
  const { KillerCombinations } = require('./lib/packlets/puzzles');

  function createSimpleKillerCage(cageSize, total, containedValues = []) {
    const existingPuzzleDesc = {
      id: 'test-killer',
      description: 'Test killer sudoku puzzle',
      type: 'killer-sudoku',
      level: 1,
      rows: 9,
      cols: 9,
      cells: [
        'ABCCCDDDE',
        'ABFFGGGDE',
        'HIJKGGLLL',
        'HIJKMGLNN',
        'HOPPMQQNR',
        'OOSTMUVWR',
        'SSSTTUVWR',
        'XYTTTZZab',
        'XYYYcccab',
        '|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      ].join('')
    };

    const puzzle = Puzzles.Killer.create(existingPuzzleDesc);
    if (puzzle.isFailure()) throw new Error(puzzle.message);

    const session = PuzzleSession.create(puzzle.value);
    if (session.isFailure()) throw new Error(session.message);

    // Apply contained values if provided
    if (containedValues.length > 0) {
      const cageA = puzzle.value.getCage('KA');
      if (cageA.isFailure()) throw new Error(cageA.message);
      const cellIds = Array.from(cageA.value.cellIds);
      containedValues.forEach((value, index) => {
        if (index < cellIds.length) {
          const result = session.value.updateCellValue(cellIds[index], value);
          if (result.isFailure()) throw new Error(result.message);
        }
      });
    }

    // For this simple test, we'll use cage KA
    const cage = puzzle.value.getCage('KA');
    if (cage.isFailure()) throw new Error(cage.message);

    return { puzzle: puzzle.value, state: session.value.state, cage: cage.value };
  }

  console.log('Testing cage KA with one cell filled with 5...');
  const { puzzle, state, cage } = createSimpleKillerCage(2, 11, [5]);

  console.log('Cage info:', {
    id: cage.id,
    total: cage.total,
    numCells: cage.numCells,
    cellIds: Array.from(cage.cellIds)
  });

  console.log('Cell states:');
  Array.from(cage.cellIds).forEach((cellId) => {
    const contents = state.getCellContents(cellId);
    if (contents.isSuccess()) {
      console.log(`  ${cellId}:`, contents.value);
    }
  });

  const result = KillerCombinations.getCellPossibilities(puzzle, state, cage);
  if (result.isSuccess()) {
    console.log('Possibilities:');
    result.value.forEach((values, cellId) => {
      console.log(`  ${cellId}: [${values.join(',')}]`);
    });
  } else {
    console.error('Failed to get possibilities:', result.message);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
