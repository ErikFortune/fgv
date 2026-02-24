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
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  ConfectionRecipeVariationId,
  SlotId,
  NoteCategory,
  JournalId,
  BaseJournalId
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
  IFillingEditJournalEntryEntity,
  IConfectionEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  AnyJournalEntryEntity
} from '../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary, IFillingRecipe } from '../../../packlets/library-runtime';
import { ISessionContext } from '../../../packlets/user-library';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  FillingEditJournalEntry,
  ConfectionEditJournalEntry,
  FillingProductionJournalEntry,
  ConfectionProductionJournalEntry,
  createJournalEntry
} from '../../../packlets/user-library/journalEntry';

describe('Journal Entry Classes', () => {
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

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 3 as Percentage,
      milkFat: 38 as Percentage,
      water: 55 as Percentage,
      solids: 4 as Percentage,
      otherFats: 0 as Percentage
    }
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
        ingredients: [
          {
            ingredient: { ids: ['test.dark-chocolate' as IngredientId] },
            amount: 200 as Measurement
          },
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
        molds: { options: [{ id: 'test.mold-a' as MoldId }], preferredId: 'test.mold-a' as MoldId },
        shellChocolate: {
          ids: ['test.dark-chocolate' as IngredientId],
          preferredId: 'test.dark-chocolate' as IngredientId
        }
      }
    ]
  };

  // ============================================================================
  // Journal Entry Entities
  // ============================================================================

  const fillingEditEntity: IFillingEditJournalEntryEntity = {
    type: 'filling-edit',
    baseId: '2026-01-15-143025-a1b2c3d4' as BaseJournalId,
    timestamp: '2026-01-15T14:30:25Z',
    variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
    recipe: {
      variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
      createdDate: '2026-01-01',
      ingredients: [
        { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
        { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
      ],
      baseWeight: 300 as Measurement
    }
  };

  const confectionEditEntity: IConfectionEditJournalEntryEntity = {
    type: 'confection-edit',
    baseId: '2026-01-15-150000-b2c3d4e5' as BaseJournalId,
    timestamp: '2026-01-15T15:00:00Z',
    variationId: 'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
    recipe: {
      variationType: 'molded-bonbon' as const,
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
      molds: { options: [{ id: 'test.mold-a' as MoldId }], preferredId: 'test.mold-a' as MoldId },
      shellChocolate: {
        ids: ['test.dark-chocolate' as IngredientId],
        preferredId: 'test.dark-chocolate' as IngredientId
      }
    }
  };

  const fillingProductionEntity: IFillingProductionJournalEntryEntity = {
    type: 'filling-production',
    baseId: '2026-01-16-100000-c3d4e5f6' as BaseJournalId,
    timestamp: '2026-01-16T10:00:00Z',
    variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
    recipe: {
      variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
      createdDate: '2026-01-01',
      ingredients: [
        { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
        { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
      ],
      baseWeight: 300 as Measurement
    },
    yield: 600 as Measurement,
    produced: {
      variationId: 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId,
      scaleFactor: 2.0,
      targetWeight: 600 as Measurement,
      ingredients: [
        { ingredientId: 'test.dark-chocolate' as IngredientId, amount: 400 as Measurement },
        { ingredientId: 'test.cream' as IngredientId, amount: 200 as Measurement }
      ]
    }
  };

  const confectionProductionEntity: IConfectionProductionJournalEntryEntity = {
    type: 'confection-production',
    baseId: '2026-01-16-140000-d4e5f6a7' as BaseJournalId,
    timestamp: '2026-01-16T14:00:00Z',
    variationId: 'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
    recipe: {
      variationType: 'molded-bonbon' as const,
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
      molds: { options: [{ id: 'test.mold-a' as MoldId }], preferredId: 'test.mold-a' as MoldId },
      shellChocolate: {
        ids: ['test.dark-chocolate' as IngredientId],
        preferredId: 'test.dark-chocolate' as IngredientId
      }
    },
    yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
    produced: {
      confectionType: 'molded-bonbon',
      variationId: 'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
      yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
      moldId: 'test.mold-a' as MoldId,
      shellChocolateId: 'test.dark-chocolate' as IngredientId
    }
  };

  // ============================================================================
  // Setup
  // ============================================================================

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
            'mold-a': moldA
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

    const ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
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
        // Note: This is a stub for testing - real implementation would use Session.EditingSession
        return { variation, scaleFactor } as unknown as ReturnType<ISessionContext['createFillingSession']>;
      }
    };
  });

  // ============================================================================
  // FillingEditJournalEntry Tests
  // ============================================================================

  describe('FillingEditJournalEntry', () => {
    test('create succeeds with valid entity and resolves recipe and variation', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;

      expect(FillingEditJournalEntry.create(sessionContext, id, fillingEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.id).toBe(id);
          expect(entry.baseId).toBe('2026-01-15-143025-a1b2c3d4' as BaseJournalId);
          expect(entry.timestamp).toBe('2026-01-15T14:30:25Z');
          expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01' as FillingRecipeVariationId);
          expect(entry.recipe).toBeDefined();
          expect(entry.variation).toBeDefined();
          expect(entry.variation.entity.baseWeight).toBe(300 as Measurement);
        }
      );
    });

    test('create fails for unknown filling ID', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;
      const invalidEntity: IFillingEditJournalEntryEntity = {
        ...fillingEditEntity,
        variationId: 'test.unknown-filling@2026-01-01-01' as FillingRecipeVariationId
      };

      expect(FillingEditJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(
        /journal.*unknown-filling/i
      );
    });

    test('create fails for unknown variation spec', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;
      const invalidEntity: IFillingEditJournalEntryEntity = {
        ...fillingEditEntity,
        variationId: 'test.test-ganache@2099-12-31-99' as FillingRecipeVariationId
      };

      expect(FillingEditJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(/journal/i);
    });

    test('property accessors return correct values', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;

      expect(FillingEditJournalEntry.create(sessionContext, id, fillingEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.id).toBe(id);
          expect(entry.baseId).toBe('2026-01-15-143025-a1b2c3d4' as BaseJournalId);
          expect(entry.timestamp).toBe('2026-01-15T14:30:25Z');
          expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01' as FillingRecipeVariationId);
          expect(entry.recipe.name).toBe('Test Ganache' as FillingName);
          expect(entry.variation.entity.variationSpec).toBe('2026-01-01-01' as FillingRecipeVariationSpec);
          expect(entry.updated).toBeUndefined();
          expect(entry.notes).toBeUndefined();
        }
      );
    });

    test('entity accessor returns original entity', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;

      expect(FillingEditJournalEntry.create(sessionContext, id, fillingEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.entity).toBe(fillingEditEntity);
          expect(entry.entity.type).toBe('filling-edit');
          expect(entry.entity.baseId).toBe('2026-01-15-143025-a1b2c3d4' as BaseJournalId);
        }
      );
    });
  });

  // ============================================================================
  // ConfectionEditJournalEntry Tests
  // ============================================================================

  describe('ConfectionEditJournalEntry', () => {
    test('create succeeds and resolves confection and variation', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;

      expect(ConfectionEditJournalEntry.create(sessionContext, id, confectionEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.id).toBe(id);
          expect(entry.baseId).toBe('2026-01-15-150000-b2c3d4e5' as BaseJournalId);
          expect(entry.timestamp).toBe('2026-01-15T15:00:00Z');
          expect(entry.variationId).toBe(
            'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId
          );
          expect(entry.recipe).toBeDefined();
          expect(entry.variation).toBeDefined();
        }
      );
    });

    test('create fails for unknown confection ID', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;
      const invalidEntity: IConfectionEditJournalEntryEntity = {
        ...confectionEditEntity,
        variationId: 'test.unknown-confection@2026-01-01-01' as ConfectionRecipeVariationId
      };

      expect(ConfectionEditJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(
        /journal.*unknown-confection/i
      );
    });

    test('create fails for unknown variation spec', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;
      const invalidEntity: IConfectionEditJournalEntryEntity = {
        ...confectionEditEntity,
        variationId: 'test.test-molded-bonbon@2099-12-31-99' as ConfectionRecipeVariationId
      };

      expect(ConfectionEditJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(/journal/i);
    });

    test('property accessors return correct values', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;

      expect(ConfectionEditJournalEntry.create(sessionContext, id, confectionEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.id).toBe(id);
          expect(entry.baseId).toBe('2026-01-15-150000-b2c3d4e5' as BaseJournalId);
          expect(entry.timestamp).toBe('2026-01-15T15:00:00Z');
          expect(entry.variationId).toBe(
            'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId
          );
          expect(entry.recipe.name).toBe('Test Molded BonBon' as ConfectionName);
          expect(entry.variation.entity.variationSpec).toBe('2026-01-01-01' as ConfectionRecipeVariationSpec);
          expect(entry.updated).toBeUndefined();
          expect(entry.notes).toBeUndefined();
        }
      );
    });

    test('entity accessor returns original entity', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;

      expect(ConfectionEditJournalEntry.create(sessionContext, id, confectionEditEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.entity).toBe(confectionEditEntity);
          expect(entry.entity.type).toBe('confection-edit');
          expect(entry.entity.baseId).toBe('2026-01-15-150000-b2c3d4e5' as BaseJournalId);
        }
      );
    });
  });

  // ============================================================================
  // FillingProductionJournalEntry Tests
  // ============================================================================

  describe('FillingProductionJournalEntry', () => {
    test('create succeeds and resolves recipe and variation', () => {
      const id = 'journals.2026-01-16-100000-c3d4e5f6' as JournalId;

      expect(
        FillingProductionJournalEntry.create(sessionContext, id, fillingProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.id).toBe(id);
        expect(entry.baseId).toBe('2026-01-16-100000-c3d4e5f6' as BaseJournalId);
        expect(entry.timestamp).toBe('2026-01-16T10:00:00Z');
        expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01' as FillingRecipeVariationId);
        expect(entry.recipe).toBeDefined();
        expect(entry.variation).toBeDefined();
      });
    });

    test('create fails for unknown filling ID', () => {
      const id = 'journals.2026-01-16-100000-c3d4e5f6' as JournalId;
      const invalidEntity: IFillingProductionJournalEntryEntity = {
        ...fillingProductionEntity,
        variationId: 'test.unknown-filling@2026-01-01-01' as FillingRecipeVariationId
      };

      expect(FillingProductionJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(
        /journal.*unknown-filling/i
      );
    });

    test('property accessors include production-specific fields', () => {
      const id = 'journals.2026-01-16-100000-c3d4e5f6' as JournalId;

      expect(
        FillingProductionJournalEntry.create(sessionContext, id, fillingProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.id).toBe(id);
        expect(entry.baseId).toBe('2026-01-16-100000-c3d4e5f6' as BaseJournalId);
        expect(entry.timestamp).toBe('2026-01-16T10:00:00Z');
        expect(entry.recipe.name).toBe('Test Ganache' as FillingName);
        expect(entry.variation.entity.baseWeight).toBe(300 as Measurement);
        expect(entry.updated).toBeUndefined();
        expect(entry.notes).toBeUndefined();
      });
    });

    test('entity has yield and produced fields', () => {
      const id = 'journals.2026-01-16-100000-c3d4e5f6' as JournalId;

      expect(
        FillingProductionJournalEntry.create(sessionContext, id, fillingProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.entity.yield).toBe(600 as Measurement);
        expect(entry.entity.produced).toBeDefined();
        expect(entry.entity.produced.scaleFactor).toBe(2.0);
        expect(entry.entity.produced.targetWeight).toBe(600 as Measurement);
      });
    });
  });

  // ============================================================================
  // ConfectionProductionJournalEntry Tests
  // ============================================================================

  describe('ConfectionProductionJournalEntry', () => {
    test('create succeeds and resolves confection and variation', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;

      expect(
        ConfectionProductionJournalEntry.create(sessionContext, id, confectionProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.id).toBe(id);
        expect(entry.baseId).toBe('2026-01-16-140000-d4e5f6a7' as BaseJournalId);
        expect(entry.timestamp).toBe('2026-01-16T14:00:00Z');
        expect(entry.variationId).toBe(
          'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId
        );
        expect(entry.recipe).toBeDefined();
        expect(entry.variation).toBeDefined();
      });
    });

    test('create fails for unknown confection ID', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;
      const invalidEntity: IConfectionProductionJournalEntryEntity = {
        ...confectionProductionEntity,
        variationId: 'test.unknown-confection@2026-01-01-01' as ConfectionRecipeVariationId
      };

      expect(ConfectionProductionJournalEntry.create(sessionContext, id, invalidEntity)).toFailWith(
        /journal.*unknown-confection/i
      );
    });

    test('property accessors return correct values', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;

      expect(
        ConfectionProductionJournalEntry.create(sessionContext, id, confectionProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.id).toBe(id);
        expect(entry.baseId).toBe('2026-01-16-140000-d4e5f6a7' as BaseJournalId);
        expect(entry.timestamp).toBe('2026-01-16T14:00:00Z');
        expect(entry.recipe.name).toBe('Test Molded BonBon' as ConfectionName);
        expect(entry.variation.entity.variationSpec).toBe('2026-01-01-01' as ConfectionRecipeVariationSpec);
        expect(entry.updated).toBeUndefined();
        expect(entry.notes).toBeUndefined();
      });
    });

    test('entity has yield and produced fields', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;

      expect(
        ConfectionProductionJournalEntry.create(sessionContext, id, confectionProductionEntity)
      ).toSucceedAndSatisfy((entry) => {
        expect(entry.entity.yield).toBeDefined();
        expect(entry.entity.yield.count).toBe(24);
        expect(entry.entity.produced).toBeDefined();
        expect(entry.entity.produced.confectionType).toBe('molded-bonbon');
        if (entry.entity.produced.confectionType === 'molded-bonbon') {
          expect(entry.entity.produced.moldId).toBe('test.mold-a' as MoldId);
        }
      });
    });
  });

  // ============================================================================
  // createJournalEntry Factory Tests
  // ============================================================================

  describe('createJournalEntry factory', () => {
    test('dispatches filling-edit correctly', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;

      expect(createJournalEntry(sessionContext, id, fillingEditEntity)).toSucceedAndSatisfy((entry) => {
        expect(entry).toBeInstanceOf(FillingEditJournalEntry);
        expect(entry.id).toBe(id);
        expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01' as FillingRecipeVariationId);
      });
    });

    test('dispatches confection-edit correctly', () => {
      const id = 'journals.2026-01-15-150000-b2c3d4e5' as JournalId;

      expect(createJournalEntry(sessionContext, id, confectionEditEntity)).toSucceedAndSatisfy((entry) => {
        expect(entry).toBeInstanceOf(ConfectionEditJournalEntry);
        expect(entry.id).toBe(id);
        expect(entry.variationId).toBe(
          'test.test-molded-bonbon@2026-01-01-01' as ConfectionRecipeVariationId
        );
      });
    });

    test('dispatches filling-production correctly', () => {
      const id = 'journals.2026-01-16-100000-c3d4e5f6' as JournalId;

      expect(createJournalEntry(sessionContext, id, fillingProductionEntity)).toSucceedAndSatisfy((entry) => {
        expect(entry).toBeInstanceOf(FillingProductionJournalEntry);
        expect(entry.id).toBe(id);
        expect(entry.entity.type).toBe('filling-production');
      });
    });

    test('dispatches confection-production correctly', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;

      expect(createJournalEntry(sessionContext, id, confectionProductionEntity)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry).toBeInstanceOf(ConfectionProductionJournalEntry);
          expect(entry.id).toBe(id);
          expect(entry.entity.type).toBe('confection-production');
        }
      );
    });

    test('fails for unknown type', () => {
      const id = 'journals.2026-01-16-140000-d4e5f6a7' as JournalId;
      const unknownEntity = {
        type: 'unknown-type',
        baseId: '2026-01-16-140000-d4e5f6a7' as BaseJournalId,
        timestamp: '2026-01-16T14:00:00Z'
      } as unknown as AnyJournalEntryEntity;

      expect(createJournalEntry(sessionContext, id, unknownEntity)).toFailWith(/unknown journal entry type/i);
    });
  });

  // ============================================================================
  // Notes and UpdatedId Tests
  // ============================================================================

  describe('notes and updatedId', () => {
    test('notes are accessible when present', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;
      const entityWithNotes: IFillingEditJournalEntryEntity = {
        ...fillingEditEntity,
        notes: [
          { category: 'general' as NoteCategory, note: 'First test note' },
          { category: 'production' as NoteCategory, note: 'Production comment' }
        ]
      };

      expect(FillingEditJournalEntry.create(sessionContext, id, entityWithNotes)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.notes).toBeDefined();
          expect(entry.notes).toHaveLength(2);
          expect(entry.notes?.[0].category).toBe('general' as NoteCategory);
          expect(entry.notes?.[0].note).toBe('First test note');
          expect(entry.notes?.[1].category).toBe('production' as NoteCategory);
        }
      );
    });

    test('updatedId is accessible when present', () => {
      const id = 'journals.2026-01-15-143025-a1b2c3d4' as JournalId;
      const entityWithUpdatedId: IFillingEditJournalEntryEntity = {
        ...fillingEditEntity,
        updatedId: 'test.test-ganache@2026-01-02-01' as FillingRecipeVariationId
      };

      expect(FillingEditJournalEntry.create(sessionContext, id, entityWithUpdatedId)).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.updatedId).toBe('test.test-ganache@2026-01-02-01' as FillingRecipeVariationId);
        }
      );
    });
  });
});
