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
  Entities,
  FillingId,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  ProcedureId,
  CollectionId,
  FillingName
} from '@fgv/ts-chocolate';

import {
  formatFilling,
  formatFillingList,
  formatProducedFilling,
  IFillingListItem
} from '../../../../../commands/filling/shared/outputFormatter';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createMinimalFillingVariation(
  overrides?: Partial<Entities.Fillings.IFillingRecipeVariationEntity>
): Entities.Fillings.IFillingRecipeVariationEntity {
  return {
    variationSpec: 'v1' as FillingRecipeVariationSpec,
    createdDate: '2026-01-15',
    ingredients: [
      {
        ingredient: {
          ids: ['coll.dark-70' as IngredientId],
          preferredId: 'coll.dark-70' as IngredientId
        },
        amount: 300 as Measurement
      },
      {
        ingredient: {
          ids: ['coll.cream' as IngredientId],
          preferredId: 'coll.cream' as IngredientId
        },
        amount: 200 as Measurement
      }
    ],
    baseWeight: 500 as Measurement,
    ...overrides
  };
}

function createMinimalFilling(overrides?: Record<string, unknown>): Entities.Fillings.IFillingRecipeEntity {
  return {
    baseId: 'dark-ganache',
    name: 'Dark Ganache Classic',
    category: 'ganache',
    goldenVariationSpec: 'v1',
    variations: [createMinimalFillingVariation()],
    ...overrides
  } as unknown as Entities.Fillings.IFillingRecipeEntity;
}

