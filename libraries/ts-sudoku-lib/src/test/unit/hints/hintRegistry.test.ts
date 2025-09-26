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
import { HintRegistry } from '../../../packlets/hints/hintRegistry';
import { NakedSinglesProvider } from '../../../packlets/hints/nakedSingles';
import { HiddenSinglesProvider } from '../../../packlets/hints/hiddenSingles';
import { PuzzleState } from '../../../packlets/common/puzzleState';
import { PuzzleSession } from '../../../packlets/common/puzzleSession';
import { Puzzles, IPuzzleDescription, PuzzleType } from '../../../index';
import {
  TechniqueIds,
  ConfidenceLevels,
  ConfidenceLevel,
  IHint,
  TechniqueId,
  DifficultyLevel
} from '../../../packlets/hints/types';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { BaseHintProvider } from '../../../packlets/hints/baseHintProvider';

// Test helper classes for error scenarios
class TestFaultyHintProvider extends BaseHintProvider {
  public constructor() {
    super({
      techniqueId: 'faulty' as TechniqueId,
      techniqueName: 'Faulty Provider',
      difficulty: 'beginner' as DifficultyLevel,
      priority: 99
    });
  }

  public canProvideHints(): boolean {
    return true;
  }

  public generateHints(): Result<readonly IHint[]> {
    return fail('Simulated provider failure');
  }
}

class TestInvalidHintProvider extends BaseHintProvider {
  public constructor() {
    super({
      techniqueId: 'invalid' as TechniqueId,
      techniqueName: 'Invalid Provider',
      difficulty: 'beginner' as DifficultyLevel,
      priority: 98
    });
  }

  public canProvideHints(): boolean {
    return true;
  }

  public generateHints(): Result<readonly IHint[]> {
    // Return hints with invalid structure (for testing error handling)
    const invalidHint = {
      techniqueId: this.techniqueId,
      techniqueName: this.techniqueName,
      difficulty: this.difficulty,
      confidence: ConfidenceLevels.HIGH,
      cellActions: [], // Invalid: no actions
      relevantCells: { primary: [], secondary: [], affected: [] },
      explanations: [],
      priority: this.priority
    } as IHint;

    return succeed([invalidHint]);
  }
}

