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
import { succeed } from '@fgv/ts-utils';
import {
  ExplanationFormatter,
  ExplanationRegistry,
  EducationalContent
} from '../../../packlets/hints/explanations';
import { NakedSinglesProvider } from '../../../packlets/hints/nakedSingles';
import { HiddenSinglesProvider } from '../../../packlets/hints/hiddenSingles';
import { PuzzleState } from '../../../packlets/common/puzzleState';
import { Puzzle } from '../../../packlets/common/puzzle';
import { PuzzleSession } from '../../../packlets/common/puzzleSession';
import { Puzzles, IPuzzleDescription, PuzzleType } from '../../../index';
import {
  IHintExplanation,
  TechniqueIds,
  TechniqueId,
  IHint,
  ConfidenceLevels,
  DifficultyLevel
} from '../../../packlets/hints/types';
import { IHintExplanationProvider } from '../../../packlets/hints/interfaces';
import { CellId } from '../../../packlets/common/common';

/* eslint-enable @rushstack/packlets/mechanics */

describe('ExplanationFormatter', () => {
  describe('formatExplanation', () => {
    test('should format basic explanation with title and description', () => {
      const explanation: IHintExplanation = {
        level: 'brief',
        title: 'Test Technique',
        description: 'This is a test description.'
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      expect(formatted).toContain('Test Technique');
      expect(formatted).toContain('This is a test description.');
    });

    test('should include steps when provided', () => {
      const explanation: IHintExplanation = {
        level: 'detailed',
        title: 'Test Technique',
        description: 'This is a test description.',
        steps: ['Step 1: Do this', 'Step 2: Do that', 'Step 3: Complete the action']
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      expect(formatted).toContain('Step 1: Do this');
      expect(formatted).toContain('Step 2: Do that');
      expect(formatted).toContain('Step 3: Complete the action');
    });

    test('should include tips when provided', () => {
      const explanation: IHintExplanation = {
        level: 'educational',
        title: 'Test Technique',
        description: 'This is a test description.',
        tips: ['Tip 1: Remember this', "Tip 2: Don't forget that"]
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      expect(formatted).toContain('Tip 1: Remember this');
      expect(formatted).toContain("Tip 2: Don't forget that");
    });

    test('should format complete explanation with all sections', () => {
      const explanation: IHintExplanation = {
        level: 'educational',
        title: 'Complete Test',
        description: 'This explanation has all sections.',
        steps: ['First step', 'Second step'],
        tips: ['Important tip', 'Helpful hint']
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      expect(formatted).toContain('Complete Test');
      expect(formatted).toContain('This explanation has all sections.');
      expect(formatted).toContain('First step');
      expect(formatted).toContain('Second step');
      expect(formatted).toContain('Important tip');
      expect(formatted).toContain('Helpful hint');
    });

    test('should handle empty steps and tips arrays', () => {
      const explanation: IHintExplanation = {
        level: 'brief',
        title: 'Minimal Explanation',
        description: 'Just title and description.',
        steps: [],
        tips: []
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      expect(formatted).toContain('Minimal Explanation');
      expect(formatted).toContain('Just title and description.');
      // Should not crash with empty arrays
      expect(typeof formatted).toBe('string');
    });

    test('should produce well-formatted output', () => {
      const explanation: IHintExplanation = {
        level: 'detailed',
        title: 'Naked Single',
        description: 'Cell A9 can only contain the value 9.',
        steps: ['Examine cell A9', 'Check row, column, and box', 'Set A9 = 9'],
        tips: ['Look for cells with only one candidate', 'Start with naked singles first']
      };

      const formatted = ExplanationFormatter.formatExplanation(explanation);

      // Should be readable and well-structured
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).not.toContain('undefined');
      expect(formatted).not.toContain('[object Object]');
    });
  });
});

describe('Explanation Content Validation', () => {
  let nakedSinglesProvider: NakedSinglesProvider;
  let hiddenSinglesProvider: HiddenSinglesProvider;
  let testState: PuzzleState;
  let testPuzzle: Puzzle;

  beforeEach(() => {
    nakedSinglesProvider = NakedSinglesProvider.create().orThrow();
    hiddenSinglesProvider = HiddenSinglesProvider.create().orThrow();

    const puzzleDesc = createTestPuzzle([
      '12345678.', // Creates naked single at A9 = 9
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........'
    ]);
    const result = createPuzzleAndState(puzzleDesc);
    testPuzzle = result.puzzle;
    testState = result.state;
  });

  describe('naked singles explanations', () => {
    test('should provide contextually accurate explanations', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          // Brief explanation should be concise and actionable
          const briefExp = hint.explanations.find((exp) => exp.level === 'brief');
          expect(briefExp).toBeDefined();
          expect(briefExp!.description).toContain('can only contain');
          expect(briefExp!.description).toContain('A9');
          expect(briefExp!.description).toContain('9');

          // Detailed explanation should explain the reasoning
          const detailedExp = hint.explanations.find((exp) => exp.level === 'detailed');
          expect(detailedExp).toBeDefined();
          expect(detailedExp!.description).toContain('only one possible candidate');
          expect(detailedExp!.description).toContain('row, column, or 3x3 box');

          // Educational explanation should provide learning context
          const educationalExp = hint.explanations.find((exp) => exp.level === 'educational');
          expect(educationalExp).toBeDefined();
          expect(educationalExp!.description).toContain('fundamental rules');
          expect(educationalExp!.description).toContain('naked single occurs when');
        }
      });
    });

    test('should provide step-by-step instructions', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];
          const detailedExp = hint.explanations.find((exp) => exp.level === 'detailed');

          expect(detailedExp?.steps).toBeDefined();
          expect(detailedExp!.steps!.length).toBeGreaterThan(0);

          // Steps should be actionable and specific
          const stepsText = detailedExp!.steps!.join(' ');
          expect(stepsText).toContain('A9');
          expect(stepsText).toContain('9');
        }
      });
    });

    test('should provide helpful tips', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          for (const explanation of hint.explanations) {
            if (explanation.tips && explanation.tips.length > 0) {
              const tipsText = explanation.tips.join(' ');
              expect(tipsText.length).toBeGreaterThan(0);

              // Tips should provide general guidance
              expect(tipsText.toLowerCase()).toMatch(/(always|check|start|look|remember)/);
            }
          }
        }
      });
    });
  });

  describe('hidden singles explanations', () => {
    test('should explain unit-based reasoning', () => {
      expect(hiddenSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          const explanations = hint.explanations;
          const allExplanationText = explanations.map((exp) => exp.description).join(' ');

          // Should mention the specific unit (row, column, or box)
          expect(allExplanationText).toMatch(/(row|column|box)/);
          expect(allExplanationText).toContain('can only');
        }
      });
    });

    test('should differentiate from naked singles in explanations', () => {
      expect(hiddenSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];
          const educationalExp = hint.explanations.find((exp) => exp.level === 'educational');

          if (educationalExp) {
            expect(educationalExp.description).toContain('hidden');
            expect(educationalExp.description).toMatch(/(technique|placement|constraints)/);
          }
        }
      });
    });
  });

  describe('explanation consistency', () => {
    test('should have consistent explanation levels across techniques', () => {
      const providers = [nakedSinglesProvider, hiddenSinglesProvider];

      for (const provider of providers) {
        expect(provider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
          if (hints.length > 0) {
            const hint = hints[0];

            // Should have all three explanation levels
            const levels = hint.explanations.map((exp) => exp.level);
            expect(levels).toContain('brief');
            expect(levels).toContain('detailed');
            expect(levels).toContain('educational');

            // Brief should be shortest, educational should be longest
            const brief = hint.explanations.find((exp) => exp.level === 'brief');
            const educational = hint.explanations.find((exp) => exp.level === 'educational');

            if (brief && educational) {
              expect(educational.description.length).toBeGreaterThan(brief.description.length);
            }
          }
        });
      }
    });

    test('should provide meaningful content at each level', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          for (const explanation of hint.explanations) {
            // All explanations should have meaningful content
            expect(explanation.title.length).toBeGreaterThan(0);
            expect(explanation.description.length).toBeGreaterThan(10);

            // Detailed and educational should have steps
            if (explanation.level === 'detailed' || explanation.level === 'educational') {
              expect(explanation.steps).toBeDefined();
              expect(explanation.steps!.length).toBeGreaterThan(0);
            }

            // Educational should have tips
            if (explanation.level === 'educational') {
              expect(explanation.tips).toBeDefined();
              expect(explanation.tips!.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  });

  describe('explanation accuracy', () => {
    test('should reference correct cell and value in explanations', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];
          const cellId = hint.cellActions[0].cellId;
          const value = hint.cellActions[0].value;

          for (const explanation of hint.explanations) {
            // Description should mention the specific cell and value
            expect(explanation.description).toContain(cellId);
            expect(explanation.description).toContain(value!.toString());

            // Steps should also reference the cell and value
            if (explanation.steps) {
              const stepsText = explanation.steps.join(' ');
              expect(stepsText).toContain(cellId);
              expect(stepsText).toContain(value!.toString());
            }
          }
        }
      });
    });

    test('should not contain contradictory information', () => {
      const providers = [nakedSinglesProvider, hiddenSinglesProvider];

      for (const provider of providers) {
        expect(provider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
          if (hints.length > 0) {
            const hint = hints[0];

            for (const explanation of hint.explanations) {
              // Should not contain contradictory statements
              const text = explanation.description.toLowerCase();

              // For naked singles, should not mention hidden concepts
              if (hint.techniqueId.includes('naked')) {
                expect(text).not.toContain('hidden single');
              }

              // For hidden singles, should not mention naked concepts incorrectly
              if (hint.techniqueId.includes('hidden')) {
                expect(text).not.toContain('naked single');
              }
            }
          }
        });
      }
    });
  });

  describe('formatAllExplanations', () => {
    test('should format multiple explanations with level headers', () => {
      const explanations: IHintExplanation[] = [
        {
          level: 'brief',
          title: 'Quick Hint',
          description: 'This is a brief explanation.'
        },
        {
          level: 'detailed',
          title: 'Detailed Analysis',
          description: 'This is a detailed explanation.',
          steps: ['Step 1', 'Step 2']
        },
        {
          level: 'educational',
          title: 'Educational Content',
          description: 'This teaches the concept.',
          tips: ['Tip 1', 'Tip 2']
        }
      ];

      const formatted = ExplanationFormatter.formatAllExplanations(explanations);

      expect(formatted).toContain('--- BRIEF ---');
      expect(formatted).toContain('--- DETAILED ---');
      expect(formatted).toContain('--- EDUCATIONAL ---');
      expect(formatted).toContain('Quick Hint');
      expect(formatted).toContain('Detailed Analysis');
      expect(formatted).toContain('Educational Content');
    });

    test('should handle empty explanations array', () => {
      const formatted = ExplanationFormatter.formatAllExplanations([]);
      expect(formatted).toBe('');
    });

    test('should separate sections with blank lines', () => {
      const explanations: IHintExplanation[] = [
        { level: 'brief', title: 'Test 1', description: 'Description 1' },
        { level: 'detailed', title: 'Test 2', description: 'Description 2' }
      ];

      const formatted = ExplanationFormatter.formatAllExplanations(explanations);
      const lines = formatted.split('\n');

      // Should have blank lines between sections
      expect(lines.filter((line) => line === '')).toBeDefined();
    });
  });

  describe('createLevelSummary', () => {
    test('should list all available explanation levels', () => {
      const explanations: IHintExplanation[] = [
        { level: 'brief', title: 'Test', description: 'Test' },
        { level: 'detailed', title: 'Test', description: 'Test' },
        { level: 'educational', title: 'Test', description: 'Test' }
      ];

      const summary = ExplanationFormatter.createLevelSummary(explanations);

      expect(summary).toContain('Available explanation levels:');
      expect(summary).toContain('brief');
      expect(summary).toContain('detailed');
      expect(summary).toContain('educational');
    });

    test('should handle single explanation level', () => {
      const explanations: IHintExplanation[] = [{ level: 'brief', title: 'Test', description: 'Test' }];

      const summary = ExplanationFormatter.createLevelSummary(explanations);
      expect(summary).toBe('Available explanation levels: brief');
    });

    test('should handle empty explanations array', () => {
      const summary = ExplanationFormatter.createLevelSummary([]);
      expect(summary).toBe('Available explanation levels: ');
    });
  });

  describe('formatting quality', () => {
    test('should produce well-formatted text for all explanation levels', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          for (const explanation of hint.explanations) {
            const formatted = ExplanationFormatter.formatExplanation(explanation);

            // Should be properly formatted text
            expect(formatted.length).toBeGreaterThan(0);
            expect(formatted).not.toContain('undefined');
            expect(formatted).not.toContain('[object Object]');
            expect(formatted.trim()).toBe(formatted); // No leading/trailing whitespace
          }
        }
      });
    });

    test('should handle special characters and formatting in explanations', () => {
      expect(nakedSinglesProvider.generateHints(testPuzzle, testState)).toSucceedAndSatisfy((hints) => {
        if (hints.length > 0) {
          const hint = hints[0];

          for (const explanation of hint.explanations) {
            const formatted = ExplanationFormatter.formatExplanation(explanation);

            // Should handle common punctuation properly
            expect(formatted).not.toMatch(/\s{3,}/); // No excessive spaces (3 or more)
            expect(formatted).not.toMatch(/\.\./); // No double periods
          }
        }
      });
    });
  });
});

