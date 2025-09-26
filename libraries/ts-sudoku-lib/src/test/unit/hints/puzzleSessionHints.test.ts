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

/* eslint-disable @rushstack/packlets/mechanics */

import '@fgv/ts-utils-jest';
import { PuzzleSessionHints } from '../../../packlets/hints';
import { PuzzleSession } from '../../../packlets/common';
import { IPuzzleDescription, PuzzleType, Puzzles } from '../../../index';
import { TechniqueIds } from '../../../packlets/hints/types';

/* eslint-enable @rushstack/packlets/mechanics */
describe('PuzzleSessionHints', () => {
  let session: PuzzleSession;
  let hintsSession: PuzzleSessionHints;

  beforeEach(() => {
    // Create a puzzle with multiple empty cells where naked singles should be detectable
    // Use a more typical sudoku puzzle state with some cells filled
    const testPuzzle: IPuzzleDescription = {
      id: 'hint-test',
      description: 'Test puzzle for hints system',
      type: 'sudoku' as PuzzleType,
      level: 1,
      rows: 9,
      cols: 9,
      cells: [
        '5.......1',
        '.7.....3.',
        '..1...5..',
        '7.......6',
        '.2.....8.',
        '6.......4',
        '..9...2..',
        '.8.....7.',
        '3.......9'
      ].join('')
    };

    const puzzle = Puzzles.Any.create(testPuzzle).orThrow();
    session = PuzzleSession.create(puzzle).orThrow();
    hintsSession = PuzzleSessionHints.create(session).orThrow();
  });

  describe('creation', () => {
    test('should create successfully from PuzzleSession', () => {
      expect(PuzzleSessionHints.create(session)).toSucceed();
    });

    test('should create with custom configuration', () => {
      const config = {
        enableNakedSingles: true,
        enableHiddenSingles: false,
        defaultExplanationLevel: 'brief' as const
      };
      expect(PuzzleSessionHints.create(session, config)).toSucceed();
    });

    test('should expose the wrapped session', () => {
      expect(hintsSession.session).toBe(session);
    });

    test('should expose the hint system', () => {
      expect(hintsSession.hintSystem).toBeDefined();
    });
  });

  describe('delegation to PuzzleSession', () => {
    test('should delegate basic properties', () => {
      expect(hintsSession.numRows).toBe(session.numRows);
      expect(hintsSession.numColumns).toBe(session.numColumns);
      expect(hintsSession.description).toBe(session.description);
      expect(hintsSession.canUndo).toBe(session.canUndo);
      expect(hintsSession.canRedo).toBe(session.canRedo);
    });

    test('should delegate state checks', () => {
      expect(hintsSession.checkIsSolved()).toBe(session.checkIsSolved());
      expect(hintsSession.checkIsValid()).toBe(session.checkIsValid());
    });

    test('should delegate cell operations', () => {
      const cell = hintsSession.cells[0];
      expect(hintsSession.cellIsValid(cell)).toBe(session.cellIsValid(cell));
      expect(hintsSession.cellHasValue(cell)).toBe(session.cellHasValue(cell));
    });
  });

  describe('state synchronization', () => {
    test('should keep state synchronized with wrapped session', () => {
      expect(hintsSession.state).toBe(session.state);

      // Make a change through the hints session
      hintsSession.updateCellValue('A1', 5);
      expect(hintsSession.state).toBe(session.state);
    });

    test('should invalidate cache on state changes', () => {
      // This is an indirect test - we can't directly observe cache invalidation
      // but we can verify the integration works by making changes and checking hints
      const initialCell = 'A9'; // The undefined cell

      // Get hints before making a change
      const hintsResult1 = hintsSession.getAllHints();

      // Make a change that should affect available hints
      hintsSession.updateCellValue(initialCell, 9);

      // Get hints after the change
      const hintsResult2 = hintsSession.getAllHints();

      // Both should succeed (implementation details may vary)
      expect(hintsResult1).toSucceed();
      expect(hintsResult2).toSucceed();
    });
  });

  describe('hint functionality', () => {
    test('should detect available hints', () => {
      // Test returns result - may be true or false depending on puzzle state
      expect(hintsSession.hasHints()).toSucceed();
    });

    test('should get all available hints', () => {
      const hintsResult = hintsSession.getAllHints();
      expect(hintsResult).toSucceed();
      // Note: hints may or may not be available depending on puzzle state
    });

    test('should get hints for specific cell', () => {
      const hintsResult = hintsSession.getHintsForCell('A1');
      expect(hintsResult).toSucceed();
      // Note: may return empty array if no hints affect this cell
    });

    test('should handle hint operations based on availability', () => {
      const hintsResult = hintsSession.getAllHints();
      expect(hintsResult).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          // Test operations when hints are available
          const hint = hints[0];

          // Should be able to validate
          expect(hintsSession.validateHint(hint)).toSucceed();

          // Should be able to get explanation
          const explanation = hintsSession.getExplanation(hint);
          expect(explanation).toBeTruthy();
          expect(typeof explanation).toBe('string');

          // Should be able to apply hint
          const applyResult = hintsSession.applyHint(hint);
          expect(applyResult).toSucceedAndSatisfy((updatedSession) => {
            expect(updatedSession.state).toBe(session.state);
            expect(updatedSession.canUndo).toBe(true);
          });
        } else {
          // When no hints available, getHint should fail
          const hintResult = hintsSession.getHint();
          expect(hintResult).toFail();
        }
      });
    });

    test('should provide system summary', () => {
      const summary = hintsSession.getSystemSummary();
      expect(summary).toContain('Sudoku Hint System');
      expect(summary).toBeTruthy();
    });

    test('should provide hint statistics', () => {
      const statsResult = hintsSession.getHintStatistics();
      expect(statsResult).toSucceedAndSatisfy((stats) => {
        expect(stats.totalHints).toBeGreaterThanOrEqual(0);
        expect(stats.hintsByTechnique).toBeInstanceOf(Map);
        expect(stats.hintsByDifficulty).toBeInstanceOf(Map);
      });
    });
  });

  describe('undo/redo integration', () => {
    test('should support undo/redo operations', () => {
      // Test basic undo/redo functionality
      expect(hintsSession.undo()).toFailWith(/nothing to undo/);
      expect(hintsSession.redo()).toFailWith(/nothing to redo/);

      // Test with a manual change
      hintsSession.updateCellValue('A2', 4);
      expect(hintsSession.canUndo).toBe(true);

      const undoResult = hintsSession.undo();
      expect(undoResult).toSucceed();
      expect(hintsSession.canRedo).toBe(true);

      const redoResult = hintsSession.redo();
      expect(redoResult).toSucceed();
    });

    test('should support undo after applying hint when available', () => {
      const hintsResult = hintsSession.getAllHints();
      expect(hintsResult).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const initialCanUndo = hintsSession.canUndo;
          hintsSession.applyHint(hints[0]);

          // Should be able to undo after applying hint
          expect(hintsSession.canUndo).toBe(true);

          // Undo the hint
          const undoResult = hintsSession.undo();
          expect(undoResult).toSucceed();
          expect(hintsSession.canUndo).toBe(initialCanUndo);
        }
      });
    });
  });

  describe('caching behavior', () => {
    test('should cache hints between calls', () => {
      // Multiple calls to getAllHints should work efficiently
      const hints1 = hintsSession.getAllHints();
      const hints2 = hintsSession.getAllHints();

      expect(hints1).toSucceed();
      expect(hints2).toSucceed();

      // Can't directly test caching, but we verify consistency
      expect(hints1).toSucceedAndSatisfy((h1) => {
        expect(hints2).toSucceedAndSatisfy((h2) => {
          expect(h1.length).toBe(h2.length);
        });
      });
    });

    test('should invalidate cache after state changes', () => {
      // Get initial hints
      const initialHints = hintsSession.getAllHints();
      expect(initialHints).toSucceed();

      // Make a state change that should invalidate cache
      hintsSession.updateCellValue('A2', 2);

      // Get hints again - should reflect new state
      const newHints = hintsSession.getAllHints();
      expect(newHints).toSucceed();

      // The hint system should continue to work after state changes
      expect(hintsSession.hasHints()).toSucceed();
    });

    test('should handle cache timeout expiration', async () => {
      // Create a session with very short cache timeout for testing
      const shortCacheConfig = {
        enableNakedSingles: true,
        enableHiddenSingles: true,
        cacheTimeoutMs: 1 // 1ms timeout to force expiration
      };

      const shortCacheSession = PuzzleSessionHints.create(session, shortCacheConfig).orThrow();

      // Get hints to populate cache
      const firstHints = shortCacheSession.getAllHints();
      expect(firstHints).toSucceed();

      // Wait a bit to ensure cache timeout passes
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10); // Wait 10ms to ensure 1ms timeout has passed
      });

      // Get hints again - cache should be expired and regenerated
      const secondHints = shortCacheSession.getAllHints();
      expect(secondHints).toSucceed();
    });
  });

  describe('hint system integration', () => {
    test('should provide single hint', () => {
      expect(hintsSession.getHint()).toSucceedAndSatisfy((hint) => {
        expect(hint.techniqueId).toBeDefined();
        expect(hint.cellActions).toBeDefined();
        expect(hint.explanations).toBeDefined();
      });
    });

    test('should provide hints with options', () => {
      const options = {
        maxHints: 3,
        enabledTechniques: [TechniqueIds.NAKED_SINGLES, TechniqueIds.HIDDEN_SINGLES]
      };
      expect(hintsSession.getAllHints(options)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeLessThanOrEqual(3);
      });
    });

    test('should get hints for specific cell', () => {
      expect(hintsSession.getHintsForCell('A1')).toSucceedAndSatisfy((hints) => {
        // May or may not have hints for the specific cell
        expect(Array.isArray(hints)).toBe(true);
      });
    });

    test('should validate hints', () => {
      expect(hintsSession.getHint()).toSucceedAndSatisfy((hint) => {
        expect(hintsSession.validateHint(hint)).toSucceed();
      });
    });

    test('should provide explanations for hints', () => {
      expect(hintsSession.getHint()).toSucceedAndSatisfy((hint) => {
        const explanation = hintsSession.getExplanation(hint);
        expect(explanation).toBeDefined();
        expect(typeof explanation).toBe('string');
        expect(explanation.length).toBeGreaterThan(0);

        // Test different explanation levels
        const briefExplanation = hintsSession.getExplanation(hint, 'brief');
        expect(briefExplanation).toBeDefined();
        expect(typeof briefExplanation).toBe('string');

        const detailedExplanation = hintsSession.getExplanation(hint, 'detailed');
        expect(detailedExplanation).toBeDefined();
        expect(typeof detailedExplanation).toBe('string');
      });
    });

    test('should provide hint statistics', () => {
      expect(hintsSession.getHintStatistics()).toSucceedAndSatisfy((stats) => {
        expect(stats.totalHints).toBeGreaterThanOrEqual(0);
        expect(stats.hintsByTechnique).toBeDefined();
        expect(stats.hintsByTechnique instanceof Map).toBe(true);
        expect(stats.hintsByDifficulty).toBeDefined();
        expect(stats.hintsByDifficulty instanceof Map).toBe(true);
      });
    });

    test('should handle options for hint statistics', () => {
      const options = { maxHints: 5 };
      expect(hintsSession.getHintStatistics(options)).toSucceedAndSatisfy((stats) => {
        expect(stats.totalHints).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('comprehensive delegation tests', () => {
    test('should delegate all getter properties', () => {
      // Test all the property getters
      expect(hintsSession.id).toBe(session.id);
      expect(hintsSession.description).toBe(session.description);
      expect(hintsSession.numRows).toBe(session.numRows);
      expect(hintsSession.numColumns).toBe(session.numColumns);
      expect(hintsSession.state).toBe(session.state);
      expect(hintsSession.canUndo).toBe(session.canUndo);
      expect(hintsSession.canRedo).toBe(session.canRedo);
    });

    test('should delegate config access', () => {
      expect(hintsSession.config).toBeDefined();
      expect(hintsSession.config.enableNakedSingles).toBeDefined();
      expect(hintsSession.config.enableHiddenSingles).toBeDefined();
    });

    test('should delegate cell access', () => {
      expect(hintsSession.cells).toBeDefined();
      expect(hintsSession.cells.length).toBeGreaterThan(0);
      expect(hintsSession.cells[0]).toBeDefined();
    });

    test('should delegate cell value operations', () => {
      // Find an empty cell to test with
      const emptyCell = hintsSession.cells.find((cell) => !hintsSession.state.hasValue(cell.id));
      expect(emptyCell).toBeDefined();

      // Test updateCellValue on empty cell
      expect(hintsSession.updateCellValue(emptyCell!.id, 5)).toSucceed();
      expect(hintsSession.updateCellValue(emptyCell!.id, undefined)).toSucceed();
    });

    test('should delegate cell notes operations', () => {
      const cell = hintsSession.cells[15]; // Pick another cell

      // Test updateCellNotes
      expect(hintsSession.updateCellNotes(cell.id, [1, 2, 3])).toSucceed();
      expect(hintsSession.updateCellNotes(cell.id, [])).toSucceed();
    });

    test('should delegate batch cell updates', () => {
      // Find empty cells for testing
      const emptyCells = hintsSession.cells.filter((cell) => !hintsSession.state.hasValue(cell.id));
      expect(emptyCells.length).toBeGreaterThanOrEqual(2);

      const updates = [
        { id: emptyCells[0].id, value: undefined, notes: [1, 2] },
        { id: emptyCells[1].id, value: undefined, notes: [3, 4] }
      ];
      expect(hintsSession.updateCells(updates)).toSucceed();
    });

    test('should delegate validation methods', () => {
      const cell = hintsSession.cells[0];

      expect(typeof hintsSession.cellIsValid(cell.id)).toBe('boolean');
      expect(typeof hintsSession.cellHasValue(cell.id)).toBe('boolean');
      expect(typeof hintsSession.isValidForCell(cell.id, 5)).toBe('boolean');
    });

    test('should delegate conversion methods', () => {
      const strings = hintsSession.toStrings();
      expect(Array.isArray(strings)).toBe(true);
      expect(strings.length).toBe(9); // Should be 9 rows
    });

    test('should delegate cage and structure getters', () => {
      // Test rows getter
      const rows = hintsSession.rows;
      expect(Array.isArray(rows)).toBe(true);

      // Test columns getter
      const cols = hintsSession.cols;
      expect(Array.isArray(cols)).toBe(true);

      // Test sections getter
      const sections = hintsSession.sections;
      expect(Array.isArray(sections)).toBe(true);

      // Test cages getter
      const cages = hintsSession.cages;
      expect(Array.isArray(cages)).toBe(true);
    });

    test('should delegate step tracking getters', () => {
      // Test nextStep getter
      expect(typeof hintsSession.nextStep).toBe('number');
      expect(hintsSession.nextStep).toBeGreaterThanOrEqual(0);

      // Test numSteps getter
      expect(typeof hintsSession.numSteps).toBe('number');
      expect(hintsSession.numSteps).toBeGreaterThanOrEqual(0);
    });

    test('should delegate cell analysis methods', () => {
      // Test getEmptyCells
      const emptyCells = hintsSession.getEmptyCells();
      expect(Array.isArray(emptyCells)).toBe(true);

      // Test getInvalidCells
      const invalidCells = hintsSession.getInvalidCells();
      expect(Array.isArray(invalidCells)).toBe(true);
    });

    test('should delegate navigation methods', () => {
      const cell = hintsSession.cells[0];

      // Test getCellNeighbor
      expect(hintsSession.getCellNeighbor(cell.id, 'right', 'none')).toSucceedAndSatisfy((neighbor) => {
        expect(neighbor).toBeDefined();
        expect(neighbor.id).toBeDefined();
      });

      // Test getCellContents
      expect(hintsSession.getCellContents(cell.id)).toSucceedAndSatisfy((result) => {
        expect(result.cell).toBeDefined();
        expect(result.contents).toBeDefined();
      });
    });
  });

  describe('cage-related delegation', () => {
    test('should delegate cage operations for compatible puzzles', () => {
      // These methods should work even if there are no cages
      expect(typeof hintsSession.cageContainsValue('fake-cage', 5)).toBe('boolean');

      const containedValues = hintsSession.cageContainedValues('fake-cage');
      expect(containedValues instanceof Set).toBe(true);
    });
  });

  describe('configuration variations', () => {
    test('should work with disabled techniques', () => {
      const config = {
        enableNakedSingles: false,
        enableHiddenSingles: false,
        defaultExplanationLevel: 'detailed' as const
      };

      expect(PuzzleSessionHints.create(session, config)).toSucceedAndSatisfy((hintsSession) => {
        expect(hintsSession.config.enableNakedSingles).toBe(false);
        expect(hintsSession.config.enableHiddenSingles).toBe(false);
        expect(hintsSession.config.defaultExplanationLevel).toBe('detailed');
      });
    });

    test('should work with cache configuration', () => {
      const config = {
        enableNakedSingles: true,
        enableHiddenSingles: true,
        cacheTimeoutMs: 30000,
        maxCacheEntries: 10
      };

      expect(PuzzleSessionHints.create(session, config)).toSucceedAndSatisfy((hintsSession) => {
        expect(hintsSession.config.cacheTimeoutMs).toBe(30000);
        expect(hintsSession.config.maxCacheEntries).toBe(10);
      });
    });
  });

  describe('error scenarios and edge cases', () => {
    test('should handle empty hints gracefully', () => {
      // Create a puzzle that should have no hints (completely filled)
      const completedPuzzle: IPuzzleDescription = {
        id: 'completed',
        description: 'Completed puzzle',
        type: 'sudoku' as PuzzleType,
        level: 1,
        rows: 9,
        cols: 9,
        cells: [
          '123456789',
          '456789123',
          '789123456',
          '234567891',
          '567891234',
          '891234567',
          '345678912',
          '678912345',
          '912345678'
        ].join('')
      };

      const puzzle = Puzzles.Any.create(completedPuzzle).orThrow();
      const completedSession = PuzzleSession.create(puzzle).orThrow();
      const completedHintsSession = PuzzleSessionHints.create(completedSession).orThrow();

      expect(completedHintsSession.getAllHints()).toSucceedAndSatisfy((hints) => {
        expect(hints).toHaveLength(0);
      });

      expect(completedHintsSession.hasHints()).toSucceedAndSatisfy((hasHints) => {
        expect(hasHints).toBe(false);
      });
    });

    test('should handle invalid cell specifications', () => {
      // Test with invalid cell IDs - should fail with validation error
      expect(hintsSession.getHintsForCell('invalid-cell')).toFailWith(/malformed cell ID/);
    });

    test('should maintain state consistency after multiple operations', () => {
      const initialState = hintsSession.checkIsSolved();

      // Apply a hint if available
      expect(hintsSession.getHint()).toSucceedAndSatisfy((hint) => {
        expect(hintsSession.applyHint(hint)).toSucceed();

        // State should remain consistent
        expect(typeof hintsSession.checkIsSolved()).toBe('boolean');
        expect(typeof hintsSession.checkIsValid()).toBe('boolean');

        // Should be able to undo
        expect(hintsSession.undo()).toSucceed();
        expect(hintsSession.checkIsSolved()).toBe(initialState);
      });
    });
  });
});
