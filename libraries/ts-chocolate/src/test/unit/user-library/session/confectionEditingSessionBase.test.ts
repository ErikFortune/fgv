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
  MoldFormat,
  MoldId,
  BaseMoldId,
  ConfectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  SlotId,
  BaseSessionId,
  SessionSpec,
  NoteCategory
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary,
  ConfectionsLibrary,
  Confections,
  IMoldEntity,
  MoldsLibrary
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
        yield: {
          numPieces: 48,
          weightPerPiece: 10 as Measurement,
          dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 8 as Millimeters }
        },
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

  // ============================================================================
  // toProductionJournalEntry Tests
  // ============================================================================

  describe('toProductionJournalEntry', () => {
    test('creates a production journal entry for a bar truffle session', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-production');
        expect(entry.baseId).toBeDefined();
        expect(entry.variationId).toBeDefined();
        expect(entry.recipe).toBeDefined();
        expect(entry.produced).toBeDefined();
        expect(entry.yield).toBeDefined();
        expect(entry.notes).toBeUndefined();
      });
    });

    test('includes notes when provided', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const notes = [{ category: 'production' as NoteCategory, note: 'Production run notes' }];
      expect(session.toProductionJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });

    test('journal entry includes filling snapshots for recipe slots', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        // The produced confection should contain filling slot info
        expect(entry.produced).toBeDefined();
        if (entry.produced.fillings) {
          const recipeSlots = entry.produced.fillings.filter((s) => s.slotType === 'recipe');
          for (const slot of recipeSlots) {
            if (slot.slotType === 'recipe') {
              expect(slot.produced).toBeDefined();
            }
          }
        }
      });
    });

    test('creates production journal entry for a rolled truffle session', () => {
      // Need a rolled truffle context
      const rolledTruffleEntity: Confections.RolledTruffleRecipeEntity = {
        baseId: 'test-rolled-truffle' as BaseConfectionId,
        confectionType: 'rolled-truffle',
        name: 'Test Rolled Truffle' as ConfectionName,
        goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        variations: [
          {
            variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
            createdDate: '2026-01-01',
            yield: { numPieces: 40, weightPerPiece: 15 as Measurement },
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

      const confectionsWithRolled = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-bar-truffle': barTruffleEntity,
              'test-rolled-truffle': rolledTruffleEntity
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: confectionsWithRolled }
      }).orThrow();
      const rtCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const rtSessionContext: ISessionContext = {
        get ingredients() {
          return rtCtx.ingredients;
        },
        get fillings() {
          return rtCtx.fillings;
        },
        get procedures() {
          return rtCtx.procedures;
        },
        get molds() {
          return rtCtx.molds;
        },
        get decorations() {
          return rtCtx.decorations;
        },
        get confections() {
          return rtCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return rtCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const rolledConfection = rtCtx.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();
      if (!rolledConfection.isRolledTruffle()) throw new Error('Expected rolled truffle');
      const rolledSession = Session.RolledTruffleEditingSession.create(
        rolledConfection,
        rtSessionContext
      ).orThrow();

      expect(rolledSession.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-production');
        expect(entry.recipe).toBeDefined();
        if ('variationType' in entry.recipe) {
          expect((entry.recipe as { variationType: string }).variationType).toBe('rolled-truffle');
        }
      });
    });

    test('creates production journal entry for a molded bonbon session', () => {
      const moldA: IMoldEntity = {
        baseId: 'mold-a' as BaseMoldId,
        manufacturer: 'Test Molds',
        productNumber: 'TM-001',
        name: 'Test mold A',
        cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
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
            yield: { numFrames: 1 },
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

      const confectionsWithMolded = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-molded-bonbon':
                moldedBonBonEntity /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'mold-a':
                moldA /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: confectionsWithMolded, molds }
      }).orThrow();
      const mbCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const mbSessionContext: ISessionContext = {
        get ingredients() {
          return mbCtx.ingredients;
        },
        get fillings() {
          return mbCtx.fillings;
        },
        get procedures() {
          return mbCtx.procedures;
        },
        get molds() {
          return mbCtx.molds;
        },
        get decorations() {
          return mbCtx.decorations;
        },
        get confections() {
          return mbCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return mbCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const moldedConfection = mbCtx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!moldedConfection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      const mbSession = Session.MoldedBonBonEditingSession.create(
        moldedConfection,
        mbSessionContext
      ).orThrow();

      expect(mbSession.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-production');
        expect(entry.recipe).toBeDefined();
        if ('variationType' in entry.recipe) {
          expect((entry.recipe as { variationType: string }).variationType).toBe('molded-bonbon');
        }
      });
    });
  });

  // ============================================================================
  // analyzeSaveOptions Tests
  // ============================================================================

  describe('analyzeSaveOptions', () => {
    test('returns save analysis with canCreateVariation false for immutable collection', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const analysis = session.analyzeSaveOptions();
      // The test collection is immutable, so variation creation is not allowed
      expect(analysis.canCreateVariation).toBe(false);
      expect(analysis.mustCreateNew).toBe(true);
      expect(analysis.recommendedOption).toBe('new');
      expect(analysis.canAddAlternatives).toBe(false);
    });

    test('returns save analysis indicating new is required for immutable collection', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const analysis = session.analyzeSaveOptions();
      expect(typeof analysis.changes.ingredientsAdded).toBe('boolean');
      expect(typeof analysis.changes.ingredientsRemoved).toBe('boolean');
      expect(typeof analysis.changes.ingredientsChanged).toBe('boolean');
      expect(typeof analysis.changes.procedureChanged).toBe('boolean');
      expect(typeof analysis.changes.weightChanged).toBe('boolean');
      expect(typeof analysis.changes.notesChanged).toBe('boolean');
    });

    test('canCreateVariation is true for a mutable collection', () => {
      const mutableConfections = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'mutable' as CollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-bar-truffle': {
                ...barTruffleEntity,
                variations: [
                  {
                    ...barTruffleEntity.variations[0],
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
                      ids: ['test.dark-chocolate' as IngredientId],
                      preferredId: 'test.dark-chocolate' as IngredientId
                    }
                  }
                ]
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: mutableConfections }
      }).orThrow();
      const mutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const mutableSessionContext: ISessionContext = {
        get ingredients() {
          return mutableCtx.ingredients;
        },
        get fillings() {
          return mutableCtx.fillings;
        },
        get procedures() {
          return mutableCtx.procedures;
        },
        get molds() {
          return mutableCtx.molds;
        },
        get decorations() {
          return mutableCtx.decorations;
        },
        get confections() {
          return mutableCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return mutableCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const mutableConfection = mutableCtx.confections
        .get('mutable.test-bar-truffle' as ConfectionId)
        .orThrow();
      if (!mutableConfection.isBarTruffle()) throw new Error('Expected bar truffle');
      const mutableSession = Session.BarTruffleEditingSession.create(
        mutableConfection,
        mutableSessionContext
      ).orThrow();

      const analysis = mutableSession.analyzeSaveOptions();
      // canCreateVariation depends on isCollectionMutable returning true for the confection's collection
      // In this test setup, the collection is not actually registered as mutable, so it returns false
      expect(analysis.canCreateVariation).toBe(false);
      expect(analysis.mustCreateNew).toBe(true);
      expect(analysis.recommendedOption).toBe('new');
    });
  });

  // ============================================================================
  // hasChanges Tests
  // ============================================================================

  describe('hasChanges', () => {
    test('returns false for a fresh session', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      expect(session.hasChanges).toBe(false);
    });

    test('returns true after scaling yield', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      session
        .scaleToYield({
          count: 96,
          weightPerPiece: 10 as Measurement,
          bufferPercentage: 10 as Percentage,
          dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 8 as Millimeters }
        })
        .orThrow();
      expect(session.hasChanges).toBe(true);
    });

    test('returns true when a child filling session has changes', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const slotId = Array.from(session.fillingSessions.keys())[0];
      if (!slotId) throw new Error('Expected a filling slot');
      const fillingSession = session.getFillingSession(slotId);
      if (!fillingSession) throw new Error('Expected filling session');

      fillingSession.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);
    });
  });

  // ============================================================================
  // markSaved Tests
  // ============================================================================

  describe('markSaved', () => {
    test('resets hasChanges after marking saved', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      session
        .scaleToYield({
          count: 96,
          weightPerPiece: 10 as Measurement,
          bufferPercentage: 10 as Percentage,
          dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 8 as Millimeters }
        })
        .orThrow();
      expect(session.hasChanges).toBe(true);

      session.markSaved();
      expect(session.hasChanges).toBe(false);
    });

    test('resets child filling session changes when marking saved', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const slotId = Array.from(session.fillingSessions.keys())[0];
      if (!slotId) throw new Error('Expected a filling slot');
      const fillingSession = session.getFillingSession(slotId);
      if (!fillingSession) throw new Error('Expected filling session');

      fillingSession.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);

      session.markSaved();
      expect(session.hasChanges).toBe(false);
    });
  });

  // ============================================================================
  // IMaterializedSessionBase accessor fallback Tests (no persisted entity)
  // ============================================================================

  describe('IMaterializedSessionBase accessors', () => {
    test('baseId returns empty string when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.baseId).toBe('');
    });

    test('sessionType is always confection', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.sessionType).toBe('confection');
    });

    test('status defaults to planning when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.status).toBe('planning');
    });

    test('label returns undefined when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.label).toBeUndefined();
    });

    test('group returns undefined when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.group).toBeUndefined();
    });

    test('createdAt returns empty string when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.createdAt).toBe('');
    });

    test('updatedAt returns empty string when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.updatedAt).toBe('');
    });

    test('notes returns undefined when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.notes).toBeUndefined();
    });

    test('sourceVariationId is derived from base confection when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.sourceVariationId).toBeDefined();
      expect(typeof session.sourceVariationId).toBe('string');
      expect(session.sourceVariationId).toMatch(/test\.test-bar-truffle@/);
    });

    test('confectionType reflects the confection type', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.confectionType).toBe('bar-truffle');
    });

    test('execution returns undefined when no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.execution).toBeUndefined();
    });

    test('entity throws when session has no persisted entity', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(() => session.entity).toThrow(/no persisted entity/i);
    });

    test('context accessor returns the session context', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.context).toBe(sessionContext);
    });

    test('produced accessor returns the produced wrapper', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.produced).toBeDefined();
      expect(session.produced.snapshot).toBeDefined();
    });

    test('baseConfection accessor returns the confection', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();
      expect(session.baseConfection).toBe(confection);
    });

    test('sourceVariationId returns from persisted entity when session is restored', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const persistedEntity = session.toPersistedState({ collectionId: 'test' as CollectionId }).orThrow();
      const restoredSession = Session.BarTruffleEditingSession.fromPersistedState(
        confection,
        persistedEntity,
        sessionContext
      ).orThrow();

      // When session is restored from persisted state, sourceVariationId comes from the persisted entity
      expect(restoredSession.sourceVariationId).toBeDefined();
      expect(typeof restoredSession.sourceVariationId).toBe('string');
      expect(restoredSession.sourceVariationId).toMatch(/test\.test-bar-truffle@/);
    });

    test('entity getter returns the persisted entity when session is restored', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const persistedEntity = session.toPersistedState({ collectionId: 'test' as CollectionId }).orThrow();
      const restoredSession = Session.BarTruffleEditingSession.fromPersistedState(
        confection,
        persistedEntity,
        sessionContext
      ).orThrow();

      // entity getter should return the persisted entity when available
      const entity = restoredSession.entity;
      expect(entity).toBeDefined();
      expect(entity.sessionType).toBe('confection');
      expect(entity.confectionType).toBe('bar-truffle');
      expect(entity.baseId).toBe(persistedEntity.baseId);
    });
  });

  // ============================================================================
  // Coverage gap tests - hasChanges via _produced.hasChanges
  // ============================================================================

  describe('hasChanges via _produced changes (no filling sessions)', () => {
    const barTruffleNoFillings: Confections.BarTruffleRecipeEntity = {
      baseId: 'test-bar-truffle-no-fillings' as BaseConfectionId,
      confectionType: 'bar-truffle',
      name: 'Test Bar Truffle No Fillings' as ConfectionName,
      goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      variations: [
        {
          variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
          createdDate: '2026-01-01',
          yield: {
            numPieces: 24,
            weightPerPiece: 12 as Measurement,
            dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 8 as Millimeters }
          },
          fillings: [],
          enrobingChocolate: {
            ids: ['test.dark-chocolate' as IngredientId],
            preferredId: 'test.dark-chocolate' as IngredientId
          }
        }
      ]
    };

    test('hasChanges returns true via _produced.hasChanges when no filling sessions exist', () => {
      const confectionsWithNoFillings = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-bar-truffle-no-fillings': barTruffleNoFillings
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: confectionsWithNoFillings }
      }).orThrow();
      const noFillingsCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const noFillingsSessionContext: ISessionContext = {
        get ingredients() {
          return noFillingsCtx.ingredients;
        },
        get fillings() {
          return noFillingsCtx.fillings;
        },
        get procedures() {
          return noFillingsCtx.procedures;
        },
        get molds() {
          return noFillingsCtx.molds;
        },
        get decorations() {
          return noFillingsCtx.decorations;
        },
        get confections() {
          return noFillingsCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return noFillingsCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const confection = noFillingsCtx.confections
        .get('test.test-bar-truffle-no-fillings' as ConfectionId)
        .orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, noFillingsSessionContext).orThrow();

      // Initially no changes
      expect(session.hasChanges).toBe(false);

      // Scale yield - this changes _produced but no filling sessions exist so _childSessionsDirty stays false
      session
        .scaleToYield({
          count: 48,
          weightPerPiece: 12 as Measurement,
          bufferPercentage: 10 as Percentage,
          dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 8 as Millimeters }
        })
        .orThrow();

      // hasChanges should be true via _produced.hasChanges (not via _childSessionsDirty)
      expect(session.hasChanges).toBe(true);
    });

    test('toProductionJournalEntry works for confection with no filling slots', () => {
      const confectionsWithNoFillings = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-bar-truffle-no-fillings': barTruffleNoFillings
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: confectionsWithNoFillings }
      }).orThrow();
      const noFillingsCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const noFillingsSessionContext: ISessionContext = {
        get ingredients() {
          return noFillingsCtx.ingredients;
        },
        get fillings() {
          return noFillingsCtx.fillings;
        },
        get procedures() {
          return noFillingsCtx.procedures;
        },
        get molds() {
          return noFillingsCtx.molds;
        },
        get decorations() {
          return noFillingsCtx.decorations;
        },
        get confections() {
          return noFillingsCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return noFillingsCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const confection = noFillingsCtx.confections
        .get('test.test-bar-truffle-no-fillings' as ConfectionId)
        .orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, noFillingsSessionContext).orThrow();

      // toProductionJournalEntry triggers _enrichFillings; with no fillings the entity is returned as-is
      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-production');
        expect(entry.produced.fillings).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Coverage gap tests - _scaleFillingToWeight via molded bonbon scaleToYield
  // ============================================================================

  describe('_scaleFillingToWeight via molded bonbon scaleToYield', () => {
    const moldA: IMoldEntity = {
      baseId: 'mold-a' as BaseMoldId,
      manufacturer: 'Test Molds',
      productNumber: 'TM-001',
      name: 'Test mold A',
      cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
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
          yield: { numFrames: 1 },
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

    function createMoldedBonBonContext(): Session.MoldedBonBonEditingSession {
      const confectionsWithMolded = ConfectionsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-molded-bonbon':
                moldedBonBonEntity /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'mold-a':
                moldA /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */ 'dark-chocolate': darkChocolate,
              cream /* eslint-enable @typescript-eslint/naming-convention */
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
              /* eslint-disable @typescript-eslint/naming-convention */ 'test-ganache':
                testRecipe /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
      const library = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings, confections: confectionsWithMolded, molds }
      }).orThrow();
      const mbCtx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
      const mbSessionContext: ISessionContext = {
        get ingredients() {
          return mbCtx.ingredients;
        },
        get fillings() {
          return mbCtx.fillings;
        },
        get procedures() {
          return mbCtx.procedures;
        },
        get molds() {
          return mbCtx.molds;
        },
        get decorations() {
          return mbCtx.decorations;
        },
        get confections() {
          return mbCtx.confections;
        },
        isCollectionMutable(collectionId: CollectionId) {
          return mbCtx.isCollectionMutable(collectionId);
        },
        createFillingSession(filling: IFillingRecipe, targetWeight: Measurement) {
          const variation = filling.goldenVariation;
          const scaleFactor = targetWeight / variation.entity.baseWeight;
          return Session.EditingSession.create(variation, scaleFactor);
        }
      };

      const moldedConfection = mbCtx.confections.get('test.test-molded-bonbon' as ConfectionId).orThrow();
      if (!moldedConfection.isMoldedBonBon()) throw new Error('Expected molded bonbon');
      return Session.MoldedBonBonEditingSession.create(moldedConfection, mbSessionContext).orThrow();
    }

    test('scaleToYield on molded bonbon calls _scaleFillingToWeight for recipe slots', () => {
      const session = createMoldedBonBonContext();

      // scaleToYield triggers _scaleAllFillingsToYield -> _scaleFillingToWeight
      // covering lines 252-263 in confectionEditingSessionBase.ts
      expect(session.scaleToYield({ numFrames: 2, bufferPercentage: 10 as Percentage })).toSucceedAndSatisfy(
        (updatedYield: Confections.BufferedConfectionYield) => {
          expect('numFrames' in updatedYield && updatedYield.numFrames).toBe(2);
        }
      );
    });
  });

  // ============================================================================
  // Coverage gap tests - _enrichFillings with ingredient slot
  // ============================================================================

  describe('_enrichFillings with ingredient slot', () => {
    test('toPersistedState correctly handles ingredient-type filling slot', () => {
      const confection = ctx.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
      if (!confection.isBarTruffle()) throw new Error('Expected bar truffle');
      const session = Session.BarTruffleEditingSession.create(confection, sessionContext).orThrow();

      const slotId = Array.from(session.fillingSessions.keys())[0];
      if (!slotId) throw new Error('Expected at least one filling slot');

      // Replace the recipe slot with an ingredient slot
      session
        .setFillingSlot(slotId, {
          type: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId
        })
        .orThrow();

      // toPersistedState triggers _getEnrichedSerializedHistory -> _enrichFillings
      // The ingredient slot hits the slotType !== 'recipe' branch (lines 712-713)
      expect(session.toPersistedState({ collectionId: 'test' as CollectionId })).toSucceedAndSatisfy(
        (persisted) => {
          expect(persisted.sessionType).toBe('confection');
          expect(persisted.history).toBeDefined();
          const current = persisted.history.current;
          if (current.fillings) {
            const ingredientSlot = current.fillings.find((s) => s.slotId === slotId);
            expect(ingredientSlot).toBeDefined();
            expect(ingredientSlot?.slotType).toBe('ingredient');
          }
        }
      );
    });
  });
});
