/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { PuzzleDefinitionFactory, STANDARD_CONFIGS } from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';

describe('Puzzles.Killer class', () => {
  const testCells = [
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
  ].join('');

  describe('create static method', () => {
    test('succeeds for a valid puzzle', () => {
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          id: 'killer-insane',
          description: 'Insane (3208329) example from djape.net',
          type: 'killer-sudoku',
          level: 100,
          cells: testCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.rows.map((r) => r.id)).toEqual(['RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI']);
        expect(puzzle.cols.map((c) => c.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']);
        expect(puzzle.sections.map((s) => s.id)).toEqual([
          'SA1',
          'SA4',
          'SA7',
          'SD1',
          'SD4',
          'SD7',
          'SG1',
          'SG4',
          'SG7'
        ]);
        expect(puzzle.cages.map((c) => c.id)).toEqual([
          'RA',
          'RB',
          'RC',
          'RD',
          'RE',
          'RF',
          'RG',
          'RH',
          'RI',
          'C1',
          'C2',
          'C3',
          'C4',
          'C5',
          'C6',
          'C7',
          'C8',
          'C9',
          'SA1',
          'SA4',
          'SA7',
          'SD1',
          'SD4',
          'SD7',
          'SG1',
          'SG4',
          'SG7',
          'KA',
          'KB',
          'KC',
          'KD',
          'KE',
          'KF',
          'KG',
          'KH',
          'KI',
          'KJ',
          'KK',
          'KL',
          'KM',
          'KN',
          'KO',
          'KP',
          'KQ',
          'KR',
          'KS',
          'KT',
          'KU',
          'KV',
          'KW',
          'KX',
          'KY',
          'KZ',
          'Ka',
          'Kb',
          'Kc'
        ]);
        expect(puzzle.cells.map((c) => c.toString()).join('')).toEqual(
          [
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........'
          ].join('')
        );
      });
    });

    test('promotes single-cell cages to givens', () => {
      // cSpell: disable
      // split the last two cells and add values for added cells
      const modifiedCells = testCells.replace('cccab', 'cccde').replace('a09,b09,c11', 'a05,b03,c11,d04,e06');
      // cSpell: enable
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          id: 'killer-insane',
          description: 'Insane (3208329) example from djape.net',
          type: 'killer-sudoku',
          level: 100,
          cells: modifiedCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.cages.map((c) => c.id)).toEqual([
          'RA',
          'RB',
          'RC',
          'RD',
          'RE',
          'RF',
          'RG',
          'RH',
          'RI',
          'C1',
          'C2',
          'C3',
          'C4',
          'C5',
          'C6',
          'C7',
          'C8',
          'C9',
          'SA1',
          'SA4',
          'SA7',
          'SD1',
          'SD4',
          'SD7',
          'SG1',
          'SG4',
          'SG7',
          'KA',
          'KB',
          'KC',
          'KD',
          'KE',
          'KF',
          'KG',
          'KH',
          'KI',
          'KJ',
          'KK',
          'KL',
          'KM',
          'KN',
          'KO',
          'KP',
          'KQ',
          'KR',
          'KS',
          'KT',
          'KU',
          'KV',
          'KW',
          'KX',
          'KY',
          'KZ',
          'Kc'
        ]);
        expect(puzzle.cells.map((c) => c.toString()).join('')).toEqual(
          [
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.......53',
            '.......46'
          ].join('')
        );
      });
    });

    test('fails if cells property is incorrectly delimited', () => {
      const invalidCells = testCells.replace('|', '/');
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/killer sudoku cells must contain cage definitions after "\|" separator/i);
    });

    test('fails if cell mappings are mismatched', () => {
      const [cells, cages] = testCells.split('|');
      const invalidCells = `${cells}xyz|${cages}`;
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/killer sudoku grid portion must be exactly 81 characters, got 84/i);
    });

    test('fails if cage sizes are mismatched', () => {
      const [cells, cages] = testCells.split('|');
      const invalidCells = `${cells}|${cages},x10`;
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/expected 29 cage sizes, found 30/i);
    });

    test('fails if cage specification is malformed', () => {
      const [cells, cages] = testCells.split('|');
      const invalidCells = `${cells}|${cages.replace('b09', 'b9')}.`;
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/malformed cage spec b9/i);
    });

    test('fails if a cage has too many cells', () => {
      let [cells, cages] = testCells.split('|');
      // cSpell: disable
      cells = cells.replace('ABCCCDDDE', 'AAAAAAAAA');
      // cSpell: enable
      cages = cages.replace(',C09', '');
      const invalidCells = `${cells}|${cages}`;
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/invalid cell count 10 for cage KA/i);
    });

    test('fails if cage total is out of range', () => {
      const [cells, cages] = testCells.split('|');
      const invalidCells = `${cells}|${cages.replace('b09', 'b19')}.`;
      expect(
        PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
          description: 'Test puzzle',
          type: 'killer-sudoku',
          level: 1,
          cells: invalidCells
        }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition))
      ).toFailWith(/invalid total 19 for cage Kb \(expected 3..17\)/);
    });
  });
});
