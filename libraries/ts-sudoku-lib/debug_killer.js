const path = require('path');

// Add the lib directory to require paths
const libPath = path.join(__dirname, 'lib');
require.main.paths.unshift(libPath);

try {
  const Puzzles = require('./lib/packlets/puzzles');

  const puzzleDesc = {
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

  console.log('Creating puzzle...');
  const puzzle = Puzzles.Killer.create(puzzleDesc);

  if (puzzle.isSuccess()) {
    console.log('Success! Analyzing killer cages:');
    const killerCages = puzzle.value.cages.filter((cage) => cage.id.startsWith('K'));
    killerCages.forEach((cage) => {
      console.log(
        `- ${cage.id}: ${cage.numCells} cells, total ${cage.total}, cells: [${Array.from(cage.cellIds).join(
          ','
        )}]`
      );
    });
  } else {
    console.error('Puzzle creation failed:', puzzle.message);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
