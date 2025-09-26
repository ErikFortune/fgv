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
import { HintSystem, DefaultHintApplicator } from '../../../packlets/hints/hints';
import { PuzzleState, CellId, PuzzleSession } from '../../../packlets/common';
import { Puzzles, IPuzzleDescription, PuzzleType } from '../../../index';
import { TechniqueIds, ConfidenceLevels } from '../../../packlets/hints/types';

describe('HintSystem', () => {
  let hintSystem: HintSystem;
  let testState: PuzzleState;

  beforeEach(() => {
    hintSystem = HintSystem.create().orThrow();

    const puzzle = createTestPuzzle([
      '12345678.', // Creates naked single at r0c8 = 9
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........'
    ]);
    testState = createPuzzleState(puzzle);
  });

  describe('creation', () => {
    test('should create with default configuration', () => {
      expect(HintSystem.create()).toSucceed();
    });

    test('should create with custom configuration', () => {
      const config = {
        enableNakedSingles: true,
        enableHiddenSingles: false,
        defaultExplanationLevel: 'brief' as const
      };

      expect(HintSystem.create(config)).toSucceedAndSatisfy((system) => {
        expect(system.config.enableNakedSingles).toBe(true);
        expect(system.config.enableHiddenSingles).toBe(false);
        expect(system.config.defaultExplanationLevel).toBe('brief');
      });
    });

    test('should have default providers registered', () => {
      const registeredTechniques = hintSystem.registry.getRegisteredTechniques();
      expect(registeredTechniques).toContain(TechniqueIds.NAKED_SINGLES);
      expect(registeredTechniques).toContain(TechniqueIds.HIDDEN_SINGLES);
    });

    test('should have default applicator', () => {
      expect(hintSystem.applicator).toBeInstanceOf(DefaultHintApplicator);
    });
  });

  describe('generateHints', () => {
    test('should generate hints for puzzle state', () => {
      expect(hintSystem.generateHints(testState)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeGreaterThan(0);

        for (const hint of hints) {
          expect(hint.cellActions.length).toBeGreaterThan(0);
          expect(hint.explanations.length).toBeGreaterThan(0);
          expect(hint.confidence).toBeGreaterThanOrEqual(1);
          expect(hint.confidence).toBeLessThanOrEqual(5);
        }
      });
    });

    test('should pass options to registry', () => {
      const options = {
        maxHints: 1,
        minConfidence: ConfidenceLevels.HIGH,
        enabledTechniques: [TechniqueIds.NAKED_SINGLES]
      };

      expect(hintSystem.generateHints(testState, options)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeLessThanOrEqual(1);

        for (const hint of hints) {
          expect(hint.confidence).toBeGreaterThanOrEqual(ConfidenceLevels.HIGH);
          expect(hint.techniqueId).toBe(TechniqueIds.NAKED_SINGLES);
        }
      });
    });
  });

  describe('getBestHint', () => {
    test('should return single best hint', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        expect(hint.cellActions.length).toBeGreaterThan(0);
        expect(hint.confidence).toBe(ConfidenceLevels.HIGH);

        // Should be highest priority (lowest number)
        expect(hint.priority).toBe(1);
      });
    });

    test('should fail when no hints available', () => {
      const completePuzzle = createTestPuzzle([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345678'
      ]);
      const completeState = createPuzzleState(completePuzzle);

      expect(hintSystem.getBestHint(completeState)).toFailWith(/No hints available/);
    });

    test('should respect filtering options', () => {
      expect(
        hintSystem.getBestHint(testState, {
          enabledTechniques: [TechniqueIds.HIDDEN_SINGLES]
        })
      ).toSucceedAndSatisfy((hint) => {
        expect(hint.techniqueId).toBe(TechniqueIds.HIDDEN_SINGLES);
      });
    });
  });

  describe('applyHint', () => {
    test('should generate cell updates from hint', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        expect(hintSystem.applyHint(hint, testState)).toSucceedAndSatisfy((updates) => {
          expect(updates.length).toBeGreaterThan(0);

          const update = updates[0];
          expect(update.id).toBe(hint.cellActions[0].cellId);
          expect(update.value).toBe(hint.cellActions[0].value);
          expect(update.notes).toBeDefined();
        });
      });
    });

    test('should preserve existing notes when applying hint', () => {
      // Create a state with notes
      const session = PuzzleSession.create(
        Puzzles.Any.create(
          createTestPuzzle([
            '12345678.',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........'
          ])
        ).orThrow()
      ).orThrow();

      // Add some notes to the target cell
      session.updateCellNotes('r0c8', [1, 2, 9]).orThrow();
      const stateWithNotes = session.state;

      expect(hintSystem.getBestHint(stateWithNotes)).toSucceedAndSatisfy((hint) => {
        expect(hintSystem.applyHint(hint, stateWithNotes)).toSucceedAndSatisfy((updates) => {
          const update = updates[0];
          expect(update.notes).toEqual([1, 2, 9]);
          expect(update.value).toBe(9);
        });
      });
    });
  });

  describe('validateHint', () => {
    test('should validate correct hint', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        expect(hintSystem.validateHint(hint, testState)).toSucceed();
      });
    });

    test('should reject hint for already filled cell', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        // Create a modified state where the target cell is already filled
        const filledPuzzle = createTestPuzzle([
          '123456789', // All cells filled
          '.........',
          '.........',
          '.........',
          '.........',
          '.........',
          '.........',
          '.........',
          '.........'
        ]);
        const filledState = createPuzzleState(filledPuzzle);

        expect(hintSystem.validateHint(hint, filledState)).toFailWith(/already has value/);
      });
    });

    test('should reject hint with invalid value', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        // Create a modified hint with invalid value
        const invalidHint = {
          ...hint,
          cellActions: [
            {
              ...hint.cellActions[0],
              value: 10 // Invalid value
            }
          ]
        };

        expect(hintSystem.validateHint(invalidHint, testState)).toFailWith(/Invalid value.*must be 1-9/);
      });
    });
  });

  describe('formatHintExplanation', () => {
    test('should format explanation at default level', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        const formatted = hintSystem.formatHintExplanation(hint);
        expect(formatted.length).toBeGreaterThan(0);
        expect(formatted).toContain(hint.techniqueName);
      });
    });

    test('should format explanation at specified level', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        const briefFormatted = hintSystem.formatHintExplanation(hint, 'brief');
        const educationalFormatted = hintSystem.formatHintExplanation(hint, 'educational');

        expect(briefFormatted.length).toBeGreaterThan(0);
        expect(educationalFormatted.length).toBeGreaterThan(0);
        expect(educationalFormatted.length).toBeGreaterThan(briefFormatted.length);
      });
    });

    test('should handle missing explanation level gracefully', () => {
      expect(hintSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        // Create hint with limited explanations
        const limitedHint = {
          ...hint,
          explanations: [hint.explanations[0]] // Only one explanation
        };

        const formatted = hintSystem.formatHintExplanation(limitedHint, 'educational');
        expect(formatted).toContain('No explanation available');
      });
    });
  });

  describe('hasHints', () => {
    test('should return true when hints are available', () => {
      expect(hintSystem.hasHints(testState)).toSucceedAndSatisfy((hasHints) => {
        expect(hasHints).toBe(true);
      });
    });

    test('should return false when no hints are available', () => {
      const completePuzzle = createTestPuzzle([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345678'
      ]);
      const completeState = createPuzzleState(completePuzzle);

      expect(hintSystem.hasHints(completeState)).toSucceedAndSatisfy((hasHints) => {
        expect(hasHints).toBe(false);
      });
    });
  });

  describe('getHintStatistics', () => {
    test('should provide statistics about available hints', () => {
      expect(hintSystem.getHintStatistics(testState)).toSucceedAndSatisfy((stats) => {
        expect(stats.totalHints).toBeGreaterThan(0);
        expect(stats.hintsByTechnique).toBeInstanceOf(Map);
        expect(stats.hintsByDifficulty).toBeInstanceOf(Map);

        // Should have at least one technique represented
        expect(stats.hintsByTechnique.size).toBeGreaterThan(0);
        expect(stats.hintsByDifficulty.size).toBeGreaterThan(0);

        // Counts should be consistent
        let totalFromTechniques = 0;
        for (const count of stats.hintsByTechnique.values()) {
          totalFromTechniques += count;
        }
        expect(totalFromTechniques).toBe(stats.totalHints);
      });
    });

    test('should return zero statistics for complete puzzle', () => {
      const completePuzzle = createTestPuzzle([
        '123456789',
        '456789123',
        '789123456',
        '234567891',
        '567891234',
        '891234567',
        '345678912',
        '678912345',
        '912345678'
      ]);
      const completeState = createPuzzleState(completePuzzle);

      expect(hintSystem.getHintStatistics(completeState)).toSucceedAndSatisfy((stats) => {
        expect(stats.totalHints).toBe(0);
        expect(stats.hintsByTechnique.size).toBe(0);
        expect(stats.hintsByDifficulty.size).toBe(0);
      });
    });
  });

  describe('getSystemSummary', () => {
    test('should provide informative system summary', () => {
      const summary = hintSystem.getSystemSummary();

      expect(summary).toContain('Sudoku Hint System');
      expect(summary).toContain('Registered Techniques');
      expect(summary).toContain('Naked Singles');
      expect(summary).toContain('Hidden Singles');
      expect(summary).toContain('Default Explanation Level');
    });

    test('should reflect current configuration', () => {
      const briefSystem = HintSystem.create({
        defaultExplanationLevel: 'brief'
      }).orThrow();

      const summary = briefSystem.getSystemSummary();
      expect(summary).toContain('brief');
    });
  });

  describe('integration scenarios', () => {
    test('should work with realistic puzzle progression', () => {
      // Start with a more complex puzzle
      const realPuzzle = createTestPuzzle([
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
      const realState = createPuzzleState(realPuzzle);

      // Should be able to generate hints
      expect(hintSystem.generateHints(realState)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeGreaterThanOrEqual(0);

        if (hints.length > 0) {
          // Should be able to get best hint
          expect(hintSystem.getBestHint(realState)).toSucceed();

          // Should be able to validate and apply hints
          const hint = hints[0];
          expect(hintSystem.validateHint(hint, realState)).toSucceed();
          expect(hintSystem.applyHint(hint, realState)).toSucceed();

          // Should be able to format explanations
          const explanation = hintSystem.formatHintExplanation(hint);
          expect(explanation.length).toBeGreaterThan(0);
        }
      });
    });

    test('should handle edge case puzzles gracefully', () => {
      // Empty puzzle
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
      const emptyState = createPuzzleState(emptyPuzzle);

      expect(hintSystem.generateHints(emptyState)).toSucceed();
      expect(hintSystem.hasHints(emptyState)).toSucceed();
      expect(hintSystem.getHintStatistics(emptyState)).toSucceed();

      // Minimal puzzle
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
      const minimalState = createPuzzleState(minimalPuzzle);

      expect(hintSystem.generateHints(minimalState)).toSucceed();
      expect(hintSystem.hasHints(minimalState)).toSucceed();
    });

    test('should maintain consistency across multiple operations', () => {
      // Multiple calls should produce consistent results
      const hints1 = hintSystem.generateHints(testState).orThrow();
      const hints2 = hintSystem.generateHints(testState).orThrow();

      expect(hints1.length).toBe(hints2.length);

      // Best hint should be consistent
      const best1 = hintSystem.getBestHint(testState).orThrow();
      const best2 = hintSystem.getBestHint(testState).orThrow();

      expect(best1.cellActions[0].cellId).toBe(best2.cellActions[0].cellId);
      expect(best1.cellActions[0].value).toBe(best2.cellActions[0].value);
    });
  });

  describe('configuration effects', () => {
    test('should respect disabled techniques', () => {
      const nakedOnlySystem = HintSystem.create({
        enableNakedSingles: true,
        enableHiddenSingles: false
      }).orThrow();

      expect(nakedOnlySystem.generateHints(testState)).toSucceedAndSatisfy((hints) => {
        for (const hint of hints) {
          expect(hint.techniqueId).toBe(TechniqueIds.NAKED_SINGLES);
        }
      });

      const hiddenOnlySystem = HintSystem.create({
        enableNakedSingles: false,
        enableHiddenSingles: true
      }).orThrow();

      expect(hiddenOnlySystem.generateHints(testState)).toSucceedAndSatisfy((hints) => {
        for (const hint of hints) {
          expect(hint.techniqueId).toBe(TechniqueIds.HIDDEN_SINGLES);
        }
      });
    });

    test('should use configured default explanation level', () => {
      const briefSystem = HintSystem.create({
        defaultExplanationLevel: 'brief'
      }).orThrow();

      expect(briefSystem.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        const formatted = briefSystem.formatHintExplanation(hint);

        // Should use brief explanation by default
        const briefExp = hint.explanations.find((exp) => exp.level === 'brief');
        expect(formatted).toContain(briefExp!.title);
      });
    });
  });
});

