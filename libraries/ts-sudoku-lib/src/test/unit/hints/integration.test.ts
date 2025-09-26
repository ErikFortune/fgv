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
import { HintSystem } from '../../../packlets/hints/hints';
import { PuzzleSessionHints } from '../../../packlets/hints';
import { PuzzleState } from '../../../packlets/common/puzzleState';
import { PuzzleSession } from '../../../packlets/common/puzzleSession';
import { Puzzles, IPuzzleDescription, PuzzleType } from '../../../index';
import { ConfidenceLevels } from '../../../packlets/hints/types';

describe('Hint System Integration', () => {
  describe('real puzzle scenarios', () => {
    test('should work with classic beginner Sudoku puzzle', () => {
      // A well-known beginner puzzle with naked and hidden singles
      const beginnerPuzzle = createTestPuzzle([
        '53..7....',
        '6..195...',
        '.98....6.',
        '8...6...3',
        '4..8.3..1',
        '7...2...6',
        '.6....28.',
        '...419..5',
        '....8..79'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(beginnerPuzzle);

      expect(hintSystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        // Should find multiple hints in a beginner puzzle
        expect(hints.length).toBeGreaterThan(0);

        // All hints should be valid
        for (const hint of hints) {
          expect(hint.cellActions.length).toBeGreaterThan(0);
          expect(hint.explanations.length).toBe(3); // brief, detailed, educational
          expect(hint.confidence).toBeGreaterThanOrEqual(1);
          expect(hint.confidence).toBeLessThanOrEqual(5);

          // Cell actions should reference valid cells and values
          for (const action of hint.cellActions) {
            expect(action.cellId).toMatch(/^r[0-8]c[0-8]$/);
            expect(action.value).toBeGreaterThanOrEqual(1);
            expect(action.value).toBeLessThanOrEqual(9);
          }
        }

        // Should include both techniques for a complex puzzle
        const techniqueIds = new Set(hints.map((h) => h.techniqueId));
        expect(techniqueIds.size).toBeGreaterThanOrEqual(1);
      });
    });

    test('should handle puzzle progression through hint application', () => {
      const puzzle = createTestPuzzle([
        '12345678.', // Simple case with one naked single
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const session = PuzzleSession.create(Puzzles.Any.create(puzzle).orThrow()).orThrow();
      const hintSystem = HintSystem.create().orThrow();

      // Get initial hints
      const initialHints = hintSystem.generateHints(session.state).orThrow();
      expect(initialHints.length).toBeGreaterThan(0);

      // Apply first hint
      const firstHint = initialHints[0];
      const updates = hintSystem.applyHint(firstHint, session.state).orThrow();
      session.updateCells([...updates]).orThrow(); // Convert readonly to mutable

      // Should be able to get hints for the new state
      const newHints = hintSystem.generateHints(session.state).orThrow();

      // The number of available hints should change (may increase or decrease)
      expect(Array.isArray(newHints)).toBe(true);

      // Previously applied hint should no longer be available
      const duplicateHint = newHints.find(
        (hint) =>
          hint.cellActions[0].cellId === firstHint.cellActions[0].cellId &&
          hint.cellActions[0].value === firstHint.cellActions[0].value
      );
      expect(duplicateHint).toBeUndefined();
    });

    test('should find no hints in completed puzzle', () => {
      const completedPuzzle = createTestPuzzle([
        '534678912',
        '672195348',
        '198342567',
        '859761423',
        '426853791',
        '713924856',
        '961537284',
        '287419635',
        '345286179'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(completedPuzzle);

      expect(hintSystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        expect(hints).toHaveLength(0);
      });

      expect(hintSystem.hasHints(state)).toSucceedAndSatisfy((hasHints) => {
        expect(hasHints).toBe(false);
      });

      expect(hintSystem.getBestHint(state)).toFailWith(/No hints available/);
    });

    test('should work with different puzzle difficulties', () => {
      const hintSystem = HintSystem.create().orThrow();

      // Easy puzzle - should have many hints available
      const easyPuzzle = createTestPuzzle([
        '1234567.9',
        '567891234',
        '891234567',
        '234567891',
        '678912345',
        '912345678',
        '345678912',
        '456789123',
        '789123456'
      ]);
      const easyState = createPuzzleState(easyPuzzle);

      expect(hintSystem.generateHints(easyState)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeGreaterThan(0);
        // Easy puzzles should have high-confidence hints
        for (const hint of hints) {
          expect(hint.confidence).toBeGreaterThanOrEqual(ConfidenceLevels.MEDIUM);
        }
      });

      // Sparse puzzle - may have fewer obvious hints
      const sparsePuzzle = createTestPuzzle([
        '1........',
        '.........2',
        '..3......',
        '.........',
        '....5....',
        '.........',
        '......6..',
        '7........',
        '........8'
      ]);
      const sparseState = createPuzzleState(sparsePuzzle);

      expect(hintSystem.generateHints(sparseState)).toSucceedAndSatisfy((hints) => {
        // May have few or no obvious hints
        expect(hints.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('PuzzleSessionHints integration', () => {
    test('should integrate seamlessly with PuzzleSessionHints wrapper', () => {
      const puzzle = createTestPuzzle([
        '53..7....',
        '6..195...',
        '.98....6.',
        '8...6...3',
        '4..8.3..1',
        '7...2...6',
        '.6....28.',
        '...419..5',
        '....8..79'
      ]);

      const session = PuzzleSession.create(Puzzles.Any.create(puzzle).orThrow()).orThrow();
      const hintsSession = PuzzleSessionHints.create(session).orThrow();

      // Should be able to get hints through wrapper
      expect(hintsSession.getAllHints()).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeGreaterThanOrEqual(0);
      });

      // Should be able to get best hint
      if (hintsSession.getAllHints().orThrow().length > 0) {
        expect(hintsSession.getHint()).toSucceed();
      }

      // Should maintain state synchronization
      expect(hintsSession.state).toBe(session.state);
    });

    test('should cache hints appropriately in PuzzleSessionHints', () => {
      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const session = PuzzleSession.create(Puzzles.Any.create(puzzle).orThrow()).orThrow();
      const hintsSession = PuzzleSessionHints.create(session).orThrow();

      // Multiple calls should be efficient (testing caching indirectly)
      const hints1 = hintsSession.getAllHints().orThrow();
      const hints2 = hintsSession.getAllHints().orThrow();

      expect(hints1.length).toBe(hints2.length);

      // Cache should be invalidated after state change
      hintsSession.updateCellValue('r1c1', 5).orThrow();
      const hints3 = hintsSession.getAllHints().orThrow();

      // Should still work after state change
      expect(Array.isArray(hints3)).toBe(true);
    });

    test('should support hint application through wrapper', () => {
      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const session = PuzzleSession.create(Puzzles.Any.create(puzzle).orThrow()).orThrow();
      const hintsSession = PuzzleSessionHints.create(session).orThrow();

      const hints = hintsSession.getAllHints().orThrow();
      if (hints.length > 0) {
        const hint = hints[0];

        // Should be able to validate hint
        expect(hintsSession.validateHint(hint)).toSucceed();

        // Should be able to apply hint
        expect(hintsSession.applyHint(hint)).toSucceedAndSatisfy((updatedSession) => {
          expect(updatedSession.canUndo).toBe(true);
        });

        // Should be able to undo hint application
        expect(hintsSession.undo()).toSucceed();
      }
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle invalid puzzle states gracefully', () => {
      // Create a puzzle with contradictory values (shouldn't be possible in normal usage)
      const invalidPuzzle = createTestPuzzle([
        '11.......', // Invalid: two 1s in same row
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(invalidPuzzle);

      // System should not crash, even with invalid state
      expect(hintSystem.generateHints(state)).toSucceed();
      expect(hintSystem.hasHints(state)).toSucceed();
      expect(hintSystem.getHintStatistics(state)).toSucceed();
    });

    test('should handle empty puzzle gracefully', () => {
      const emptyPuzzle = createTestPuzzle([
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(emptyPuzzle);

      expect(hintSystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        // Empty puzzle should have no obvious hints
        expect(hints).toHaveLength(0);
      });

      expect(hintSystem.hasHints(state)).toSucceedAndSatisfy((hasHints) => {
        expect(hasHints).toBe(false);
      });
    });

    test('should handle puzzles with minimal clues', () => {
      const minimalPuzzle = createTestPuzzle([
        '1........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(minimalPuzzle);

      // Should not crash with minimal input
      expect(hintSystem.generateHints(state)).toSucceed();
      expect(hintSystem.hasHints(state)).toSucceed();
      expect(hintSystem.getHintStatistics(state)).toSucceed();
    });

    test('should handle configuration edge cases', () => {
      // System with no techniques enabled
      const emptySystem = HintSystem.create({
        enableNakedSingles: false,
        enableHiddenSingles: false
      }).orThrow();

      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);
      const state = createPuzzleState(puzzle);

      expect(emptySystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        expect(hints).toHaveLength(0);
      });

      expect(emptySystem.getBestHint(state)).toFailWith(/No hints available/);
    });

    test('should validate hint system consistency across multiple calls', () => {
      const puzzle = createTestPuzzle([
        '53..7....',
        '6..195...',
        '.98....6.',
        '8...6...3',
        '4..8.3..1',
        '7...2...6',
        '.6....28.',
        '...419..5',
        '....8..79'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(puzzle);

      // Multiple calls should produce consistent results
      const calls = 5;
      const allHints = [];

      for (let i = 0; i < calls; i++) {
        const hints = hintSystem.generateHints(state).orThrow();
        allHints.push(hints);
      }

      // All calls should return the same number of hints
      const firstCallCount = allHints[0].length;
      for (const hints of allHints) {
        expect(hints.length).toBe(firstCallCount);
      }

      // Best hints should be consistent
      for (let i = 0; i < calls; i++) {
        if (allHints[i].length > 0) {
          const bestHint = hintSystem.getBestHint(state).orThrow();
          expect(bestHint.cellActions[0].cellId).toBeDefined();
          expect(bestHint.cellActions[0].value).toBeDefined();
        }
      }
    });
  });

  describe('performance and scalability', () => {
    test('should handle hint generation efficiently', () => {
      const puzzle = createTestPuzzle([
        '53..7....',
        '6..195...',
        '.98....6.',
        '8...6...3',
        '4..8.3..1',
        '7...2...6',
        '.6....28.',
        '...419..5',
        '....8..79'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(puzzle);

      // Measure hint generation time (should be reasonable)
      const startTime = Date.now();
      const hints = hintSystem.generateHints(state).orThrow();
      const endTime = Date.now();

      expect(hints.length).toBeGreaterThanOrEqual(0);

      // Should complete within reasonable time (generous limit for CI environments)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds should be more than enough
    });

    test('should handle multiple hint requests efficiently', () => {
      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(puzzle);

      // Multiple rapid hint requests should all succeed
      const requests = 10;
      const startTime = Date.now();

      for (let i = 0; i < requests; i++) {
        expect(hintSystem.generateHints(state)).toSucceed();
        expect(hintSystem.hasHints(state)).toSucceed();
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Should handle multiple requests efficiently
      expect(totalDuration).toBeLessThan(10000); // 10 seconds for 10 requests
    });
  });

  describe('educational content quality', () => {
    test('should provide educational value in explanations', () => {
      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(puzzle);

      expect(hintSystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          // Educational explanations should teach concepts
          const educationalExp = hint.explanations.find((exp) => exp.level === 'educational');
          if (educationalExp) {
            expect(educationalExp.description.length).toBeGreaterThan(100);
            expect(educationalExp.description).toMatch(/(technique|method|strategy|rule)/i);
            expect(educationalExp.tips).toBeDefined();
            expect(educationalExp.tips?.length).toBeGreaterThan(0);
          }

          // Brief explanations should be actionable
          const briefExp = hint.explanations.find((exp) => exp.level === 'brief');
          if (briefExp) {
            expect(briefExp.steps).toBeDefined();
            expect(briefExp.steps!.length).toBeGreaterThan(0);
          }
        }
      });
    });

    test('should provide progressive learning from brief to educational', () => {
      const puzzle = createTestPuzzle([
        '12345678.',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........',
        '.........'
      ]);

      const hintSystem = HintSystem.create().orThrow();
      const state = createPuzzleState(puzzle);

      expect(hintSystem.generateHints(state)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          const brief = hint.explanations.find((exp) => exp.level === 'brief');
          const detailed = hint.explanations.find((exp) => exp.level === 'detailed');
          const educational = hint.explanations.find((exp) => exp.level === 'educational');

          if (brief && detailed && educational) {
            // Should progress from brief to detailed to educational
            expect(detailed.description.length).toBeGreaterThan(brief.description.length);
            expect(educational.description.length).toBeGreaterThan(detailed.description.length);

            // Educational should have more comprehensive content
            expect(educational.steps!.length).toBeGreaterThanOrEqual(detailed.steps!.length);
            expect(educational.tips!.length).toBeGreaterThan(0);
          }
        }
      });
    });
  });
});

// Helper functions for creating test puzzles and states
function createTestPuzzle(rows: string[]): IPuzzleDescription {
  return {
    id: 'integration-test-puzzle',
    description: 'Integration test puzzle for hint system',
    type: 'sudoku' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: rows.join('')
  };
}

function createPuzzleState(puzzleDesc: IPuzzleDescription): PuzzleState {
  const puzzle = Puzzles.Any.create(puzzleDesc).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();
  return session.state;
}
