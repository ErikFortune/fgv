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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { PuzzleState } from '../common';
import { IHintExplanationProvider } from './interfaces';
import { ExplanationLevel, IHint, IHintExplanation, TechniqueId, TechniqueIds } from './types';

/**
 * Registry for managing hint explanation providers.
 * @public
 */
export class ExplanationRegistry {
  private readonly _providers: Map<TechniqueId, IHintExplanationProvider>;

  /**
   * Creates a new ExplanationRegistry instance.
   */
  public constructor() {
    this._providers = new Map();
  }

  /**
   * Registers a new explanation provider.
   * @param provider - The provider to register
   * @returns Result indicating success or failure of registration
   */
  public registerProvider(provider: IHintExplanationProvider): Result<void> {
    if (this._providers.has(provider.techniqueId)) {
      return fail(`Explanation provider for technique ${provider.techniqueId} is already registered`);
    }

    this._providers.set(provider.techniqueId, provider);
    return succeed(undefined);
  }

  /**
   * Gets explanations for a specific hint.
   * @param hint - The hint to explain
   * @param state - The puzzle state context
   * @returns Result containing the explanations
   */
  public getExplanations(hint: IHint, state: PuzzleState): Result<readonly IHintExplanation[]> {
    const provider = this._providers.get(hint.techniqueId);
    if (!provider) {
      return fail(`No explanation provider found for technique ${hint.techniqueId}`);
    }

    return provider.generateExplanations(hint, state);
  }

  /**
   * Gets a specific explanation at the requested level.
   * @param hint - The hint to explain
   * @param level - The desired explanation level
   * @param state - The puzzle state context
   * @returns Result containing the explanation at the specified level
   */
  public getExplanationAtLevel(
    hint: IHint,
    level: ExplanationLevel,
    state: PuzzleState
  ): Result<IHintExplanation> {
    return this.getExplanations(hint, state).onSuccess((explanations) => {
      const explanation = explanations.find((exp) => exp.level === level);
      return explanation
        ? succeed(explanation)
        : fail(`No explanation available at level ${level} for technique ${hint.techniqueId}`);
    });
  }
}

/**
 * Utility class for formatting and displaying hint explanations.
 * @public
 */
