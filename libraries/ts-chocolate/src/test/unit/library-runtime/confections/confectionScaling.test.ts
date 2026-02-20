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
  CollectionId,
  MoldId,
  BaseMoldId,
  MoldFormat,
  ConfectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  SlotId,
  Millimeters
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
  ProceduresLibrary,
  DecorationsLibrary
} from '../../../../packlets/entities';
import {
  ChocolateEntityLibrary,
  ChocolateLibrary,
  computeScaledFillings,
  canScale
} from '../../../../packlets/library-runtime';
import type {
  IMoldedBonBonRecipeVariation,
  IRolledTruffleRecipeVariation,
  IBarTruffleRecipeVariation
} from '../../../../packlets/library-runtime';

describe('confectionScaling', () => {
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

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const caramel: IIngredientEntity = {
    baseId: 'caramel' as BaseIngredientId,
    name: 'Caramel',
    category: 'other',
    ganacheCharacteristics: testChars
  };

  const cocoaPowder: IIngredientEntity = {
    baseId: 'cocoa-powder' as BaseIngredientId,
    name: 'Cocoa Powder',
    category: 'other',
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: testChars
  };

  // Filling: baseWeight 0g (edge case for zero-weight guard)
  const zeroWeightRecipe: IFillingRecipeEntity = {
    baseId: 'zero-ganache' as BaseFillingId,
    name: 'Zero Ganache' as FillingName,
    category: 'ganache',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [],
        baseWeight: 0 as Measurement
      }
    ]
  };

  // Filling: baseWeight 300g (200g chocolate + 100g cream)
  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['sc.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['sc.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  // moldA: 24 cavities, 10g each
  const moldA: IMoldEntity = {
    baseId: 'mold-a' as BaseMoldId,
    manufacturer: 'Test',
    productNumber: 'T-001',
    cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
    format: 'other' as MoldFormat
  };

  // moldB: 30 cavities, 8g each
  const moldB: IMoldEntity = {
    baseId: 'mold-b' as BaseMoldId,
    manufacturer: 'Test',
    productNumber: 'T-002',
    cavities: { kind: 'count', count: 30, info: { weight: 8 as Measurement } },
    format: 'other' as MoldFormat
  };

  // moldNoCavityWeight: 20 cavities, no weight
  const moldNoCavityWeight: IMoldEntity = {
    baseId: 'mold-no-weight' as BaseMoldId,
    manufacturer: 'Test',
    productNumber: 'T-003',
    cavities: { kind: 'count', count: 20 },
    format: 'other' as MoldFormat
  };

  // Molded bonbon: 1 recipe slot (center = ganache), mold-a preferred
  const moldedBonBonEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test BonBon' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [
                { type: 'recipe' as const, id: 'sc.test-ganache' as FillingId },
                { type: 'ingredient' as const, id: 'sc.caramel' as IngredientId }
              ],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'sc.mold-a' as MoldId }, { id: 'sc.mold-b' as MoldId }],
          preferredId: 'sc.mold-a' as MoldId
        },
        shellChocolate: {
          ids: ['sc.dark-chocolate' as IngredientId],
          preferredId: 'sc.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  // Molded bonbon with zero-weight filling
  const bonBonZeroWeightFillingEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'bonbon-zero-filling' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'BonBon Zero Filling' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            filling: {
              options: [{ type: 'recipe' as const, id: 'sc.zero-ganache' as FillingId }],
              preferredId: 'sc.zero-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'sc.mold-a' as MoldId }],
          preferredId: 'sc.mold-a' as MoldId
        },
        shellChocolate: {
          ids: ['sc.dark-chocolate' as IngredientId],
          preferredId: 'sc.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  // Rolled truffle with zero yield count (edge case)
  const truffleZeroCountEntity: Confections.RolledTruffleRecipeEntity = {
    baseId: 'truffle-zero-count' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Truffle Zero Count' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 0, unit: 'pieces' },
        fillings: [
          {
            slotId: 'center' as SlotId,
            filling: {
              options: [{ type: 'recipe' as const, id: 'sc.test-ganache' as FillingId }],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ]
      }
    ]
  };

  // Molded bonbon with empty molds list (preferredMold returns undefined)
  const bonBonNoMoldEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'bonbon-no-mold' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'BonBon No Mold' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 24, unit: 'pieces' },
        fillings: [
          {
            slotId: 'center' as SlotId,
            filling: {
              options: [{ type: 'recipe' as const, id: 'sc.test-ganache' as FillingId }],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ],
        molds: { options: [], preferredId: undefined as unknown as MoldId },
        shellChocolate: {
          ids: ['sc.dark-chocolate' as IngredientId],
          preferredId: 'sc.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  // Molded bonbon with no-weight mold
  const bonBonNoWeightMoldEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'bonbon-no-weight' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'BonBon No Weight' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 20, unit: 'pieces' },
        fillings: [
          {
            slotId: 'center' as SlotId,
            filling: {
              options: [{ type: 'recipe' as const, id: 'sc.test-ganache' as FillingId }],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'sc.mold-no-weight' as MoldId }],
          preferredId: 'sc.mold-no-weight' as MoldId
        },
        shellChocolate: {
          ids: ['sc.dark-chocolate' as IngredientId],
          preferredId: 'sc.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  // Rolled truffle: 40 pieces, 15g each, 1 recipe slot
  const rolledTruffleEntity: Confections.RolledTruffleRecipeEntity = {
    baseId: 'test-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Truffle' as ConfectionName,
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
              options: [
                { type: 'recipe' as const, id: 'sc.test-ganache' as FillingId },
                { type: 'ingredient' as const, id: 'sc.caramel' as IngredientId }
              ],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ],
        coatings: {
          ids: ['sc.cocoa-powder' as IngredientId],
          preferredId: 'sc.cocoa-powder' as IngredientId
        }
      }
    ]
  };

  // Bar truffle: 48 pieces, 10g each, 1 recipe slot
  const barTruffleEntity: Confections.BarTruffleRecipeEntity = {
    baseId: 'test-bar' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar' as ConfectionName,
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
              options: [{ type: 'recipe' as const, id: 'sc.test-ganache' as FillingId }],
              preferredId: 'sc.test-ganache' as FillingId
            }
          }
        ],
        frameDimensions: { width: 300 as Millimeters, height: 200 as Millimeters, depth: 8 as Millimeters },
        singleBonBonDimensions: { width: 25 as Millimeters, height: 25 as Millimeters }
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
          id: 'sc' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            caramel,
            'cocoa-powder': cocoaPowder,
            cream
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'sc' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-ganache': testRecipe,
            'zero-ganache': zeroWeightRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'sc' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'mold-a': moldA,
            'mold-b': moldB,
            'mold-no-weight': moldNoCavityWeight
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const procedures = ProceduresLibrary.create({ builtin: false, collections: [] }).orThrow();
    const decorations = DecorationsLibrary.create({ builtin: false, collections: [] }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'sc' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-bonbon': moldedBonBonEntity,
            'bonbon-no-mold': bonBonNoMoldEntity,
            'bonbon-no-weight': bonBonNoWeightMoldEntity,
            'bonbon-zero-filling': bonBonZeroWeightFillingEntity,
            'test-truffle': rolledTruffleEntity,
            'truffle-zero-count': truffleZeroCountEntity,
            'test-bar': barTruffleEntity
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
  // canScale
  // ============================================================================

  describe('canScale', () => {
    test('returns true for molded bonbon with positive targetFrames', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(canScale(variation, { targetFrames: 2 })).toBe(true);
      });
    });

    test('returns false for molded bonbon with no targetFrames', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(canScale(variation, {})).toBe(false);
        expect(canScale(variation, { targetFrames: 0 })).toBe(false);
      });
    });

    test('returns true for rolled truffle with positive targetCount', () => {
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(canScale(variation, { targetCount: 80 })).toBe(true);
      });
    });

    test('returns false for rolled truffle with no targetCount', () => {
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(canScale(variation, {})).toBe(false);
        expect(canScale(variation, { targetCount: 0 })).toBe(false);
      });
    });
  });

  // ============================================================================
  // Molded BonBon Scaling
  // ============================================================================

  describe('computeScaledFillings - molded bonbon', () => {
    test('scales 2 frames with preferred mold (24 cavities, 10g, 10% buffer)', () => {
      // 2 frames × 24 cavities × 10g × 1.1 = 528g total → 528g for 1 slot
      // scaleFactor vs recipe: 48 / 24 = 2.0
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, { targetFrames: 2 })).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(48);
          expect(result.effectiveFrames).toBe(2);
          expect(result.scaleFactor).toBeCloseTo(2.0);
          expect(result.slots).toHaveLength(1);
          const slot = result.slots[0];
          expect(slot.type).toBe('recipe');
          expect(slot.slotId).toBe('center');
          if (slot.type === 'recipe') {
            // 528g / 300g base = 1.76 scaleFactor
            expect(slot.targetWeight).toBeCloseTo(528);
            expect(slot.scaleFactor).toBeCloseTo(528 / 300);
            expect(slot.produced.ingredients).toHaveLength(2);
            // 200g × 1.76 = 352g
            expect(slot.produced.ingredients[0].amount).toBeCloseTo(200 * (528 / 300));
            // 100g × 1.76 = 176g
            expect(slot.produced.ingredients[1].amount).toBeCloseTo(100 * (528 / 300));
          }
        });
      });
    });

    test('uses custom buffer percentage', () => {
      // 1 frame × 24 × 10g × 1.2 = 288g
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, { targetFrames: 1, bufferPercentage: 0.2 })
        ).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(24);
          const slot = result.slots[0];
          if (slot.type === 'recipe') {
            expect(slot.targetWeight).toBeCloseTo(288);
          }
        });
      });
    });

    test('falls back to preferred mold when selectedMoldId does not match', () => {
      // mold-a preferred (24 cavities, 10g); unknown ID falls back to preferred
      // 1 frame × 24 × 10g × 1.1 = 264g
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetFrames: 1,
            selectedMoldId: 'sc.nonexistent-mold' as MoldId
          })
        ).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(24);
          const slot = result.slots[0];
          if (slot.type === 'recipe') {
            expect(slot.targetWeight).toBeCloseTo(264);
          }
        });
      });
    });

    test('uses selected alternate mold (mold-b: 30 cavities, 8g)', () => {
      // 2 frames × 30 × 8g × 1.1 = 528g
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetFrames: 2,
            selectedMoldId: 'sc.mold-b' as MoldId
          })
        ).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(60);
          expect(result.effectiveFrames).toBe(2);
          const slot = result.slots[0];
          if (slot.type === 'recipe') {
            // 2 × 30 × 8 × 1.1 = 528g
            expect(slot.targetWeight).toBeCloseTo(528);
          }
        });
      });
    });

    test('scales ingredient-type slot to computed weight', () => {
      // Select caramel (ingredient) for the center slot
      // 1 frame × 24 × 10g × 1.1 = 264g
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetFrames: 1,
            fillingSelections: { center: 'sc.caramel' }
          })
        ).toSucceedAndSatisfy((result) => {
          expect(result.slots).toHaveLength(1);
          const slot = result.slots[0];
          expect(slot.type).toBe('ingredient');
          if (slot.type === 'ingredient') {
            expect(slot.ingredient.name).toBe('Caramel');
            expect(slot.targetWeight).toBeCloseTo(264);
          }
        });
      });
    });

    test('fails when targetFrames is missing', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, {})).toFail();
      });
    });

    test('fails when targetFrames is zero or negative', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, { targetFrames: 0 })).toFail();
        expect(computeScaledFillings(variation, { targetFrames: -1 })).toFail();
      });
    });

    test('fails when mold has no cavity weight', () => {
      expect(ctx.confections.get('sc.bonbon-no-weight' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, { targetFrames: 1 })).toFail();
      });
    });

    test('fails when filling has zero base weight', () => {
      expect(ctx.confections.get('sc.bonbon-zero-filling' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, { targetFrames: 1 })).toFail();
      });
    });
  });

  // ============================================================================
  // Rolled Truffle Scaling (linear)
  // ============================================================================

  describe('computeScaledFillings - rolled truffle', () => {
    test('scales to double count (80 pieces from 40)', () => {
      // scaleFactor = 80 / 40 = 2.0
      // filling baseWeight 300g × 2.0 = 600g
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(computeScaledFillings(variation, { targetCount: 80 })).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(80);
          expect(result.effectiveFrames).toBeUndefined();
          expect(result.scaleFactor).toBeCloseTo(2.0);
          expect(result.slots).toHaveLength(1);
          const slot = result.slots[0];
          expect(slot.type).toBe('recipe');
          if (slot.type === 'recipe') {
            expect(slot.targetWeight).toBeCloseTo(600);
            expect(slot.scaleFactor).toBeCloseTo(2.0);
            expect(slot.produced.ingredients[0].amount).toBeCloseTo(400);
            expect(slot.produced.ingredients[1].amount).toBeCloseTo(200);
          }
        });
      });
    });

    test('scales ingredient-type slot using weightPerPiece', () => {
      // Select caramel (ingredient) for center slot
      // targetCount=80, weightPerPiece=15g, 1 slot → 80 × 15 / 1 = 1200g
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetCount: 80,
            fillingSelections: { center: 'sc.caramel' }
          })
        ).toSucceedAndSatisfy((result) => {
          const slot = result.slots[0];
          expect(slot.type).toBe('ingredient');
          if (slot.type === 'ingredient') {
            expect(slot.ingredient.name).toBe('Caramel');
            expect(slot.targetWeight).toBeCloseTo(1200);
          }
        });
      });
    });

    test('fails when targetCount is missing', () => {
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(computeScaledFillings(variation, {})).toFail();
      });
    });

    test('fails when targetCount is zero or negative', () => {
      expect(ctx.confections.get('sc.test-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(computeScaledFillings(variation, { targetCount: 0 })).toFail();
        expect(computeScaledFillings(variation, { targetCount: -5 })).toFail();
      });
    });

    test('fails when recipe yield count is zero', () => {
      expect(ctx.confections.get('sc.truffle-zero-count' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IRolledTruffleRecipeVariation;
        expect(computeScaledFillings(variation, { targetCount: 40 })).toFail();
      });
    });
  });

  // ============================================================================
  // Bar Truffle Scaling (linear)
  // ============================================================================

  describe('computeScaledFillings - bar truffle', () => {
    test('scales to 96 pieces from 48 (×2)', () => {
      // scaleFactor = 96 / 48 = 2.0, filling 300g × 2 = 600g
      expect(ctx.confections.get('sc.test-bar' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IBarTruffleRecipeVariation;
        expect(computeScaledFillings(variation, { targetCount: 96 })).toSucceedAndSatisfy((result) => {
          expect(result.effectiveCount).toBe(96);
          expect(result.scaleFactor).toBeCloseTo(2.0);
          const slot = result.slots[0];
          expect(slot.type).toBe('recipe');
          if (slot.type === 'recipe') {
            expect(slot.targetWeight).toBeCloseTo(600);
          }
        });
      });
    });

    test('fails when targetCount is missing', () => {
      expect(ctx.confections.get('sc.test-bar' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IBarTruffleRecipeVariation;
        expect(computeScaledFillings(variation, {})).toFail();
      });
    });
  });

  // ============================================================================
  // Filling selection (fillingSelections override)
  // ============================================================================

  describe('fillingSelections', () => {
    test('uses preferred filling when no selection provided', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(computeScaledFillings(variation, { targetFrames: 1 })).toSucceedAndSatisfy((result) => {
          const slot = result.slots[0];
          expect(slot.type).toBe('recipe');
        });
      });
    });

    test('uses selected alternate filling when provided', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetFrames: 1,
            fillingSelections: { center: 'sc.caramel' }
          })
        ).toSucceedAndSatisfy((result) => {
          const slot = result.slots[0];
          expect(slot.type).toBe('ingredient');
          if (slot.type === 'ingredient') {
            expect(slot.ingredient.name).toBe('Caramel');
          }
        });
      });
    });

    test('falls back to first option when selection ID is not found', () => {
      expect(ctx.confections.get('sc.test-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
        const variation = c.goldenVariation as IMoldedBonBonRecipeVariation;
        expect(
          computeScaledFillings(variation, {
            targetFrames: 1,
            fillingSelections: { center: 'sc.nonexistent' }
          })
        ).toSucceedAndSatisfy((result) => {
          const slot = result.slots[0];
          // Falls back to first option (recipe)
          expect(slot.type).toBe('recipe');
        });
      });
    });
  });
});
