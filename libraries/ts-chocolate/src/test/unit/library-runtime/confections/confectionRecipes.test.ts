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

import '@fgv/ts-utils-jest';

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  Percentage,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  Model as CommonModel,
  CollectionId,
  MoldId,
  BaseMoldId,
  MoldFormat,
  Millimeters,
  ConfectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  SlotId,
  DecorationId,
  BaseDecorationId,
  NoteCategory,
  ProcedureId,
  BaseProcedureId
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary,
  IMoldEntity,
  MoldsLibrary,
  ConfectionsLibrary,
  Confections,
  IProcedureEntity,
  ProceduresLibrary,
  IDecorationEntity,
  DecorationsLibrary
} from '../../../../packlets/entities';
import {
  ChocolateEntityLibrary,
  ChocolateLibrary,
  ConfectionRecipeVariationBase
} from '../../../../packlets/library-runtime';

describe('Confection Recipes', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const creamChars: IGanacheCharacteristics = {
    cacaoFat: 0 as Percentage,
    sugar: 3 as Percentage,
    milkFat: 38 as Percentage,
    water: 55 as Percentage,
    solids: 4 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const milkChocolate: IChocolateIngredientEntity = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate 40%',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cocoaPowder: IIngredientEntity = {
    baseId: 'cocoa-powder' as BaseIngredientId,
    name: 'Cocoa Powder',
    category: 'other',
    ganacheCharacteristics: testChars
  };

  const caramel: IIngredientEntity = {
    baseId: 'caramel' as BaseIngredientId,
    name: 'Caramel Filling',
    category: 'other',
    ganacheCharacteristics: creamChars
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const moldA: IMoldEntity = {
    baseId: 'mold-a' as BaseMoldId,
    manufacturer: 'Test',
    productNumber: 'T-001',
    cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
    format: 'other' as MoldFormat
  };

  const moldB: IMoldEntity = {
    baseId: 'mold-b' as BaseMoldId,
    manufacturer: 'Test',
    productNumber: 'T-002',
    cavities: { kind: 'count', count: 28, info: { weight: 12 as Measurement } },
    format: 'other' as MoldFormat
  };

  const testProcedure: IProcedureEntity = {
    baseId: 'tempering-procedure' as BaseProcedureId,
    name: 'Standard Tempering',
    description: 'Standard chocolate tempering procedure',
    steps: []
  };

  const altProcedure: IProcedureEntity = {
    baseId: 'alternate-procedure' as BaseProcedureId,
    name: 'Alternate Tempering',
    description: 'Alternate tempering procedure',
    steps: []
  };

  const altDecoration: IDecorationEntity = {
    baseId: 'cocoa-powder-finish' as BaseDecorationId,
    name: 'Cocoa Powder Finish',
    description: 'A cocoa powder finish',
    ingredients: []
  };

  const moldedBonBonEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'test-molded-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Molded BonBon' as ConfectionName,
    description: 'A test molded bonbon',
    tags: ['chocolate', 'bonbon'],
    urls: [{ category: 'recipe', url: 'https://example.com/recipe' }] as CommonModel.ICategorizedUrl[],
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        name: 'Original',
        createdDate: '2026-01-01',
        additionalTags: ['dark-chocolate'],
        additionalUrls: [
          { category: 'video', url: 'https://example.com/video' }
        ] as CommonModel.ICategorizedUrl[],
        notes: [{ category: 'general' as NoteCategory, note: 'Test variation note' }],
        decorations: {
          options: [
            { id: 'test.gold-leaf-accent' as DecorationId },
            {
              id: 'test.cocoa-powder-finish' as DecorationId,
              notes: [{ category: 'general' as NoteCategory, note: 'alternate decoration' }]
            }
          ],
          preferredId: 'test.gold-leaf-accent' as DecorationId
        },
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [
                { type: 'recipe' as const, id: 'test.test-ganache' as FillingId },
                { type: 'ingredient' as const, id: 'test.caramel' as IngredientId }
              ],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'test.mold-a' as MoldId }, { id: 'test.mold-b' as MoldId }],
          preferredId: 'test.mold-a' as MoldId
        },
        shellChocolate: {
          ids: ['test.dark-chocolate' as IngredientId, 'test.milk-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
        },
        additionalChocolates: [
          {
            purpose: 'decoration',
            chocolate: {
              ids: ['test.milk-chocolate' as IngredientId],
              preferredId: 'test.milk-chocolate' as IngredientId
            }
          }
        ],
        procedures: {
          options: [
            { id: 'test.tempering-procedure' as ProcedureId },
            {
              id: 'test.alternate-procedure' as ProcedureId,
              notes: [{ category: 'general' as NoteCategory, note: 'alternate procedure' }]
            }
          ],
          preferredId: 'test.tempering-procedure' as ProcedureId
        }
      },
      {
        variationSpec: '2026-01-02-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-02',
        yield: { count: 28, unit: 'pieces', weightPerPiece: 12 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'test.mold-b' as MoldId }],
          preferredId: 'test.mold-b' as MoldId
        },
        shellChocolate: {
          ids: ['test.dark-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  const barTruffleEntity: Confections.BarTruffleRecipeEntity = {
    baseId: 'test-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        frameDimensions: { width: 300 as Millimeters, height: 200 as Millimeters, depth: 8 as Millimeters },
        singleBonBonDimensions: { width: 25 as Millimeters, height: 25 as Millimeters },
        enrobingChocolate: {
          ids: ['test.dark-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
        }
      },
      {
        variationSpec: '2026-01-02-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-02',
        yield: { count: 60, unit: 'pieces', weightPerPiece: 8 as Measurement },
        frameDimensions: { width: 300 as Millimeters, height: 200 as Millimeters, depth: 6 as Millimeters },
        singleBonBonDimensions: { width: 20 as Millimeters, height: 20 as Millimeters }
      }
    ]
  };

  const brokenMoldedBonBonEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'broken-molded-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Broken Molded BonBon' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [],
        molds: {
          options: [{ id: 'test.mold-a' as MoldId }],
          preferredId: 'test.mold-a' as MoldId
        },
        shellChocolate: {
          ids: ['test.cream' as unknown as IngredientId],
          preferredId: 'test.cream' as unknown as IngredientId
        }
      }
    ]
  };

  const rolledTruffleEntity: Confections.RolledTruffleRecipeEntity = {
    baseId: 'test-rolled-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        enrobingChocolate: {
          ids: ['test.dark-chocolate' as IngredientId, 'test.milk-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
        },
        coatings: {
          ids: ['test.cocoa-powder' as IngredientId],
          preferredId: 'test.cocoa-powder' as IngredientId
        }
      },
      {
        variationSpec: '2026-01-02-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-02',
        yield: { count: 50, unit: 'pieces', weightPerPiece: 12 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ]
      },
      {
        variationSpec: '2026-01-03-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-03',
        yield: { count: 50, unit: 'pieces', weightPerPiece: 12 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        enrobingChocolate: {
          ids: ['test.cream' as unknown as IngredientId],
          preferredId: 'test.cream' as unknown as IngredientId
        }
      }
    ]
  };

  // ============================================================================
  // Setup
  // ============================================================================

  let ctx: ChocolateLibrary;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            'milk-chocolate': milkChocolate,
            'cocoa-powder': cocoaPowder,
            cream,
            caramel
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-ganache': testRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'mold-a': moldA,
            'mold-b': moldB
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const procedures = ProceduresLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'tempering-procedure': testProcedure,
            'alternate-procedure': altProcedure
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const testDecoration: IDecorationEntity = {
      baseId: 'gold-leaf-accent' as BaseDecorationId,
      name: 'Gold Leaf Accent',
      description: 'Decorative gold leaf accent',
      ingredients: []
    };

    const decorations = DecorationsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'gold-leaf-accent': testDecoration,
            'cocoa-powder-finish': altDecoration
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-molded-bonbon': moldedBonBonEntity,
            'broken-molded-bonbon': brokenMoldedBonBonEntity,
            'test-bar-truffle': barTruffleEntity,
            'test-rolled-truffle': rolledTruffleEntity
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, molds, procedures, decorations, confections }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
  });

  // ============================================================================
  // MoldedBonBonRecipe Tests
  // ============================================================================

  describe('MoldedBonBonRecipe', () => {
    test('gets from library with correct type guards', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.isMoldedBonBon()).toBe(true);
          expect(confection.isBarTruffle()).toBe(false);
          expect(confection.isRolledTruffle()).toBe(false);
        }
      );
    });

    test('has correct base properties', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.id).toBe('test.test-molded-bonbon');
          expect(confection.baseId).toBe('test-molded-bonbon');
          expect(confection.collectionId).toBe('test');
          expect(confection.name).toBe('Test Molded BonBon');
          expect(confection.description).toBe('A test molded bonbon');
          expect(confection.confectionType).toBe('molded-bonbon');
          expect(confection.goldenVariationSpec).toBe('2026-01-01-01');
          expect(confection.tags).toEqual(['chocolate', 'bonbon']);
          expect(confection.urls).toHaveLength(1);
          expect(confection.urls?.[0].category).toBe('recipe');
        }
      );
    });

    test('golden variation access', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.goldenVariation).toBeDefined();
          expect(confection.goldenVariation.variationSpec).toBe('2026-01-01-01');

          expect(
            confection.getVariation('2026-01-01-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.variationSpec).toBe('2026-01-01-01');
          });
        }
      );
    });

    test('getVariation succeeds for known spec and fails for unknown', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-01-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.variationSpec).toBe('2026-01-01-01');
          });

          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.variationSpec).toBe('2026-01-02-01');
          });

          expect(confection.getVariation('unknown' as ConfectionRecipeVariationSpec)).toFailWith(
            /variation.*not found/i
          );
        }
      );
    });

    test('getVariations returns all variations', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variations = confection.variations;
          expect(variations).toHaveLength(2);
          expect(variations[0].variationSpec).toBe('2026-01-01-01');
          expect(variations[1].variationSpec).toBe('2026-01-02-01');
        }
      );
    });

    test('getVariations returns cached variations on subsequent calls', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          // First call - creates variations and caches them
          expect(confection.getVariations()).toSucceedAndSatisfy((variations1) => {
            expect(variations1).toHaveLength(2);

            // Second call - returns cached variations
            expect(confection.getVariations()).toSucceedAndSatisfy((variations2) => {
              expect(variations2).toBe(variations1); // Same array reference
            });
          });
        }
      );
    });

    test('getVariation returns cached variation on subsequent calls', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const spec = '2026-01-01-01' as ConfectionRecipeVariationSpec;

          // First call - creates variation and caches it
          expect(confection.getVariation(spec)).toSucceedAndSatisfy((variation1) => {
            expect(variation1.variationSpec).toBe(spec);

            // Second call - returns cached variation
            expect(confection.getVariation(spec)).toSucceedAndSatisfy((variation2) => {
              expect(variation2).toBe(variation1); // Same object reference
            });
          });
        }
      );
    });

    test('type-specific properties from golden variation', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isMoldedBonBon()) {
            throw new Error('Expected molded bonbon');
          }

          // Molds
          expect(confection.molds).toBeDefined();
          expect(confection.molds.preferredId).toBe('test.mold-a');
          expect(confection.molds.options).toHaveLength(2);

          // Shell chocolate
          expect(confection.shellChocolate).toBeDefined();
          expect(confection.shellChocolate.chocolate.id).toBe('test.dark-chocolate');

          // Fillings
          expect(confection.fillings).toBeDefined();
          expect(confection.fillings).toHaveLength(1);
          expect(confection.fillings?.[0].slotId).toBe('center');

          // Yield
          expect(confection.yield).toBeDefined();
          expect(confection.yield.count).toBe(24);
          expect(confection.yield.weightPerPiece).toBe(10);

          // Decorations
          expect(confection.decorations).toBeDefined();
        }
      );
    });

    test('entity accessor returns original entity', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isMoldedBonBon()) {
            throw new Error('Expected molded bonbon');
          }

          const entity = confection.entity;
          expect(entity.baseId).toBe('test-molded-bonbon');
          expect(entity.confectionType).toBe('molded-bonbon');
          expect(entity.variations).toHaveLength(2);
        }
      );
    });
  });

  // ============================================================================
  // BarTruffleRecipe Tests
  // ============================================================================

  describe('BarTruffleRecipe', () => {
    test('gets from library with correct type guards', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.isBarTruffle()).toBe(true);
          expect(confection.isMoldedBonBon()).toBe(false);
          expect(confection.isRolledTruffle()).toBe(false);
        }
      );
    });

    test('has correct base properties', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.id).toBe('test.test-bar-truffle');
          expect(confection.name).toBe('Test Bar Truffle');
          expect(confection.confectionType).toBe('bar-truffle');
        }
      );
    });

    test('type-specific properties from golden variation', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isBarTruffle()) {
            throw new Error('Expected bar truffle');
          }

          // Frame dimensions
          expect(confection.frameDimensions).toBeDefined();
          expect(confection.frameDimensions.width).toBe(300);
          expect(confection.frameDimensions.height).toBe(200);
          expect(confection.frameDimensions.depth).toBe(8);

          // Single bonbon dimensions
          expect(confection.singleBonBonDimensions).toBeDefined();
          expect(confection.singleBonBonDimensions.width).toBe(25);
          expect(confection.singleBonBonDimensions.height).toBe(25);

          // Enrobing chocolate
          expect(confection.enrobingChocolate).toBeDefined();
          expect(confection.enrobingChocolate?.chocolate.id).toBe('test.dark-chocolate');

          // Fillings
          expect(confection.fillings).toBeDefined();
          expect(confection.fillings).toHaveLength(1);
        }
      );
    });

    test('variation access', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.goldenVariation.variationSpec).toBe('2026-01-01-01');
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.variationSpec).toBe('2026-01-02-01');
          });
        }
      );
    });

    test('entity accessor returns original entity', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isBarTruffle()) {
            throw new Error('Expected bar truffle');
          }

          const entity = confection.entity;
          expect(entity.baseId).toBe('test-bar-truffle');
          expect(entity.confectionType).toBe('bar-truffle');
        }
      );
    });
  });

  // ============================================================================
  // RolledTruffleRecipe Tests
  // ============================================================================

  describe('RolledTruffleRecipe', () => {
    test('gets from library with correct type guards', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.isRolledTruffle()).toBe(true);
          expect(confection.isMoldedBonBon()).toBe(false);
          expect(confection.isBarTruffle()).toBe(false);
        }
      );
    });

    test('has correct base properties', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.id).toBe('test.test-rolled-truffle');
          expect(confection.name).toBe('Test Rolled Truffle');
          expect(confection.confectionType).toBe('rolled-truffle');
        }
      );
    });

    test('type-specific properties from golden variation', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isRolledTruffle()) {
            throw new Error('Expected rolled truffle');
          }

          // Fillings
          expect(confection.fillings).toBeDefined();
          expect(confection.fillings).toHaveLength(1);

          // Enrobing chocolate and coatings are defined in golden variation
          expect(confection.enrobingChocolate).toBeDefined();
          expect(confection.coatings).toBeDefined();
        }
      );
    });

    test('variation access', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(confection.goldenVariation.variationSpec).toBe('2026-01-01-01');
          expect(confection.variations).toHaveLength(3);
        }
      );
    });
  });

  // ============================================================================
  // ConfectionBase Common Tests
  // ============================================================================

  describe('ConfectionBase common properties', () => {
    test('effectiveTags returns merged base and variation tags', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          // Base tags: ['chocolate', 'bonbon']
          // Variation additionalTags: ['dark-chocolate']
          expect(confection.effectiveTags).toEqual(['chocolate', 'bonbon', 'dark-chocolate']);
        }
      );
    });

    test('effectiveUrls returns merged base and variation urls', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          // Base urls: [{ category: 'recipe', url: '...' }]
          // Variation additionalUrls: [{ category: 'video', url: '...' }]
          expect(confection.effectiveUrls).toHaveLength(2);
          expect(confection.effectiveUrls[0].category).toBe('recipe');
          expect(confection.effectiveUrls[1].category).toBe('video');
        }
      );
    });
  });

  // ============================================================================
  // Variation Tests
  // ============================================================================

  describe('Variation properties and accessors', () => {
    test('variation createdDate and basic accessors', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.createdDate).toBe('2026-01-01');
          expect(variation.variationSpec).toBe('2026-01-01-01');
          expect(variation.name).toBe('Original');
          expect(variation.confectionId).toBe('test.test-molded-bonbon');
        }
      );
    });

    test('variation.confection navigates to parent confection', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.confection).toBe(confection);
          expect(variation.confection.name).toBe('Test Molded BonBon');
        }
      );
    });

    test('variation.entity returns original entity data', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.entity).toBeDefined();
          expect(variation.entity.variationSpec).toBe('2026-01-01-01');
          expect(variation.entity.createdDate).toBe('2026-01-01');
        }
      );
    });

    test('variation decorations accessor with alternates', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.decorations).toBeDefined();
          expect(variation.decorations?.options).toHaveLength(2);
          expect(variation.decorations?.options[0].id).toBe('test.gold-leaf-accent');
          expect(variation.decorations?.options[0].decoration.name).toBe('Gold Leaf Accent');
          expect(variation.decorations?.options[1].id).toBe('test.cocoa-powder-finish');
          expect(variation.decorations?.options[1].decoration.name).toBe('Cocoa Powder Finish');
          expect(variation.decorations?.options[1].notes).toHaveLength(1);
          expect(variation.decorations?.preferredId).toBe('test.gold-leaf-accent');
        }
      );
    });

    test('variation without decorations returns undefined', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.decorations).toBeUndefined();
          });
        }
      );
    });
  });

  describe('Variation procedures', () => {
    test('procedures accessor resolves procedure references with alternates', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          const procedures = variation.procedures;
          expect(procedures).toBeDefined();
          expect(procedures!.options).toHaveLength(2);
          expect(procedures!.options[0].procedure.name).toBe('Standard Tempering');
          expect(procedures!.options[1].procedure.name).toBe('Alternate Tempering');
          expect(procedures!.options[1].notes).toHaveLength(1);
          expect(procedures!.preferredId).toBe('test.tempering-procedure');
        }
      );
    });

    test('procedures returns undefined when no procedures', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.procedures).toBeUndefined();
        }
      );
    });
  });

  describe('Variation filling resolution with ingredient options', () => {
    test('fillings accessor resolves ingredient-type filling options', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          const fillings = variation.fillings;
          expect(fillings).toHaveLength(1);
          const slot = fillings![0];
          expect(slot.filling.options).toHaveLength(2);

          // First option is recipe
          expect(slot.filling.options[0].type).toBe('recipe');
          expect(slot.filling.options[0].id).toBe('test.test-ganache');

          // Second option is ingredient
          expect(slot.filling.options[1].type).toBe('ingredient');
          expect(slot.filling.options[1].id).toBe('test.caramel');
          if (slot.filling.options[1].type === 'ingredient') {
            expect(slot.filling.options[1].ingredient.name).toBe('Caramel Filling');
          }
        }
      );
    });
  });

  describe('Variation type guards', () => {
    test('isMoldedBonBonVariation returns true for molded bonbon', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.isMoldedBonBonVariation()).toBe(true);
          expect(variation.isBarTruffleVariation()).toBe(false);
          expect(variation.isRolledTruffleVariation()).toBe(false);
        }
      );
    });

    test('isBarTruffleVariation returns true for bar truffle', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.isBarTruffleVariation()).toBe(true);
          expect(variation.isMoldedBonBonVariation()).toBe(false);
          expect(variation.isRolledTruffleVariation()).toBe(false);
        }
      );
    });

    test('isRolledTruffleVariation returns true for rolled truffle', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.isRolledTruffleVariation()).toBe(true);
          expect(variation.isMoldedBonBonVariation()).toBe(false);
          expect(variation.isBarTruffleVariation()).toBe(false);
        }
      );
    });
  });

  describe('MoldedBonBonVariation specific', () => {
    test('molds accessor resolves molds with alternates', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isMoldedBonBonVariation()) {
            throw new Error('Expected molded bonbon variation');
          }

          const molds = variation.molds;
          expect(molds.options).toHaveLength(2);
          expect(molds.options[0].id).toBe('test.mold-a');
          expect(molds.options[0].mold.productNumber).toBe('T-001');
          expect(molds.options[1].id).toBe('test.mold-b');
          expect(molds.preferredId).toBe('test.mold-a');
        }
      );
    });

    test('shellChocolate accessor validates primary is chocolate', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isMoldedBonBonVariation()) {
            throw new Error('Expected molded bonbon variation');
          }

          const shell = variation.shellChocolate;
          expect(shell.chocolate.id).toBe('test.dark-chocolate');
          expect(shell.chocolate.isChocolate()).toBe(true);
          expect(shell.alternates).toHaveLength(1);
          expect(shell.alternates[0].id).toBe('test.milk-chocolate');
        }
      );
    });

    test('additionalChocolates accessor resolves additional chocolates', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isMoldedBonBonVariation()) {
            throw new Error('Expected molded bonbon variation');
          }

          const additional = variation.additionalChocolates;
          expect(additional).toHaveLength(1);
          expect(additional![0].purpose).toBe('decoration');
          expect(additional![0].chocolate.chocolate.id).toBe('test.milk-chocolate');
          expect(additional![0].chocolate.chocolate.isChocolate()).toBe(true);
        }
      );
    });

    test('additionalChocolates accessor returns undefined when empty', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            if (!variation.isMoldedBonBonVariation()) {
              throw new Error('Expected molded bonbon variation');
            }

            expect(variation.additionalChocolates).toBeUndefined();
          });
        }
      );
    });

    test('shellChocolate fails when primary is not a chocolate', () => {
      expect(ctx.confections.get('test.broken-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isMoldedBonBon()) {
            throw new Error('Expected molded bonbon');
          }

          // Accessing shellChocolate will throw because cream is not a chocolate
          expect(() => confection.shellChocolate).toThrow(/not a chocolate/i);
        }
      );
    });
  });

  describe('RolledTruffleVariation specific', () => {
    test('enrobingChocolate accessor validates primary is chocolate', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isRolledTruffleVariation()) {
            throw new Error('Expected rolled truffle variation');
          }

          const enrobing = variation.enrobingChocolate;
          expect(enrobing).toBeDefined();
          expect(enrobing!.chocolate.id).toBe('test.dark-chocolate');
          expect(enrobing!.chocolate.isChocolate()).toBe(true);
          expect(enrobing!.alternates).toHaveLength(1);
          expect(enrobing!.alternates[0].id).toBe('test.milk-chocolate');
        }
      );
    });

    test('enrobingChocolate returns undefined when not specified', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            if (!variation.isRolledTruffleVariation()) {
              throw new Error('Expected rolled truffle variation');
            }

            expect(variation.enrobingChocolate).toBeUndefined();
          });
        }
      );
    });

    test('coatings accessor resolves coating ingredients', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isRolledTruffleVariation()) {
            throw new Error('Expected rolled truffle variation');
          }

          const coatings = variation.coatings;
          if (!coatings) {
            throw new Error('Expected coatings to be defined');
          }
          expect(coatings.options).toHaveLength(1);
          const firstCoating = coatings.options[0];
          if (!firstCoating) {
            throw new Error('Expected first coating to be defined');
          }
          expect(firstCoating.id).toBe('test.cocoa-powder');
          expect(firstCoating.ingredient.name).toBe('Cocoa Powder');
          expect(coatings.preferred).toBeDefined();
          expect(coatings.preferred!.id).toBe('test.cocoa-powder');
        }
      );
    });

    test('coatings returns undefined when not specified', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            if (!variation.isRolledTruffleVariation()) {
              throw new Error('Expected rolled truffle variation');
            }

            expect(variation.coatings).toBeUndefined();
          });
        }
      );
    });

    test('enrobingChocolate fails when primary is not a chocolate', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-03-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            if (!variation.isRolledTruffleVariation()) {
              throw new Error('Expected rolled truffle variation');
            }

            // Accessing enrobingChocolate will throw because cream is not a chocolate
            expect(() => variation.enrobingChocolate).toThrow(/not a chocolate/i);
          });
        }
      );
    });

    test('preferredProcedure returns undefined when no procedures', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isRolledTruffleVariation()) {
            throw new Error('Expected rolled truffle variation');
          }

          expect(variation.preferredProcedure).toBeUndefined();
        }
      );
    });
  });

  // ============================================================================
  // Recipe-level delegating getters
  // ============================================================================

  describe('Recipe-level delegating getters', () => {
    test('MoldedBonBonRecipe.procedures delegates to golden variation', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isMoldedBonBon()) {
            throw new Error('Expected molded bonbon');
          }

          expect(confection.procedures).toBeDefined();
          expect(confection.procedures!.options).toHaveLength(2);
          expect(confection.procedures!.options[0].procedure.name).toBe('Standard Tempering');
        }
      );
    });

    test('MoldedBonBonRecipe.additionalChocolates delegates to golden variation', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isMoldedBonBon()) {
            throw new Error('Expected molded bonbon');
          }

          expect(confection.additionalChocolates).toHaveLength(1);
          expect(confection.additionalChocolates![0].purpose).toBe('decoration');
        }
      );
    });

    test('BarTruffleRecipe.procedures returns undefined when golden has no procedures', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isBarTruffle()) {
            throw new Error('Expected bar truffle');
          }

          expect(confection.procedures).toBeUndefined();
        }
      );
    });

    test('RolledTruffleRecipe.procedures returns undefined when golden has no procedures', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isRolledTruffle()) {
            throw new Error('Expected rolled truffle');
          }

          expect(confection.procedures).toBeUndefined();
        }
      );
    });

    test('RolledTruffleRecipe.coatings delegates to golden variation', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isRolledTruffle()) {
            throw new Error('Expected rolled truffle');
          }

          expect(confection.coatings).toBeDefined();
          expect(confection.coatings!.options[0].id).toBe('test.cocoa-powder');
        }
      );
    });

    test('RolledTruffleRecipe.entity returns original entity', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          if (!confection.isRolledTruffle()) {
            throw new Error('Expected rolled truffle');
          }

          expect(confection.entity.baseId).toBe('test-rolled-truffle');
          expect(confection.entity.confectionType).toBe('rolled-truffle');
        }
      );
    });
  });

  // ============================================================================
  // getEffectiveTags / getEffectiveUrls with default variation
  // ============================================================================

  describe('getEffectiveTags and getEffectiveUrls with default variation', () => {
    test('getEffectiveTags() without argument defaults to golden variation', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const tags = confection.getEffectiveTags();
          expect(tags).toEqual(['chocolate', 'bonbon', 'dark-chocolate']);
        }
      );
    });

    test('getEffectiveUrls() without argument defaults to golden variation', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const urls = confection.getEffectiveUrls();
          expect(urls).toHaveLength(2);
          expect(urls[0].category).toBe('recipe');
          expect(urls[1].category).toBe('video');
        }
      );
    });

    test('getEffectiveTags() on confection without base tags uses empty array', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const tags = confection.getEffectiveTags();
          expect(tags).toEqual([]);
        }
      );
    });

    test('getEffectiveUrls() on confection without base urls uses empty array', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const urls = confection.getEffectiveUrls();
          expect(urls).toEqual([]);
        }
      );
    });
  });

  // ============================================================================
  // Variation base class property accessors
  // ============================================================================

  describe('Variation base class property accessors', () => {
    test('variation.notes returns entity notes', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.notes).toBeDefined();
          expect(variation.notes).toHaveLength(1);
          expect(variation.notes![0].note).toBe('Test variation note');
        }
      );
    });

    test('variation.notes returns undefined when no notes', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.notes).toBeUndefined();
        }
      );
    });

    test('variation.effectiveTags merges base and variation tags', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.effectiveTags).toEqual(['chocolate', 'bonbon', 'dark-chocolate']);
        }
      );
    });

    test('variation.effectiveUrls merges base and variation urls', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          expect(variation.effectiveUrls).toHaveLength(2);
          expect(variation.effectiveUrls[0].category).toBe('recipe');
          expect(variation.effectiveUrls[1].category).toBe('video');
        }
      );
    });

    test('variation.context returns the confection context', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          if (!variation.isMoldedBonBonVariation()) {
            throw new Error('Expected molded bonbon variation');
          }

          // context is on the concrete class, not the variation interface
          expect(variation).toBeInstanceOf(ConfectionRecipeVariationBase);
          const { context } = variation as unknown as {
            context: { ingredients: unknown; procedures: unknown };
          };
          expect(context).toBeDefined();
          expect(context.ingredients).toBeDefined();
          expect(context.procedures).toBeDefined();
        }
      );
    });

    test('variation.preferredProcedure returns preferred procedure', () => {
      expect(ctx.confections.get('test.test-molded-bonbon' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;

          if (!variation.isMoldedBonBonVariation()) {
            throw new Error('Expected molded bonbon variation');
          }

          expect(variation.preferredProcedure).toBeDefined();
          expect(variation.preferredProcedure!.procedure.name).toBe('Standard Tempering');
        }
      );
    });
  });

  // ============================================================================
  // Bar truffle variation without enrobing chocolate
  // ============================================================================

  describe('BarTruffleVariation optional fields', () => {
    test('enrobingChocolate returns undefined when not specified', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            if (!variation.isBarTruffleVariation()) {
              throw new Error('Expected bar truffle variation');
            }

            expect(variation.enrobingChocolate).toBeUndefined();
            // Second access exercises the cached null path
            expect(variation.enrobingChocolate).toBeUndefined();
          });
        }
      );
    });

    test('preferredProcedure returns undefined when no procedures', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isBarTruffleVariation()) {
            throw new Error('Expected bar truffle variation');
          }

          expect(variation.preferredProcedure).toBeUndefined();
        }
      );
    });

    test('fillings returns undefined when variation has no fillings', () => {
      expect(ctx.confections.get('test.test-bar-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          expect(
            confection.getVariation('2026-01-02-01' as ConfectionRecipeVariationSpec)
          ).toSucceedAndSatisfy((variation) => {
            expect(variation.fillings).toBeUndefined();
          });
        }
      );
    });
  });

  // ============================================================================
  // Rolled truffle cached resolution paths
  // ============================================================================

  describe('RolledTruffleVariation cached resolution', () => {
    test('getEnrobingChocolate caches result on second call', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isRolledTruffleVariation()) {
            throw new Error('Expected rolled truffle variation');
          }

          // First call resolves
          expect(variation.enrobingChocolate).toBeDefined();
          // Second call uses cache
          expect(variation.enrobingChocolate?.chocolate.id).toBe('test.dark-chocolate');
        }
      );
    });

    test('getCoatings caches result on second call', () => {
      expect(ctx.confections.get('test.test-rolled-truffle' as ConfectionId)).toSucceedAndSatisfy(
        (confection) => {
          const variation = confection.goldenVariation;
          if (!variation.isRolledTruffleVariation()) {
            throw new Error('Expected rolled truffle variation');
          }

          // First call resolves
          expect(variation.coatings).toBeDefined();
          // Second call uses cache
          expect(variation.coatings!.options[0].id).toBe('test.cocoa-powder');
        }
      );
    });
  });
});
