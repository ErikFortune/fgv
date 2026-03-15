// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Mock ESM-only module before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

import '@fgv/ts-utils-jest';
import {
  ConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  DecorationId,
  Entities,
  FillingId,
  IngredientId,
  Measurement,
  Millimeters,
  MoldId,
  ProcedureId
} from '@fgv/ts-chocolate';

import { formatConfectionHuman } from '../../../../commands/confection/showCommand';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createMoldedBonBonVariation(
  overrides?: Record<string, unknown>
): Entities.Confections.IMoldedBonBonRecipeVariationEntity {
  return {
    variationSpec: 'v1' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-15',
    yield: { numFrames: 24 },
    molds: {
      options: [{ id: 'coll.cw1000' as MoldId }],
      preferredId: 'coll.cw1000' as MoldId
    },
    shellChocolate: {
      ids: ['coll.dark-70' as IngredientId],
      preferredId: 'coll.dark-70' as IngredientId
    },
    ...overrides
  } as unknown as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
}

function createBarTruffleVariation(
  overrides?: Record<string, unknown>
): Entities.Confections.IBarTruffleRecipeVariationEntity {
  return {
    variationSpec: 'v1' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-15',
    yield: {
      numPieces: 30,
      weightPerPiece: 15 as Measurement,
      dimensions: { width: 30 as Millimeters, height: 20 as Millimeters, depth: 10 as Millimeters }
    },
    ...overrides
  } as unknown as Entities.Confections.IBarTruffleRecipeVariationEntity;
}

function createRolledTruffleVariation(
  overrides?: Record<string, unknown>
): Entities.Confections.IRolledTruffleRecipeVariationEntity {
  return {
    variationSpec: 'v1' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-15',
    yield: { numPieces: 40, weightPerPiece: 10 as Measurement },
    ...overrides
  } as unknown as Entities.Confections.IRolledTruffleRecipeVariationEntity;
}

function createConfection(
  confectionType: string,
  variation: Entities.Confections.AnyConfectionRecipeVariationEntity,
  overrides?: Record<string, unknown>
): Entities.Confections.AnyConfectionRecipeEntity {
  return {
    baseId: 'dark-ganache-bonbon',
    name: 'Dark Ganache Bonbon' as ConfectionName,
    confectionType,
    goldenVariationSpec: 'v1' as ConfectionRecipeVariationSpec,
    variations: [variation],
    ...overrides
  } as unknown as Entities.Confections.AnyConfectionRecipeEntity;
}

// ============================================================================
// Tests
// ============================================================================