function createFillingListItem(overrides?: Partial<IFillingListItem>): IFillingListItem {
  return {
    id: 'coll.dark-ganache' as FillingId,
    name: 'Dark Ganache Classic' as FillingName,
    collectionId: 'coll' as CollectionId,
    category: 'ganache',
    variationCount: 1,
    goldenVariationSpec: 'v1' as FillingRecipeVariationSpec,
    ...overrides
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('filling outputFormatter', () => {
  // ==========================================================================
  // formatFillingList
  // ==========================================================================

  describe('formatFillingList', () => {
    test('returns no fillings message for empty list', () => {
      const output = formatFillingList([], 'human');
      expect(output).toBe('No fillings found.');
    });

    test('formats single filling as human output', () => {
      const items = [createFillingListItem()];
      const output = formatFillingList(items, 'human');
      expect(output).toContain('Found 1 filling(s)');
      expect(output).toContain('coll.dark-ganache');
      expect(output).toContain('Dark Ganache Classic');
      expect(output).toContain('ganache');
    });

    test('formats multiple fillings with alignment', () => {
      const items = [
        createFillingListItem(),
        createFillingListItem({
          id: 'coll.caramel-salt' as FillingId,
          name: 'Salted Caramel' as FillingName,
          category: 'caramel',
          variationCount: 3,
          tags: ['classic', 'sea-salt']
        })
      ];
      const output = formatFillingList(items, 'human');
      expect(output).toContain('Found 2 filling(s)');
      expect(output).toContain('coll.caramel-salt');
      expect(output).toContain('Salted Caramel');
      expect(output).toContain('classic, sea-salt');
    });

    test('formats as JSON', () => {
      const items = [createFillingListItem()];
      const output = formatFillingList(items, 'json');
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('coll.dark-ganache');
    });

    test('formats as YAML', () => {
      const items = [createFillingListItem()];
      const output = formatFillingList(items, 'yaml');
      expect(output).toContain('id: coll.dark-ganache');
      expect(output).toContain('name: Dark Ganache Classic');
    });

    test('formats as table', () => {
      const items = [createFillingListItem()];
      const output = formatFillingList(items, 'table');
      expect(output).toContain('|');
      expect(output).toContain('coll.dark-ganache');
    });

    test('returns no fillings message for empty table', () => {
      const output = formatFillingList([], 'table');
      expect(output).toBe('No fillings found.');
    });
  });

  // ==========================================================================
  // formatFilling
  // ==========================================================================

  describe('formatFilling', () => {
    test('formats minimal filling as human output', () => {
      const filling = createMinimalFilling();
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Filling: Dark Ganache Classic');
      expect(output).toContain('ID: coll.dark-ganache');
      expect(output).toContain('Category: ganache');
      expect(output).toContain('Variation: v1 (golden)');
      expect(output).toContain('Base Weight: 500g');
      expect(output).toContain('coll.dark-70');
      expect(output).toContain('300');
      expect(output).toContain('coll.cream');
      expect(output).toContain('200');
    });

    test('formats filling with description and tags', () => {
      const filling = createMinimalFilling({
        description: 'A rich dark chocolate ganache',
        tags: ['classic', 'dark']
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Description: A rich dark chocolate ganache');
      expect(output).toContain('Tags: classic, dark');
    });

    test('formats filling with variation notes and yield', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation({
            notes: [{ text: 'Use fresh cream only' }] as unknown as ReadonlyArray<never>,
            yield: '50 bonbons'
          })
        ]
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Yield: 50 bonbons');
    });

    test('formats filling with ingredient notes', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation({
            ingredients: [
              {
                ingredient: {
                  ids: ['coll.dark-70' as IngredientId],
                  preferredId: 'coll.dark-70' as IngredientId
                },
                amount: 300 as Measurement,
                notes: [{ text: 'melted to 45°C' }] as unknown as ReadonlyArray<never>
              }
            ],
            baseWeight: 300 as Measurement
          })
        ]
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('coll.dark-70');
    });

    test('formats filling with ratings', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation({
            ratings: [
              { category: 'flavor', score: 5 },
              { category: 'texture', score: 4, notes: 'Slightly grainy' }
            ] as unknown as ReadonlyArray<Entities.Fillings.IFillingRating>
          })
        ]
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Ratings:');
      expect(output).toContain('flavor');
      expect(output).toContain('5/5');
      expect(output).toContain('texture');
      expect(output).toContain('4/5');
      expect(output).toContain('Slightly grainy');
    });

    test('formats filling with procedure references', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation({
            procedures: {
              options: [
                { id: 'coll.make-ganache' as ProcedureId },
                {
                  id: 'coll.alt-ganache' as ProcedureId,
                  notes: [{ text: 'faster method' }] as unknown as ReadonlyArray<never>
                }
              ],
              preferredId: 'coll.make-ganache' as ProcedureId
            }
          })
        ]
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Procedures:');
      expect(output).toContain('coll.make-ganache');
      expect(output).toContain('(preferred)');
    });

    test('formats filling with URLs', () => {
      const filling = createMinimalFilling({
        urls: [{ url: 'https://example.com/recipe', category: 'recipe' }] as unknown as ReadonlyArray<never>
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('https://example.com/recipe');
    });

    test('formats filling with multiple variations', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation(),
          createMinimalFillingVariation({
            variationSpec: 'v2' as FillingRecipeVariationSpec,
            createdDate: '2026-02-01'
          })
        ]
      });
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      expect(output).toContain('Other variations (1):');
      expect(output).toContain('v2');
    });

    test('shows specific non-golden variation', () => {
      const filling = createMinimalFilling({
        variations: [
          createMinimalFillingVariation(),
          createMinimalFillingVariation({
            variationSpec: 'v2' as FillingRecipeVariationSpec,
            createdDate: '2026-02-01'
          })
        ]
      });
      const output = formatFilling(
        filling,
        'coll.dark-ganache' as FillingId,
        'human',
        'v2' as FillingRecipeVariationSpec
      );
      expect(output).toContain('Variation: v2');
      expect(output).not.toContain('Variation: v2 (golden)');
    });

    test('shows error when variation not found', () => {
      const filling = createMinimalFilling();
      const output = formatFilling(
        filling,
        'coll.dark-ganache' as FillingId,
        'human',
        'nonexistent' as FillingRecipeVariationSpec
      );
      expect(output).toContain('Variation nonexistent not found');
      expect(output).toContain('Available variations:');
    });

    test('formats as JSON', () => {
      const filling = createMinimalFilling();
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'json');
      const parsed = JSON.parse(output);
      expect(parsed.name).toBe('Dark Ganache Classic');
    });

    test('formats as YAML', () => {
      const filling = createMinimalFilling();
      const output = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'yaml');
      expect(output).toContain('name: Dark Ganache Classic');
    });

    test('formats as table (same as human)', () => {
      const filling = createMinimalFilling();
      const humanOutput = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'human');
      const tableOutput = formatFilling(filling, 'coll.dark-ganache' as FillingId, 'table');
      expect(tableOutput).toBe(humanOutput);
    });
  });

  // ==========================================================================
  // formatProducedFilling
  // ==========================================================================

  describe('formatProducedFilling', () => {
    const sourceVariation = createMinimalFillingVariation();

    function createProducedFilling(
      overrides?: Partial<Entities.Fillings.IProducedFillingEntity>
    ): Entities.Fillings.IProducedFillingEntity {
      return {
        variationId: 'coll.dark-ganache@v1' as FillingRecipeVariationId,
        scaleFactor: 2,
        targetWeight: 1000 as Measurement,
        ingredients: [
          {
            ingredientId: 'coll.dark-70' as IngredientId,
            amount: 600 as Measurement
          },
          {
            ingredientId: 'coll.cream' as IngredientId,
            amount: 400 as Measurement
          }
        ],
        ...overrides
      };
    }

    test('formats produced filling as human output', () => {
      const produced = createProducedFilling();
      const output = formatProducedFilling(produced, sourceVariation, 'human');
      expect(output).toContain('Produced Filling');
      expect(output).toContain('Source: coll.dark-ganache@v1');
      expect(output).toContain('Scale Factor: 2.00x');
      expect(output).toContain('Source Weight: 500g');
      expect(output).toContain('Target Weight: 1000g');
      expect(output).toContain('coll.dark-70');
      expect(output).toContain('600');
      expect(output).toContain('coll.cream');
      expect(output).toContain('400');
      expect(output).toContain('Total: 1000g');
    });

    test('shows original amounts with (was) notation', () => {
      const produced = createProducedFilling();
      const output = formatProducedFilling(produced, sourceVariation, 'human');
      expect(output).toContain('(was 300');
      expect(output).toContain('(was 200');
    });

    test('formats with custom precision', () => {
      const produced = createProducedFilling({
        scaleFactor: 1.5,
        targetWeight: 750 as Measurement,
        ingredients: [
          {
            ingredientId: 'coll.dark-70' as IngredientId,
            amount: 450 as Measurement
          }
        ]
      });
      const output = formatProducedFilling(produced, sourceVariation, 'human', 2);
      expect(output).toContain('450');
    });

    test('formats as JSON', () => {
      const produced = createProducedFilling();
      const output = formatProducedFilling(produced, sourceVariation, 'json');
      const parsed = JSON.parse(output);
      expect(parsed.scaleFactor).toBe(2);
      expect(parsed.targetWeight).toBe(1000);
    });

    test('formats as YAML', () => {
      const produced = createProducedFilling();
      const output = formatProducedFilling(produced, sourceVariation, 'yaml');
      expect(output).toContain('scaleFactor: 2');
      expect(output).toContain('targetWeight: 1000');
    });

    test('formats as table (same as human)', () => {
      const produced = createProducedFilling();
      const humanOutput = formatProducedFilling(produced, sourceVariation, 'human');
      const tableOutput = formatProducedFilling(produced, sourceVariation, 'table');
      expect(tableOutput).toBe(humanOutput);
    });
  });
});
