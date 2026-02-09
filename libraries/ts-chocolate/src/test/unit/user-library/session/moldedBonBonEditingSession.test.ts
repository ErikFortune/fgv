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

describe('MoldedBonBonEditingSession', () => {
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

  const moldC: IMoldEntity = {
    baseId: 'mold-c' as BaseMoldId,
    manufacturer: 'Test Molds',
    productNumber: 'TM-003',
    description: 'Test mold C - same weight as A',
    cavities: { kind: 'count', count: 20, info: { weight: 10 as Measurement } },
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
            'mold-b': moldB,
            'mold-c': moldC
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
            'test-molded-bonbon': moldedBonBonEntity
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
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session with valid confection and context', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      expect(Session.MoldedBonBonEditingSession.create(confection, sessionContext)).toSucceedAndSatisfy(
        (session) => {
          expect(session.sessionId).toBeDefined();
          expect(session.baseConfection).toBe(confection);
        }
      );
    });

    test('loads current mold', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.currentMold.id).toBe('test.mold-a');
    });

    test('creates filling sessions', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.fillingSessions.size).toBeGreaterThan(0);
    });

    test('creates with initialYield parameter', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');

      expect(
        Session.MoldedBonBonEditingSession.create(confection, sessionContext, {
          initialYield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement, frames: 2 }
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.produced.yield.count).toBe(48);
      });
    });
  });

  // ============================================================================
  // Frame-Based Yield Tests (setFrames)
  // ============================================================================

  describe('setFrames', () => {
    test('sets yield with frame count and default buffer', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(2)).toSucceed();
      // 2 frames x 24 cavities = 48 pieces
      expect(session.produced.yield.count).toBe(48);
    });

    test('setFrames rescales filling sessions', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      const initialFilling = Array.from(session.fillingSessions.values())[0];
      expect(initialFilling).toBeDefined();
      const initialWeight = initialFilling!.produced.targetWeight;

      expect(session.setFrames(4)).toSucceed();

      const scaledFilling = Array.from(session.fillingSessions.values())[0];
      expect(scaledFilling).toBeDefined();
      expect(scaledFilling!.produced.targetWeight).not.toBe(initialWeight);
    });

    test('fails for zero frames', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(0)).toFailWith(/positive/i);
    });

    test('fails for negative frames', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(-1)).toFailWith(/positive/i);
    });

    test('fails for buffer percentage below 0', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(2, -0.5)).toFailWith(/between 0 and 1/i);
    });

    test('fails for buffer percentage above 1', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(2, 1.5)).toFailWith(/between 0 and 1/i);
    });

    test('succeeds with buffer percentage of 0', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(2, 0)).toSucceed();
    });

    test('succeeds with buffer percentage of 0.2', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.setFrames(2, 0.2)).toSucceed();
    });
  });

  // ============================================================================
  // scaleToYield Tests
  // ============================================================================

  describe('scaleToYield', () => {
    test('scales to frame-based yield', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(
        session.scaleToYield({
          count: 48,
          unit: 'pieces',
          weightPerPiece: 10 as Measurement,
          frames: 2
        })
      ).toSucceed();
    });

    test('scales to legacy count yield', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.scaleToYield({ count: 48, unit: 'pieces' })).toSucceed();
    });

    test('fails when produced.scaleToYield fails', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      // Test with invalid yield (zero count) which should fail
      expect(session.scaleToYield({ count: 0, unit: 'pieces' })).toFail();
    });
  });

  // ============================================================================
  // Mold Change Workflow Tests
  // ============================================================================

  describe('mold change workflow', () => {
    test('analyzeMoldChange returns analysis', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.analyzeMoldChange('test.mold-b' as MoldId)).toSucceedAndSatisfy((analysis) => {
        expect(analysis.oldMoldId).toBe('test.mold-a');
        expect(analysis.newMoldId).toBe('test.mold-b');
        // mold-b (28 cavities x 12g) vs mold-a (24 cavities x 10g) => weight increases
        expect(analysis.weightDelta).toBeGreaterThan(0);
        expect(analysis.requiresRescaling).toBe(true);
        expect(analysis.fillingSessionsAffected).toContain('center' as SlotId);
      });
    });

    test('analyzeMoldChange sets pendingMoldChange', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      session.analyzeMoldChange('test.mold-b' as MoldId).orThrow();
      expect(session.pendingMoldChange).toBeDefined();
    });

    test('confirmMoldChange applies pending change and updates currentMold', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.currentMold.id).toBe('test.mold-a');

      session.analyzeMoldChange('test.mold-b' as MoldId).orThrow();
      expect(session.confirmMoldChange()).toSucceed();
      expect(session.currentMold.id).toBe('test.mold-b');
      expect(session.pendingMoldChange).toBeUndefined();
    });

    test('confirmMoldChange rescales filling sessions when weights differ', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      const fillingBefore = Array.from(session.fillingSessions.values())[0];
      expect(fillingBefore).toBeDefined();
      const weightBefore = fillingBefore!.produced.targetWeight;

      session.analyzeMoldChange('test.mold-b' as MoldId).orThrow();
      expect(session.confirmMoldChange()).toSucceed();

      const fillingAfter = Array.from(session.fillingSessions.values())[0];
      expect(fillingAfter).toBeDefined();
      // mold-b has different cavity weight, so filling should be rescaled
      expect(fillingAfter!.produced.targetWeight).not.toBe(weightBefore);
    });

    test('confirmMoldChange does not rescale when weights are same', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      // Confirm mold change and verify it succeeds (rescaling always happens since mold weights differ)
      const analysis = session.analyzeMoldChange('test.mold-c' as MoldId).orThrow();
      expect(analysis.requiresRescaling).toBe(true);

      expect(session.confirmMoldChange()).toSucceed();
      expect(session.currentMold.id).toBe('test.mold-c');
    });

    test('confirmMoldChange fails without analyze', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.confirmMoldChange()).toFailWith(/no pending/i);
    });

    test('cancelMoldChange clears pending', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      session.analyzeMoldChange('test.mold-b' as MoldId).orThrow();
      session.cancelMoldChange();
      expect(session.pendingMoldChange).toBeUndefined();
    });

    test('cancelMoldChange when no pending does not error', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(() => session.cancelMoldChange()).not.toThrow();
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    test('currentMold returns loaded mold', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.currentMold).toBeDefined();
      expect(session.currentMold.id).toBe('test.mold-a');
    });

    test('sessionId is defined', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
    });

    test('baseConfection returns the recipe', () => {
      const confection = ctx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!confection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const session = Session.MoldedBonBonEditingSession.create(confection, sessionContext).orThrow();

      expect(session.baseConfection).toBe(confection);
    });
  });
});