describe('formatConfectionHuman', () => {
  test('formats basic confection info', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Confection: Dark Ganache Bonbon');
    expect(output).toContain('ID: coll.dark-ganache-bonbon');
    expect(output).toContain('Type: molded-bonbon');
  });

  test('formats description and tags', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation, {
      description: 'Classic dark ganache in a polycarbonate mold',
      tags: ['classic', 'dark']
    });
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Description: Classic dark ganache in a polycarbonate mold');
    expect(output).toContain('Tags: classic, dark');
  });

  test('formats golden variation marker', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Variation: v1 (golden)');
  });

  test('formats variation dates and yield', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Created: 2026-01-15');
    expect(output).toContain('Yield: 24 frames');
  });

  test('formats yield with custom unit and weight', () => {
    const variation = createBarTruffleVariation();
    const confection = createConfection('bar-truffle', variation);
    const output = formatConfectionHuman(confection, 'coll.bar-truffle' as ConfectionId);
    expect(output).toContain('Yield: 30 pieces');
    expect(output).toContain('Weight per piece: 15g');
  });

  // Molded bonbon specific
  test('formats molded bonbon with molds and shell chocolate', () => {
    const variation = createMoldedBonBonVariation({
      molds: {
        options: [
          { id: 'coll.cw1000' as MoldId },
          { id: 'coll.cw2000' as MoldId, notes: [{ text: 'alternative' }] }
        ],
        preferredId: 'coll.cw1000' as MoldId
      }
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Molds:');
    expect(output).toContain('coll.cw1000 (preferred)');
    expect(output).toContain('coll.cw2000');
    expect(output).toContain('Shell Chocolate:');
    expect(output).toContain('coll.dark-70 (preferred)');
  });

  test('formats molded bonbon with additional chocolates', () => {
    const variation = createMoldedBonBonVariation({
      additionalChocolates: [
        {
          purpose: 'Seal',
          chocolate: {
            ids: ['coll.dark-55' as IngredientId],
            preferredId: 'coll.dark-55' as IngredientId
          }
        }
      ]
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Seal Chocolate:');
    expect(output).toContain('coll.dark-55 (preferred)');
  });

  // Bar truffle specific
  test('formats bar truffle with bonbon dimensions', () => {
    const variation = createBarTruffleVariation();
    const confection = createConfection('bar-truffle', variation);
    const output = formatConfectionHuman(confection, 'coll.bar-truffle' as ConfectionId);
    expect(output).toContain('BonBon Dimensions:');
    expect(output).toContain('30 x 20 x 10 mm');
  });

  test('formats bar truffle with enrobing chocolate', () => {
    const variation = createBarTruffleVariation({
      enrobingChocolate: {
        ids: ['coll.dark-70' as IngredientId, 'coll.dark-64' as IngredientId],
        preferredId: 'coll.dark-70' as IngredientId
      }
    });
    const confection = createConfection('bar-truffle', variation);
    const output = formatConfectionHuman(confection, 'coll.bar-truffle' as ConfectionId);
    expect(output).toContain('Enrobing Chocolate:');
    expect(output).toContain('coll.dark-70 (preferred)');
    expect(output).toContain('coll.dark-64');
  });

  // Rolled truffle specific
  test('formats rolled truffle with enrobing and coatings', () => {
    const variation = createRolledTruffleVariation({
      enrobingChocolate: {
        ids: ['coll.dark-70' as IngredientId],
        preferredId: 'coll.dark-70' as IngredientId
      },
      coatings: {
        ids: ['coll.cocoa-powder' as IngredientId, 'coll.chopped-nuts' as IngredientId],
        preferredId: 'coll.cocoa-powder' as IngredientId
      }
    });
    const confection = createConfection('rolled-truffle', variation);
    const output = formatConfectionHuman(confection, 'coll.rolled-truffle' as ConfectionId);
    expect(output).toContain('Enrobing Chocolate:');
    expect(output).toContain('coll.dark-70 (preferred)');
    expect(output).toContain('Coatings:');
    expect(output).toContain('coll.cocoa-powder (preferred)');
    expect(output).toContain('coll.chopped-nuts');
  });

  // Fillings
  test('formats fillings with slots', () => {
    const variation = createMoldedBonBonVariation({
      fillings: [
        {
          slotId: 'main',
          name: 'Main Filling',
          filling: {
            options: [
              { id: 'coll.dark-ganache' as FillingId, type: 'recipe' },
              { id: 'coll.caramel' as FillingId, type: 'recipe', notes: [{ text: 'seasonal' }] }
            ],
            preferredId: 'coll.dark-ganache' as FillingId
          }
        }
      ]
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Fillings:');
    expect(output).toContain('Main Filling:');
    expect(output).toContain('coll.dark-ganache [recipe] (preferred)');
    expect(output).toContain('coll.caramel [recipe]');
  });

  test('uses slotId when name is not provided', () => {
    const variation = createMoldedBonBonVariation({
      fillings: [
        {
          slotId: 'slot-1',
          filling: {
            options: [{ id: 'coll.dark-ganache' as FillingId, type: 'recipe' }]
          }
        }
      ]
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('slot-1:');
  });

  // Decorations
  test('formats decorations', () => {
    const variation = createMoldedBonBonVariation({
      decorations: {
        options: [{ id: 'gold-leaf' as DecorationId }, { id: 'cocoa-dust' as DecorationId }],
        preferredId: 'gold-leaf' as DecorationId
      }
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Decorations:');
    expect(output).toContain('gold-leaf (preferred)');
    expect(output).toContain('cocoa-dust');
  });

  // Procedures
  test('formats procedures', () => {
    const variation = createMoldedBonBonVariation({
      procedures: {
        options: [
          { id: 'coll.bonbon-assembly' as ProcedureId },
          { id: 'coll.alt-bonbon' as ProcedureId, notes: [{ text: 'simplified' }] }
        ],
        preferredId: 'coll.bonbon-assembly' as ProcedureId
      }
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Procedures:');
    expect(output).toContain('coll.bonbon-assembly (preferred)');
  });

  // Notes
  test('formats variation notes', () => {
    const variation = createMoldedBonBonVariation({
      notes: 'Use tempered chocolate at 31°C'
    });
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Notes: Use tempered chocolate at 31°C');
  });

  // URLs
  test('formats confection URLs', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation, {
      urls: [{ url: 'https://example.com/recipe', category: 'recipe' }]
    });
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('https://example.com/recipe');
  });

  // Multiple variations
  test('shows other variations when multiple exist', () => {
    const v1 = createMoldedBonBonVariation();
    const v2 = createMoldedBonBonVariation({
      variationSpec: 'v2' as ConfectionRecipeVariationSpec,
      createdDate: '2026-02-01'
    });
    const confection = createConfection('molded-bonbon', v1, {
      variations: [v1, v2]
    });
    const output = formatConfectionHuman(confection, 'coll.dark-ganache-bonbon' as ConfectionId);
    expect(output).toContain('Other variations (1):');
    expect(output).toContain('v2');
  });

  // Specific variation selection
  test('shows specific variation when requested', () => {
    const v1 = createMoldedBonBonVariation();
    const v2 = createMoldedBonBonVariation({
      variationSpec: 'v2' as ConfectionRecipeVariationSpec,
      createdDate: '2026-02-01'
    });
    const confection = createConfection('molded-bonbon', v1, {
      variations: [v1, v2]
    });
    const output = formatConfectionHuman(
      confection,
      'coll.dark-ganache-bonbon' as ConfectionId,
      'v2' as ConfectionRecipeVariationSpec
    );
    expect(output).toContain('Variation: v2');
    expect(output).not.toContain('Variation: v2 (golden)');
  });

  test('shows error when requested variation not found', () => {
    const variation = createMoldedBonBonVariation();
    const confection = createConfection('molded-bonbon', variation);
    const output = formatConfectionHuman(
      confection,
      'coll.dark-ganache-bonbon' as ConfectionId,
      'nonexistent' as ConfectionRecipeVariationSpec
    );
    expect(output).toContain('Variation nonexistent not found');
    expect(output).toContain('Available variations:');
  });
});
