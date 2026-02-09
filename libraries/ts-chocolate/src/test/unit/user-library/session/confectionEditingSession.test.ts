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
  SlotId
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
  Confections
} from '../../../../packlets/entities';
import {
  ChocolateEntityLibrary,
  ChocolateLibrary,
  IFillingRecipe
} from '../../../../packlets/library-runtime';
import { ISessionContext, Session } from '../../../../packlets/user-library';

describe('ConfectionEditingSession', () => {
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

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original recipe' }] as CommonModel.ICategorizedNote[],
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
    manufacturer: 'Test Molds',
    productNumber: 'TM-001',
    description: 'Test mold A',
    cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
    format: 'other' as MoldFormat
  };

  const moldB: IMoldEntity = {
    baseId: 'mold-b' as BaseMoldId,
    manufacturer: 'Test Molds',
    productNumber: 'TM-002',
    description: 'Test mold B',
    cavities: { kind: 'count', count: 28, info: { weight: 12 as Measurement } },
    format: 'other' as MoldFormat
  };

  const moldedBonBonEntity: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'test-molded-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Molded BonBon' as ConfectionName,
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
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'test.mold-a' as MoldId }],
          preferredId: 'test.mold-a' as MoldId
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
        frameDimensions: {
          width: 300 as Millimeters,
          height: 200 as Millimeters,
          depth: 8 as Millimeters
        },
        singleBonBonDimensions: { width: 25 as Millimeters, height: 25 as Millimeters },
        enrobingChocolate: {
          ids: ['test.dark-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
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
        ]
      }
    ]
  };

  let ctx: ChocolateLibrary;
  let sessionContext: ISessionContext;

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

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-molded-bonbon': moldedBonBonEntity,
            'test-bar-truffle': barTruffleEntity,
            'test-rolled-truffle': rolledTruffleEntity
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, molds, confections }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();

    sessionContext = {
      get ingredients() {
        return ctx.ingredients;
      },
      get fillings() {
        return ctx.fillings;
      },
      get procedures() {
        return ctx.procedures;
      },
      get molds() {
        return ctx.molds;
      },
      get confections() {
        return ctx.confections;
      },
      isCollectionMutable(collectionId: CollectionId) {
        return ctx.isCollectionMutable(collectionId);
      },
      createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
        const variation = filling.goldenVariation;
        const baseWeight = variation.entity.baseWeight;
        const scaleFactor = targetWeight / baseWeight;
        return Session.EditingSession.create(variation, scaleFactor);
      }
    };
  });

  // ============================================================================
  // Dispatcher Tests
  // ============================================================================

  describe('create dispatcher', () => {
    test('dispatches molded bonbon to MoldedBonBonEditingSession', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      expect(confection.isMoldedBonBon()).toBe(true);

      expect(Session.ConfectionEditingSession.create(confection, sessionContext)).toSucceedAndSatisfy(
        (session) => {
          expect(session).toBeInstanceOf(Session.MoldedBonBonEditingSession);
        }
      );
    });

    test('dispatches bar truffle to BarTruffleEditingSession', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      expect(confection.isBarTruffle()).toBe(true);

      expect(Session.ConfectionEditingSession.create(confection, sessionContext)).toSucceedAndSatisfy(
        (session) => {
          expect(session).toBeInstanceOf(Session.BarTruffleEditingSession);
        }
      );
    });

    test('dispatches rolled truffle to RolledTruffleEditingSession', () => {
      const confection = ctx.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();
      expect(confection.isRolledTruffle()).toBe(true);

      expect(Session.ConfectionEditingSession.create(confection, sessionContext)).toSucceedAndSatisfy(
        (session) => {
          expect(session).toBeInstanceOf(Session.RolledTruffleEditingSession);
        }
      );
    });
  });
});
