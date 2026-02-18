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

import { Collections, DetailedResult, Result, fail, succeed } from '@fgv/ts-utils';

import {
  BaseDecorationId,
  DecorationId,
  IngredientId,
  Measurement,
  Model as CommonModel,
  NoteCategory,
  ProcedureId,
  RatingScore
} from '../../../../packlets/common';
import { Decorations, Fillings, IDecorationEntity, IProcedureEntity } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AnyIngredient } from '../../../../packlets/library-runtime/ingredients/ingredient';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { MaterializedLibrary } from '../../../../packlets/library-runtime/materializedLibrary';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { Procedure } from '../../../../packlets/library-runtime/procedures/procedure';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { Decoration } from '../../../../packlets/library-runtime/decorations/decoration';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IDecorationContext } from '../../../../packlets/library-runtime/decorations/model';

// ============================================================================
// Mock Data
// ============================================================================

const mockIngredient: AnyIngredient = {
  id: 'test.gold-leaf' as IngredientId,
  name: 'Gold Leaf'
} as AnyIngredient;

const mockIngredient2: AnyIngredient = {
  id: 'test.silver-leaf' as IngredientId,
  name: 'Silver Leaf'
} as AnyIngredient;

const mockProcedure: Procedure = {
  id: 'test.procedure-a' as ProcedureId,
  name: 'Gold Leaf Application'
} as Procedure;

const mockProcedure2: Procedure = {
  id: 'test.procedure-b' as ProcedureId,
  name: 'Silver Leaf Application'
} as Procedure;

// ============================================================================
// Mock Context
// ============================================================================

function createMockContext(
  ingredientMap: Map<IngredientId, Result<AnyIngredient>> = new Map(),
  procedureMap: Map<ProcedureId, Result<Procedure>> = new Map()
): IDecorationContext {
  const proceduresLibrary = {
    get(id: ProcedureId): DetailedResult<Procedure, Collections.ResultMapResultDetail> {
      const result = procedureMap.get(id) ?? fail(`Procedure '${id}' not found`);
      // Add asResult getter to make this work like a DetailedResult
      Object.defineProperty(result, 'asResult', {
        get() {
          return result;
        }
      });
      return result as DetailedResult<Procedure, Collections.ResultMapResultDetail>;
    }
  } as MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never>;

  return {
    _getIngredient(id: IngredientId): Result<AnyIngredient> {
      return ingredientMap.get(id) ?? fail(`Ingredient '${id}' not found`);
    },
    procedures: proceduresLibrary
  };
}

// ============================================================================
// Test Data Factories
// ============================================================================

function createMinimalDecorationEntity(
  baseId: BaseDecorationId = 'test-decoration' as BaseDecorationId,
  name: string = 'Test Decoration'
): IDecorationEntity {
  return {
    baseId,
    name,
    ingredients: []
  };
}

function createDecorationEntityWithIngredients(): IDecorationEntity {
  return {
    baseId: 'gold-decoration' as BaseDecorationId,
    name: 'Gold Decoration',
    ingredients: [
      {
        ingredient: {
          ids: ['test.gold-leaf' as IngredientId],
          preferredId: 'test.gold-leaf' as IngredientId
        },
        amount: 5 as Measurement
      }
    ]
  };
}

function createDecorationEntityWithAlternates(): IDecorationEntity {
  return {
    baseId: 'metallic-decoration' as BaseDecorationId,
    name: 'Metallic Decoration',
    ingredients: [
      {
        ingredient: {
          ids: ['test.gold-leaf' as IngredientId, 'test.silver-leaf' as IngredientId],
          preferredId: 'test.gold-leaf' as IngredientId
        },
        amount: 5 as Measurement
      }
    ]
  };
}

function createDecorationEntityWithProcedures(): IDecorationEntity {
  return {
    baseId: 'procedural-decoration' as BaseDecorationId,
    name: 'Procedural Decoration',
    ingredients: [],
    procedures: {
      options: [{ id: 'test.procedure-a' as ProcedureId }, { id: 'test.procedure-b' as ProcedureId }],
      preferredId: 'test.procedure-a' as ProcedureId
    }
  };
}

function createDecorationEntityWithAllFields(): IDecorationEntity {
  return {
    baseId: 'complete-decoration' as BaseDecorationId,
    name: 'Complete Decoration',
    description: 'A fully featured decoration',
    ingredients: [
      {
        ingredient: {
          ids: ['test.gold-leaf' as IngredientId],
          preferredId: 'test.gold-leaf' as IngredientId
        },
        amount: 5 as Measurement,
        notes: [{ category: 'usage' as NoteCategory, note: 'Apply carefully' }]
      }
    ],
    procedures: {
      options: [
        {
          id: 'test.procedure-a' as ProcedureId,
          notes: [{ category: 'general' as NoteCategory, note: 'Preferred method' }]
        }
      ],
      preferredId: 'test.procedure-a' as ProcedureId
    },
    ratings: [
      {
        category: 'difficulty' as Fillings.RatingCategory,
        score: 4 as RatingScore
      }
    ],
    tags: ['metallic', 'luxury'],
    notes: [{ category: 'general' as NoteCategory, note: 'Very elegant' }]
  };
}

