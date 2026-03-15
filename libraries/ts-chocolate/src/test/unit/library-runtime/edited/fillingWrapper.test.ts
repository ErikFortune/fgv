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

/* eslint-disable max-lines -- comprehensive test file covering all editing methods requires more than 2000 lines */

import '@fgv/ts-utils-jest';

import {
  BaseFillingId,
  FillingName,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  NoteCategory,
  ProcedureId,
  RatingScore,
  UrlCategory
} from '../../../../packlets/common';
import { Fillings, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedFillingRecipe } from '../../../../packlets/library-runtime/edited/fillingWrapper';

type FillingCategory = Fillings.FillingCategory;

// ============================================================================
// Test Data Helpers
// ============================================================================

function makeEntity(overrides?: Partial<Fillings.IFillingRecipeEntity>): Fillings.IFillingRecipeEntity {
  const defaultVariation: Fillings.IFillingRecipeVariationEntity = {
    variationSpec: 'v1' as FillingRecipeVariationSpec,
    createdDate: '2026-01-01',
    ingredients: [],
    baseWeight: 0 as Measurement
  };

  return {
    baseId: 'test-filling' as unknown as BaseFillingId,
    name: 'Test Filling' as FillingName,
    category: 'ganache' as FillingCategory,
    variations: [defaultVariation],
    goldenVariationSpec: 'v1' as FillingRecipeVariationSpec,
    ...overrides
  };
}

const basicIngredient: Fillings.IFillingIngredientEntity = {
  ingredient: {
    ids: ['dark-chocolate' as unknown as IngredientId],
    preferredId: 'dark-chocolate' as unknown as IngredientId
  },
  amount: 100 as Measurement
};

const ingredientWithNotes: Fillings.IFillingIngredientEntity = {
  ingredient: {
    ids: ['cream' as unknown as IngredientId]
  },
  amount: 50 as Measurement,
  notes: [{ category: 'usage' as NoteCategory, note: 'Heat to 80C' }]
};

const ingredientWithModifiers: Fillings.IFillingIngredientEntity = {
  ingredient: {
    ids: ['salt' as unknown as IngredientId]
  },
  amount: 1 as Measurement,
  modifiers: {
    spoonLevel: 'level',
    toTaste: true
  }
};

const basicProcedure: Fillings.IProcedureRefEntity = {
  id: 'proc-1' as unknown as ProcedureId
};

const procedureWithNotes: Fillings.IProcedureRefEntity = {
  id: 'proc-2' as unknown as ProcedureId,
  notes: [{ category: 'timing' as NoteCategory, note: 'Do this first' }]
};

const basicRating: Fillings.IFillingRating = {
  category: 'taste',
  score: 4 as RatingScore
};

const ratingWithNotes: Fillings.IFillingRating = {
  category: 'texture',
  score: 5 as RatingScore,
  notes: [{ category: 'general' as NoteCategory, note: 'Very smooth' }]
};

function makeVariation(
  spec: string,
  overrides?: Partial<Fillings.IFillingRecipeVariationEntity>
): Fillings.IFillingRecipeVariationEntity {
  return {
    variationSpec: spec as FillingRecipeVariationSpec,
    createdDate: '2026-01-01',
    ingredients: [],
    baseWeight: 0 as Measurement,
    ...overrides
  };
}

// ============================================================================
// EditedFillingRecipe Tests
// ============================================================================

