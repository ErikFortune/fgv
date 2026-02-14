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
  Allergen,
  BaseIngredientId,
  Certification,
  IngredientCategory,
  IngredientPhase,
  MeasurementUnit,
  Model as CommonModel,
  Percentage,
  UrlCategory
} from '../../../../packlets/common';
import { Ingredients, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedIngredient } from '../../../../packlets/library-runtime/edited/ingredientWrapper';

// ============================================================================
// Test Data
// ============================================================================

const baseIngredient: Ingredients.IIngredientEntity = {
  baseId: 'dark-chocolate' as BaseIngredientId,
  name: 'Dark Chocolate 70%',
  category: 'chocolate' as IngredientCategory,
  ganacheCharacteristics: {
    cacaoFat: 38 as Percentage,
    sugar: 28 as Percentage,
    milkFat: 0 as Percentage,
    water: 0 as Percentage,
    solids: 32 as Percentage,
    otherFats: 2 as Percentage
  }
};

const chocolateIngredient: Ingredients.IChocolateIngredientEntity = {
  baseId: 'callebaut-811' as BaseIngredientId,
  name: 'Callebaut 811',
  category: 'chocolate' as const,
  chocolateType: 'dark' as Ingredients.IChocolateIngredientEntity['chocolateType'],
  cacaoPercentage: 54.5 as Percentage,
  ganacheCharacteristics: {
    cacaoFat: 30 as Percentage,
    sugar: 36 as Percentage,
    milkFat: 0 as Percentage,
    water: 0 as Percentage,
    solids: 32 as Percentage,
    otherFats: 2 as Percentage
  },
  temperatureCurve: { melt: 50, cool: 27, working: 31 } as Ingredients.ITemperatureCurve,
  beanVarieties: [
    'forastero' as Ingredients.IChocolateIngredientEntity['beanVarieties'] extends
      | ReadonlyArray<infer U>
      | undefined
      ? U
      : never
  ],
  applications: [
    'ganache' as Ingredients.IChocolateIngredientEntity['applications'] extends
      | ReadonlyArray<infer U>
      | undefined
      ? U
      : never
  ],
  origins: ['Ghana', 'Ivory Coast']
};

const fullIngredient: Ingredients.IIngredientEntity = {
  ...baseIngredient,
  description: 'A rich dark chocolate',
  manufacturer: 'Callebaut',
  allergens: ['milk' as Allergen, 'soy' as Allergen],
  traceAllergens: ['nuts' as Allergen],
  certifications: ['kosher' as Certification],
  vegan: false,
  tags: ['dark', 'ganache'],
  density: 1.2,
  phase: 'solid' as IngredientPhase,
  measurementUnits: {
    options: [{ id: 'g' as MeasurementUnit }, { id: 'kg' as MeasurementUnit }],
    preferredId: 'g' as MeasurementUnit
  },
  urls: [{ url: 'https://example.com/product', category: 'product' as UrlCategory }]
};

// ============================================================================
// EditedIngredient Tests
// ============================================================================