// ============================================================================
// Decoration Tests
// ============================================================================

describe('Decoration', () => {
  describe('factory method', () => {
    test('create() succeeds with minimal entity', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      expect(Decoration.create(context, id, entity)).toSucceedAndSatisfy((decoration) => {
        expect(decoration.id).toBe(id);
        expect(decoration.baseId).toBe(entity.baseId);
        expect(decoration.name).toBe(entity.name);
      });
    });

    test('create() succeeds with complete entity', () => {
      const entity = createDecorationEntityWithAllFields();
      const ingredientMap = new Map([[mockIngredient.id, succeed(mockIngredient)]]);
      const procedureMap = new Map([[mockProcedure.id, succeed(mockProcedure)]]);
      const context = createMockContext(ingredientMap, procedureMap);
      const id = 'test.complete-decoration' as DecorationId;

      expect(Decoration.create(context, id, entity)).toSucceedAndSatisfy((decoration) => {
        expect(decoration.id).toBe(id);
        expect(decoration.name).toBe(entity.name);
        expect(decoration.description).toBe(entity.description);
      });
    });
  });

  describe('identity properties', () => {
    test('id returns composite decoration ID', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.my-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.id).toBe(id);
    });

    test('baseId returns base decoration ID from entity', () => {
      const baseId = 'custom-decoration' as BaseDecorationId;
      const entity = createMinimalDecorationEntity(baseId);
      const context = createMockContext();
      const id = 'test.custom-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.baseId).toBe(baseId);
    });
  });

  describe('core properties', () => {
    test('name returns decoration name', () => {
      const entity = createMinimalDecorationEntity('test-dec' as BaseDecorationId, 'Beautiful Decoration');
      const context = createMockContext();
      const id = 'test.test-dec' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.name).toBe('Beautiful Decoration');
    });

    test('description returns value when present', () => {
      const entity: IDecorationEntity = {
        ...createMinimalDecorationEntity(),
        description: 'A stunning decoration'
      };
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.description).toBe('A stunning decoration');
    });

    test('description returns undefined when absent', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.description).toBeUndefined();
    });
  });

  describe('ingredients property', () => {
    test('ingredients resolves single ingredient', () => {
      const entity = createDecorationEntityWithIngredients();
      const ingredientMap = new Map([[mockIngredient.id, succeed(mockIngredient)]]);
      const context = createMockContext(ingredientMap);
      const id = 'test.gold-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toHaveLength(1);
      expect(decoration.ingredients[0].ingredient).toBe(mockIngredient);
      expect(decoration.ingredients[0].amount).toBe(5 as Measurement);
      expect(decoration.ingredients[0].alternates).toEqual([]);
    });

    test('ingredients resolves with alternates', () => {
      const entity = createDecorationEntityWithAlternates();
      const ingredientMap = new Map([
        [mockIngredient.id, succeed(mockIngredient)],
        [mockIngredient2.id, succeed(mockIngredient2)]
      ]);
      const context = createMockContext(ingredientMap);
      const id = 'test.metallic-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toHaveLength(1);
      expect(decoration.ingredients[0].ingredient).toBe(mockIngredient);
      expect(decoration.ingredients[0].alternates).toHaveLength(1);
      expect(decoration.ingredients[0].alternates[0]).toBe(mockIngredient2);
    });

    test('ingredients silently skips missing alternates', () => {
      const entity = createDecorationEntityWithAlternates();
      const ingredientMap = new Map([[mockIngredient.id, succeed(mockIngredient)]]);
      const context = createMockContext(ingredientMap);
      const id = 'test.metallic-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toHaveLength(1);
      expect(decoration.ingredients[0].ingredient).toBe(mockIngredient);
      expect(decoration.ingredients[0].alternates).toEqual([]);
    });

    test('ingredients returns empty array when resolution fails', () => {
      const entity = createDecorationEntityWithIngredients();
      const context = createMockContext();
      const id = 'test.gold-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toEqual([]);
    });

    test('ingredients caches resolved result', () => {
      const entity = createDecorationEntityWithIngredients();
      let callCount = 0;
      const ingredientMap = new Map([
        [
          mockIngredient.id,
          succeed({
            ...mockIngredient,
            get name() {
              callCount++;
              return 'Gold Leaf';
            }
          } as AnyIngredient)
        ]
      ]);
      const context = createMockContext(ingredientMap);
      const id = 'test.gold-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      const first = decoration.ingredients;
      const second = decoration.ingredients;

      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });

    test('ingredients preserves ingredientIds from entity', () => {
      const entity = createDecorationEntityWithAlternates();
      const ingredientMap = new Map([
        [mockIngredient.id, succeed(mockIngredient)],
        [mockIngredient2.id, succeed(mockIngredient2)]
      ]);
      const context = createMockContext(ingredientMap);
      const id = 'test.metallic-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients[0].ingredientIds).toEqual(entity.ingredients[0].ingredient);
    });

    test('ingredients preserves notes from entity', () => {
      const entity: IDecorationEntity = {
        baseId: 'noted-decoration' as BaseDecorationId,
        name: 'Noted Decoration',
        ingredients: [
          {
            ingredient: {
              ids: ['test.gold-leaf' as IngredientId],
              preferredId: 'test.gold-leaf' as IngredientId
            },
            amount: 5 as Measurement,
            notes: [{ category: 'usage' as NoteCategory, note: 'Handle with care' }]
          }
        ]
      };
      const ingredientMap = new Map([[mockIngredient.id, succeed(mockIngredient)]]);
      const context = createMockContext(ingredientMap);
      const id = 'test.noted-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients[0].notes).toEqual(entity.ingredients[0].notes);
    });

    test('ingredients uses first ID when preferredId not specified', () => {
      const entity: IDecorationEntity = {
        baseId: 'no-preferred' as BaseDecorationId,
        name: 'No Preferred',
        ingredients: [
          {
            ingredient: {
              ids: ['test.gold-leaf' as IngredientId, 'test.silver-leaf' as IngredientId]
            },
            amount: 5 as Measurement
          }
        ]
      };
      const ingredientMap = new Map([
        [mockIngredient.id, succeed(mockIngredient)],
        [mockIngredient2.id, succeed(mockIngredient2)]
      ]);
      const context = createMockContext(ingredientMap);
      const id = 'test.no-preferred' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients[0].ingredient).toBe(mockIngredient);
      expect(decoration.ingredients[0].alternates).toHaveLength(1);
      expect(decoration.ingredients[0].alternates[0]).toBe(mockIngredient2);
    });
  });

  describe('procedures property', () => {
    test('procedures resolves when present', () => {
      const entity = createDecorationEntityWithProcedures();
      const procedureMap = new Map([
        [mockProcedure.id, succeed(mockProcedure)],
        [mockProcedure2.id, succeed(mockProcedure2)]
      ]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.procedural-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.procedures).toBeDefined();
      expect(decoration.procedures?.options).toHaveLength(2);
      expect(decoration.procedures?.options[0].procedure).toBe(mockProcedure);
      expect(decoration.procedures?.options[1].procedure).toBe(mockProcedure2);
      expect(decoration.procedures?.preferredId).toBe('test.procedure-a' as ProcedureId);
    });

    test('procedures returns undefined when not in entity', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.procedures).toBeUndefined();
    });

    test('procedures caches resolved result', () => {
      const entity = createDecorationEntityWithProcedures();
      const procedureMap = new Map([
        [mockProcedure.id, succeed(mockProcedure)],
        [mockProcedure2.id, succeed(mockProcedure2)]
      ]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.procedural-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      const first = decoration.procedures;
      const second = decoration.procedures;

      expect(first).toBe(second);
    });

    test('procedures includes procedure reference notes', () => {
      const entity: IDecorationEntity = {
        baseId: 'noted-procedures' as BaseDecorationId,
        name: 'Noted Procedures',
        ingredients: [],
        procedures: {
          options: [
            {
              id: 'test.procedure-a' as ProcedureId,
              notes: [{ category: 'general' as NoteCategory, note: 'Best approach' }]
            }
          ],
          preferredId: 'test.procedure-a' as ProcedureId
        }
      };
      const procedureMap = new Map([[mockProcedure.id, succeed(mockProcedure)]]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.noted-procedures' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.procedures?.options[0].notes).toEqual(entity.procedures?.options[0].notes);
    });

    test('procedures includes entity reference', () => {
      const entity = createDecorationEntityWithProcedures();
      const procedureMap = new Map([
        [mockProcedure.id, succeed(mockProcedure)],
        [mockProcedure2.id, succeed(mockProcedure2)]
      ]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.procedural-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.procedures?.options[0].entity).toBe(entity.procedures?.options[0]);
    });
  });

  describe('preferredProcedure property', () => {
    test('preferredProcedure returns preferred when specified', () => {
      const entity = createDecorationEntityWithProcedures();
      const procedureMap = new Map([
        [mockProcedure.id, succeed(mockProcedure)],
        [mockProcedure2.id, succeed(mockProcedure2)]
      ]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.procedural-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.preferredProcedure).toBeDefined();
      expect(decoration.preferredProcedure?.procedure).toBe(mockProcedure);
      expect(decoration.preferredProcedure?.id).toBe('test.procedure-a' as ProcedureId);
    });

    test('preferredProcedure returns first when no preferred specified', () => {
      const entity: IDecorationEntity = {
        baseId: 'no-preferred-proc' as BaseDecorationId,
        name: 'No Preferred Procedure',
        ingredients: [],
        procedures: {
          options: [{ id: 'test.procedure-a' as ProcedureId }, { id: 'test.procedure-b' as ProcedureId }]
        }
      };
      const procedureMap = new Map([
        [mockProcedure.id, succeed(mockProcedure)],
        [mockProcedure2.id, succeed(mockProcedure2)]
      ]);
      const context = createMockContext(new Map(), procedureMap);
      const id = 'test.no-preferred-proc' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.preferredProcedure).toBeDefined();
      expect(decoration.preferredProcedure?.procedure).toBe(mockProcedure);
    });

    test('preferredProcedure returns undefined when no procedures', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.preferredProcedure).toBeUndefined();
    });
  });

  describe('ratings property', () => {
    test('ratings returns value when present', () => {
      const ratings: Decorations.IDecorationRating[] = [
        { category: 'difficulty' as Fillings.RatingCategory, score: 3 as RatingScore },
        { category: 'appearance' as Fillings.RatingCategory, score: 5 as RatingScore }
      ];
      const entity: IDecorationEntity = {
        ...createMinimalDecorationEntity(),
        ratings
      };
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ratings).toEqual(ratings);
    });

    test('ratings returns undefined when absent', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ratings).toBeUndefined();
    });
  });

  describe('tags property', () => {
    test('tags returns value when present', () => {
      const tags = ['metallic', 'luxury', 'gold'];
      const entity: IDecorationEntity = {
        ...createMinimalDecorationEntity(),
        tags
      };
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.tags).toEqual(tags);
    });

    test('tags returns undefined when absent', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.tags).toBeUndefined();
    });
  });

  describe('notes property', () => {
    test('notes returns value when present', () => {
      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'Very elegant' },
        { category: 'usage' as NoteCategory, note: 'Apply sparingly' }
      ];
      const entity: IDecorationEntity = {
        ...createMinimalDecorationEntity(),
        notes
      };
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.notes).toEqual(notes);
    });

    test('notes returns undefined when absent', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.notes).toBeUndefined();
    });
  });

  describe('entity property', () => {
    test('entity returns original entity', () => {
      const entity = createDecorationEntityWithAllFields();
      const ingredientMap = new Map([[mockIngredient.id, succeed(mockIngredient)]]);
      const procedureMap = new Map([[mockProcedure.id, succeed(mockProcedure)]]);
      const context = createMockContext(ingredientMap, procedureMap);
      const id = 'test.complete-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.entity).toBe(entity);
    });
  });

  describe('empty ingredients array', () => {
    test('ingredients returns empty array when entity has no ingredients', () => {
      const entity = createMinimalDecorationEntity();
      const context = createMockContext();
      const id = 'test.test-decoration' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toEqual([]);
    });
  });

  describe('multiple ingredients resolution', () => {
    test('ingredients resolves multiple ingredients correctly', () => {
      const entity: IDecorationEntity = {
        baseId: 'multi-ingredient' as BaseDecorationId,
        name: 'Multi Ingredient Decoration',
        ingredients: [
          {
            ingredient: {
              ids: ['test.gold-leaf' as IngredientId],
              preferredId: 'test.gold-leaf' as IngredientId
            },
            amount: 5 as Measurement
          },
          {
            ingredient: {
              ids: ['test.silver-leaf' as IngredientId],
              preferredId: 'test.silver-leaf' as IngredientId
            },
            amount: 3 as Measurement
          }
        ]
      };
      const ingredientMap = new Map([
        [mockIngredient.id, succeed(mockIngredient)],
        [mockIngredient2.id, succeed(mockIngredient2)]
      ]);
      const context = createMockContext(ingredientMap);
      const id = 'test.multi-ingredient' as DecorationId;

      const decoration = Decoration.create(context, id, entity).orThrow();

      expect(decoration.ingredients).toHaveLength(2);
      expect(decoration.ingredients[0].ingredient).toBe(mockIngredient);
      expect(decoration.ingredients[0].amount).toBe(5 as Measurement);
      expect(decoration.ingredients[1].ingredient).toBe(mockIngredient2);
      expect(decoration.ingredients[1].amount).toBe(3 as Measurement);
    });
  });
});