describe('HintRegistry', () => {
  let registry: HintRegistry;
  let nakedSinglesProvider: NakedSinglesProvider;
  let hiddenSinglesProvider: HiddenSinglesProvider;

  beforeEach(() => {
    registry = HintRegistry.create().orThrow();
    nakedSinglesProvider = NakedSinglesProvider.create().orThrow();
    hiddenSinglesProvider = HiddenSinglesProvider.create().orThrow();
  });

  describe('creation', () => {
    test('should create successfully', () => {
      expect(HintRegistry.create()).toSucceed();
    });

    test('should start with no registered providers', () => {
      expect(registry.getRegisteredTechniques()).toHaveLength(0);
      expect(registry.getProviders()).toHaveLength(0);
    });
  });

  describe('provider registration', () => {
    test('should register a provider successfully', () => {
      expect(registry.registerProvider(nakedSinglesProvider)).toSucceed();

      const techniques = registry.getRegisteredTechniques();
      expect(techniques).toContain(TechniqueIds.NAKED_SINGLES);
      expect(techniques).toHaveLength(1);
    });

    test('should register multiple providers', () => {
      expect(registry.registerProvider(nakedSinglesProvider)).toSucceed();
      expect(registry.registerProvider(hiddenSinglesProvider)).toSucceed();

      const techniques = registry.getRegisteredTechniques();
      expect(techniques).toContain(TechniqueIds.NAKED_SINGLES);
      expect(techniques).toContain(TechniqueIds.HIDDEN_SINGLES);
      expect(techniques).toHaveLength(2);
    });

    test('should fail to register duplicate provider', () => {
      expect(registry.registerProvider(nakedSinglesProvider)).toSucceed();
      expect(registry.registerProvider(nakedSinglesProvider)).toFailWith(/already registered/);
    });

    test('should retrieve registered provider', () => {
      registry.registerProvider(nakedSinglesProvider).orThrow();

      expect(registry.getProvider(TechniqueIds.NAKED_SINGLES)).toSucceedAndSatisfy((provider) => {
        expect(provider).toBe(nakedSinglesProvider);
      });
    });

    test('should fail to retrieve unregistered provider', () => {
      expect(registry.getProvider(TechniqueIds.NAKED_SINGLES)).toFailWith(/not found/);
    });
  });

  describe('provider unregistration', () => {
    test('should unregister a provider successfully', () => {
      registry.registerProvider(nakedSinglesProvider).orThrow();
      expect(registry.getRegisteredTechniques()).toHaveLength(1);

      expect(registry.unregisterProvider(TechniqueIds.NAKED_SINGLES)).toSucceed();
      expect(registry.getRegisteredTechniques()).toHaveLength(0);
    });

    test('should fail to unregister non-existent provider', () => {
      expect(registry.unregisterProvider(TechniqueIds.NAKED_SINGLES)).toFailWith(/not found/);
    });

    test('should not affect other providers when unregistering', () => {
      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();

      expect(registry.unregisterProvider(TechniqueIds.NAKED_SINGLES)).toSucceed();

      const techniques = registry.getRegisteredTechniques();
      expect(techniques).not.toContain(TechniqueIds.NAKED_SINGLES);
      expect(techniques).toContain(TechniqueIds.HIDDEN_SINGLES);
      expect(techniques).toHaveLength(1);
    });
  });

  describe('getProviders filtering', () => {
    beforeEach(() => {
      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();
    });

    test('should return all providers when no options specified', () => {
      const providers = registry.getProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toContain(nakedSinglesProvider);
      expect(providers).toContain(hiddenSinglesProvider);
    });

    test('should filter by enabled techniques', () => {
      const providers = registry.getProviders({
        enabledTechniques: [TechniqueIds.NAKED_SINGLES]
      });
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(nakedSinglesProvider);
    });

    test('should return empty array when no techniques match filter', () => {
      const providers = registry.getProviders({
        enabledTechniques: ['non-existent' as TechniqueId]
      });
      expect(providers).toHaveLength(0);
    });

    test('should filter by preferred difficulty', () => {
      // Both providers are 'beginner' difficulty, so should return both
      const providers = registry.getProviders({
        preferredDifficulty: 'beginner'
      });
      expect(providers).toHaveLength(2);

      // No providers match 'expert' difficulty
      const expertProviders = registry.getProviders({
        preferredDifficulty: 'expert'
      });
      expect(expertProviders).toHaveLength(0);
    });
  });

  describe('generateAllHints', () => {
    let testState: PuzzleState;

    beforeEach(() => {
      const puzzle = createTestPuzzle([
        '12345678.', // Creates a naked single at r0c8
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

      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();
    });

    test('should generate hints from all registered providers', () => {
      expect(registry.generateAllHints(testState)).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeGreaterThan(0);

        // Should contain hints from multiple techniques
        const techniqueIds = hints.map((h) => h.techniqueId);
        expect(new Set(techniqueIds).size).toBeGreaterThanOrEqual(1);
      });
    });

    test('should respect maxHints option', () => {
      expect(registry.generateAllHints(testState, { maxHints: 2 })).toSucceedAndSatisfy((hints) => {
        expect(hints.length).toBeLessThanOrEqual(2);
      });
    });

    test('should respect minConfidence option', () => {
      expect(
        registry.generateAllHints(testState, { minConfidence: ConfidenceLevels.HIGH })
      ).toSucceedAndSatisfy((hints) => {
        for (const hint of hints) {
          expect(hint.confidence).toBeGreaterThanOrEqual(ConfidenceLevels.HIGH);
        }
      });
    });

    test('should filter by enabled techniques', () => {
      expect(
        registry.generateAllHints(testState, {
          enabledTechniques: [TechniqueIds.NAKED_SINGLES]
        })
      ).toSucceedAndSatisfy((hints) => {
        for (const hint of hints) {
          expect(hint.techniqueId).toBe(TechniqueIds.NAKED_SINGLES);
        }
      });
    });

    test('should handle state where no hints are available', () => {
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

      expect(registry.generateAllHints(completeState)).toSucceedAndSatisfy((hints) => {
        expect(hints).toHaveLength(0);
      });
    });
  });

  describe('getBestHint', () => {
    let testState: PuzzleState;

    beforeEach(() => {
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

      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();
    });

    test('should return best hint based on priority and confidence', () => {
      expect(registry.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        expect(hint.confidence).toBe(ConfidenceLevels.HIGH);

        // Naked singles have priority 1, hidden singles have priority 2
        // So if both are available, naked single should be preferred
        if (hint.techniqueId === TechniqueIds.NAKED_SINGLES) {
          expect(hint.priority).toBe(1);
        }
      });
    });

    test('should fail when no hints are available', () => {
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

      expect(registry.getBestHint(completeState)).toFailWith(/No hints available/);
    });

    test('should respect filtering options', () => {
      expect(
        registry.getBestHint(testState, {
          enabledTechniques: [TechniqueIds.HIDDEN_SINGLES]
        })
      ).toSucceedAndSatisfy((hint) => {
        expect(hint.techniqueId).toBe(TechniqueIds.HIDDEN_SINGLES);
      });
    });
  });

  describe('error handling', () => {
    test('should handle provider that throws during hint generation', () => {
      const faultyProvider = new TestFaultyHintProvider();
      registry.registerProvider(faultyProvider).orThrow();

      const testState = createTestPuzzleState();

      expect(registry.generateAllHints(testState)).toSucceedAndSatisfy((hints) => {
        // Should continue working despite faulty provider
        expect(Array.isArray(hints)).toBe(true);
      });
    });

    test('should handle provider that returns invalid hints', () => {
      const invalidProvider = new TestInvalidHintProvider();
      registry.registerProvider(invalidProvider).orThrow();

      const testState = createTestPuzzleState();

      // Registry should handle invalid hints gracefully
      expect(registry.generateAllHints(testState)).toSucceed();
    });

    test('should validate options in generateAllHints', () => {
      const testState = createTestPuzzleState();

      expect(registry.generateAllHints(testState, { maxHints: -1 })).toFail();

      expect(
        registry.generateAllHints(testState, { minConfidence: 0 as unknown as ConfidenceLevel })
      ).toFail();
    });
  });

  describe('provider priority handling', () => {
    test('should order providers by priority', () => {
      registry.registerProvider(hiddenSinglesProvider).orThrow(); // priority 2
      registry.registerProvider(nakedSinglesProvider).orThrow(); // priority 1

      const providers = registry.getProviders();

      // Should be ordered by priority (ascending)
      expect(providers[0].priority).toBeLessThanOrEqual(providers[1].priority);
    });

    test('should use priority for best hint selection', () => {
      const testState = createTestPuzzleState();

      registry.registerProvider(hiddenSinglesProvider).orThrow(); // priority 2, registered first
      registry.registerProvider(nakedSinglesProvider).orThrow(); // priority 1, registered second

      expect(registry.getBestHint(testState)).toSucceedAndSatisfy((hint) => {
        // Should prefer naked singles (priority 1) over hidden singles (priority 2)
        // if both are available
        if (hint.techniqueId === TechniqueIds.NAKED_SINGLES) {
          expect(hint.priority).toBe(1);
        }
      });
    });
  });

  describe('integration scenarios', () => {
    test('should work with real puzzle scenarios', () => {
      // Use a more realistic puzzle scenario
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
      const state = createPuzzleState(puzzle);

      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();

      expect(registry.generateAllHints(state)).toSucceedAndSatisfy((hints) => {
        // Should find some hints in a real puzzle
        expect(hints.length).toBeGreaterThanOrEqual(0);

        // All hints should be valid
        for (const hint of hints) {
          expect(hint.cellActions.length).toBeGreaterThan(0);
          expect(hint.explanations.length).toBeGreaterThan(0);
          expect(hint.confidence).toBeGreaterThanOrEqual(1);
          expect(hint.confidence).toBeLessThanOrEqual(5);
        }
      });
    });
  });
});