describe('EditedIngredient', () => {
  describe('factory methods', () => {
    test('create() succeeds with base ingredient', () => {
      expect(EditedIngredient.create(baseIngredient)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Dark Chocolate 70%');
        expect(wrapper.category).toBe('chocolate');
        expect(wrapper.ganacheCharacteristics.cacaoFat).toBe(38);
      });
    });

    test('create() succeeds with full ingredient', () => {
      expect(EditedIngredient.create(fullIngredient)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Dark Chocolate 70%');
        expect(wrapper.current.description).toBe('A rich dark chocolate');
        expect(wrapper.current.manufacturer).toBe('Callebaut');
      });
    });

    test('create() deep copies the initial entity', () => {
      const mutableAllergens = ['milk' as Allergen];
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        allergens: mutableAllergens
      };

      const wrapper = EditedIngredient.create(ingredient).orThrow();
      mutableAllergens.push('soy' as Allergen);

      expect(wrapper.current.allergens).toHaveLength(1);
    });

    test('create() succeeds with chocolate-specific ingredient', () => {
      expect(EditedIngredient.create(chocolateIngredient)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Callebaut 811');
        expect(wrapper.category).toBe('chocolate');
      });
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const history: Session.ISerializedEditingHistoryEntity<Ingredients.IngredientEntity> = {
        current: baseIngredient,
        original: baseIngredient,
        undoStack: [{ ...baseIngredient, name: 'Previous Name' }],
        redoStack: [{ ...baseIngredient, name: 'Future Name' }]
      };

      expect(EditedIngredient.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
        expect(wrapper.name).toBe('Dark Chocolate 70%');
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const wrapper = EditedIngredient.create(fullIngredient).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(fullIngredient);

      wrapper.setName('Modified Name').orThrow();
      expect(snapshot.name).toBe('Dark Chocolate 70%');
      expect(wrapper.name).toBe('Modified Name');
    });

    test('snapshot getter returns deep copy', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const snap = wrapper.snapshot;

      expect(snap).toEqual(baseIngredient);
      expect(snap).not.toBe(wrapper.current);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();

      const snapshot = wrapper.createSnapshot();

      wrapper.setName('Change 3').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 4').orThrow();

      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.name).toBe('Change 2');
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });

    test('getSerializedHistory() returns complete history', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(baseIngredient);

      expect(history.current.name).toBe('Change 1');
      expect(history.original.name).toBe('Dark Chocolate 70%');
      expect(history.undoStack).toHaveLength(1);
      expect(history.redoStack).toHaveLength(1);
      expect(history.undoStack[0].name).toBe('Dark Chocolate 70%');
      expect(history.redoStack[0].name).toBe('Change 2');
    });

    test('getSerializedHistory() deep copies all states', () => {
      const wrapper = EditedIngredient.create(fullIngredient).orThrow();
      wrapper.setName('Changed').orThrow();

      const history = wrapper.getSerializedHistory(fullIngredient);

      wrapper.setName('Changed Again').orThrow();

      expect(history.current.name).toBe('Changed');
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('undo() after a change restores previous state', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      wrapper.setName('New Name').orThrow();
      expect(wrapper.name).toBe('New Name');

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Dark Chocolate 70%');
    });

    test('redo() returns false when no redo history', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('redo() after undo restores undone state', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      wrapper.setName('New Name').orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('New Name');
    });

    test('canUndo() and canRedo() reflect correct states', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.setName('Change').orThrow();
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(true);
    });

    test('new edit clears redo stack', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 2').orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('history truncation after MAX_HISTORY_SIZE changes', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      for (let i = 0; i < 51; i++) {
        wrapper.setName(`Name ${i}`).orThrow();
      }

      let undoCount = 0;
      while (wrapper.undo().orThrow()) {
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('editing methods — common fields', () => {
    test('setName() updates name', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setName('New Name')).toSucceed();
      expect(wrapper.name).toBe('New Name');
      expect(wrapper.canUndo()).toBe(true);
    });

    test('setDescription() sets and clears description', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setDescription('A description')).toSucceed();
      expect(wrapper.current.description).toBe('A description');

      expect(wrapper.setDescription(undefined)).toSucceed();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('setManufacturer() sets and clears manufacturer', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setManufacturer('Callebaut')).toSucceed();
      expect(wrapper.current.manufacturer).toBe('Callebaut');

      expect(wrapper.setManufacturer(undefined)).toSucceed();
      expect(wrapper.current.manufacturer).toBeUndefined();
    });

    test('setGanacheCharacteristics() updates ganache', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const newGanache: Ingredients.IGanacheCharacteristics = {
        cacaoFat: 40 as Percentage,
        sugar: 25 as Percentage,
        milkFat: 5 as Percentage,
        water: 0 as Percentage,
        solids: 28 as Percentage,
        otherFats: 2 as Percentage
      };

      expect(wrapper.setGanacheCharacteristics(newGanache)).toSucceed();
      expect(wrapper.ganacheCharacteristics.cacaoFat).toBe(40);
      expect(wrapper.ganacheCharacteristics.milkFat).toBe(5);
    });

    test('setAllergens() sets and clears allergens', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setAllergens(['milk' as Allergen, 'soy' as Allergen])).toSucceed();
      expect(wrapper.current.allergens).toEqual(['milk', 'soy']);

      expect(wrapper.setAllergens(undefined)).toSucceed();
      expect(wrapper.current.allergens).toBeUndefined();
    });

    test('setAllergens() deep copies the array', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const allergens: Allergen[] = ['milk' as Allergen];

      wrapper.setAllergens(allergens).orThrow();
      allergens.push('soy' as Allergen);

      expect(wrapper.current.allergens).toHaveLength(1);
    });

    test('setTraceAllergens() sets and clears trace allergens', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setTraceAllergens(['nuts' as Allergen])).toSucceed();
      expect(wrapper.current.traceAllergens).toEqual(['nuts']);

      expect(wrapper.setTraceAllergens(undefined)).toSucceed();
      expect(wrapper.current.traceAllergens).toBeUndefined();
    });

    test('setCertifications() sets and clears certifications', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setCertifications(['kosher' as Certification, 'halal' as Certification])).toSucceed();
      expect(wrapper.current.certifications).toEqual(['kosher', 'halal']);

      expect(wrapper.setCertifications(undefined)).toSucceed();
      expect(wrapper.current.certifications).toBeUndefined();
    });

    test('setVegan() sets and clears vegan status', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setVegan(true)).toSucceed();
      expect(wrapper.current.vegan).toBe(true);

      expect(wrapper.setVegan(false)).toSucceed();
      expect(wrapper.current.vegan).toBe(false);

      expect(wrapper.setVegan(undefined)).toSucceed();
      expect(wrapper.current.vegan).toBeUndefined();
    });

    test('setTags() sets and clears tags', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setTags(['dark', 'premium'])).toSucceed();
      expect(wrapper.current.tags).toEqual(['dark', 'premium']);

      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('setDensity() sets and clears density', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setDensity(1.3)).toSucceed();
      expect(wrapper.current.density).toBe(1.3);

      expect(wrapper.setDensity(undefined)).toSucceed();
      expect(wrapper.current.density).toBeUndefined();
    });

    test('setPhase() sets and clears phase', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.setPhase('liquid' as IngredientPhase)).toSucceed();
      expect(wrapper.current.phase).toBe('liquid');

      expect(wrapper.setPhase(undefined)).toSucceed();
      expect(wrapper.current.phase).toBeUndefined();
    });

    test('setMeasurementUnits() sets and clears measurement units', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const units: CommonModel.IOptionsWithPreferred<CommonModel.IMeasurementUnitOption, MeasurementUnit> = {
        options: [{ id: 'g' as MeasurementUnit }, { id: 'oz' as MeasurementUnit }],
        preferredId: 'g' as MeasurementUnit
      };

      expect(wrapper.setMeasurementUnits(units)).toSucceed();
      expect(wrapper.current.measurementUnits?.preferredId).toBe('g');
      expect(wrapper.current.measurementUnits?.options).toHaveLength(2);

      expect(wrapper.setMeasurementUnits(undefined)).toSucceed();
      expect(wrapper.current.measurementUnits).toBeUndefined();
    });

    test('setUrls() sets and clears urls', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const urls: CommonModel.ICategorizedUrl[] = [
        { url: 'https://example.com', category: 'product' as UrlCategory }
      ];

      expect(wrapper.setUrls(urls)).toSucceed();
      expect(wrapper.current.urls).toHaveLength(1);
      expect(wrapper.current.urls![0].url).toBe('https://example.com');

      expect(wrapper.setUrls(undefined)).toSucceed();
      expect(wrapper.current.urls).toBeUndefined();
    });

    test('setUrls() deep copies the array', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const urls: CommonModel.ICategorizedUrl[] = [
        { url: 'https://example.com', category: 'product' as UrlCategory }
      ];

      wrapper.setUrls(urls).orThrow();
      urls.push({ url: 'https://other.com', category: 'manufacturer' as UrlCategory });

      expect(wrapper.current.urls).toHaveLength(1);
    });

    test('applyUpdate() applies partial update', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();

      expect(wrapper.applyUpdate({ name: 'Updated', description: 'New desc' })).toSucceed();
      expect(wrapper.name).toBe('Updated');
      expect(wrapper.current.description).toBe('New desc');
      expect(wrapper.canUndo()).toBe(true);
    });
  });

  describe('read-only access', () => {
    test('current returns the current entity', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.current.baseId).toBe('dark-chocolate');
      expect(wrapper.current.name).toBe('Dark Chocolate 70%');
    });

    test('name returns current name', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.name).toBe('Dark Chocolate 70%');
    });

    test('category returns current category', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.category).toBe('chocolate');
    });

    test('ganacheCharacteristics returns current ganache', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.ganacheCharacteristics.cacaoFat).toBe(38);
    });
  });

  describe('comparison', () => {
    test('hasChanges() returns false for unchanged entity', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      expect(wrapper.hasChanges(baseIngredient)).toBe(false);
    });

    test('hasChanges() returns true after name change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setName('Changed').orThrow();
      expect(wrapper.hasChanges(baseIngredient)).toBe(true);
    });

    test('getChanges() returns all-false for unchanged entity', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.hasChanges).toBe(false);
      expect(changes.nameChanged).toBe(false);
      expect(changes.categoryChanged).toBe(false);
      expect(changes.ganacheCharacteristicsChanged).toBe(false);
      expect(changes.descriptionChanged).toBe(false);
      expect(changes.manufacturerChanged).toBe(false);
      expect(changes.allergensChanged).toBe(false);
      expect(changes.traceAllergensChanged).toBe(false);
      expect(changes.certificationsChanged).toBe(false);
      expect(changes.veganChanged).toBe(false);
      expect(changes.tagsChanged).toBe(false);
      expect(changes.densityChanged).toBe(false);
      expect(changes.phaseChanged).toBe(false);
      expect(changes.measurementUnitsChanged).toBe(false);
      expect(changes.urlsChanged).toBe(false);
    });

    test('getChanges() detects name change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setName('Changed').orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.nameChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
      expect(changes.categoryChanged).toBe(false);
    });

    test('getChanges() detects ganache characteristics change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper
        .setGanacheCharacteristics({
          ...baseIngredient.ganacheCharacteristics,
          cacaoFat: 45 as Percentage
        })
        .orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.ganacheCharacteristicsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects description change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setDescription('New description').orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.descriptionChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects manufacturer change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setManufacturer('New Manufacturer').orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.manufacturerChanged).toBe(true);
    });

    test('getChanges() detects allergens change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setAllergens(['milk' as Allergen]).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.allergensChanged).toBe(true);
    });

    test('getChanges() detects trace allergens change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setTraceAllergens(['nuts' as Allergen]).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.traceAllergensChanged).toBe(true);
    });

    test('getChanges() detects certifications change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setCertifications(['kosher' as Certification]).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.certificationsChanged).toBe(true);
    });

    test('getChanges() detects vegan change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setVegan(true).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.veganChanged).toBe(true);
    });

    test('getChanges() detects tags change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setTags(['new-tag']).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.tagsChanged).toBe(true);
    });

    test('getChanges() detects density change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setDensity(1.5).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.densityChanged).toBe(true);
    });

    test('getChanges() detects phase change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setPhase('liquid' as IngredientPhase).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.phaseChanged).toBe(true);
    });

    test('getChanges() detects measurement units change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper
        .setMeasurementUnits({
          options: [{ id: 'g' as MeasurementUnit }],
          preferredId: 'g' as MeasurementUnit
        })
        .orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.measurementUnitsChanged).toBe(true);
    });

    test('getChanges() detects urls change', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      wrapper.setUrls([{ url: 'https://example.com', category: 'product' as UrlCategory }]).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.urlsChanged).toBe(true);
    });

    test('getChanges() with full ingredient detects no changes', () => {
      const wrapper = EditedIngredient.create(fullIngredient).orThrow();
      const changes = wrapper.getChanges(fullIngredient);

      expect(changes.hasChanges).toBe(false);
    });

    test('getChanges() allergens comparison handles sorted order', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        allergens: ['soy' as Allergen, 'milk' as Allergen]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper.setAllergens(['milk' as Allergen, 'soy' as Allergen]).orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.allergensChanged).toBe(false);
    });

    test('getChanges() allergens comparison detects length difference', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        allergens: ['milk' as Allergen]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper.setAllergens(['milk' as Allergen, 'soy' as Allergen]).orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.allergensChanged).toBe(true);
    });

    test('getChanges() measurement units comparison handles preferredId difference', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        measurementUnits: {
          options: [{ id: 'g' as MeasurementUnit }],
          preferredId: 'g' as MeasurementUnit
        }
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper
        .setMeasurementUnits({
          options: [{ id: 'g' as MeasurementUnit }],
          preferredId: 'kg' as MeasurementUnit
        })
        .orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.measurementUnitsChanged).toBe(true);
    });

    test('getChanges() measurement units comparison handles options length difference', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        measurementUnits: {
          options: [{ id: 'g' as MeasurementUnit }],
          preferredId: 'g' as MeasurementUnit
        }
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper
        .setMeasurementUnits({
          options: [{ id: 'g' as MeasurementUnit }, { id: 'kg' as MeasurementUnit }],
          preferredId: 'g' as MeasurementUnit
        })
        .orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.measurementUnitsChanged).toBe(true);
    });

    test('getChanges() urls comparison handles sorted order', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        urls: [
          { url: 'https://b.com', category: 'product' as UrlCategory },
          { url: 'https://a.com', category: 'manufacturer' as UrlCategory }
        ]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper
        .setUrls([
          { url: 'https://a.com', category: 'manufacturer' as UrlCategory },
          { url: 'https://b.com', category: 'product' as UrlCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.urlsChanged).toBe(false);
    });

    test('getChanges() urls comparison detects category difference', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        urls: [{ url: 'https://a.com', category: 'product' as UrlCategory }]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper.setUrls([{ url: 'https://a.com', category: 'manufacturer' as UrlCategory }]).orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.urlsChanged).toBe(true);
    });

    test('getChanges() urls comparison detects length difference', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        urls: [{ url: 'https://a.com', category: 'product' as UrlCategory }]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper
        .setUrls([
          { url: 'https://a.com', category: 'product' as UrlCategory },
          { url: 'https://b.com', category: 'manufacturer' as UrlCategory }
        ])
        .orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.urlsChanged).toBe(true);
    });

    test('getChanges() handles both undefined for optional arrays', () => {
      const wrapper = EditedIngredient.create(baseIngredient).orThrow();
      const changes = wrapper.getChanges(baseIngredient);

      expect(changes.allergensChanged).toBe(false);
      expect(changes.traceAllergensChanged).toBe(false);
      expect(changes.certificationsChanged).toBe(false);
      expect(changes.tagsChanged).toBe(false);
      expect(changes.measurementUnitsChanged).toBe(false);
      expect(changes.urlsChanged).toBe(false);
    });

    test('getChanges() handles one undefined and one defined for optional arrays', () => {
      const ingredient: Ingredients.IIngredientEntity = {
        ...baseIngredient,
        allergens: ['milk' as Allergen]
      };
      const wrapper = EditedIngredient.create(ingredient).orThrow();

      wrapper.setAllergens(undefined).orThrow();
      const changes = wrapper.getChanges(ingredient);

      expect(changes.allergensChanged).toBe(true);
    });
  });

  describe('deep copy with category-specific fields', () => {
    test('deep copies chocolate-specific fields', () => {
      const wrapper = EditedIngredient.create(chocolateIngredient).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(chocolateIngredient);
    });

    test('deep copies non-chocolate ingredient without category fields', () => {
      const sugarIngredient: Ingredients.ISugarIngredientEntity = {
        baseId: 'white-sugar' as BaseIngredientId,
        name: 'White Sugar',
        category: 'sugar' as const,
        ganacheCharacteristics: {
          cacaoFat: 0 as Percentage,
          sugar: 100 as Percentage,
          milkFat: 0 as Percentage,
          water: 0 as Percentage,
          solids: 0 as Percentage,
          otherFats: 0 as Percentage
        },
        sweetnessPotency: 1.0
      };

      const wrapper = EditedIngredient.create(sugarIngredient).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(sugarIngredient);
    });
  });
});