describe('DefaultHintApplicator', () => {
  let applicator: DefaultHintApplicator;
  let testState: PuzzleState;

  beforeEach(() => {
    applicator = new DefaultHintApplicator();

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
    testState = createPuzzleState(puzzle);
  });

  describe('validateHint', () => {
    test('should validate valid set-value hint', () => {
      const validHint = createTestHint('r0c8', 9);
      expect(applicator.validateHint(validHint, testState)).toSucceed();
    });

    test('should reject unsupported action types', () => {
      const invalidHint = createTestHint('r0c8', 9, 'eliminate-candidate');
      expect(applicator.validateHint(invalidHint, testState)).toFailWith(/Unsupported action type/);
    });

    test('should reject hint for non-existent cell', () => {
      const invalidHint = createTestHint('r99c99', 9);
      expect(applicator.validateHint(invalidHint, testState)).toFailWith(/Invalid cell/);
    });

    test('should reject hint for already filled cell', () => {
      const invalidHint = createTestHint('r0c0', 5); // r0c0 already has value 1
      expect(applicator.validateHint(invalidHint, testState)).toFailWith(/already has value/);
    });

    test('should reject hint with invalid value', () => {
      const invalidHint = createTestHint('r0c8', 10);
      expect(applicator.validateHint(invalidHint, testState)).toFailWith(/Invalid value.*must be 1-9/);
    });

    test('should reject hint with missing value', () => {
      const invalidHint = createTestHint('r0c8', undefined);
      expect(applicator.validateHint(invalidHint, testState)).toFailWith(/No value specified/);
    });
  });

  describe('applyHint', () => {
    test('should generate correct cell updates', () => {
      const hint = createTestHint('r0c8', 9);
      expect(applicator.applyHint(hint, testState)).toSucceedAndSatisfy((updates) => {
        expect(updates).toHaveLength(1);

        const update = updates[0];
        expect(update.id).toBe('r0c8');
        expect(update.value).toBe(9);
        expect(update.notes).toBeDefined();
      });
    });

    test('should preserve existing notes', () => {
      // Create a session with notes
      const session = PuzzleSession.create(
        Puzzles.Any.create(
          createTestPuzzle([
            '12345678.',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........',
            '.........'
          ])
        ).orThrow()
      ).orThrow();

      session.updateCellNotes('r0c8', [1, 2, 9]).orThrow();
      const stateWithNotes = session.state;

      const hint = createTestHint('r0c8', 9);
      expect(applicator.applyHint(hint, stateWithNotes)).toSucceedAndSatisfy((updates) => {
        const update = updates[0];
        expect(update.notes).toEqual([1, 2, 9]);
      });
    });

    test('should fail validation before applying', () => {
      const invalidHint = createTestHint('r0c0', 5); // Already filled cell
      expect(applicator.applyHint(invalidHint, testState)).toFailWith(/already has value/);
    });
  });
});

