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

import { FileTree } from '@fgv/ts-json-base';

import {
  BaseIngredientId,
  BaseFillingId,
  BaseLocationId,
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
  BaseJournalId,
  JournalId,
  Millimeters,
  LocationId
} from '../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  IFillingProductionJournalEntryEntity,
  FillingsLibrary,
  IMoldEntity,
  MoldsLibrary,
  ConfectionsLibrary,
  Confections,
  SessionLibrary,
  Session as SessionEntities,
  JournalLibrary,
  LocationsLibrary,
  MoldInventoryLibrary,
  IngredientInventoryLibrary,
  Inventory as InventoryEntities
} from '../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../packlets/library-runtime';
import { UserEntityLibrary } from '../../../packlets/user-entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { UserLibrary } from '../../../packlets/user-library/userLibrary';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  ICommitResult,
  AnyMaterializedSession,
  IMoldInventoryEntry,
  IIngredientInventoryEntry
} from '../../../packlets/user-library/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { ILocation } from '../../../packlets/user-library/location';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditingSession } from '../../../packlets/user-library/session/editingSession';

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
    name: 'Test Mold A',
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
        yield: { numFrames: 1 },
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
          numPieces: 30,
          weightPerPiece: 20 as Measurement,
          dimensions: { width: 20 as Millimeters, height: 20 as Millimeters, depth: 10 as Millimeters }
        },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Layer',
            filling: {
              options: [{ type: 'recipe' as const, id: 'test.test-ganache' as FillingId }],
              preferredId: 'test.test-ganache' as FillingId
            }
          }
        ]
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
        yield: { numFrames: 1, bufferPercentage: 10 as Percentage },
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
        yield: { numFrames: 1, bufferPercentage: 10 as Percentage },
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
        yield: { count: 40, weightPerPiece: 15 as Measurement, bufferPercentage: 10 as Percentage },
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
        yield: { count: 40, weightPerPiece: 15 as Measurement, bufferPercentage: 10 as Percentage },
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
        yield: {
          count: 30,
          weightPerPiece: 20 as Measurement,
          bufferPercentage: 10 as Percentage,
          dimensions: { width: 20 as Millimeters, height: 20 as Millimeters, depth: 10 as Millimeters }
        },
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
        yield: {
          count: 30,
          weightPerPiece: 20 as Measurement,
          bufferPercentage: 10 as Percentage,
          dimensions: { width: 20 as Millimeters, height: 20 as Millimeters, depth: 10 as Millimeters }
        },
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

  // Pre-populated filling session entity (for commitFillingSession tests)
  // Must be in sessionLib before libForCommit is created to be found via merge
  const fillingSessionEntity: SessionEntities.IFillingSessionEntity = {
    baseId: '2026-02-06-120003-beef0001' as BaseSessionId,
    sessionType: 'filling',
    sourceVariationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
    status: 'active',
    createdAt: '2026-02-06T12:00:03Z',
    updatedAt: '2026-02-06T12:00:03Z',
    label: 'Pre-Populated Filling Session',
    history: {
      current: {
        variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
        scaleFactor: 1,
        targetWeight: 300 as Measurement,
        ingredients: [
          {
            ingredientId: 'test.dark-chocolate' as IngredientId,
            amount: 200 as Measurement
          },
          {
            ingredientId: 'test.cream' as IngredientId,
            amount: 100 as Measurement
          }
        ]
      },
      original: {
        variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
        scaleFactor: 1,
        targetWeight: 300 as Measurement,
        ingredients: [
          {
            ingredientId: 'test.dark-chocolate' as IngredientId,
            amount: 200 as Measurement
          },
          {
            ingredientId: 'test.cream' as IngredientId,
            amount: 100 as Measurement
          }
        ]
      },
      undoStack: [],
      redoStack: []
    }
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

    // Build user entity library with sessions, journals, inventories
    sessionLib = SessionLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'user' as CollectionId,
          isMutable: true,
          items: {
            [moldedBonBonSessionEntity.baseId]: moldedBonBonSessionEntity,
            [rolledTruffleSessionEntity.baseId]: rolledTruffleSessionEntity,
            [barTruffleSessionEntity.baseId]: barTruffleSessionEntity,
            [fillingSessionEntity.baseId]: fillingSessionEntity
          }
        }
      ]
    }).orThrow();

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

    // Create a test filling session via the UserLibrary (tests createPersistedFillingSession + persists to entity lib)
    const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
    testSessionId = userLib
      .createPersistedFillingSession(variationId, {
        collectionId: 'user' as CollectionId,
        status: 'active',
        label: 'Test Session for Materialization'
      })
      .orThrow();
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
      expect(UserLibrary.create(userEntities, ctx)).toSucceedAndSatisfy((lib: UserLibrary) => {
        expect(lib).toBeInstanceOf(UserLibrary);
      });
    });

    test('entities exposes underlying user entity library', () => {
      const userEntities = UserEntityLibrary.create().orThrow();
      expect(UserLibrary.create(userEntities, ctx)).toSucceedAndSatisfy((lib: UserLibrary) => {
        expect(lib.entities).toBe(userEntities);
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
      expect(userLib.procedures).toBeDefined();
    });

    test('decorations delegates to context', () => {
      expect(userLib.decorations).toBeDefined();
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
      ).toSucceedAndSatisfy((entry: IMoldInventoryEntry) => {
        expect(entry.item.baseId).toBe('mold-a');
        expect(entry.quantity).toBe(3);
      });
    });

    test('ingredientInventory resolves entries via ingredients context', () => {
      expect(
        userLib.ingredientInventory.get('user.choc-inv-1' as InventoryEntities.IngredientInventoryEntryId)
      ).toSucceedAndSatisfy((entry: IIngredientInventoryEntry) => {
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
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy(
        (session: EditingSession) => {
          expect(session.produced.targetWeight).toBe(600);
        }
      );
    });

    test('scale factor calculates correctly', () => {
      const recipe = ctx.fillings.get('test.test-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy(
        (session: EditingSession) => {
          // Base weight is 300, target is 600, so ingredients should be scaled 2x
          const ingredients = session.produced.ingredients;
          expect(ingredients[0].amount).toBe(400); // 200 * 2
          expect(ingredients[1].amount).toBe(200); // 100 * 2
        }
      );
    });

    test('session has correct ingredient amounts', () => {
      const recipe = ctx.fillings.get('test.test-ganache' as FillingId).orThrow();
      expect(userLib.createFillingSession(recipe, 600 as Measurement)).toSucceedAndSatisfy(
        (session: EditingSession) => {
          // Base: 200g chocolate + 100g cream, scaled 2x
          const ingredients = session.produced.ingredients;
          expect(ingredients).toHaveLength(2);
          expect(ingredients[0].amount).toBe(400); // 200 * 2
          expect(ingredients[1].amount).toBe(200); // 100 * 2
        }
      );
    });
  });

  // ============================================================================
  // createPersistedFillingSession Tests
  // ============================================================================

  describe('createPersistedFillingSession', () => {
    test('creates persisted session and returns composite SessionId', () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      expect(
        userLib.createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((sessionId: SessionId) => {
        expect(sessionId).toMatch(/^user\./);
      });
    });

    test('persisted session is materializable via sessions library', () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      const sessionId = userLib
        .createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId,
          status: 'active',
          label: 'Materializable Session'
        })
        .orThrow();

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.sessionType).toBe('filling');
        expect(session.status).toBe('active');
        expect(session.label).toBe('Materializable Session');
        expect(session.sourceVariationId).toBe(variationId);
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
  // createPersistedConfectionSession Tests
  // ============================================================================

  describe('createPersistedConfectionSession', () => {
    test('creates persisted molded bonbon session and returns composite SessionId', () => {
      expect(
        userLib.createPersistedConfectionSession('test.test-bonbon' as ConfectionId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((sessionId: SessionId) => {
        expect(sessionId).toMatch(/^user\./);
      });
    });

    test('persisted confection session is materializable via sessions library', () => {
      const sessionId = userLib
        .createPersistedConfectionSession('test.test-bonbon' as ConfectionId, {
          collectionId: 'user' as CollectionId,
          status: 'planning',
          label: 'Test Bonbon Session'
        })
        .orThrow();

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.sessionType).toBe('confection');
        expect(session.status).toBe('planning');
        expect(session.label).toBe('Test Bonbon Session');
      });
    });

    test('creates bar truffle session', () => {
      expect(
        userLib.createPersistedConfectionSession('test.test-bar-truffle' as ConfectionId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceed();
    });

    test('creates rolled truffle session', () => {
      expect(
        userLib.createPersistedConfectionSession('test.test-rolled-truffle' as ConfectionId, {
          collectionId: 'user' as CollectionId
        })
      ).toSucceed();
    });

    test('fails for unknown confection ID', () => {
      expect(
        userLib.createPersistedConfectionSession('test.unknown-confection' as ConfectionId, {
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

    test('materializes and saves filling session', () => {
      expect(testSessionId).toBeDefined();

      // First verify materialization works
      expect(userLib.sessions.get(testSessionId!)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        if ('targetWeight' in session && 'baseRecipe' in session) {
          expect(session.targetWeight).toBeDefined();
          expect((session as EditingSession).baseRecipe.fillingRecipe.baseId).toBe('test-ganache');
        }
      });

      // saveSession returns the composite SessionId
      expect(userLib.saveSession(testSessionId!)).toSucceedAndSatisfy((savedId: SessionId) => {
        expect(savedId).toBe(testSessionId);
      });
    });

    test('saves confection session', () => {
      const sessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;

      // First materialize the confection session
      expect(userLib.sessions.get(sessionId)).toSucceed();

      // saveSession returns the composite SessionId
      expect(userLib.saveSession(sessionId)).toSucceedWith(sessionId);
    });

    // Note: The defensive "session not found in entities" path would only be hit if a session
    // was deleted between get() and saveSession(), which cannot be tested without modifying the library.
  });

  // ============================================================================
  // Confection Session Materialization Tests
  // ============================================================================

  describe('confection session materialization', () => {
    test('materializes molded bonbon session', () => {
      const sessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session).toBeDefined();
        // Verify it's a confection session (has baseConfection property)
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-bonbon');
        }
      });
    });

    test('materializes rolled truffle session', () => {
      const sessionId = `user.${rolledTruffleSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session).toBeDefined();
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-rolled-truffle');
        }
      });
    });

    test('materializes bar truffle session', () => {
      const sessionId = `user.${barTruffleSessionEntity.baseId}` as SessionId;

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session).toBeDefined();
        if ('baseConfection' in session) {
          expect(session.baseConfection.baseId).toBe('test-bar-truffle');
        }
      });
    });
  });

  // ============================================================================
  // updateSessionStatus Tests
  // ============================================================================

  describe('updateSessionStatus', () => {
    test('fails for non-existent sessionId', () => {
      const sessionId = 'user.non-existent' as SessionId;
      expect(userLib.updateSessionStatus(sessionId, 'committed')).toFail();
    });

    test('updates filling session status', () => {
      expect(testSessionId).toBeDefined();

      // Verify initial status is 'active'
      expect(userLib.sessions.get(testSessionId!)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.status).toBe('active');
      });

      // Update to 'committed'
      expect(userLib.updateSessionStatus(testSessionId!, 'committed')).toSucceedWith(testSessionId!);

      // Verify status changed (cache was cleared, so re-materializes)
      expect(userLib.sessions.get(testSessionId!)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.status).toBe('committed');
      });

      // Restore to 'active' for other tests
      expect(userLib.updateSessionStatus(testSessionId!, 'active')).toSucceed();
    });

    test('updates confection session status', () => {
      const sessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;

      expect(userLib.updateSessionStatus(sessionId, 'planning')).toSucceedWith(sessionId);

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.status).toBe('planning');
      });

      // Restore
      expect(userLib.updateSessionStatus(sessionId, 'active')).toSucceed();
    });

    test('updates updatedAt timestamp', () => {
      expect(testSessionId).toBeDefined();

      const beforeUpdate = new Date().toISOString();

      expect(userLib.updateSessionStatus(testSessionId!, 'committing')).toSucceed();

      expect(userLib.sessions.get(testSessionId!)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.updatedAt >= beforeUpdate).toBe(true);
      });

      // Restore
      expect(userLib.updateSessionStatus(testSessionId!, 'active')).toSucceed();
    });
  });

  // ============================================================================
  // Persisted-Orchestrated Async Session Methods
  // ============================================================================

  describe('persisted-orchestrated async session methods', () => {
    test('createPersistedFillingSessionAndSave succeeds without explicit caller save', async () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      const result = await userLib.createPersistedFillingSessionAndSave(variationId, {
        collectionId: 'user' as CollectionId,
        status: 'planning',
        label: 'Async Persisted Session'
      });

      expect(result).toSucceedAndSatisfy((sessionId: SessionId) => {
        expect(sessionId).toMatch(/^user\./);
      });

      expect(userLib.sessions.get(result.orThrow())).toSucceedAndSatisfy(
        (session: AnyMaterializedSession) => {
          expect(session.label).toBe('Async Persisted Session');
        }
      );
    });

    test('saveSessionAndPersist succeeds for a materialized session', async () => {
      expect(testSessionId).toBeDefined();
      expect(userLib.sessions.get(testSessionId!)).toSucceed();

      const result = await userLib.saveSessionAndPersist(testSessionId!);
      expect(result).toSucceedWith(testSessionId!);
    });

    test('updateSessionExecutionAndPersist and updateSessionStatusAndPersist both apply', async () => {
      expect(testSessionId).toBeDefined();
      const sessionId = testSessionId!;
      const executionState: SessionEntities.IExecutionState = {
        currentStepIndex: 0,
        startedAt: '2026-02-06T12:00:00Z',
        executionLog: [
          {
            stepIndex: 0,
            status: 'active',
            startedAt: '2026-02-06T12:00:00Z',
            notes: []
          },
          {
            stepIndex: 1,
            status: 'pending'
          },
          {
            stepIndex: 2,
            status: 'pending'
          }
        ]
      };

      expect(await userLib.updateSessionExecutionAndPersist(sessionId, executionState)).toSucceedWith(
        sessionId
      );
      expect(await userLib.updateSessionStatusAndPersist(sessionId, 'committing')).toSucceedWith(sessionId);

      expect(userLib.sessions.get(sessionId)).toSucceedAndSatisfy((session: AnyMaterializedSession) => {
        expect(session.execution).toBeDefined();
        expect(session.status).toBe('committing');
      });
    });

    test('removeSessionAndPersist removes the session without explicit caller save', async () => {
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      const created = userLib
        .createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId,
          status: 'planning',
          label: 'Session to Remove'
        })
        .orThrow();

      expect(await userLib.removeSessionAndPersist(created)).toSucceedWith(created);
      expect(userLib.sessions.get(created)).toFail();
    });

    test('user entity library returns singleton persisted sessions collection wrapper', () => {
      const first = userLib.entities.getPersistedSessionsCollection('user' as CollectionId).orThrow();
      const second = userLib.entities.getPersistedSessionsCollection('user' as CollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('saveSessionAndPersist actually saves when sessions collection has FileTree backing', async () => {
      // Create a FileTree-backed sessions collection (exercises _persistSessionsCollectionIfSupported
      // when canSave() returns true, covering the save() call at lines 732-734)
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/sessions/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const userEntitiesWithFileSessions = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ]
      }).orThrow();

      const libWithFileSessions = UserLibrary.create(userEntitiesWithFileSessions, ctx).orThrow();

      // Add a filling session — this goes into the FileTree-backed collection
      const variationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;
      const createdId = libWithFileSessions
        .createPersistedFillingSession(variationId, {
          collectionId: 'user' as CollectionId,
          status: 'planning',
          label: 'FileTree Session'
        })
        .orThrow();

      // saveSessionAndPersist calls _persistSessionsCollectionIfSupported which calls save()
      // because canSave() is true (FileTree backing)
      const result = await libWithFileSessions.saveSessionAndPersist(createdId);
      expect(result).toSucceedWith(createdId);
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

  // ============================================================================
  // clearCache and locations accessor Tests
  // ============================================================================

  describe('clearCache and locations accessor', () => {
    test('locations returns MaterializedLibrary', () => {
      expect(userLib.locations).toBeDefined();
      expect(typeof userLib.locations.get).toBe('function');
    });

    test('locations resolves entries when locations sub-library has items', () => {
      // Build a user entity library that includes a locations collection
      const locationsLib = LocationsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'user' as CollectionId,
            isMutable: true,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: {
              'home-kitchen': { baseId: 'home-kitchen' as BaseLocationId, name: 'Home Kitchen' }
            }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const userEntitiesWithLocations = UserEntityLibrary.create({
        libraries: {
          sessions: sessionLib,
          journals: JournalLibrary.create({ builtin: false }).orThrow(),
          moldInventory: MoldInventoryLibrary.create({ builtin: false }).orThrow(),
          ingredientInventory: IngredientInventoryLibrary.create({ builtin: false }).orThrow(),
          locations: locationsLib
        }
      }).orThrow();

      const libWithLocations = UserLibrary.create(userEntitiesWithLocations, ctx).orThrow();

      expect(libWithLocations.locations.get('user.home-kitchen' as LocationId)).toSucceedAndSatisfy(
        (loc: ILocation) => {
          expect(loc.name).toBe('Home Kitchen');
          expect(loc.collectionId).toBe('user');
        }
      );
    });

    test('clearCache causes subsequent accessor calls to re-create MaterializedLibrary', () => {
      // Access sessions to populate the cache
      const sessionsBefore = userLib.sessions;
      expect(sessionsBefore).toBeDefined();

      // Clear the cache
      userLib.clearCache();

      // After clearing, a new MaterializedLibrary is created (different object reference)
      const sessionsAfter = userLib.sessions;
      expect(sessionsAfter).toBeDefined();
      expect(sessionsAfter).not.toBe(sessionsBefore);
    });

    test('clearCache clears all sub-library caches', () => {
      // Touch all accessors to populate caches
      const sessionsBefore = userLib.sessions;
      const journalsBefore = userLib.journals;
      const moldInvBefore = userLib.moldInventory;
      const ingInvBefore = userLib.ingredientInventory;
      const locationsBefore = userLib.locations;

      // Clear all at once
      userLib.clearCache();

      // All should be new references after clearing
      expect(userLib.sessions).not.toBe(sessionsBefore);
      expect(userLib.journals).not.toBe(journalsBefore);
      expect(userLib.moldInventory).not.toBe(moldInvBefore);
      expect(userLib.ingredientInventory).not.toBe(ingInvBefore);
      expect(userLib.locations).not.toBe(locationsBefore);
    });
  });

  // ============================================================================
  // invalidateCacheEntry Tests
  // ============================================================================

  describe('invalidateCacheEntry', () => {
    test('invalidates a sessions cache entry', () => {
      expect(testSessionId).toBeDefined();
      const sessionId = testSessionId!;

      // Materialize to populate the cache
      expect(userLib.sessions.get(sessionId)).toSucceed();

      // Invalidate the entry — should not throw and should succeed on re-access
      expect(() => userLib.invalidateCacheEntry('sessions', sessionId)).not.toThrow();
      expect(userLib.sessions.get(sessionId)).toSucceed();
    });

    test('invalidates a journals cache entry', () => {
      expect(() => userLib.invalidateCacheEntry('journals', 'user.some-entry')).not.toThrow();
    });

    test('invalidates a moldInventory cache entry', () => {
      // Materialize first
      userLib.moldInventory.get('user.mold-inv-1' as InventoryEntities.MoldInventoryEntryId);

      expect(() => userLib.invalidateCacheEntry('moldInventory', 'user.mold-inv-1')).not.toThrow();

      // Still materializable after invalidation
      expect(
        userLib.moldInventory.get('user.mold-inv-1' as InventoryEntities.MoldInventoryEntryId)
      ).toSucceed();
    });

    test('invalidates an ingredientInventory cache entry', () => {
      userLib.ingredientInventory.get('user.choc-inv-1' as InventoryEntities.IngredientInventoryEntryId);

      expect(() => userLib.invalidateCacheEntry('ingredientInventory', 'user.choc-inv-1')).not.toThrow();

      expect(
        userLib.ingredientInventory.get('user.choc-inv-1' as InventoryEntities.IngredientInventoryEntryId)
      ).toSucceed();
    });

    test('invalidates a locations cache entry', () => {
      expect(() => userLib.invalidateCacheEntry('locations', 'user.somewhere')).not.toThrow();
    });

    test('invalidateCacheEntry works before MaterializedLibrary is created', () => {
      // Fresh UserLibrary — no caches populated yet
      const freshLib = UserLibrary.create(userLib.entities, ctx).orThrow();
      expect(() => freshLib.invalidateCacheEntry('sessions', 'user.anything')).not.toThrow();
      expect(() => freshLib.invalidateCacheEntry('journals', 'user.anything')).not.toThrow();
      expect(() => freshLib.invalidateCacheEntry('moldInventory', 'user.anything')).not.toThrow();
      expect(() => freshLib.invalidateCacheEntry('ingredientInventory', 'user.anything')).not.toThrow();
      expect(() => freshLib.invalidateCacheEntry('locations', 'user.anything')).not.toThrow();
    });
  });

  // ============================================================================
  // createPersistedConfectionSessionAndSave Tests
  // ============================================================================

  describe('createPersistedConfectionSessionAndSave', () => {
    test('succeeds and returns a composite SessionId', async () => {
      const result = await userLib.createPersistedConfectionSessionAndSave(
        'test.test-bonbon' as ConfectionId,
        {
          collectionId: 'user' as CollectionId,
          status: 'planning',
          label: 'Async Confection Session'
        }
      );

      expect(result).toSucceedAndSatisfy((sessionId: SessionId) => {
        expect(sessionId).toMatch(/^user\./);
      });

      expect(userLib.sessions.get(result.orThrow())).toSucceedAndSatisfy(
        (session: AnyMaterializedSession) => {
          expect(session.label).toBe('Async Confection Session');
          expect(session.sessionType).toBe('confection');
        }
      );
    });

    test('fails when the confection ID is unknown', async () => {
      const result = await userLib.createPersistedConfectionSessionAndSave(
        'test.nonexistent-confection' as ConfectionId,
        {
          collectionId: 'user' as CollectionId
        }
      );
      expect(result).toFail();
    });
  });

  // ============================================================================
  // Async persist method failure paths
  // ============================================================================

  describe('async persist method failure paths', () => {
    test('createPersistedFillingSessionAndSave fails when variation ID is unknown', async () => {
      const result = await userLib.createPersistedFillingSessionAndSave(
        'test.nonexistent-filling@2026-01-01-01' as FillingRecipeVariationId,
        { collectionId: 'user' as CollectionId }
      );
      expect(result).toFail();
    });

    test('saveSessionAndPersist fails when session ID does not exist', async () => {
      const result = await userLib.saveSessionAndPersist('user.nonexistent' as SessionId);
      expect(result).toFail();
    });

    test('updateSessionExecutionAndPersist fails when session ID does not exist', async () => {
      const executionState: SessionEntities.IExecutionState = {
        currentStepIndex: 0,
        startedAt: '2026-02-06T12:00:00Z',
        executionLog: []
      };
      const result = await userLib.updateSessionExecutionAndPersist(
        'user.nonexistent' as SessionId,
        executionState
      );
      expect(result).toFail();
    });

    test('updateSessionStatusAndPersist fails when session ID does not exist', async () => {
      const result = await userLib.updateSessionStatusAndPersist(
        'user.nonexistent' as SessionId,
        'committed'
      );
      expect(result).toFail();
    });

    test('removeSessionAndPersist fails when session ID does not exist', async () => {
      // Use a valid-format session ID that doesn't exist in the library
      const result = await userLib.removeSessionAndPersist('user.2026-03-14-120000-a1b2c3d4' as SessionId);
      expect(result).toFail();
    });
  });

  // ============================================================================
  // updateSessionExecution error path
  // ============================================================================

  describe('updateSessionExecution', () => {
    test('fails when session ID does not exist', () => {
      const executionState: SessionEntities.IExecutionState = {
        currentStepIndex: 0,
        startedAt: '2026-02-06T12:00:00Z',
        executionLog: []
      };
      expect(userLib.updateSessionExecution('user.nonexistent' as SessionId, executionState)).toFail();
    });
  });

  // ============================================================================
  // addJournalEntry Tests
  // ============================================================================

  describe('addJournalEntry', () => {
    // Helper: build a minimal filling production journal entry for testing
    function makeFillingJournalEntry(): IFillingProductionJournalEntryEntity {
      return {
        type: 'filling-production' as const,
        baseId: '2026-03-14-120000-a1b2c3d4' as BaseJournalId,
        timestamp: '2026-03-14T12:00:00Z',
        variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
        recipe: testRecipe.variations[0],
        yield: 300 as Measurement,
        produced: {
          variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
          scaleFactor: 1,
          targetWeight: 300 as Measurement,
          ingredients: [
            {
              ingredientId: 'test.dark-chocolate' as IngredientId,
              amount: 200 as Measurement
            },
            {
              ingredientId: 'test.cream' as IngredientId,
              amount: 100 as Measurement
            }
          ]
        }
      };
    }

    test('fails when journal collection does not exist', async () => {
      const journalEntry = makeFillingJournalEntry();
      const result = await userLib.addJournalEntry('nonexistent' as CollectionId, journalEntry);
      expect(result).toFailWith(/journal collection.*nonexistent.*is not available/i);
    });

    test('fails when journal collection exists but addItem fails (no FileTree backing)', async () => {
      // Build a UserLibrary with a mutable journals collection (but no FileTree)
      const journalsWithCollection = JournalLibrary.create({
        builtin: false,
        collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const userEntitiesWithJournals = UserEntityLibrary.create({
        libraries: {
          sessions: sessionLib,
          journals: journalsWithCollection,
          moldInventory: MoldInventoryLibrary.create({ builtin: false }).orThrow(),
          ingredientInventory: IngredientInventoryLibrary.create({ builtin: false }).orThrow()
        }
      }).orThrow();

      const libWithJournals = UserLibrary.create(userEntitiesWithJournals, ctx).orThrow();
      const journalEntry = makeFillingJournalEntry();

      // addItem will fail because there's no FileTree backing
      const result = await libWithJournals.addJournalEntry('user' as CollectionId, journalEntry);
      expect(result).toFailWith(/does not support persistence/i);
    });

    test('succeeds when journal collection has FileTree backing', async () => {
      // Create an in-memory FileTree for the journals collection
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/journals/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const userEntitiesWithFileTree = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ],
        libraries: { sessions: sessionLib }
      }).orThrow();

      const libWithFileTree = UserLibrary.create(userEntitiesWithFileTree, ctx).orThrow();
      const journalEntry = makeFillingJournalEntry();

      const result = await libWithFileTree.addJournalEntry('user' as CollectionId, journalEntry);
      expect(result).toSucceedAndSatisfy((journalId: JournalId) => {
        expect(journalId).toMatch(/^user\./);
      });
    });
  });

  // ============================================================================
  // commitFillingSession Tests
  // ============================================================================

  describe('commitFillingSession', () => {
    test('fails when session does not exist', async () => {
      const result = await userLib.commitFillingSession(
        'user.nonexistent' as SessionId,
        'user' as CollectionId
      );
      expect(result).toFailWith(/session.*nonexistent.*not found/i);
    });

    test('fails when session is a confection session (not a filling session)', async () => {
      const confectionSessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;
      // Materialize the confection session first
      expect(userLib.sessions.get(confectionSessionId)).toSucceed();

      const result = await userLib.commitFillingSession(confectionSessionId, 'user' as CollectionId);
      expect(result).toFailWith(/is not a filling session/i);
    });

    test('fails when journal collection is not available', async () => {
      // UserLib has no journal collection with ID 'nonexistent'
      const result = await userLib.commitFillingSession(testSessionId!, 'nonexistent' as CollectionId);
      expect(result).toFailWith(/failed to persist journal entry/i);
    });

    test('succeeds and returns ICommitResult when journal has FileTree backing', async () => {
      // Build a FileTree-backed journal collection
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/journals/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      // fillingSessionEntity is pre-populated in sessionLib (before this library is created),
      // so the merged copy inside userEntitiesForCommit will contain it.
      const userEntitiesForCommit = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ],
        libraries: { sessions: sessionLib }
      }).orThrow();

      const libForCommit = UserLibrary.create(userEntitiesForCommit, ctx).orThrow();
      const fillingSessionId = `user.${fillingSessionEntity.baseId}` as SessionId;

      const result = await libForCommit.commitFillingSession(fillingSessionId, 'user' as CollectionId);

      expect(result).toSucceedAndSatisfy((commitResult: ICommitResult) => {
        expect(commitResult.journalId).toMatch(/^user\./);
        expect(commitResult.saveAnalysis).toBeDefined();
      });

      // Session status should be 'committed' after commit
      expect(libForCommit.sessions.get(fillingSessionId)).toSucceedAndSatisfy(
        (session: AnyMaterializedSession) => {
          expect(session.status).toBe('committed');
        }
      );
    });
  });

  // ============================================================================
  // commitConfectionSession Tests
  // ============================================================================

  describe('commitConfectionSession', () => {
    test('fails when session does not exist', async () => {
      const result = await userLib.commitConfectionSession(
        'user.nonexistent' as SessionId,
        'user' as CollectionId
      );
      expect(result).toFailWith(/session.*nonexistent.*not found/i);
    });

    test('fails when session is a filling session (not a confection session)', async () => {
      const result = await userLib.commitConfectionSession(testSessionId!, 'user' as CollectionId);
      expect(result).toFailWith(/is not a confection session/i);
    });

    test('fails when journal collection is not available', async () => {
      const confectionSessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;
      expect(userLib.sessions.get(confectionSessionId)).toSucceed();

      const result = await userLib.commitConfectionSession(
        confectionSessionId,
        'nonexistent' as CollectionId
      );
      expect(result).toFailWith(/failed to persist journal entry/i);
    });

    test('succeeds for a molded bonbon session and returns ICommitResult', async () => {
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/journals/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const userEntitiesForCommit = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ],
        libraries: { sessions: sessionLib }
      }).orThrow();

      const libForCommit = UserLibrary.create(userEntitiesForCommit, ctx).orThrow();

      const confectionSessionId = `user.${moldedBonBonSessionEntity.baseId}` as SessionId;
      // Materialize first to confirm it works
      expect(libForCommit.sessions.get(confectionSessionId)).toSucceed();

      const result = await libForCommit.commitConfectionSession(confectionSessionId, 'user' as CollectionId);

      expect(result).toSucceedAndSatisfy((commitResult: ICommitResult) => {
        expect(commitResult.journalId).toMatch(/^user\./);
        expect(commitResult.saveAnalysis).toBeDefined();
      });

      // Session status should be 'committed' after commit
      expect(libForCommit.sessions.get(confectionSessionId)).toSucceedAndSatisfy(
        (session: AnyMaterializedSession) => {
          expect(session.status).toBe('committed');
        }
      );
    });

    test('succeeds for a rolled truffle session', async () => {
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/journals/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const userEntitiesForCommit = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ],
        libraries: { sessions: sessionLib }
      }).orThrow();

      const libForCommit = UserLibrary.create(userEntitiesForCommit, ctx).orThrow();
      const rolledSessionId = `user.${rolledTruffleSessionEntity.baseId}` as SessionId;

      expect(
        await libForCommit.commitConfectionSession(rolledSessionId, 'user' as CollectionId)
      ).toSucceedAndSatisfy((commitResult: ICommitResult) => {
        expect(commitResult.journalId).toMatch(/^user\./);
      });
    });

    test('succeeds for a bar truffle session', async () => {
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/journals/user.yaml', contents: { items: {} } }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const userEntitiesForCommit = UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            load: true,
            skipMissingDirectories: true
          }
        ],
        libraries: { sessions: sessionLib }
      }).orThrow();

      const libForCommit = UserLibrary.create(userEntitiesForCommit, ctx).orThrow();
      const barSessionId = `user.${barTruffleSessionEntity.baseId}` as SessionId;

      expect(
        await libForCommit.commitConfectionSession(barSessionId, 'user' as CollectionId)
      ).toSucceedAndSatisfy((commitResult: ICommitResult) => {
        expect(commitResult.journalId).toMatch(/^user\./);
      });
    });
  });
});