export class ExplanationFormatter {
  /**
   * Formats a hint explanation as a readable string.
   * @param explanation - The explanation to format
   * @param includeSteps - Whether to include step-by-step instructions
   * @param includeTips - Whether to include tips
   * @returns Formatted explanation string
   */
  public static formatExplanation(
    explanation: IHintExplanation,
    includeSteps: boolean = true,
    includeTips: boolean = true
  ): string {
    const sections: string[] = [];

    // Title and description
    sections.push(`${explanation.title}`);
    sections.push(`${explanation.description}`);

    // Steps
    if (includeSteps && explanation.steps && explanation.steps.length > 0) {
      sections.push('\nSteps:');
      explanation.steps.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
    }

    // Tips
    if (includeTips && explanation.tips && explanation.tips.length > 0) {
      sections.push('\nTips:');
      explanation.tips.forEach((tip) => {
        sections.push(`• ${tip}`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Formats all explanations for a hint as a structured string.
   * @param explanations - The explanations to format
   * @returns Formatted explanations string
   */
  public static formatAllExplanations(explanations: readonly IHintExplanation[]): string {
    const sections: string[] = [];

    for (const explanation of explanations) {
      sections.push(`--- ${explanation.level.toUpperCase()} ---`);
      sections.push(this.formatExplanation(explanation));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Creates a summary of available explanation levels.
   * @param explanations - The explanations to summarize
   * @returns Summary string
   */
  public static createLevelSummary(explanations: readonly IHintExplanation[]): string {
    const levels = explanations.map((exp) => exp.level).join(', ');
    return `Available explanation levels: ${levels}`;
  }
}

/**
 * Educational content manager for Sudoku solving techniques.
 * @public
 */
export class EducationalContent {
  private static readonly _techniqueIntroductions: Map<TechniqueId, string> = new Map([
    [
      TechniqueIds.NAKED_SINGLES,
      'Naked Singles are the most fundamental Sudoku technique. When a cell has only one possible ' +
        'value due to the numbers already placed in its row, column, and 3x3 box, that cell contains ' +
        'a "naked single." This technique is always safe to apply and forms the foundation for more ' +
        'advanced solving methods.'
    ],

    [
      TechniqueIds.HIDDEN_SINGLES,
      'Hidden Singles focus on finding where specific values must be placed within a unit (row, ' +
        'column, or 3x3 box). When a particular number can only be placed in one cell within a unit, ' +
        'that placement is a "hidden single." This technique complements naked singles and together ' +
        'they can solve many easier puzzles completely.'
    ]
  ]);

  private static readonly _techniqueRelationships: Map<TechniqueId, string[]> = new Map([
    [
      TechniqueIds.NAKED_SINGLES,
      [
        'Apply naked singles first - they often reveal new naked singles',
        'Naked singles may create hidden singles in related units',
        'Use with hidden singles to solve beginner-level puzzles'
      ]
    ],

    [
      TechniqueIds.HIDDEN_SINGLES,
      [
        'Check for hidden singles after applying naked singles',
        'Hidden singles can create new naked singles',
        'Consider all three unit types: rows, columns, and boxes'
      ]
    ]
  ]);

  /**
   * Gets an introduction to a specific technique.
   * @param techniqueId - The technique to introduce
   * @returns Result containing the introduction text
   */
  public static getTechniqueIntroduction(techniqueId: TechniqueId): Result<string> {
    const introduction = this._techniqueIntroductions.get(techniqueId);
    return introduction
      ? succeed(introduction)
      : fail(`No introduction available for technique ${techniqueId}`);
  }

  /**
   * Gets relationship information for a technique.
   * @param techniqueId - The technique to get relationships for
   * @returns Result containing the relationship information
   */
  public static getTechniqueRelationships(techniqueId: TechniqueId): Result<readonly string[]> {
    const relationships = this._techniqueRelationships.get(techniqueId);
    return relationships
      ? succeed(relationships)
      : fail(`No relationship information available for technique ${techniqueId}`);
  }

  /**
   * Gets a complete educational overview for a technique.
   * @param techniqueId - The technique to describe
   * @returns Result containing the complete overview
   */
  public static getTechniqueOverview(techniqueId: TechniqueId): Result<string> {
    const introduction = this.getTechniqueIntroduction(techniqueId);
    const relationships = this.getTechniqueRelationships(techniqueId);

    return introduction.onSuccess((intro) => {
      return relationships.onSuccess((rels) => {
        const sections = [intro, '', 'Technique Relationships:', ...rels.map((rel) => `• ${rel}`)];
        return succeed(sections.join('\n'));
      });
    });
  }

  /**
   * Gets general Sudoku solving advice.
   * @returns Array of general solving tips
   */
  public static getGeneralSolvingTips(): readonly string[] {
    return [
      'Start with naked singles - they are always correct when found',
      'After placing numbers, scan for new naked singles immediately',
      'Check for hidden singles systematically in rows, columns, and boxes',
      'Focus on units with many filled cells first',
      'Keep track of candidates mentally or with pencil marks',
      'Take breaks when stuck - fresh eyes often spot overlooked patterns',
      'Practice pattern recognition to spot techniques more quickly'
    ];
  }

  /**
   * Gets difficulty progression advice.
   * @returns Advice for progressing through difficulty levels
   */
  public static getDifficultyProgression(): readonly string[] {
    return [
      'Master naked singles and hidden singles completely before advancing',
      'Beginner puzzles can often be solved with just these two techniques',
      'Intermediate puzzles introduce pointing pairs and box/line interactions',
      'Advanced puzzles require naked and hidden pairs/triples',
      'Expert puzzles may need advanced techniques like X-wing and swordfish',
      'Each technique builds on the foundation of simpler techniques'
    ];
  }

  /**
   * Creates a complete educational guide for beginners.
   * @returns Comprehensive beginner guide
   */
  public static createBeginnerGuide(): string {
    const sections = [
      'SUDOKU SOLVING GUIDE FOR BEGINNERS',
      '='.repeat(35),
      '',
      'Sudoku is a logic puzzle where you fill a 9x9 grid with digits 1-9.',
      'Each row, column, and 3x3 box must contain each digit exactly once.',
      '',
      'BASIC TECHNIQUES:',
      '',
      '1. Naked Singles',
      this._techniqueIntroductions.get(TechniqueIds.NAKED_SINGLES) || '',
      '',
      '2. Hidden Singles',
      this._techniqueIntroductions.get(TechniqueIds.HIDDEN_SINGLES) || '',
      '',
      'SOLVING STRATEGY:',
      ...this.getGeneralSolvingTips().map((tip) => `• ${tip}`),
      '',
      'PROGRESSION:',
      ...this.getDifficultyProgression().map((tip) => `• ${tip}`)
    ];

    return sections.join('\n');
  }
}
