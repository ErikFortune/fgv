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
  Millimeters,
  ConfectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  SlotId,
  BaseSessionId,
  SessionSpec
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary,
  ConfectionsLibrary,
  Confections
} from '../../../../packlets/entities';
import {
  ChocolateEntityLibrary,
  ChocolateLibrary,
  IFillingRecipe
} from '../../../../packlets/library-runtime';
import { ISessionContext, Session } from '../../../../packlets/user-library';

describe('ConfectionEditingSessionBase', () => {
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

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-bar-truffle': barTruffleEntity
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, confections }
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
      get decorations() {
        return ctx.decorations;
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
  // Filling Slot Management Tests
  // ============================================================================

  describe('filling slot management', () => {
    test('setFillingSlot with recipe choice creates filling session', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(
        session.setFillingSlot('new-slot' as SlotId, {
          type: 'recipe',
          fillingId: 'test.test-ganache' as FillingId
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
        expect(result?.baseRecipe).toBeDefined();
        expect(result?.scaleToTargetWeight).toBeDefined();
      });
    });

    test('setFillingSlot replaces existing slot with new recipe session', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const knownSlot = Array.from(session.fillingSessions.keys())[0];
      if (knownSlot === undefined) {
        throw new Error('Expected at least one filling slot');
      }
      const originalFilling = session.getFillingSession(knownSlot);
      expect(originalFilling).toBeDefined();

      expect(
        session.setFillingSlot(knownSlot, {
          type: 'recipe',
          fillingId: 'test.test-ganache' as FillingId
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
        expect(result?.baseRecipe).toBeDefined();
        // Should be a different session instance
        expect(result).not.toBe(originalFilling);
      });
    });

    test('setFillingSlot with ingredient choice returns undefined', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(
        session.setFillingSlot('new-slot' as SlotId, {
          type: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId
        })
      ).toSucceedWith(undefined);
    });

    test('removeFillingSlot removes and returns the session', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const knownSlot = Array.from(session.fillingSessions.keys())[0];
      if (knownSlot === undefined) {
        throw new Error('Expected at least one filling slot');
      }

      expect(session.removeFillingSlot(knownSlot)).toSucceedAndSatisfy((removed) => {
        expect(removed).toBeDefined();
        expect(removed?.baseRecipe).toBeDefined();
      });
      expect(session.getFillingSession(knownSlot)).toBeUndefined();
    });

    test('removeFillingSlot for non-existent slot fails', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.removeFillingSlot('nonexistent' as SlotId)).toFailWith(/not found/i);
    });

    test('getFillingSession returns session for known slot', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const knownSlot = Array.from(session.fillingSessions.keys())[0];
      if (knownSlot === undefined) {
        throw new Error('Expected at least one filling slot');
      }

      const fillingSession = session.getFillingSession(knownSlot);
      expect(fillingSession).toBeDefined();
      expect(fillingSession?.produced).toBeDefined();
    });

    test('getFillingSession returns undefined for unknown slot', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.getFillingSession('unknown' as SlotId)).toBeUndefined();
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    test('sessionId returns a string', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
    });

    test('sessionId is auto-generated when not provided', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
    });

    test('sessionId is auto-generated when params object does not include sessionId', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext, {}).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
      expect(session.sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
    });

    test('uses provided sessionId when specified in params', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const customSessionId = '2026-01-15-120000-abcd1234' as SessionSpec;
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext, {
        sessionId: customSessionId
      }).orThrow();

      expect(session.sessionId).toBe(customSessionId);
    });

    test('baseConfection returns the recipe', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.baseConfection).toBe(confection);
    });

    test('produced is defined', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.produced).toBeDefined();
    });

    test('context returns the session context', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.context).toBe(sessionContext);
    });

    test('fillingSessions returns the Map', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.fillingSessions).toBeInstanceOf(Map);
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  describe('toPersistedState', () => {
    test('creates persisted state with auto-generated baseId', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'test' as CollectionId,
          status: 'active',
          label: 'Test Session'
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.baseId).toBeDefined();
        expect(persisted.sessionType).toBe('confection');
        expect(persisted.confectionType).toBe('bar-truffle');
        expect(persisted.status).toBe('active');
        expect(persisted.label).toBe('Test Session');
      });
    });

    test('creates persisted state with provided baseId', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const baseId = '2026-02-17-120000-abc12345' as BaseSessionId;
      expect(
        session.toPersistedState({
          collectionId: 'test' as CollectionId,
          baseId
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.baseId).toBe(baseId);
      });
    });
  });
});