// Helper functions
function createTestPuzzle(rows: string[]): IPuzzleDescription {
  return {
    id: 'test-puzzle',
    description: 'Test puzzle for hint system',
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

function createTestHint(
  cellId: string,
  value: number | undefined,
  action: 'set-value' | 'eliminate-candidate' = 'set-value'
): any {
  return {
    techniqueId: TechniqueIds.NAKED_SINGLES,
    techniqueName: 'Test Technique',
    difficulty: 'beginner' as const,
    confidence: ConfidenceLevels.HIGH,
    cellActions: [
      {
        cellId: cellId as unknown as import('../../../packlets/common').CellId,
        action,
        value,
        reason: 'Test reason'
      }
    ],
    relevantCells: {
      primary: [cellId as unknown as import('../../../packlets/common').CellId],
      secondary: [],
      affected: []
    },
    explanations: [
      {
        level: 'brief' as const,
        title: 'Test',
        description: 'Test description'
      }
    ],
    priority: 1
  };
}

// Additional tests for error scenarios to improve coverage
describe('HintSystem - Error Scenarios for Coverage', () => {
  let hintSystem: HintSystem;
  let state: PuzzleState;

  beforeEach(() => {
    hintSystem = HintSystem.create().orThrow();

    const puzzleDesc = createTestPuzzle([
      '12345678.', // Creates naked single at r0c8 = 9
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........'
    ]);
    const puzzle = Puzzles.Any.create(puzzleDesc).orThrow();
    const session = PuzzleSession.create(puzzle).orThrow();
    state = session.state;
  });

  describe('hint validation error scenarios', () => {
    test('should handle invalid value in set-value action', () => {
      const invalidHint = createTestHint('r0c0', 0); // Invalid value
      expect(hintSystem.validateHint(invalidHint, state)).toFailWith(/invalid value/i);

      const invalidHint2 = createTestHint('r0c0', 10); // Invalid value
      expect(hintSystem.validateHint(invalidHint2, state)).toFailWith(/invalid value/i);
    });

    test('should handle missing value in set-value action', () => {
      const hintWithoutValue = createTestHint('r0c0', undefined);
      expect(hintSystem.validateHint(hintWithoutValue, state)).toFailWith(/no value specified/i);
    });

    test('should handle invalid cell ID in hint application', () => {
      const invalidCellHint = createTestHint('invalid-cell', 5);
      expect(hintSystem.applyHint(invalidCellHint, state)).toFailWith(/failed to get cell contents/i);
    });
  });

  describe('hint application edge cases', () => {
    test('should handle cell contents retrieval failure', () => {
      // Create a hint with an invalid cell ID to trigger getCellContents failure
      const badHint = createTestHint('r99c99', 5);
      expect(hintSystem.applyHint(badHint, state)).toFailWith(/failed to get cell contents/i);
    });

    test('should handle multiple cell actions with mixed validity', () => {
      const mixedValidityHint = {
        techniqueId: TechniqueIds.NAKED_SINGLES,
        techniqueName: 'Test Technique',
        difficulty: 'beginner' as const,
        confidence: ConfidenceLevels.HIGH,
        cellActions: [
          {
            cellId: 'r0c0' as CellId,
            action: 'set-value' as const,
            value: 5,
            reason: 'Valid action'
          },
          {
            cellId: 'invalid-cell' as CellId,
            action: 'set-value' as const,
            value: 6,
            reason: 'Invalid cell'
          }
        ],
        relevantCells: {
          primary: ['r0c0' as CellId],
          secondary: [],
          affected: []
        },
        explanations: [
          {
            level: 'brief' as const,
            title: 'Test',
            description: 'Test'
          }
        ],
        priority: 1
      };

      expect(hintSystem.applyHint(mixedValidityHint, state)).toFailWith(/failed to get cell contents/i);
    });
  });
});