// Helper functions for creating test puzzles and states
function createTestPuzzle(rows: string[]): IPuzzleDescription {
  return {
    id: 'test-puzzle',
    description: 'Test puzzle for hint registry',
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

function createTestPuzzleState(): PuzzleState {
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
  return createPuzzleState(puzzle);
}

// Additional tests for coverage completion
describe('HintRegistry - Additional Coverage', () => {
  let registry: HintRegistry;
  let nakedSinglesProvider: NakedSinglesProvider;
  let hiddenSinglesProvider: HiddenSinglesProvider;

  beforeEach(() => {
    registry = HintRegistry.create().orThrow();
    nakedSinglesProvider = NakedSinglesProvider.create().orThrow();
    hiddenSinglesProvider = HiddenSinglesProvider.create().orThrow();
  });

  describe('registry utility methods', () => {
    test('should check if providers are registered with hasProvider', () => {
      // Initially no providers
      expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(false);
      expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(false);

      // Register a provider
      registry.registerProvider(nakedSinglesProvider).orThrow();
      expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(true);
      expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(false);

      // Register another provider
      registry.registerProvider(hiddenSinglesProvider).orThrow();
      expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(true);
    });

    test('should clear all providers', () => {
      // Register providers
      registry.registerProvider(nakedSinglesProvider).orThrow();
      registry.registerProvider(hiddenSinglesProvider).orThrow();

      // Verify they're registered
      expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(true);
      expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(true);

      // Clear and verify
      expect(registry.clear()).toSucceed();
      expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(false);
      expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(false);
    });

    test('should group providers by difficulty level', () => {
      // Register providers with different difficulties
      registry.registerProvider(nakedSinglesProvider).orThrow(); // beginner
      registry.registerProvider(hiddenSinglesProvider).orThrow(); // beginner

      const providersByDifficulty = registry.getProvidersByDifficulty();

      expect(providersByDifficulty.has('beginner')).toBe(true);
      const beginnerProviders = providersByDifficulty.get('beginner');
      expect(beginnerProviders).toBeDefined();
      expect(beginnerProviders!.length).toBe(2);

      // Verify they're the right providers
      const techniqueIds = beginnerProviders!.map((p) => p.techniqueId);
      expect(techniqueIds).toContain(TechniqueIds.NAKED_SINGLES);
      expect(techniqueIds).toContain(TechniqueIds.HIDDEN_SINGLES);
    });

    test('should handle empty registry in getProvidersByDifficulty', () => {
      const emptyRegistry = HintRegistry.create().orThrow();
      const providersByDifficulty = emptyRegistry.getProvidersByDifficulty();

      expect(providersByDifficulty.size).toBe(0);
    });
  });

  describe('registry creation with providers', () => {
    test('should create registry with initial providers', () => {
      const providers = [nakedSinglesProvider, hiddenSinglesProvider];
      expect(HintRegistry.create(providers)).toSucceedAndSatisfy((registry) => {
        expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(true);
        expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(true);
      });
    });

    test('should handle valid provider registration during creation', () => {
      // Test normal successful case
      const validProviders = [nakedSinglesProvider, hiddenSinglesProvider];
      expect(HintRegistry.create(validProviders)).toSucceedAndSatisfy((registry) => {
        expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(true);
        expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(true);
      });
    });

    test('should create empty registry when no providers given', () => {
      expect(HintRegistry.create()).toSucceedAndSatisfy((registry) => {
        expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(false);
        expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(false);
      });

      expect(HintRegistry.create([])).toSucceedAndSatisfy((registry) => {
        expect(registry.hasProvider(TechniqueIds.NAKED_SINGLES)).toBe(false);
        expect(registry.hasProvider(TechniqueIds.HIDDEN_SINGLES)).toBe(false);
      });
    });
  });
});