describe('EditedFillingRecipe', () => {
  describe('factory methods', () => {
    test('create() succeeds with minimal entity', () => {
      const entity = makeEntity();
      expect(EditedFillingRecipe.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Filling' as FillingName);
        expect(wrapper.current.baseId).toBe(entity.baseId);
        expect(wrapper.current.variations).toHaveLength(1);
        expect(wrapper.goldenVariationSpec).toBe('v1' as FillingRecipeVariationSpec);
      });
    });

    test('create() deep copies variation notes', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            notes: [{ category: 'general' as NoteCategory, note: 'Test note' }]
          })
        ]
      });

      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.variations[0].notes).toHaveLength(1);
      expect(wrapper.variations[0].notes?.[0].note).toBe('Test note');
    });

    test('create() deep copies ingredient modifiers', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [ingredientWithModifiers]
          })
        ]
      });

      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.variations[0].ingredients[0].modifiers).toBeDefined();
      expect(wrapper.variations[0].ingredients[0].modifiers?.spoonLevel).toBe('level');
      expect(wrapper.variations[0].ingredients[0].modifiers?.toTaste).toBe(true);
    });

    test('create() deep copies derivedFrom with notes', () => {
      const entity = makeEntity({
        derivedFrom: {
          sourceVariationId: 'source.filling@v1' as FillingRecipeVariationId,
          derivedDate: '2026-01-01',
          notes: [{ category: 'general' as NoteCategory, note: 'Derived from original' }]
        }
      });

      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.current.derivedFrom).toBeDefined();
      expect(wrapper.current.derivedFrom?.notes).toHaveLength(1);
      expect(wrapper.current.derivedFrom?.notes?.[0].note).toBe('Derived from original');
    });

    test('create() deep copies derivedFrom without notes', () => {
      const entity = makeEntity({
        derivedFrom: {
          sourceVariationId: 'source.filling@v1' as FillingRecipeVariationId,
          derivedDate: '2026-01-01'
        }
      });

      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.current.derivedFrom).toBeDefined();
      expect(wrapper.current.derivedFrom?.notes).toBeUndefined();
    });

    test('create() succeeds with full entity', () => {
      const variation1 = makeVariation('v1', {
        ingredients: [basicIngredient, ingredientWithNotes],
        ratings: [basicRating, ratingWithNotes],
        procedures: {
          options: [basicProcedure, procedureWithNotes],
          preferredId: 'proc-1' as unknown as ProcedureId
        }
      });

      const variation2 = makeVariation('v2', {
        ingredients: [basicIngredient]
      });

      const entity = makeEntity({
        description: 'A delicious filling',
        tags: ['smooth', 'dark'],
        variations: [variation1, variation2],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec,
        urls: [{ category: 'tutorial' as UrlCategory, url: 'https://example.com/tutorial' }]
      });

      expect(EditedFillingRecipe.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Filling' as FillingName);
        expect(wrapper.current.description).toBe('A delicious filling');
        expect(wrapper.current.variations).toHaveLength(2);
        expect(wrapper.current.tags).toHaveLength(2);
        expect(wrapper.current.urls).toHaveLength(1);
      });
    });

    test('create() deep copies the initial entity', () => {
      const mutableVariations: Fillings.IFillingRecipeVariationEntity[] = [makeVariation('v1')];
      const entity = makeEntity({ variations: mutableVariations });

      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      mutableVariations.push(makeVariation('v2'));

      expect(wrapper.current.variations).toHaveLength(1);
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const entity = makeEntity();
      const history: Session.ISerializedEditingHistoryEntity<Fillings.IFillingRecipeEntity> = {
        current: entity,
        original: entity,
        undoStack: [makeEntity({ name: 'Previous Name' as FillingName })],
        redoStack: [makeEntity({ name: 'Future Name' as FillingName })]
      };

      expect(EditedFillingRecipe.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
        expect(wrapper.name).toBe('Test Filling' as FillingName);
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const entity = makeEntity({
        tags: ['test']
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(entity);

      wrapper.setName('Modified Name' as FillingName).orThrow();
      expect(snapshot.name).toBe('Test Filling' as FillingName);
      expect(wrapper.name).toBe('Modified Name' as FillingName);
    });

    test('snapshot getter returns deep copy', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      const snap = wrapper.snapshot;

      expect(snap).toEqual(entity);
      expect(snap).not.toBe(wrapper.current);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setName('Change 1' as FillingName).orThrow();
      wrapper.setName('Change 2' as FillingName).orThrow();

      const snapshot = wrapper.createSnapshot();

      wrapper.setName('Change 3' as FillingName).orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 4' as FillingName).orThrow();

      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.name).toBe('Change 2' as FillingName);
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });

    test('getSerializedHistory() captures complete state', () => {
      const original = makeEntity({ name: 'Original' as FillingName });
      const wrapper = EditedFillingRecipe.create(original).orThrow();

      wrapper.setName('Modified' as FillingName).orThrow();
      wrapper.setName('Modified Again' as FillingName).orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(original);

      expect(history.original.name).toBe('Original' as FillingName);
      expect(history.current.name).toBe('Modified' as FillingName);
      expect(history.undoStack.length).toBeGreaterThan(0);
      expect(history.redoStack.length).toBeGreaterThan(0);
    });

    test('getSerializedHistory() creates deep copies', () => {
      const original = makeEntity();
      const wrapper = EditedFillingRecipe.create(original).orThrow();
      wrapper.setName('Changed' as FillingName).orThrow();

      const history = wrapper.getSerializedHistory(original);

      wrapper.setName('Changed Again' as FillingName).orThrow();

      expect(history.current.name).toBe('Changed' as FillingName);
      expect(wrapper.name).toBe('Changed Again' as FillingName);
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('redo() returns false when no future', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('undo() restores previous state', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setName('Change 1' as FillingName).orThrow();
      wrapper.setName('Change 2' as FillingName).orThrow();

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 1' as FillingName);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Test Filling' as FillingName);
    });

    test('redo() restores future state', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setName('Change 1' as FillingName).orThrow();
      wrapper.setName('Change 2' as FillingName).orThrow();
      wrapper.undo().orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 1' as FillingName);

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 2' as FillingName);
    });

    test('canUndo() reflects undo availability', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setName('Change' as FillingName).orThrow();
      expect(wrapper.canUndo()).toBe(true);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });

    test('canRedo() reflects redo availability', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canRedo()).toBe(false);

      wrapper.setName('Change' as FillingName).orThrow();
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.redo().orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('new mutation clears redo stack', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setName('Change 1' as FillingName).orThrow();
      wrapper.setName('Change 2' as FillingName).orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('New Change' as FillingName).orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('max history size is enforced', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      for (let i = 0; i < 52; i++) {
        wrapper.setName(`Change ${i}` as FillingName).orThrow();
      }

      let undoCount = 0;
      while (wrapper.canUndo()) {
        wrapper.undo().orThrow();
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('identity accessors', () => {
    test('current returns current entity', () => {
      const entity = makeEntity({ description: 'Test description' });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.current.name).toBe('Test Filling' as FillingName);
      expect(wrapper.current.description).toBe('Test description');
      expect(wrapper.current.baseId).toBe(entity.baseId);
    });

    test('snapshot returns immutable copy', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const snap1 = wrapper.snapshot;
      const snap2 = wrapper.snapshot;

      expect(snap1).toEqual(snap2);
      expect(snap1).not.toBe(snap2);
    });

    test('name getter returns current name', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.name).toBe('Test Filling' as FillingName);

      wrapper.setName('New Name' as FillingName).orThrow();
      expect(wrapper.name).toBe('New Name' as FillingName);
    });

    test('goldenVariationSpec getter returns current golden spec', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.goldenVariationSpec).toBe('v1' as FillingRecipeVariationSpec);
    });

    test('variations getter returns variations array', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.variations).toHaveLength(2);
    });
  });

  describe('setName()', () => {
    test('updates name', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.setName('New Name' as FillingName)).toSucceed();
      expect(wrapper.name).toBe('New Name' as FillingName);
    });

    test('pushes undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setName('New Name' as FillingName).orThrow();
      expect(wrapper.canUndo()).toBe(true);

      wrapper.undo().orThrow();
      expect(wrapper.name).toBe('Test Filling' as FillingName);
    });

    test('clears redo stack', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.setName('Change 1' as FillingName).orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 2' as FillingName).orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('setCategory()', () => {
    test('updates category', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.setCategory('caramel')).toSucceed();
      expect(wrapper.current.category).toBe('caramel');
    });

    test('pushes undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.setCategory('caramel').orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.category).toBe('ganache');
    });

    test('clears redo stack', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.setCategory('caramel').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setCategory('gianduja').orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('setDescription()', () => {
    test('sets description', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.setDescription('A new description')).toSucceed();
      expect(wrapper.current.description).toBe('A new description');
    });

    test('clears description with undefined', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity({ description: 'Old' })).orThrow();
      expect(wrapper.setDescription(undefined)).toSucceed();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('pushes undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.setDescription('New Description').orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.description).toBeUndefined();
    });
  });

  describe('setTags()', () => {
    test('sets tags array', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const tags = ['smooth', 'dark'];

      expect(wrapper.setTags(tags)).toSucceed();
      expect(wrapper.current.tags).toEqual(tags);
    });

    test('clears tags with undefined', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity({ tags: ['test'] })).orThrow();
      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('deep copies tags array', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const mutableTags = ['smooth'];

      wrapper.setTags(mutableTags).orThrow();
      mutableTags.push('dark');

      expect(wrapper.current.tags).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.setTags(['test']).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.tags).toBeUndefined();
    });
  });

  describe('setUrls()', () => {
    test('sets urls array', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const urls = [{ category: 'tutorial' as UrlCategory, url: 'https://example.com/tutorial' }];

      expect(wrapper.setUrls(urls)).toSucceed();
      expect(wrapper.current.urls).toEqual(urls);
    });

    test('clears urls with undefined', () => {
      const wrapper = EditedFillingRecipe.create(
        makeEntity({
          urls: [{ category: 'tutorial' as UrlCategory, url: 'https://example.com' }]
        })
      ).orThrow();
      expect(wrapper.setUrls(undefined)).toSucceed();
      expect(wrapper.current.urls).toBeUndefined();
    });

    test('deep copies urls array', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const mutableUrls = [{ category: 'tutorial' as UrlCategory, url: 'https://example.com/tutorial' }];

      wrapper.setUrls(mutableUrls).orThrow();
      mutableUrls.push({ category: 'video' as UrlCategory, url: 'https://example.com/video' });

      expect(wrapper.current.urls).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const urls = [{ category: 'tutorial' as UrlCategory, url: 'https://example.com/tutorial' }];
      wrapper.setUrls(urls).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.urls).toBeUndefined();
    });
  });

  describe('setGoldenVariationSpec()', () => {
    test('sets golden variation spec when variation exists', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.setGoldenVariationSpec('v2' as FillingRecipeVariationSpec)).toSucceed();
      expect(wrapper.goldenVariationSpec).toBe('v2' as FillingRecipeVariationSpec);
    });

    test('fails when variation does not exist', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.setGoldenVariationSpec('v99' as FillingRecipeVariationSpec)).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('pushes undo on success', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setGoldenVariationSpec('v2' as FillingRecipeVariationSpec).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.goldenVariationSpec).toBe('v1' as FillingRecipeVariationSpec);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setGoldenVariationSpec('v99' as FillingRecipeVariationSpec);
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('replaceVariation()', () => {
    test('replaces existing variation', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      const newVariation = makeVariation('v2', {
        ingredients: [basicIngredient],
        baseWeight: 100 as Measurement
      });

      expect(wrapper.replaceVariation('v2' as FillingRecipeVariationSpec, newVariation)).toSucceed();
      expect(wrapper.variations[1].ingredients).toHaveLength(1);
      expect(wrapper.variations[1].baseWeight).toBe(100 as Measurement);
    });

    test('fails when variation does not exist', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const newVariation = makeVariation('v99');

      expect(wrapper.replaceVariation('v99' as FillingRecipeVariationSpec, newVariation)).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('deep copies variation entity', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1')]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      const mutableIngredients = [basicIngredient];
      const newVariation = makeVariation('v1', { ingredients: mutableIngredients });

      wrapper.replaceVariation('v1' as FillingRecipeVariationSpec, newVariation).orThrow();
      mutableIngredients.push(ingredientWithNotes);

      expect(wrapper.variations[0].ingredients).toHaveLength(1);
    });

    test('pushes undo on success', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1', { baseWeight: 100 as Measurement })]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      const newVariation = makeVariation('v1', { baseWeight: 200 as Measurement });
      wrapper.replaceVariation('v1' as FillingRecipeVariationSpec, newVariation).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.variations[0].baseWeight).toBe(100 as Measurement);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.replaceVariation('v99' as FillingRecipeVariationSpec, makeVariation('v99'));
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('addVariation()', () => {
    test('adds new variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const newVariation = makeVariation('v2');

      expect(wrapper.addVariation(newVariation)).toSucceed();
      expect(wrapper.variations).toHaveLength(2);
      expect(wrapper.variations[1].variationSpec).toBe('v2' as FillingRecipeVariationSpec);
    });

    test('fails when variation already exists', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const duplicate = makeVariation('v1');

      expect(wrapper.addVariation(duplicate)).toFailWith(/variation 'v1' already exists/i);
    });

    test('deep copies variation entity', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      const mutableIngredients = [basicIngredient];
      const newVariation = makeVariation('v2', { ingredients: mutableIngredients });

      wrapper.addVariation(newVariation).orThrow();
      mutableIngredients.push(ingredientWithNotes);

      expect(wrapper.variations[1].ingredients).toHaveLength(1);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.addVariation(makeVariation('v2')).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.variations).toHaveLength(1);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.addVariation(makeVariation('v1'));
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('removeVariation()', () => {
    test('removes variation when multiple exist', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2'), makeVariation('v3')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v2' as FillingRecipeVariationSpec)).toSucceed();
      expect(wrapper.variations).toHaveLength(2);
      expect(wrapper.variations.some((v) => v.variationSpec === 'v2')).toBe(false);
    });

    test('fails when removing last variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.removeVariation('v1' as FillingRecipeVariationSpec)).toFailWith(
        /cannot remove the last variation/i
      );
    });

    test('fails when removing golden variation', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v1' as FillingRecipeVariationSpec)).toFailWith(
        /cannot remove the golden variation/i
      );
    });

    test('fails when variation does not exist', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v99' as FillingRecipeVariationSpec)).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('pushes undo on success', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.removeVariation('v2' as FillingRecipeVariationSpec).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.variations).toHaveLength(2);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.removeVariation('v1' as FillingRecipeVariationSpec);
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('setVariationIngredientAlternates()', () => {
    const primaryId = 'dark-chocolate' as unknown as IngredientId;
    const altId = 'milk-chocolate' as unknown as IngredientId;
    const altId2 = 'white-chocolate' as unknown as IngredientId;

    function makeEntityWithIngredient(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [primaryId], preferredId: primaryId },
                amount: 100 as Measurement
              }
            ]
          })
        ]
      });
    }

    test('sets alternates and preferred on existing ingredient', () => {
      const entity = makeEntityWithIngredient();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(
        wrapper.setVariationIngredientAlternates(
          'v1' as FillingRecipeVariationSpec,
          primaryId,
          [primaryId, altId],
          altId
        )
      ).toSucceed();

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.ids).toEqual([primaryId, altId]);
      expect(ing.ingredient.preferredId).toBe(altId);
    });

    test('preserves other ingredient fields (amount, unit, modifiers)', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [primaryId], preferredId: primaryId },
                amount: 150 as Measurement,
                unit: 'mL',
                modifiers: { yieldFactor: 0.8 }
              }
            ]
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper
        .setVariationIngredientAlternates(
          'v1' as FillingRecipeVariationSpec,
          primaryId,
          [primaryId, altId],
          altId
        )
        .orThrow();

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.amount).toBe(150);
      expect(ing.unit).toBe('mL');
      expect(ing.modifiers?.yieldFactor).toBe(0.8);
    });

    test('can remove all alternates (single id)', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [primaryId, altId, altId2], preferredId: altId },
                amount: 100 as Measurement
              }
            ]
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper
        .setVariationIngredientAlternates('v1' as FillingRecipeVariationSpec, altId, [primaryId], primaryId)
        .orThrow();

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.ids).toEqual([primaryId]);
      expect(ing.ingredient.preferredId).toBe(primaryId);
    });

    test('fails when variation does not exist', () => {
      const entity = makeEntityWithIngredient();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(
        wrapper.setVariationIngredientAlternates(
          'v99' as FillingRecipeVariationSpec,
          primaryId,
          [primaryId, altId],
          altId
        )
      ).toFailWith(/variation 'v99' does not exist/i);
    });

    test('fails when ingredient not found in variation', () => {
      const entity = makeEntityWithIngredient();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(
        wrapper.setVariationIngredientAlternates(
          'v1' as FillingRecipeVariationSpec,
          'unknown-ingredient' as unknown as IngredientId,
          ['unknown-ingredient' as unknown as IngredientId],
          'unknown-ingredient' as unknown as IngredientId
        )
      ).toFailWith(/ingredient 'unknown-ingredient' not found/i);
    });

    test('pushes undo on success', () => {
      const entity = makeEntityWithIngredient();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper
        .setVariationIngredientAlternates(
          'v1' as FillingRecipeVariationSpec,
          primaryId,
          [primaryId, altId],
          altId
        )
        .orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.ids).toEqual([primaryId]);
      expect(ing.ingredient.preferredId).toBe(primaryId);
    });

    test('does not push undo on failure', () => {
      const entity = makeEntityWithIngredient();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setVariationIngredientAlternates(
        'v99' as FillingRecipeVariationSpec,
        primaryId,
        [primaryId, altId],
        altId
      );
      expect(wrapper.canUndo()).toBe(false);
    });

    test('matched by any id in the ids array (not just preferred)', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [primaryId, altId], preferredId: primaryId },
                amount: 100 as Measurement
              }
            ]
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(
        wrapper.setVariationIngredientAlternates(
          'v1' as FillingRecipeVariationSpec,
          altId,
          [primaryId, altId, altId2],
          altId2
        )
      ).toSucceed();

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.ids).toContain(altId2);
      expect(ing.ingredient.preferredId).toBe(altId2);
    });
  });

  describe('setVariationProcedureAlternates()', () => {
    const proc1 = 'proc-a' as unknown as ProcedureId;
    const proc2 = 'proc-b' as unknown as ProcedureId;

    function makeEntityWithProcedure(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            procedures: { options: [{ id: proc1 }], preferredId: proc1 }
          })
        ]
      });
    }

    test('sets procedure options and preferred', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      expect(
        wrapper.setVariationProcedureAlternates(
          'v1' as FillingRecipeVariationSpec,
          [{ id: proc1 }, { id: proc2 }],
          proc2
        )
      ).toSucceed();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options.map((o) => o.id)).toEqual([proc1, proc2]);
      expect(procs?.preferredId).toBe(proc2);
    });

    test('clears procedures when options array is empty', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      expect(
        wrapper.setVariationProcedureAlternates('v1' as FillingRecipeVariationSpec, [], undefined)
      ).toSucceed();

      expect(wrapper.variations[0].procedures).toBeUndefined();
    });

    test('allows preferredId to be undefined', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      expect(
        wrapper.setVariationProcedureAlternates(
          'v1' as FillingRecipeVariationSpec,
          [{ id: proc1 }, { id: proc2 }],
          undefined
        )
      ).toSucceed();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options).toHaveLength(2);
      expect(procs?.preferredId).toBeUndefined();
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      expect(
        wrapper.setVariationProcedureAlternates('v99' as FillingRecipeVariationSpec, [{ id: proc1 }], proc1)
      ).toFailWith(/does not exist/);
    });

    test('fails when preferredId not in options', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      expect(
        wrapper.setVariationProcedureAlternates('v1' as FillingRecipeVariationSpec, [{ id: proc1 }], proc2)
      ).toFailWith(/not found in options/);
    });

    test('pushes undo and restores on undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();

      wrapper
        .setVariationProcedureAlternates(
          'v1' as FillingRecipeVariationSpec,
          [{ id: proc1 }, { id: proc2 }],
          proc2
        )
        .orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options.map((o) => o.id)).toEqual([proc1]);
      expect(procs?.preferredId).toBe(proc1);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithProcedure()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setVariationProcedureAlternates('v99' as FillingRecipeVariationSpec, [{ id: proc1 }], proc1);
      expect(wrapper.canUndo()).toBe(false);
    });

    test('preserves procedure notes on options', () => {
      const optionWithNotes: Fillings.IProcedureRefEntity = {
        id: proc1,
        notes: [{ category: 'timing' as NoteCategory, note: 'Do this first' }]
      };
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper
        .setVariationProcedureAlternates('v1' as FillingRecipeVariationSpec, [optionWithNotes], proc1)
        .orThrow();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options[0].notes).toEqual(optionWithNotes.notes);
    });
  });

  describe('createBlankVariation()', () => {
    const date = '2026-02-18';

    test('creates a blank variation with auto-generated spec', () => {
      const entity = makeEntity({ variations: [makeVariation(`${date}-01`)] });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-02` as FillingRecipeVariationSpec
      );

      expect(wrapper.variations).toHaveLength(2);
      const newVar = wrapper.variations[1];
      expect(newVar.variationSpec).toBe(`${date}-02`);
      expect(newVar.ingredients).toHaveLength(0);
      expect(newVar.createdDate).toBe(date);
      expect(newVar.name).toBeUndefined();
    });

    test('sets name on the new variation when provided', () => {
      const entity = makeEntity({ variations: [makeVariation(`${date}-01`)] });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.createBlankVariation({ date, name: 'Less Sugar' }).orThrow();

      const newVar = wrapper.variations[1];
      expect(newVar.variationSpec).toBe(`${date}-02-less-sugar`);
      expect(newVar.name).toBe('Less Sugar');
    });

    test('auto-increments index past existing specs for the same date', () => {
      const entity = makeEntity({
        variations: [makeVariation(`${date}-01`), makeVariation(`${date}-02`)]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-03` as FillingRecipeVariationSpec
      );
    });

    test('pushes undo and restores on undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.createBlankVariation({ date }).orThrow();

      expect(wrapper.variations).toHaveLength(2);
      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations).toHaveLength(1);
    });

    test('uses today as date when no options provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const spec = wrapper.createBlankVariation().orThrow();

      expect(spec).toMatch(`${today}-`);
      expect(wrapper.variations[1].createdDate).toBe(today);
    });
  });

  describe('duplicateVariation()', () => {
    const date = '2026-02-18';

    test('duplicates a variation with a new spec', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [basicIngredient],
            notes: [{ category: 'general' as NoteCategory, note: 'Test note' }]
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(wrapper.duplicateVariation('v1' as FillingRecipeVariationSpec, { date })).toSucceedWith(
        `${date}-01` as FillingRecipeVariationSpec
      );

      expect(wrapper.variations).toHaveLength(2);
      const dup = wrapper.variations[1];
      expect(dup.ingredients).toHaveLength(1);
      expect(dup.notes).toHaveLength(1);
      expect(dup.createdDate).toBe(date);
    });

    test('sets name on the duplicate when provided', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.duplicateVariation('v1' as FillingRecipeVariationSpec, { date, name: 'Tweaked' }).orThrow();

      const dup = wrapper.variations[1];
      expect(dup.variationSpec).toBe(`${date}-01-tweaked`);
      expect(dup.name).toBe('Tweaked');
    });

    test('fails when source spec does not exist', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.duplicateVariation('v99' as FillingRecipeVariationSpec, { date })).toFailWith(
        /does not exist/
      );
    });

    test('pushes undo and restores on undo', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      wrapper.duplicateVariation('v1' as FillingRecipeVariationSpec, { date }).orThrow();

      expect(wrapper.variations).toHaveLength(2);
      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations).toHaveLength(1);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.duplicateVariation('v99' as FillingRecipeVariationSpec, { date });
      expect(wrapper.canUndo()).toBe(false);
    });

    test('uses today as date when no options provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const spec = wrapper.duplicateVariation('v1' as FillingRecipeVariationSpec).orThrow();

      expect(spec).toMatch(`${today}-`);
      expect(wrapper.variations[1].createdDate).toBe(today);
    });
  });

  describe('setVariationName()', () => {
    test('sets the name on a variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.setVariationName('v1' as FillingRecipeVariationSpec, 'Golden Batch')).toSucceed();

      expect(wrapper.variations[0].name).toBe('Golden Batch');
    });

    test('clears the name when undefined is passed', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1', { name: 'Old Name' })]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationName('v1' as FillingRecipeVariationSpec, undefined).orThrow();

      expect(wrapper.variations[0].name).toBeUndefined();
    });

    test('trims whitespace from name', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setVariationName('v1' as FillingRecipeVariationSpec, '  Trimmed  ').orThrow();

      expect(wrapper.variations[0].name).toBe('Trimmed');
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.setVariationName('v99' as FillingRecipeVariationSpec, 'Name')).toFailWith(
        /does not exist/
      );
    });

    test('pushes undo and restores on undo', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1', { name: 'Original' })]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationName('v1' as FillingRecipeVariationSpec, 'Updated').orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].name).toBe('Original');
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setVariationName('v99' as FillingRecipeVariationSpec, 'Name');
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('change detection', () => {
    test('hasChanges() returns false when unchanged', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      expect(wrapper.hasChanges(entity)).toBe(false);
    });

    test('hasChanges() returns true when name changed', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setName('New Name' as FillingName).orThrow();
      expect(wrapper.hasChanges(entity)).toBe(true);
    });

    test('getChanges() detects name change', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setName('New Name' as FillingName).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.nameChanged).toBe(true);
      expect(changes.categoryChanged).toBe(false);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects category change', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setCategory('caramel').orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.categoryChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects description change', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setDescription('New Description').orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.descriptionChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects tags change', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setTags(['new-tag']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects urls change', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setUrls([{ category: 'tutorial' as UrlCategory, url: 'https://example.com' }]).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.urlsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects golden variation spec change', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setGoldenVariationSpec('v2' as FillingRecipeVariationSpec).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.goldenVariationSpecChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects variations change (add)', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.addVariation(makeVariation('v2')).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.variationsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects variations change (remove)', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1'), makeVariation('v2')],
        goldenVariationSpec: 'v1' as FillingRecipeVariationSpec
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.removeVariation('v2' as FillingRecipeVariationSpec).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.variationsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects variations change (replace)', () => {
      const entity = makeEntity({
        variations: [makeVariation('v1', { baseWeight: 100 as Measurement })]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      const newVariation = makeVariation('v1', { baseWeight: 200 as Measurement });
      wrapper.replaceVariation('v1' as FillingRecipeVariationSpec, newVariation).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.variationsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects multiple changes', () => {
      const entity = makeEntity();
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setName('New Name' as FillingName).orThrow();
      wrapper.setDescription('New Description').orThrow();
      wrapper.setCategory('caramel').orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.nameChanged).toBe(true);
      expect(changes.descriptionChanged).toBe(true);
      expect(changes.categoryChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() handles tags order difference', () => {
      const entity = makeEntity({ tags: ['a', 'b', 'c'] });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setTags(['c', 'b', 'a']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(false);
    });

    test('getChanges() detects tags length difference', () => {
      const entity = makeEntity({ tags: ['a', 'b'] });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();
      wrapper.setTags(['a', 'b', 'c']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(true);
    });
  });

  describe('setVariationIngredient()', () => {
    const chocolateId = 'dark-chocolate' as unknown as IngredientId;
    const creamId = 'cream' as unknown as IngredientId;

    function makeEntityWithIngredient(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId], preferredId: chocolateId },
                amount: 100 as Measurement
              }
            ],
            baseWeight: 100 as Measurement
          })
        ]
      });
    }

    test('adds a new ingredient to the variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.setVariationIngredient('v1' as FillingRecipeVariationSpec, creamId, 50 as Measurement)
      ).toSucceedWith(true);

      expect(wrapper.variations[0].ingredients).toHaveLength(2);
      const cream = wrapper.variations[0].ingredients.find((i) => i.ingredient.ids.includes(creamId));
      expect(cream?.amount).toBe(50);
    });

    test('updates an existing ingredient in the variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.setVariationIngredient('v1' as FillingRecipeVariationSpec, chocolateId, 200 as Measurement)
      ).toSucceedWith(true);

      expect(wrapper.variations[0].ingredients).toHaveLength(1);
      expect(wrapper.variations[0].ingredients[0].amount).toBe(200);
      expect(wrapper.variations[0].ingredients[0].ingredient.preferredId).toBe(chocolateId);
    });

    test('recalculates baseWeight after adding ingredient', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();
      wrapper
        .setVariationIngredient('v1' as FillingRecipeVariationSpec, creamId, 50 as Measurement)
        .orThrow();

      // 100 (chocolate) + 50 (cream) = 150
      expect(wrapper.variations[0].baseWeight).toBe(150);
    });

    test('sets unit and modifiers when provided', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      wrapper
        .setVariationIngredient('v1' as FillingRecipeVariationSpec, creamId, 2 as Measurement, 'tsp', {
          toTaste: true
        })
        .orThrow();

      const cream = wrapper.variations[0].ingredients.find((i) => i.ingredient.ids.includes(creamId));
      expect(cream?.unit).toBe('tsp');
      expect(cream?.modifiers?.toTaste).toBe(true);
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.setVariationIngredient('v99' as FillingRecipeVariationSpec, chocolateId, 100 as Measurement)
      ).toFailWith(/variation 'v99' does not exist/i);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      wrapper
        .setVariationIngredient('v1' as FillingRecipeVariationSpec, creamId, 50 as Measurement)
        .orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].ingredients).toHaveLength(1);
    });
  });

  describe('replaceVariationIngredient()', () => {
    const chocolateId = 'dark-chocolate' as unknown as IngredientId;
    const newChocolateId = 'milk-chocolate' as unknown as IngredientId;

    function makeEntityWithIngredient(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId], preferredId: chocolateId },
                amount: 100 as Measurement
              }
            ],
            baseWeight: 100 as Measurement
          })
        ]
      });
    }

    test('replaces with a new ingredient id and updates preferred', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.replaceVariationIngredient(
          'v1' as FillingRecipeVariationSpec,
          chocolateId,
          newChocolateId,
          90 as Measurement
        )
      ).toSucceedWith(true);

      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.ids).toContain(newChocolateId);
      expect(ing.ingredient.preferredId).toBe(newChocolateId);
      expect(ing.amount).toBe(90);
    });

    test('when newId is already in ids, only updates preferred and amount', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId, newChocolateId], preferredId: chocolateId },
                amount: 100 as Measurement
              }
            ],
            baseWeight: 100 as Measurement
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper
        .replaceVariationIngredient(
          'v1' as FillingRecipeVariationSpec,
          chocolateId,
          newChocolateId,
          80 as Measurement
        )
        .orThrow();

      const ing = wrapper.variations[0].ingredients[0];
      // ids should still be [chocolateId, newChocolateId] - not duplicated
      expect(ing.ingredient.ids).toEqual([chocolateId, newChocolateId]);
      expect(ing.ingredient.preferredId).toBe(newChocolateId);
      expect(ing.amount).toBe(80);
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.replaceVariationIngredient(
          'v99' as FillingRecipeVariationSpec,
          chocolateId,
          newChocolateId,
          100 as Measurement
        )
      ).toFailWith(/variation 'v99' does not exist/i);
    });

    test('fails when ingredient not found in variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      expect(
        wrapper.replaceVariationIngredient(
          'v1' as FillingRecipeVariationSpec,
          'unknown' as unknown as IngredientId,
          newChocolateId,
          100 as Measurement
        )
      ).toFailWith(/ingredient 'unknown' not found/i);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithIngredient()).orThrow();

      wrapper
        .replaceVariationIngredient(
          'v1' as FillingRecipeVariationSpec,
          chocolateId,
          newChocolateId,
          90 as Measurement
        )
        .orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      const ing = wrapper.variations[0].ingredients[0];
      expect(ing.ingredient.preferredId).toBe(chocolateId);
    });
  });

  describe('removeVariationIngredient()', () => {
    const chocolateId = 'dark-chocolate' as unknown as IngredientId;
    const creamId = 'cream' as unknown as IngredientId;

    function makeEntityWithTwoIngredients(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId], preferredId: chocolateId },
                amount: 100 as Measurement
              },
              {
                ingredient: { ids: [creamId] },
                amount: 50 as Measurement
              }
            ],
            baseWeight: 150 as Measurement
          })
        ]
      });
    }

    test('removes an ingredient by id', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithTwoIngredients()).orThrow();

      expect(wrapper.removeVariationIngredient('v1' as FillingRecipeVariationSpec, creamId)).toSucceedWith(
        true
      );

      expect(wrapper.variations[0].ingredients).toHaveLength(1);
      expect(wrapper.variations[0].ingredients[0].ingredient.ids).not.toContain(creamId);
    });

    test('recalculates baseWeight after removal', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithTwoIngredients()).orThrow();

      wrapper.removeVariationIngredient('v1' as FillingRecipeVariationSpec, creamId).orThrow();

      expect(wrapper.variations[0].baseWeight).toBe(100);
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithTwoIngredients()).orThrow();

      expect(wrapper.removeVariationIngredient('v99' as FillingRecipeVariationSpec, creamId)).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('fails when ingredient not found in variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithTwoIngredients()).orThrow();

      expect(
        wrapper.removeVariationIngredient(
          'v1' as FillingRecipeVariationSpec,
          'unknown' as unknown as IngredientId
        )
      ).toFailWith(/ingredient 'unknown' not found/i);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithTwoIngredients()).orThrow();

      wrapper.removeVariationIngredient('v1' as FillingRecipeVariationSpec, creamId).orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].ingredients).toHaveLength(2);
    });
  });

  describe('setVariationProcedure()', () => {
    const procedureId = 'proc-1' as unknown as ProcedureId;
    const procedure2Id = 'proc-2' as unknown as ProcedureId;

    test('sets a new procedure when none exists', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.setVariationProcedure('v1' as FillingRecipeVariationSpec, procedureId)).toSucceedWith(
        true
      );

      const procs = wrapper.variations[0].procedures;
      expect(procs).toBeDefined();
      expect(procs?.preferredId).toBe(procedureId);
      expect(procs?.options).toHaveLength(1);
    });

    test('adds to existing options and updates preferred', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            procedures: { options: [{ id: procedureId }], preferredId: procedureId }
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationProcedure('v1' as FillingRecipeVariationSpec, procedure2Id).orThrow();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options).toHaveLength(2);
      expect(procs?.preferredId).toBe(procedure2Id);
    });

    test('does not duplicate when setting same procedure again', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            procedures: { options: [{ id: procedureId }], preferredId: procedureId }
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationProcedure('v1' as FillingRecipeVariationSpec, procedureId).orThrow();

      const procs = wrapper.variations[0].procedures;
      expect(procs?.options).toHaveLength(1);
      expect(procs?.preferredId).toBe(procedureId);
    });

    test('clears procedures when undefined is passed', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            procedures: { options: [{ id: procedureId }], preferredId: procedureId }
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationProcedure('v1' as FillingRecipeVariationSpec, undefined).orThrow();

      expect(wrapper.variations[0].procedures).toBeUndefined();
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.setVariationProcedure('v99' as FillingRecipeVariationSpec, procedureId)).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      wrapper.setVariationProcedure('v1' as FillingRecipeVariationSpec, procedureId).orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].procedures).toBeUndefined();
    });
  });

  describe('setVariationNotes()', () => {
    test('sets notes on a variation', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const notes = [{ category: 'general' as NoteCategory, note: 'Test note' }];

      expect(wrapper.setVariationNotes('v1' as FillingRecipeVariationSpec, notes)).toSucceedWith(true);

      expect(wrapper.variations[0].notes).toHaveLength(1);
      expect(wrapper.variations[0].notes?.[0].note).toBe('Test note');
    });

    test('clears notes when undefined is passed', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            notes: [{ category: 'general' as NoteCategory, note: 'Old note' }]
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.setVariationNotes('v1' as FillingRecipeVariationSpec, undefined).orThrow();

      expect(wrapper.variations[0].notes).toBeUndefined();
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();

      expect(wrapper.setVariationNotes('v99' as FillingRecipeVariationSpec, [])).toFailWith(
        /variation 'v99' does not exist/i
      );
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntity()).orThrow();
      const notes = [{ category: 'general' as NoteCategory, note: 'New note' }];

      wrapper.setVariationNotes('v1' as FillingRecipeVariationSpec, notes).orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].notes).toBeUndefined();
    });
  });

  describe('scaleVariationToTargetWeight()', () => {
    const chocolateId = 'dark-chocolate' as unknown as IngredientId;
    const creamId = 'cream' as unknown as IngredientId;

    function makeEntityWithWeightIngredients(): Fillings.IFillingRecipeEntity {
      return makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId] },
                amount: 200 as Measurement,
                unit: 'g' as const
              },
              {
                ingredient: { ids: [creamId] },
                amount: 100 as Measurement,
                unit: 'mL' as const
              }
            ],
            baseWeight: 300 as Measurement
          })
        ]
      });
    }

    test('scales weight ingredients proportionally to target weight', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithWeightIngredients()).orThrow();

      expect(
        wrapper.scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 600 as Measurement)
      ).toSucceedAndSatisfy((actualWeight) => {
        expect(actualWeight).toBe(600);
      });

      const ingredients = wrapper.variations[0].ingredients;
      expect(ingredients[0].amount).toBe(400); // 200 × 2
      expect(ingredients[1].amount).toBe(200); // 100 × 2
    });

    test('leaves non-weight ingredients unchanged', () => {
      const saltId = 'salt' as unknown as IngredientId;
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              { ingredient: { ids: [chocolateId] }, amount: 200 as Measurement, unit: 'g' as const },
              { ingredient: { ids: [saltId] }, amount: 1 as Measurement, unit: 'tsp' as const }
            ],
            baseWeight: 200 as Measurement
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      wrapper.scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 400 as Measurement).orThrow();

      const ingredients = wrapper.variations[0].ingredients;
      // chocolate scaled 200 → 400
      expect(ingredients[0].amount).toBe(400);
      // salt stays at 1 (non-weight unit)
      expect(ingredients[1].amount).toBe(1);
    });

    test('fails when targetWeight is not positive', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithWeightIngredients()).orThrow();

      expect(
        wrapper.scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 0 as Measurement)
      ).toFailWith(/target weight must be positive/i);
    });

    test('fails when variation spec not found', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithWeightIngredients()).orThrow();

      expect(
        wrapper.scaleVariationToTargetWeight('v99' as FillingRecipeVariationSpec, 300 as Measurement)
      ).toFailWith(/variation 'v99' does not exist/i);
    });

    test('fails when no weight-contributing ingredients exist', () => {
      const saltId = 'salt' as unknown as IngredientId;
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [{ ingredient: { ids: [saltId] }, amount: 1 as Measurement, unit: 'tsp' as const }],
            baseWeight: 0 as Measurement
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      expect(
        wrapper.scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 300 as Measurement)
      ).toFailWith(/cannot scale.*no weight-contributing ingredients/i);
    });

    test('applies yieldFactor modifier in baseWeight calculation', () => {
      const entity = makeEntity({
        variations: [
          makeVariation('v1', {
            ingredients: [
              {
                ingredient: { ids: [chocolateId] },
                amount: 100 as Measurement,
                modifiers: { yieldFactor: 0.8 }
              }
            ],
            baseWeight: 80 as Measurement
          })
        ]
      });
      const wrapper = EditedFillingRecipe.create(entity).orThrow();

      // baseWeight = 100 × 0.8 = 80; scale to 160 means scaleFactor=2; scaled amount = 200
      const result = wrapper
        .scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 160 as Measurement)
        .orThrow();
      expect(result).toBe(160);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedFillingRecipe.create(makeEntityWithWeightIngredients()).orThrow();

      wrapper.scaleVariationToTargetWeight('v1' as FillingRecipeVariationSpec, 600 as Measurement).orThrow();

      expect(wrapper.canUndo()).toBe(true);
      wrapper.undo().orThrow();
      expect(wrapper.variations[0].ingredients[0].amount).toBe(200);
    });
  });
});