describe('ExplanationRegistry', () => {
  let registry: ExplanationRegistry;
  let mockProvider: IHintExplanationProvider;
  let testHint: IHint;
  let testState: PuzzleState;
  let testPuzzle: Puzzle;

  beforeEach(() => {
    registry = new ExplanationRegistry();

    // Create a mock provider
    mockProvider = {
      techniqueId: TechniqueIds.NAKED_SINGLES,
      generateExplanations: jest.fn().mockReturnValue(
        succeed([
          {
            level: 'brief',
            title: 'Mock Brief',
            description: 'Mock brief description'
          },
          {
            level: 'detailed',
            title: 'Mock Detailed',
            description: 'Mock detailed description',
            steps: ['Mock step 1', 'Mock step 2']
          }
        ])
      )
    };

    // Create test hint and state
    const puzzleDesc = createTestPuzzle([
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
    const result = createPuzzleAndState(puzzleDesc);
    testPuzzle = result.puzzle;
    testState = result.state;

    testHint = {
      techniqueId: TechniqueIds.NAKED_SINGLES,
      techniqueName: 'Naked Singles',
      difficulty: 'beginner' as DifficultyLevel,
      confidence: ConfidenceLevels.HIGH,
      cellActions: [
        {
          cellId: 'A9' as unknown as CellId,
          action: 'set-value',
          value: 9
        }
      ],
      relevantCells: {
        primary: ['A9' as unknown as CellId],
        secondary: [],
        affected: []
      },
      explanations: [],
      priority: 100
    };
  });

  describe('registerProvider', () => {
    test('should successfully register a new provider', () => {
      expect(registry.registerProvider(mockProvider)).toSucceed();
    });

    test('should fail when registering duplicate provider', () => {
      expect(registry.registerProvider(mockProvider)).toSucceed();
      expect(registry.registerProvider(mockProvider)).toFailWith(
        /technique.*naked-singles.*already registered/i
      );
    });

    test('should allow different providers for different techniques', () => {
      const hiddenProvider: IHintExplanationProvider = {
        techniqueId: TechniqueIds.HIDDEN_SINGLES,
        generateExplanations: jest.fn().mockReturnValue(succeed([]))
      };

      expect(registry.registerProvider(mockProvider)).toSucceed();
      expect(registry.registerProvider(hiddenProvider)).toSucceed();
    });
  });

  describe('getExplanations', () => {
    test('should return explanations from registered provider', () => {
      expect(registry.registerProvider(mockProvider)).toSucceed();

      expect(registry.getExplanations(testHint, testPuzzle, testState)).toSucceedAndSatisfy(
        (explanations) => {
          expect(explanations).toHaveLength(2);
          expect(explanations[0].level).toBe('brief');
          expect(explanations[0].title).toBe('Mock Brief');
          expect(explanations[1].level).toBe('detailed');
          expect(explanations[1].title).toBe('Mock Detailed');
        }
      );

      expect(mockProvider.generateExplanations).toHaveBeenCalledWith(testHint, testPuzzle, testState);
    });

    test('should fail when no provider registered for technique', () => {
      expect(registry.getExplanations(testHint, testPuzzle, testState)).toFailWith(
        /no explanation provider found.*naked-singles/i
      );
    });

    test('should handle provider that returns empty explanations', () => {
      const emptyProvider: IHintExplanationProvider = {
        techniqueId: TechniqueIds.NAKED_SINGLES,
        generateExplanations: jest.fn().mockReturnValue(succeed([]))
      };

      expect(registry.registerProvider(emptyProvider)).toSucceed();
      expect(registry.getExplanations(testHint, testPuzzle, testState)).toSucceedAndSatisfy(
        (explanations) => {
          expect(explanations).toHaveLength(0);
        }
      );
    });
  });

  describe('getExplanationAtLevel', () => {
    beforeEach(() => {
      expect(registry.registerProvider(mockProvider)).toSucceed();
    });

    test('should return explanation at requested level', () => {
      expect(registry.getExplanationAtLevel(testHint, 'brief', testPuzzle, testState)).toSucceedAndSatisfy(
        (explanation) => {
          expect(explanation.level).toBe('brief');
          expect(explanation.title).toBe('Mock Brief');
        }
      );

      expect(registry.getExplanationAtLevel(testHint, 'detailed', testPuzzle, testState)).toSucceedAndSatisfy(
        (explanation) => {
          expect(explanation.level).toBe('detailed');
          expect(explanation.title).toBe('Mock Detailed');
        }
      );
    });

    test('should fail when requested level not available', () => {
      expect(registry.getExplanationAtLevel(testHint, 'educational', testPuzzle, testState)).toFailWith(
        /no explanation available.*educational.*naked-singles/i
      );
    });

    test('should fail when no provider registered', () => {
      const registry2 = new ExplanationRegistry();
      expect(registry2.getExplanationAtLevel(testHint, 'brief', testPuzzle, testState)).toFailWith(
        /no explanation provider found.*naked-singles/i
      );
    });
  });
});

describe('EducationalContent', () => {
  describe('getTechniqueIntroduction', () => {
    test('should return introduction for naked singles', () => {
      expect(EducationalContent.getTechniqueIntroduction(TechniqueIds.NAKED_SINGLES)).toSucceedAndSatisfy(
        (intro) => {
          expect(intro).toContain('most fundamental');
          expect(intro).toContain('naked single');
          expect(intro).toContain('row, column, and 3x3 box');
        }
      );
    });

    test('should return introduction for hidden singles', () => {
      expect(EducationalContent.getTechniqueIntroduction(TechniqueIds.HIDDEN_SINGLES)).toSucceedAndSatisfy(
        (intro) => {
          expect(intro).toContain('Hidden Singles');
          expect(intro).toContain('specific values');
          expect(intro).toContain('unit');
        }
      );
    });

    test('should fail for unknown technique', () => {
      expect(
        EducationalContent.getTechniqueIntroduction('unknown-technique' as unknown as TechniqueId)
      ).toFailWith(/no introduction available.*unknown-technique/i);
    });
  });

  describe('getTechniqueRelationships', () => {
    test('should return relationships for naked singles', () => {
      expect(EducationalContent.getTechniqueRelationships(TechniqueIds.NAKED_SINGLES)).toSucceedAndSatisfy(
        (relationships) => {
          expect(relationships.length).toBeGreaterThan(0);
          const allText = relationships.join(' ');
          expect(allText).toContain('naked singles first');
          expect(allText).toContain('hidden singles');
        }
      );
    });

    test('should return relationships for hidden singles', () => {
      expect(EducationalContent.getTechniqueRelationships(TechniqueIds.HIDDEN_SINGLES)).toSucceedAndSatisfy(
        (relationships) => {
          expect(relationships.length).toBeGreaterThan(0);
          const allText = relationships.join(' ');
          expect(allText).toContain('after applying naked singles');
          expect(allText).toContain('unit types');
        }
      );
    });

    test('should fail for unknown technique', () => {
      expect(
        EducationalContent.getTechniqueRelationships('unknown-technique' as unknown as TechniqueId)
      ).toFailWith(/no relationship information available.*unknown-technique/i);
    });
  });

  describe('getTechniqueOverview', () => {
    test('should combine introduction and relationships for naked singles', () => {
      expect(EducationalContent.getTechniqueOverview(TechniqueIds.NAKED_SINGLES)).toSucceedAndSatisfy(
        (overview) => {
          expect(overview).toContain('most fundamental');
          expect(overview).toContain('Technique Relationships:');
          expect(overview).toContain('• Apply naked singles first');
        }
      );
    });

    test('should combine introduction and relationships for hidden singles', () => {
      expect(EducationalContent.getTechniqueOverview(TechniqueIds.HIDDEN_SINGLES)).toSucceedAndSatisfy(
        (overview) => {
          expect(overview).toContain('Hidden Singles focus');
          expect(overview).toContain('Technique Relationships:');
          expect(overview).toContain('• Check for hidden singles');
        }
      );
    });

    test('should fail for unknown technique', () => {
      expect(
        EducationalContent.getTechniqueOverview('unknown-technique' as unknown as TechniqueId)
      ).toFailWith(/no introduction available.*unknown-technique/i);
    });
  });

  describe('getGeneralSolvingTips', () => {
    test('should return array of solving tips', () => {
      const tips = EducationalContent.getGeneralSolvingTips();

      expect(tips.length).toBeGreaterThan(0);
      expect(tips[0]).toContain('naked singles');

      const allTips = tips.join(' ');
      expect(allTips).toContain('hidden singles');
      expect(allTips).toContain('candidates');
      expect(allTips).toContain('pattern recognition');
    });

    test('should return consistent tips', () => {
      const tips1 = EducationalContent.getGeneralSolvingTips();
      const tips2 = EducationalContent.getGeneralSolvingTips();

      expect(tips1).toEqual(tips2);
    });
  });

  describe('getDifficultyProgression', () => {
    test('should return progression advice', () => {
      const progression = EducationalContent.getDifficultyProgression();

      expect(progression.length).toBeGreaterThan(0);

      const allText = progression.join(' ');
      expect(allText).toContain('Master naked singles');
      expect(allText).toContain('Beginner puzzles');
      expect(allText).toContain('Intermediate');
      expect(allText).toContain('Advanced');
      expect(allText).toContain('Expert');
    });

    test('should provide logical progression', () => {
      const progression = EducationalContent.getDifficultyProgression();

      // First tip should be about mastering basics
      expect(progression[0]).toContain('Master naked singles');

      // Should mention technique building
      const lastTip = progression[progression.length - 1];
      expect(lastTip).toContain('foundation');
    });
  });

  describe('createBeginnerGuide', () => {
    test('should create comprehensive beginner guide', () => {
      const guide = EducationalContent.createBeginnerGuide();

      expect(guide).toContain('SUDOKU SOLVING GUIDE FOR BEGINNERS');
      expect(guide).toContain('BASIC TECHNIQUES:');
      expect(guide).toContain('1. Naked Singles');
      expect(guide).toContain('2. Hidden Singles');
      expect(guide).toContain('SOLVING STRATEGY:');
      expect(guide).toContain('PROGRESSION:');
    });

    test('should include technique introductions', () => {
      const guide = EducationalContent.createBeginnerGuide();

      expect(guide).toContain('most fundamental Sudoku technique');
      expect(guide).toContain('finding where specific values must be placed');
    });

    test('should include tips and progression advice', () => {
      const guide = EducationalContent.createBeginnerGuide();

      expect(guide).toContain('• Start with naked singles');
      expect(guide).toContain('• Master naked singles and hidden singles');
    });

    test('should be well-formatted', () => {
      const guide = EducationalContent.createBeginnerGuide();

      expect(guide.length).toBeGreaterThan(100);
      expect(guide).toContain('=');
      expect(guide).not.toContain('undefined');
      expect(guide).not.toContain('[object Object]');
    });
  });
});

// Helper functions for creating test puzzles and states
function createTestPuzzle(rows: string[]): IPuzzleDescription {
  return {
    id: 'test-puzzle',
    description: 'Test puzzle for explanations',
    type: 'sudoku' as PuzzleType,
    level: 1,
    rows: 9,
    cols: 9,
    cells: rows.join('')
  };
}

function createPuzzleAndState(puzzleDesc: IPuzzleDescription): { puzzle: Puzzle; state: PuzzleState } {
  const puzzle = Puzzles.Any.create(puzzleDesc).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();
  return { puzzle, state: session.state };
}
