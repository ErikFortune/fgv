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
  FillingRecipeVariationId,
  CollectionId,
  MoldId,
  BaseMoldId,
  MoldFormat,
  ConfectionId,
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  ConfectionRecipeVariationId,
  SlotId,
  SessionId,
  BaseSessionId,
  Millimeters
} from '../../../packlets/common';
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
  SessionLibrary,
  Session as SessionEntities,
  JournalLibrary,
  MoldInventoryLibrary,
  IngredientInventoryLibrary,
  Inventory as InventoryEntities
} from '../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../packlets/library-runtime';
import { UserEntityLibrary } from '../../../packlets/user-entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { UserLibrary } from '../../../packlets/user-library/userLibrary';

describe('UserLibrary', () => {
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
            name: 'Center',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        molds: { options: [{ id: 'test.mold-a' as MoldId }], preferredId: 'test.mold-a' as MoldId },
        shellChocolate: {
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

  const barTruffleEntity: Confections.BarTruffleRecipeEntity = {
    baseId: 'test-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: { count: 30, unit: 'pieces', weightPerPiece: 20 as Measurement },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Layer',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ],
        frameDimensions: { width: 200 as Millimeters, height: 200 as Millimeters, depth: 10 as Millimeters },
        singleBonBonDimensions: { width: 20 as Millimeters, height: 20 as Millimeters }
      }
    ]
  };

  // Confection session entities for testing materialization
  const moldedBonBonSessionEntity: SessionEntities.IConfectionSessionEntity = {
    baseId: '2026-02-06-120000-abcd1234' as BaseSessionId,
    sessionType: 'confection',
    confectionType: 'molded-bonbon',
    sourceVariationId: 'test.test-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
    status: 'active',
    createdAt: '2026-02-06T12:00:00Z',
    updatedAt: '2026-02-06T12:00:00Z',
    label: 'Test Molded BonBon Session',
    history: {
      current: {
        confectionType: 'molded-bonbon',
        variationId: 'test.test-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ],
        moldId: 'test.mold-a' as MoldId,
        shellChocolateId: 'test.dark-chocolate' as IngredientId
      },
      original: {
        confectionType: 'molded-bonbon',
        variationId: 'test.test-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ],
        moldId: 'test.mold-a' as MoldId,
        shellChocolateId: 'test.dark-chocolate' as IngredientId
      },
      undoStack: [],
      redoStack: []
    },
    childSessionIds: {}
  };

  const rolledTruffleSessionEntity: SessionEntities.IConfectionSessionEntity = {
    baseId: '2026-02-06-120001-abcd5678' as BaseSessionId,
    sessionType: 'confection',
    confectionType: 'rolled-truffle',
    sourceVariationId: 'test.test-rolled-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
    status: 'active',
    createdAt: '2026-02-06T12:00:01Z',
    updatedAt: '2026-02-06T12:00:01Z',
    label: 'Test Rolled Truffle Session',
    history: {
      current: {
        confectionType: 'rolled-truffle',
        variationId: 'test.test-rolled-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      },
      original: {
        confectionType: 'rolled-truffle',
        variationId: 'test.test-rolled-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      },
      undoStack: [],
      redoStack: []
    },
    childSessionIds: {}
  };

  const barTruffleSessionEntity: SessionEntities.IConfectionSessionEntity = {
    baseId: '2026-02-06-120002-abcd9012' as BaseSessionId,
    sessionType: 'confection',
    confectionType: 'bar-truffle',
    sourceVariationId: 'test.test-bar-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
    status: 'active',
    createdAt: '2026-02-06T12:00:02Z',
    updatedAt: '2026-02-06T12:00:02Z',
    label: 'Test Bar Truffle Session',
    history: {
      current: {
        confectionType: 'bar-truffle',
        variationId: 'test.test-bar-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 30, unit: 'pieces', weightPerPiece: 20 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      },
      original: {
        confectionType: 'bar-truffle',
        variationId: 'test.test-bar-truffle@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 30, unit: 'pieces', weightPerPiece: 20 as Measurement },
        fillings: [
          {
            slotType: 'recipe',
            slotId: 'center' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      },
      undoStack: [],
      redoStack: []
    },
    childSessionIds: {}
  };

  // Filling recipe with invalid baseWeight for error testing
  const invalidRecipe: IFillingRecipeEntity = {
    baseId: 'invalid-ganache' as BaseFillingId,
    name: 'Invalid Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache with zero base weight',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 0 as Measurement
      }
    ]
  };

  // ============================================================================
  // Test Fixtures
  // ============================================================================

  let userLib: UserLibrary;
  let ctx: ChocolateLibrary;
  let sessionLib: SessionLibrary;
  let testSessionId: SessionId | undefined;

  beforeEach(() => {
    // Build chocolate library
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: { 'dark-chocolate': darkChocolate, cream }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: {
            'test-ganache': testRecipe,
            'invalid-ganache': invalidRecipe
          }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: { 'mold-a': moldA }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: {
            'test-bonbon': moldedBonBonEntity,
            'test-rolled-truffle': rolledTruffleEntity,
            'test-bar-truffle': barTruffleEntity
          }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const entityLib = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, molds, confections }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(entityLib).orThrow();

    // Create a test session for materialization testing
    const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
    const tempUserLib = UserLibrary.create(UserEntityLibrary.create().orThrow(), ctx).orThrow();
    const testSession = tempUserLib
      .createPersistedFillingSession(variationId, {
        collectionId: 'user' as CollectionId,
        status: 'active',
        label: 'Test Session for Materialization'
      })
      .orThrow();

    // Build user entity library with sessions, journals, inventories
    sessionLib = SessionLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'user' as CollectionId,
          isMutable: true,
          items: {
            [testSession.baseId]: testSession,
            [moldedBonBonSessionEntity.baseId]: moldedBonBonSessionEntity,
            [rolledTruffleSessionEntity.baseId]: rolledTruffleSessionEntity,
            [barTruffleSessionEntity.baseId]: barTruffleSessionEntity
          }
        }
      ]
    }).orThrow();

    testSessionId = `user.${testSession.baseId}` as SessionId;

    const userEntities = UserEntityLibrary.create({
      libraries: {
        sessions: sessionLib,
        journals: JournalLibrary.create({ builtin: false }).orThrow(),
        moldInventory: MoldInventoryLibrary.create({
          builtin: false,
          collections: [
            {
              id: 'user' as CollectionId,
              isMutable: true,
              /* eslint-disable @typescript-eslint/naming-convention */
              items: {
                'mold-inv-1': {
                  inventoryType: 'mold' as const,
                  moldId: 'test.mold-a' as MoldId,
                  count: 3
                }
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          ]
        }).orThrow(),
        ingredientInventory: IngredientInventoryLibrary.create({
          builtin: false,
          collections: [
            {
              id: 'user' as CollectionId,
              isMutable: true,
              /* eslint-disable @typescript-eslint/naming-convention */
              items: {
                'choc-inv-1': {
                  inventoryType: 'ingredient' as const,
                  ingredientId: 'test.dark-chocolate' as IngredientId,
                  quantity: 500 as Measurement
                }
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          ]
        }).orThrow()
      }
    }).orThrow();

    userLib = UserLibrary.create(userEntities, ctx).orThrow();
  });

  // ============================================================================
  // create() Tests
  // ============================================================================

  describe('create', () => {
    test('succeeds with valid inputs', () => {
      const userEntities = UserEntityLibrary.create().orThrow();
      expect(UserLibrary.create(userEntities, ctx)).toSucceed();
    });

    test('returns UserLibrary instance', () => {
      const userEntities = UserEntityLibrary.create().orThrow();
      expect(UserLibrary.create(userEntities, ctx)).toSucceedAndSatisfy((lib) => {
        expect(lib).toBeInstanceOf(UserLibrary);
      });
    });
  });

  // ============================================================================
  // Context Delegation Tests
  // ============================================================================

  describe('context delegation', () => {
    test('fillings delegates to context', () => {
      expect(userLib.fillings.get('test.test-ganache' as FillingId)).toSucceed();
    });

    test('confections delegates to context', () => {
      expect(userLib.confections.get('test.test-bonbon' as ConfectionId)).toSucceed();
    });

    test('molds delegates to context', () => {
      expect(userLib.molds.get('test.mold-a' as MoldId)).toSucceed();
    });

    test('ingredients delegates to context', () => {
      expect(userLib.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceed();
    });

    test('procedures delegates to context', () => {
      // Just verify the getter returns a MaterializedLibrary
      expect(userLib.procedures).toBeDefined();
    });

    test('isCollectionMutable delegates to confection context', () => {
      // The test collection in beforeEach has isMutable: false
      expect(userLib.isCollectionMutable('test' as CollectionId)).toSucceedWith(false);
    });

    test('isCollectionMutable returns true for mutable collection', () => {
      // Create a context with a mutable collection
      const mutableIngredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'mutable' as CollectionId,
            isMutable: true,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: { 'dark-chocolate': darkChocolate }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const mutableRecipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'mutable' as CollectionId,
            isMutable: true,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: { 'test-ganache': testRecipe }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const mutableLibrary = ChocolateEntityLibrary.create({
        libraries: { ingredients: mutableIngredients, fillings: mutableRecipes }
      }).orThrow();

      const mutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(mutableLibrary).orThrow();
      const mutableUserLib = UserLibrary.create(UserEntityLibrary.create().orThrow(), mutableCtx).orThrow();

      expect(mutableUserLib.isCollectionMutable('mutable' as CollectionId)).toSucceedWith(true);
    });

    test('isCollectionMutable fails for non-existent collection', () => {
      expect(userLib.isCollectionMutable('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  // ============================================================================
  // Materialized Accessors Tests
  // ============================================================================

  describe('materialized accessors', () => {
    test('sessions returns MaterializedLibrary', () => {
      expect(userLib.sessions).toBeDefined();
      expect(typeof userLib.sessions.get).toBe('function');
    });

    test('journals returns MaterializedLibrary', () => {
      expect(userLib.journals).toBeDefined();
      expect(typeof userLib.journals.get).toBe('function');
    });

    test('moldInventory resolves entries via molds context', () => {
      expect(
        userLib.moldInventory.get('user.mold-inv-1' as InventoryEntities.MoldInventoryEntryId)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.item.baseId).toBe('mold-a');
        expect(entry.quantity).toBe(3);
      });
    });

    test('ingredientInventory resolves entries via ingredients context', () => {
      expect(
        userLib.ingredientInventory.get('user.choc-inv-1' as InventoryEntities.IngredientInventoryEntryId)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.item.baseId).toBe('dark-chocolate');
        expect(entry.quantity).toBe(500);
      });
    });
  });

  // ============================================================================
  // createFillingSession Tests
  // ============================================================================

  describe('createFillingSession', () => {
    test('creates session at target weight', () => {
      const recipe = ctx.fillings.get('test.test-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy((session) => {
        expect(session.produced.targetWeight).toBe(600);
      });
    });

    test('scale factor calculates correctly', () => {
      const recipe = ctx.fillings.get('test.test-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy((session) => {
        // Base weight is 300, target is 600, so ingredients should be scaled 2x
        const ingredients = session.produced.ingredients;
        expect(ingredients[0].amount).toBe(400); // 200 * 2
        expect(ingredients[1].amount).toBe(200); // 100 * 2
      });
    });

    test('session has correct ingredient amounts', () => {
      const recipe = ctx.fillings.get('test.test-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy((session) => {
        // Base: 200g chocolate + 100g cream, scaled 2x
        const ingredients = session.produced.ingredients;
        expect(ingredients).toHaveLength(2);
        expect(ingredients[0].amount).toBe(400); // 200 * 2
        expect(ingredients[1].amount).toBe(200); // 100 * 2
      });
    });
  });

  // ============================================================================
  // createPersistedFillingSession Tests
  // ============================================================================

  describe('createPersistedFillingSession', () => {
    test('creates persisted session from valid variation ID', () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      expect(
        userLib.createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceed();
    });

    test('returns IFillingSessionEntity with correct sessionType', () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      expect(
        userLib.createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.sessionType).toBe('filling');
        expect(persisted.sourceVariationId).toBe(variationId);
      });
    });

    test('fails for unknown variation ID', () => {
      const variationId = 'test.unknown-filling@2026-01-01-01' as FillingRecipeVariationId;
      expect(
        userLib.createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId
        })
      ).toFail();
    });
  });

  // ============================================================================
  // saveSession Tests
  // ============================================================================

  describe('saveSession', () => {
    test('fails for non-existent sessionId', () => {
      const sessionId = 'user.non-existent' as SessionId;
      expect(userLib.saveSession(sessionId)).toFail();
    });

    test('creates and materializes persisted session', () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;

      // Create a persisted session
      expect(
        userLib.createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId,
          status: 'active',
          label: 'Test Session'
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.sessionType).toBe('filling');
        expect(persisted.status).toBe('active');
        expect(persisted.label).toBe('Test Session');
        expect(persisted.sourceVariationId).toBe(variationId);
      });
    });

    test('materializes and saves session added in beforeEach', () => {
      if (!testSessionId) {
        // Skip if session wasn't added (shouldn't happen in normal test run)
        return;
      }

      // First verify materialization works - tests _materializeSession and _materializeFillingSession
      expect(userLib.sessions.get(testSessionId)).toSucceedAndSatisfy((session) => {
        // Filling sessions are EditingSession type
        if ('targetWeight' in session && 'baseRecipe' in session) {
          expect(session.targetWeight).toBeDefined();
          expect(session.baseRecipe.fillingRecipe.baseId).toBe('test-ganache');
        }
      });

      // Then verify saveSession works - tests saveSession success path (lines 296-329)
      expect(userLib.saveSession(testSessionId)).toSucceedAndSatisfy((saved) => {
        expect(saved.sessionType).toBe('filling');
      });
    });

    test('saves confection session', () => {
      const sessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;

      // First materialize the confection session
      expect(userLib.sessions.get(sessionId)).toSucceed();

      // Then verify saveSession works for confection sessions
      expect(userLib.saveSession(sessionId)).toSucceedAndSatisfy((saved) => {
        expect(saved.sessionType).toBe('confection');
        if (saved.sessionType === 'confection') {
          expect(saved.confectionType).toBe('molded-bonbon');
          expect(saved.sourceVariationId).toBe(moldedBonBonSessionEntity.sourceVariationId);
          expect(saved.childSessionIds).toEqual({});
        }
      });
    });

    // Note: Lines 309-310 (session not found in entities during save) represent defensive
    // coding for race conditions. If a session materializes successfully via get(), it must
    // exist in the entity library. This path would only be hit if the session was deleted
    // between get() and saveSession(), which cannot be tested without modifying the library.
  });

  // ============================================================================
  // Confection Session Materialization Tests
  // ============================================================================

  describe('confection session materialization', () => {
    test('materializes molded bonbon session', () => {
      const sessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session) => {
        expect(session).toBeDefined();
        // Verify it's a confection session (has baseConfection property)
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-bonbon');
        }
      });
    });

    test('materializes rolled truffle session', () => {
      const sessionId = `user.${rolledTruffleSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session) => {
        expect(session).toBeDefined();
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-rolled-truffle');
        }
      });
    });

    test('materializes bar truffle session', () => {
      const sessionId = `user.${barTruffleSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session) => {
        expect(session).toBeDefined();
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-bar-truffle');
        }
      });
    });
  });

  // ============================================================================
  // Error Path Tests
  // ============================================================================

  describe('error paths', () => {
    test('createFillingSession fails with baseWeight <= 0', () => {
      const recipe = ctx.fillings.get('test.invalid-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toFailWith(
        /base weight must be positive/i
      );
    });
  });
});
