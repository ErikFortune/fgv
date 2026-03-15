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
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  ConfectionRecipeVariationId,
  DecorationId,
  FillingId,
  IngredientId,
  Measurement,
  Millimeters,
  MoldId,
  NoteCategory,
  ProcedureId,
  SlotId,
  UrlCategory
} from '../../../../packlets/common';
import { Confections } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedConfectionRecipe } from '../../../../packlets/library-runtime/edited/confectionWrapper';

// ============================================================================
// Test Data Helpers
// ============================================================================

const date = '2026-02-18';

function makeChocolateSpec(id: string): Confections.IChocolateSpec {
  return {
    ids: [id as IngredientId],
    preferredId: id as IngredientId
  };
}

function makeMoldRef(id: string): Confections.IConfectionMoldRef {
  return { id: id as MoldId };
}

function makeMoldedBonBonVariation(
  spec: string,
  overrides?: Partial<Confections.IMoldedBonBonRecipeVariationEntity>
): Confections.IMoldedBonBonRecipeVariationEntity {
  return {
    variationSpec: spec as ConfectionRecipeVariationSpec,
    createdDate: date,
    yield: { numFrames: 1 },
    molds: { options: [makeMoldRef('round-mold')], preferredId: 'round-mold' as MoldId },
    shellChocolate: makeChocolateSpec('dark-70'),
    ...overrides
  };
}

function makeBarTruffleVariation(
  spec: string,
  overrides?: Partial<Confections.IBarTruffleRecipeVariationEntity>
): Confections.IBarTruffleRecipeVariationEntity {
  return {
    variationSpec: spec as ConfectionRecipeVariationSpec,
    createdDate: date,
    yield: {
      numPieces: 36,
      weightPerPiece: 10 as Measurement,
      dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 12 as Millimeters }
    },
    ...overrides
  };
}

function makeRolledTruffleVariation(
  spec: string,
  overrides?: Partial<Confections.IRolledTruffleRecipeVariationEntity>
): Confections.IRolledTruffleRecipeVariationEntity {
  return {
    variationSpec: spec as ConfectionRecipeVariationSpec,
    createdDate: date,
    yield: { numPieces: 30, weightPerPiece: 15 as Measurement },
    ...overrides
  };
}

function makeMoldedBonBonEntity(
  overrides?: Partial<Confections.MoldedBonBonRecipeEntity>
): Confections.MoldedBonBonRecipeEntity {
  return {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test BonBon' as ConfectionName,
    variations: [makeMoldedBonBonVariation('v1')],
    goldenVariationSpec: 'v1' as ConfectionRecipeVariationSpec,
    ...overrides
  };
}

function makeBarTruffleEntity(
  overrides?: Partial<Confections.BarTruffleRecipeEntity>
): Confections.BarTruffleRecipeEntity {
  return {
    baseId: 'test-bar' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    variations: [makeBarTruffleVariation('v1')],
    goldenVariationSpec: 'v1' as ConfectionRecipeVariationSpec,
    ...overrides
  };
}

function makeRolledTruffleEntity(
  overrides?: Partial<Confections.RolledTruffleRecipeEntity>
): Confections.RolledTruffleRecipeEntity {
  return {
    baseId: 'test-rolled' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    variations: [makeRolledTruffleVariation('v1')],
    goldenVariationSpec: 'v1' as ConfectionRecipeVariationSpec,
    ...overrides
  };
}

// ============================================================================
// EditedConfectionRecipe Tests
// ============================================================================

describe('EditedConfectionRecipe', () => {
  // ============================================================================
  // Factory Methods
  // ============================================================================

  describe('factory methods', () => {
    test('create() succeeds with molded bonbon entity', () => {
      const entity = makeMoldedBonBonEntity();
      expect(EditedConfectionRecipe.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test BonBon' as ConfectionName);
        expect(wrapper.confectionType).toBe('molded-bonbon');
        expect(wrapper.goldenVariationSpec).toBe('v1' as ConfectionRecipeVariationSpec);
        expect(wrapper.variations).toHaveLength(1);
      });
    });

    test('create() succeeds with bar truffle entity', () => {
      const entity = makeBarTruffleEntity();
      expect(EditedConfectionRecipe.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Bar Truffle' as ConfectionName);
        expect(wrapper.confectionType).toBe('bar-truffle');
      });
    });

    test('create() succeeds with rolled truffle entity', () => {
      const entity = makeRolledTruffleEntity();
      expect(EditedConfectionRecipe.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Rolled Truffle' as ConfectionName);
        expect(wrapper.confectionType).toBe('rolled-truffle');
      });
    });

    test('create() deep copies so mutations do not affect original', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('Modified' as ConfectionName);
      expect(entity.name).toBe('Test BonBon' as ConfectionName);
    });

    test('restoreFromHistory() restores undo/redo stacks', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('Step 1' as ConfectionName);
      wrapper.setName('Step 2' as ConfectionName);

      const history = wrapper.getSerializedHistory(entity);
      const restored = EditedConfectionRecipe.restoreFromHistory(history).orThrow();
      expect(restored.name).toBe('Step 2' as ConfectionName);
      expect(restored.canUndo()).toBe(true);
    });
  });

  // ============================================================================
  // Recipe-Level Field Editing
  // ============================================================================

  describe('setName', () => {
    test('updates name and supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setName('New Name' as ConfectionName)).toSucceed();
      expect(wrapper.name).toBe('New Name' as ConfectionName);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Test BonBon' as ConfectionName);
    });

    test('redo restores after undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('New Name' as ConfectionName);
      wrapper.undo();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('New Name' as ConfectionName);
    });
  });

  describe('setDescription', () => {
    test('sets and clears description', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setDescription('A rich dark chocolate bonbon')).toSucceed();
      expect(wrapper.current.description).toBe('A rich dark chocolate bonbon');

      expect(wrapper.setDescription(undefined)).toSucceed();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setDescription('First');
      wrapper.setDescription('Second');

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.current.description).toBe('First');
    });
  });

  describe('setTags', () => {
    test('sets and clears tags', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setTags(['dark', 'seasonal'])).toSucceed();
      expect(wrapper.current.tags).toEqual(['dark', 'seasonal']);

      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({ tags: ['original'] });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setTags(['updated']);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.current.tags).toEqual(['original']);
    });
  });

  describe('setUrls', () => {
    test('sets and clears urls', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(
        wrapper.setUrls([{ category: 'recipe' as UrlCategory, url: 'https://example.com' }])
      ).toSucceed();
      expect(wrapper.current.urls).toHaveLength(1);

      expect(wrapper.setUrls(undefined)).toSucceed();
      expect(wrapper.current.urls).toBeUndefined();
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({
        urls: [{ category: 'recipe' as UrlCategory, url: 'https://original.com' }]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setUrls([{ category: 'recipe' as UrlCategory, url: 'https://updated.com' }]);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.current.urls?.[0].url).toBe('https://original.com');
    });
  });

  describe('setGoldenVariationSpec', () => {
    test('sets golden spec when variation exists', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setGoldenVariationSpec('v2' as ConfectionRecipeVariationSpec)).toSucceed();
      expect(wrapper.goldenVariationSpec).toBe('v2' as ConfectionRecipeVariationSpec);
    });

    test('fails when spec does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setGoldenVariationSpec('v99' as ConfectionRecipeVariationSpec)).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setGoldenVariationSpec('v2' as ConfectionRecipeVariationSpec);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.goldenVariationSpec).toBe('v1' as ConfectionRecipeVariationSpec);
    });
  });

  // ============================================================================
  // Variation Management
  // ============================================================================

  describe('addVariation', () => {
    test('adds a new molded bonbon variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.addVariation(makeMoldedBonBonVariation('v2'))).toSucceed();
      expect(wrapper.variations).toHaveLength(2);
      expect(wrapper.variations[1].variationSpec).toBe('v2' as ConfectionRecipeVariationSpec);
    });

    test('fails when spec already exists', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.addVariation(makeMoldedBonBonVariation('v1'))).toFailWith(/already exists/);
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.addVariation(makeMoldedBonBonVariation('v2'));

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.variations).toHaveLength(1);
    });
  });

  describe('replaceVariation', () => {
    test('replaces an existing variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const updated = makeMoldedBonBonVariation('v1', { yield: { numFrames: 2 } });

      expect(wrapper.replaceVariation('v1' as ConfectionRecipeVariationSpec, updated)).toSucceed();
      expect((wrapper.variations[0] as Confections.IMoldedBonBonRecipeVariationEntity).yield.numFrames).toBe(
        2
      );
    });

    test('fails when spec does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(
        wrapper.replaceVariation('v99' as ConfectionRecipeVariationSpec, makeMoldedBonBonVariation('v99'))
      ).toFailWith(/does not exist/);
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.replaceVariation(
        'v1' as ConfectionRecipeVariationSpec,
        makeMoldedBonBonVariation('v1', { yield: { numFrames: 2 } })
      );

      expect(wrapper.undo()).toSucceedWith(true);
      expect((wrapper.variations[0] as Confections.IMoldedBonBonRecipeVariationEntity).yield.numFrames).toBe(
        1
      );
    });
  });

  describe('removeVariation', () => {
    test('removes a non-golden variation', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v2' as ConfectionRecipeVariationSpec)).toSucceed();
      expect(wrapper.variations).toHaveLength(1);
    });

    test('fails when removing the last variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v1' as ConfectionRecipeVariationSpec)).toFailWith(/last variation/);
    });

    test('fails when removing the golden variation', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v1' as ConfectionRecipeVariationSpec)).toFailWith(/golden variation/);
    });

    test('fails when spec does not exist', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.removeVariation('v99' as ConfectionRecipeVariationSpec)).toFailWith(/does not exist/);
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.removeVariation('v2' as ConfectionRecipeVariationSpec);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.variations).toHaveLength(2);
    });
  });

  describe('setVariationName', () => {
    test('sets a name on an existing variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setVariationName('v1' as ConfectionRecipeVariationSpec, 'Dark Shell')).toSucceed();
      expect(wrapper.variations[0].name).toBe('Dark Shell');
    });

    test('clears name when undefined is passed', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1', { name: 'Old Name' })]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setVariationName('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      expect(wrapper.variations[0].name).toBeUndefined();
    });

    test('fails when spec does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.setVariationName('v99' as ConfectionRecipeVariationSpec, 'Name')).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationName('v1' as ConfectionRecipeVariationSpec, 'Named');

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.variations[0].name).toBeUndefined();
    });
  });

  // ============================================================================
  // createBlankVariation — per subtype
  // ============================================================================

  describe('createBlankVariation (molded bonbon)', () => {
    test('creates blank variation with molds and shellChocolate from golden', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-02` as ConfectionRecipeVariationSpec
      );

      expect(wrapper.variations).toHaveLength(2);
      const newVar = wrapper.variations[1] as Confections.IMoldedBonBonRecipeVariationEntity;
      expect(newVar.variationSpec).toBe(`${date}-02` as ConfectionRecipeVariationSpec);
      expect(newVar.yield.numFrames).toBe(1);
      expect(newVar.molds.options).toHaveLength(1);
      expect(newVar.molds.preferredId).toBe('round-mold' as MoldId);
      expect(newVar.shellChocolate.ids).toContain('dark-70' as IngredientId);
      expect(newVar.fillings).toBeUndefined();
    });

    test('sets name on new variation when provided', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      wrapper.createBlankVariation({ date, name: 'Milk Shell' }).orThrow();

      const newVar = wrapper.variations[1];
      expect(newVar.variationSpec).toBe(`${date}-02-milk-shell` as ConfectionRecipeVariationSpec);
      expect(newVar.name).toBe('Milk Shell');
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.createBlankVariation({ date });

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.variations).toHaveLength(1);
    });

    test('uses today as date when options not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const spec = `${today}-01` as ConfectionRecipeVariationSpec;
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(spec)],
        goldenVariationSpec: spec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation()).toSucceedAndSatisfy((newSpec) => {
        expect(newSpec.startsWith(today)).toBe(true);
      });
    });

    test('copies mold notes from golden when present', () => {
      const moldWithNotes: Confections.IConfectionMoldRef = {
        id: 'round-mold' as MoldId,
        notes: [{ category: 'general' as NoteCategory, note: 'Handle carefully' }]
      };
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation(`${date}-01`, {
            molds: { options: [moldWithNotes], preferredId: 'round-mold' as MoldId }
          })
        ],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.createBlankVariation({ date }).orThrow();

      const newVar = wrapper.variations[1] as Confections.IMoldedBonBonRecipeVariationEntity;
      expect(newVar.molds.options[0].notes).toHaveLength(1);
      expect(newVar.molds.options[0].notes?.[0].note).toBe('Handle carefully');
    });
  });

  describe('createBlankVariation (bar truffle)', () => {
    test('creates blank variation with yield dimensions from golden', () => {
      const entity = makeBarTruffleEntity({
        variations: [makeBarTruffleVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-02` as ConfectionRecipeVariationSpec
      );

      const newVar = wrapper.variations[1] as Confections.IBarTruffleRecipeVariationEntity;
      expect(newVar.yield.numPieces).toBe(36);
      expect(newVar.yield.dimensions.width).toBe(25 as Millimeters);
      expect(newVar.yield.dimensions.depth).toBe(12 as Millimeters);
      expect(newVar.enrobingChocolate).toBeUndefined();
    });
  });

  describe('createBlankVariation (rolled truffle)', () => {
    test('creates blank variation with no type-specific required fields', () => {
      const entity = makeRolledTruffleEntity({
        variations: [makeRolledTruffleVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-02` as ConfectionRecipeVariationSpec
      );

      const newVar = wrapper.variations[1] as Confections.IRolledTruffleRecipeVariationEntity;
      expect(newVar.yield.numPieces).toBe(30);
      expect(newVar.enrobingChocolate).toBeUndefined();
      expect(newVar.coatings).toBeUndefined();
    });

    test('creates blank variation with default zero yield when golden variation is not found', () => {
      // goldenVariationSpec points to a non-existent spec, so golden is undefined
      const entity = makeRolledTruffleEntity({
        variations: [makeRolledTruffleVariation(`${date}-01`)],
        goldenVariationSpec: 'nonexistent' as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.createBlankVariation({ date })).toSucceedWith(
        `${date}-02` as ConfectionRecipeVariationSpec
      );

      const newVar = wrapper.variations[1] as Confections.IRolledTruffleRecipeVariationEntity;
      expect(newVar.yield.numPieces).toBe(0);
      expect(newVar.yield.weightPerPiece).toBe(0 as Measurement);
    });
  });

  // ============================================================================
  // duplicateVariation — per subtype
  // ============================================================================

  describe('duplicateVariation (molded bonbon)', () => {
    test('duplicates a molded bonbon variation with new spec', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation(`${date}-01`, {
            name: 'Original',
            yield: { numFrames: 1 },
            molds: { options: [makeMoldRef('square-mold')], preferredId: 'square-mold' as MoldId }
          })
        ],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(
        wrapper.duplicateVariation(`${date}-01` as ConfectionRecipeVariationSpec, { date })
      ).toSucceedWith(`${date}-02` as ConfectionRecipeVariationSpec);

      expect(wrapper.variations).toHaveLength(2);
      const dup = wrapper.variations[1] as Confections.IMoldedBonBonRecipeVariationEntity;
      expect(dup.variationSpec).toBe(`${date}-02` as ConfectionRecipeVariationSpec);
      expect(dup.name).toBeUndefined();
      expect(dup.yield.numFrames).toBe(1);
      expect(dup.molds.preferredId).toBe('square-mold' as MoldId);
    });

    test('sets name on duplicate when provided', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      wrapper
        .duplicateVariation(`${date}-01` as ConfectionRecipeVariationSpec, { date, name: 'White Shell' })
        .orThrow();

      const dup = wrapper.variations[1];
      expect(dup.variationSpec).toBe(`${date}-02-white-shell` as ConfectionRecipeVariationSpec);
      expect(dup.name).toBe('White Shell');
    });

    test('uses today as date when options not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const spec = `${today}-01` as ConfectionRecipeVariationSpec;
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(spec)],
        goldenVariationSpec: spec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.duplicateVariation(spec)).toSucceedAndSatisfy((newSpec) => {
        expect(newSpec.startsWith(today)).toBe(true);
      });
    });

    test('fails when source spec does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.duplicateVariation('v99' as ConfectionRecipeVariationSpec, { date })).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation(`${date}-01`)],
        goldenVariationSpec: `${date}-01` as ConfectionRecipeVariationSpec
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.duplicateVariation(`${date}-01` as ConfectionRecipeVariationSpec, { date });

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.variations).toHaveLength(1);
    });
  });

  describe('duplicateVariation (bar truffle)', () => {
    test('duplicates a bar truffle variation preserving dimensions and enrobing chocolate', () => {
      const entity = makeBarTruffleEntity({
        variations: [
          makeBarTruffleVariation(`${date}-01`, {
            enrobingChocolate: makeChocolateSpec('milk-38')
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      wrapper.duplicateVariation(`${date}-01` as ConfectionRecipeVariationSpec, { date }).orThrow();

      const dup = wrapper.variations[1] as Confections.IBarTruffleRecipeVariationEntity;
      expect(dup.yield.dimensions.width).toBe(25 as Millimeters);
      expect(dup.enrobingChocolate?.ids).toContain('milk-38' as IngredientId);
    });
  });

  describe('duplicateVariation (rolled truffle)', () => {
    test('duplicates a rolled truffle variation preserving coatings', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation(`${date}-01`, {
            coatings: { ids: ['cocoa-powder' as IngredientId], preferredId: 'cocoa-powder' as IngredientId }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      wrapper.duplicateVariation(`${date}-01` as ConfectionRecipeVariationSpec, { date }).orThrow();

      const dup = wrapper.variations[1] as Confections.IRolledTruffleRecipeVariationEntity;
      expect(dup.coatings?.ids).toContain('cocoa-powder' as IngredientId);
    });
  });

  // ============================================================================
  // Deep Copy Fidelity
  // ============================================================================

  describe('deep copy fidelity', () => {
    test('deep copies molded bonbon variation with notes, procedures, decorations, additionalChocolates', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            notes: [{ category: 'general' as NoteCategory, note: 'Test note' }],
            procedures: {
              options: [{ id: 'proc-1' as ProcedureId }],
              preferredId: 'proc-1' as ProcedureId
            },
            decorations: {
              options: [{ id: 'deco-1' as DecorationId }],
              preferredId: 'deco-1' as DecorationId
            },
            additionalChocolates: [{ chocolate: makeChocolateSpec('white-35'), purpose: 'seal' }]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0] as Confections.IMoldedBonBonRecipeVariationEntity;

      expect(v.notes).toHaveLength(1);
      expect(v.procedures?.options).toHaveLength(1);
      expect(v.decorations?.options).toHaveLength(1);
      expect(v.additionalChocolates).toHaveLength(1);
      expect(v.additionalChocolates?.[0].purpose).toBe('seal');
    });

    test('deep copies bar truffle variation with enrobing chocolate', () => {
      const entity = makeBarTruffleEntity({
        variations: [makeBarTruffleVariation('v1', { enrobingChocolate: makeChocolateSpec('dark-70') })]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0] as Confections.IBarTruffleRecipeVariationEntity;

      expect(v.enrobingChocolate?.ids).toContain('dark-70' as IngredientId);
    });

    test('deep copies decoration option notes in variation base', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            decorations: {
              options: [
                {
                  id: 'deco-1' as unknown as DecorationId,
                  notes: [{ category: 'general' as NoteCategory, note: 'Apply last' }]
                }
              ],
              preferredId: 'deco-1' as unknown as DecorationId
            }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0];
      expect(v.decorations?.options[0].notes).toHaveLength(1);
    });

    test('deep copies procedure option notes in variation base', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            procedures: {
              options: [
                {
                  id: 'proc-1' as unknown as ProcedureId,
                  notes: [{ category: 'timing' as NoteCategory, note: 'Do first' }]
                }
              ],
              preferredId: 'proc-1' as unknown as ProcedureId
            }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0];
      expect(v.procedures?.options[0].notes).toHaveLength(1);
    });

    test('deep copies filling option notes in variation base', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            fillings: [
              {
                slotId: 'slot-1' as unknown as SlotId,
                filling: {
                  options: [
                    {
                      type: 'recipe' as const,
                      id: 'filling-1' as unknown as FillingId,
                      notes: [{ category: 'general' as NoteCategory, note: 'Use fresh' }]
                    },
                    {
                      type: 'recipe' as const,
                      id: 'filling-2' as unknown as FillingId
                    }
                  ],
                  preferredId: 'filling-1' as unknown as FillingId
                }
              }
            ]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0];
      expect(v.fillings?.[0].filling.options[0].notes).toHaveLength(1);
      expect(v.fillings?.[0].filling.options[1].notes).toBeUndefined();
    });

    test('deep copies derivedFrom without notes', () => {
      const entity = makeMoldedBonBonEntity({
        derivedFrom: {
          sourceVariationId: 'src.bonbon@v1' as unknown as ConfectionRecipeVariationId,
          derivedDate: date
        }
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.current.derivedFrom?.notes).toBeUndefined();
    });

    test('deep copies rolled truffle variation with enrobing chocolate and coatings', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            enrobingChocolate: makeChocolateSpec('milk-38'),
            coatings: { ids: ['cocoa-powder' as IngredientId], preferredId: 'cocoa-powder' as IngredientId }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0] as Confections.IRolledTruffleRecipeVariationEntity;

      expect(v.enrobingChocolate?.ids).toContain('milk-38' as IngredientId);
      expect(v.coatings?.ids).toContain('cocoa-powder' as IngredientId);
    });

    test('deep copies fillings slots in variation base', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            fillings: [
              {
                slotId: 'slot-1' as unknown as SlotId,
                filling: {
                  options: [
                    {
                      type: 'recipe' as const,
                      id: 'filling-1' as unknown as FillingId,
                      notes: [{ category: 'general' as NoteCategory, note: 'Use fresh' }]
                    }
                  ],
                  preferredId: 'filling-1' as unknown as FillingId
                }
              }
            ]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0];
      expect(v.fillings).toHaveLength(1);
      expect(v.fillings?.[0].filling.options[0].notes).toHaveLength(1);
    });

    test('deep copies derivedFrom with notes', () => {
      const entity = makeMoldedBonBonEntity({
        derivedFrom: {
          sourceVariationId: 'src.bonbon@v1' as unknown as ConfectionRecipeVariationId,
          derivedDate: date,
          notes: [{ category: 'general' as NoteCategory, note: 'Adapted from original' }]
        }
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.current.derivedFrom?.notes).toHaveLength(1);
      expect(wrapper.current.derivedFrom?.notes?.[0].note).toBe('Adapted from original');
    });

    test('deep copies additionalTags and additionalUrls in variation base', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            additionalTags: ['seasonal', 'dark'],
            additionalUrls: [{ category: 'recipe' as UrlCategory, url: 'https://example.com' }]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const v = wrapper.variations[0];
      expect(v.additionalTags).toEqual(['seasonal', 'dark']);
      expect(v.additionalUrls).toHaveLength(1);
    });

    test('mutations to original entity do not affect wrapper after create()', () => {
      const variation = makeMoldedBonBonVariation('v1');
      const entity = makeMoldedBonBonEntity({ variations: [variation] });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      (variation.molds.options as Confections.IConfectionMoldRef[]).push(makeMoldRef('extra-mold'));
      const v = wrapper.variations[0];
      expect(Confections.isMoldedBonBonRecipeVariationEntity(v)).toBe(true);
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.molds.options).toHaveLength(1);
      }
    });
  });

  // ============================================================================
  // Change Detection
  // ============================================================================

  describe('hasChanges / getChanges', () => {
    test('no changes when nothing is modified', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.hasChanges(entity)).toBe(false);
    });

    test('detects name change', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('Changed' as ConfectionName);

      const changes = wrapper.getChanges(entity);
      expect(changes.nameChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('detects description change', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setDescription('New description');

      expect(wrapper.getChanges(entity).descriptionChanged).toBe(true);
    });

    test('detects tags change', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setTags(['new-tag']);

      expect(wrapper.getChanges(entity).tagsChanged).toBe(true);
    });

    test('detects urls change', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setUrls([{ category: 'recipe' as UrlCategory, url: 'https://example.com' }]);

      expect(wrapper.getChanges(entity).urlsChanged).toBe(true);
    });

    test('detects goldenVariationSpec change', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [makeMoldedBonBonVariation('v1'), makeMoldedBonBonVariation('v2')]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setGoldenVariationSpec('v2' as ConfectionRecipeVariationSpec);

      expect(wrapper.getChanges(entity).goldenVariationSpecChanged).toBe(true);
    });

    test('detects variations change on add', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.addVariation(makeMoldedBonBonVariation('v2'));

      expect(wrapper.getChanges(entity).variationsChanged).toBe(true);
    });

    test('detects tags change when lengths differ', () => {
      const entity = makeMoldedBonBonEntity({ tags: ['a', 'b'] });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setTags(['a']);

      expect(wrapper.getChanges(entity).tagsChanged).toBe(true);
    });

    test('detects tags change when content differs (same length)', () => {
      const entity = makeMoldedBonBonEntity({ tags: ['a', 'b'] });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setTags(['a', 'c']);

      expect(wrapper.getChanges(entity).tagsChanged).toBe(true);
    });

    test('no tags change when one side is undefined and other is undefined', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();

      expect(wrapper.getChanges(entity).tagsChanged).toBe(false);
    });

    test('no changes after undo restores original state', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('Changed' as ConfectionName);
      wrapper.undo();

      expect(wrapper.hasChanges(entity)).toBe(false);
    });
  });

  // ============================================================================
  // Variation-Level Setters
  // ============================================================================

  describe('setVariationYield', () => {
    test('sets yield on existing variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationYield('v1' as ConfectionRecipeVariationSpec, {
          numPieces: 50,
          weightPerPiece: 15 as Measurement
        })
      ).toSucceed();
      expect((wrapper.variations[0] as Confections.IRolledTruffleRecipeVariationEntity).yield.numPieces).toBe(
        50
      );
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationYield('nope' as ConfectionRecipeVariationSpec, {
          numPieces: 50,
          weightPerPiece: 15 as Measurement
        })
      ).toFailWith(/does not exist/);
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationYield('v1' as ConfectionRecipeVariationSpec, {
        numPieces: 50,
        weightPerPiece: 15 as Measurement
      });
      wrapper.undo();
      expect((wrapper.variations[0] as Confections.IRolledTruffleRecipeVariationEntity).yield.numPieces).toBe(
        30
      );
    });
  });

  describe('setVariationFillings', () => {
    test('sets fillings on existing variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const fillings: Confections.IFillingSlotEntity[] = [
        {
          slotId: 'center' as SlotId,
          filling: {
            options: [{ type: 'recipe' as const, id: 'filling-1' as unknown as FillingId }],
            preferredId: 'filling-1' as unknown as FillingId
          }
        }
      ];
      expect(wrapper.setVariationFillings('v1' as ConfectionRecipeVariationSpec, fillings)).toSucceed();
      expect(wrapper.variations[0].fillings).toHaveLength(1);
    });

    test('clears fillings when undefined', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: {
                  options: [{ type: 'recipe' as const, id: 'filling-1' as unknown as FillingId }],
                  preferredId: 'filling-1' as unknown as FillingId
                }
              }
            ]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationFillings('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      expect(wrapper.variations[0].fillings).toBeUndefined();
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationFillings('nope' as ConfectionRecipeVariationSpec, [])).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationFillings('v1' as ConfectionRecipeVariationSpec, [
        {
          slotId: 'center' as SlotId,
          filling: {
            options: [{ type: 'recipe' as const, id: 'filling-1' as unknown as FillingId }],
            preferredId: 'filling-1' as unknown as FillingId
          }
        }
      ]);
      wrapper.undo();
      expect(wrapper.variations[0].fillings).toBeUndefined();
    });
  });

  describe('setVariationCoatings', () => {
    test('sets coatings on rolled truffle variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const coatings: Confections.ICoatingsEntity = {
        ids: ['cocoa-powder' as IngredientId],
        preferredId: 'cocoa-powder' as IngredientId
      };
      expect(wrapper.setVariationCoatings('v1' as ConfectionRecipeVariationSpec, coatings)).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.coatings?.preferredId).toBe('cocoa-powder');
      }
    });

    test('clears coatings when undefined', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            coatings: { ids: ['cocoa-powder' as IngredientId], preferredId: 'cocoa-powder' as IngredientId }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationCoatings('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.coatings).toBeUndefined();
      }
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationCoatings('nope' as ConfectionRecipeVariationSpec, undefined)).toFailWith(
        /does not exist/
      );
    });

    test('fails for non-rolled-truffle variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationCoatings('v1' as ConfectionRecipeVariationSpec, undefined)).toFailWith(
        /not a rolled truffle/
      );
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationCoatings('v1' as ConfectionRecipeVariationSpec, {
        ids: ['cocoa-powder' as IngredientId],
        preferredId: 'cocoa-powder' as IngredientId
      });
      wrapper.undo();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.coatings).toBeUndefined();
      }
    });
  });

  describe('setVariationEnrobingChocolate', () => {
    test('sets enrobing chocolate on rolled truffle variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const choc: Confections.IChocolateSpec = {
        ids: ['dark-70' as IngredientId],
        preferredId: 'dark-70' as IngredientId
      };
      expect(wrapper.setVariationEnrobingChocolate('v1' as ConfectionRecipeVariationSpec, choc)).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.enrobingChocolate?.preferredId).toBe('dark-70');
      }
    });

    test('sets enrobing chocolate on bar truffle variation', () => {
      const entity = makeBarTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const choc: Confections.IChocolateSpec = {
        ids: ['milk-40' as IngredientId],
        preferredId: 'milk-40' as IngredientId
      };
      expect(wrapper.setVariationEnrobingChocolate('v1' as ConfectionRecipeVariationSpec, choc)).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isBarTruffleRecipeVariationEntity(v)) {
        expect(v.enrobingChocolate?.preferredId).toBe('milk-40');
      }
    });

    test('clears enrobing chocolate when undefined', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            enrobingChocolate: { ids: ['dark-70' as IngredientId], preferredId: 'dark-70' as IngredientId }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationEnrobingChocolate('v1' as ConfectionRecipeVariationSpec, undefined)
      ).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.enrobingChocolate).toBeUndefined();
      }
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationEnrobingChocolate('nope' as ConfectionRecipeVariationSpec, undefined)
      ).toFailWith(/does not exist/);
    });

    test('fails for molded bonbon variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationEnrobingChocolate('v1' as ConfectionRecipeVariationSpec, undefined)
      ).toFailWith(/does not support enrobing/);
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationEnrobingChocolate('v1' as ConfectionRecipeVariationSpec, {
        ids: ['dark-70' as IngredientId],
        preferredId: 'dark-70' as IngredientId
      });
      wrapper.undo();
      const v = wrapper.variations[0];
      if (Confections.isRolledTruffleRecipeVariationEntity(v)) {
        expect(v.enrobingChocolate).toBeUndefined();
      }
    });
  });

  describe('setVariationProcedures', () => {
    test('sets procedures on existing variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const procedures = {
        options: [{ id: 'proc-1' as ProcedureId }],
        preferredId: 'proc-1' as ProcedureId
      };
      expect(wrapper.setVariationProcedures('v1' as ConfectionRecipeVariationSpec, procedures)).toSucceed();
      expect(wrapper.variations[0].procedures?.preferredId).toBe('proc-1');
    });

    test('clears procedures when undefined', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            procedures: { options: [{ id: 'proc-1' as ProcedureId }], preferredId: 'proc-1' as ProcedureId }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationProcedures('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      expect(wrapper.variations[0].procedures).toBeUndefined();
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationProcedures('nope' as ConfectionRecipeVariationSpec, undefined)).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationProcedures('v1' as ConfectionRecipeVariationSpec, {
        options: [{ id: 'proc-1' as ProcedureId }],
        preferredId: 'proc-1' as ProcedureId
      });
      wrapper.undo();
      expect(wrapper.variations[0].procedures).toBeUndefined();
    });
  });

  describe('setVariationNotes', () => {
    test('sets notes on existing variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const notes = [{ category: 'general' as NoteCategory, note: 'Test note' }];
      expect(wrapper.setVariationNotes('v1' as ConfectionRecipeVariationSpec, notes)).toSucceed();
      expect(wrapper.variations[0].notes).toHaveLength(1);
    });

    test('clears notes when undefined', () => {
      const entity = makeRolledTruffleEntity({
        variations: [
          makeRolledTruffleVariation('v1', {
            notes: [{ category: 'general' as NoteCategory, note: 'Test note' }]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationNotes('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      expect(wrapper.variations[0].notes).toBeUndefined();
    });

    test('fails for non-existent variation', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationNotes('nope' as ConfectionRecipeVariationSpec, undefined)).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationNotes('v1' as ConfectionRecipeVariationSpec, [
        { category: 'general' as NoteCategory, note: 'Test note' }
      ]);
      wrapper.undo();
      expect(wrapper.variations[0].notes).toBeUndefined();
    });
  });

  // ============================================================================
  // snapshot / restoreSnapshot
  // ============================================================================

  describe('snapshot', () => {
    test('snapshot returns deep copy of current state', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setName('Modified' as ConfectionName);

      const snap = wrapper.snapshot;
      expect(snap.name).toBe('Modified' as ConfectionName);
    });

    test('restoreSnapshot restores state and supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const snap = wrapper.snapshot;

      wrapper.setName('Changed' as ConfectionName);
      wrapper.restoreSnapshot(snap);

      expect(wrapper.name).toBe('Test BonBon' as ConfectionName);
      expect(wrapper.canUndo()).toBe(true);
    });
  });

  // ============================================================================
  // setVariationMolds
  // ============================================================================

  describe('setVariationMolds', () => {
    test('sets molds on molded bonbon variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const molds = {
        options: [makeMoldRef('new-mold')],
        preferredId: 'new-mold' as MoldId
      };
      expect(wrapper.setVariationMolds('v1' as ConfectionRecipeVariationSpec, molds)).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.molds.preferredId).toBe('new-mold');
        expect(v.molds.options).toHaveLength(1);
      }
    });

    test('fails when variation does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const molds = { options: [makeMoldRef('m')], preferredId: 'm' as MoldId };
      expect(wrapper.setVariationMolds('nope' as ConfectionRecipeVariationSpec, molds)).toFailWith(
        /does not exist/
      );
    });

    test('fails when variation is not a molded bonbon', () => {
      const entity = makeBarTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const molds = { options: [makeMoldRef('m')], preferredId: 'm' as MoldId };
      expect(wrapper.setVariationMolds('v1' as ConfectionRecipeVariationSpec, molds)).toFailWith(
        /not a molded bon-bon/
      );
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const molds = { options: [makeMoldRef('new-mold')], preferredId: 'new-mold' as MoldId };
      wrapper.setVariationMolds('v1' as ConfectionRecipeVariationSpec, molds);
      wrapper.undo();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.molds.preferredId).toBe('round-mold');
      }
    });
  });

  // ============================================================================
  // setVariationShellChocolate
  // ============================================================================

  describe('setVariationShellChocolate', () => {
    test('sets shell chocolate on molded bonbon variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const shellChocolate = makeChocolateSpec('milk-40');
      expect(
        wrapper.setVariationShellChocolate('v1' as ConfectionRecipeVariationSpec, shellChocolate)
      ).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.shellChocolate.preferredId).toBe('milk-40');
      }
    });

    test('fails when variation does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationShellChocolate('nope' as ConfectionRecipeVariationSpec, makeChocolateSpec('x'))
      ).toFailWith(/does not exist/);
    });

    test('fails when variation is not a molded bonbon', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationShellChocolate('v1' as ConfectionRecipeVariationSpec, makeChocolateSpec('x'))
      ).toFailWith(/not a molded bon-bon/);
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      wrapper.setVariationShellChocolate('v1' as ConfectionRecipeVariationSpec, makeChocolateSpec('milk-40'));
      wrapper.undo();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.shellChocolate.preferredId).toBe('dark-70');
      }
    });
  });

  // ============================================================================
  // setVariationAdditionalChocolates
  // ============================================================================

  describe('setVariationAdditionalChocolates', () => {
    test('sets additional chocolates on molded bonbon variation', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const additionalChocolates: Confections.IAdditionalChocolateEntity[] = [
        {
          chocolate: { ids: ['white-30' as IngredientId], preferredId: 'white-30' as IngredientId },
          purpose: 'seal'
        }
      ];
      expect(
        wrapper.setVariationAdditionalChocolates('v1' as ConfectionRecipeVariationSpec, additionalChocolates)
      ).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.additionalChocolates).toHaveLength(1);
        expect(v.additionalChocolates![0].purpose).toBe('seal');
      }
    });

    test('clears additional chocolates when undefined', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            additionalChocolates: [
              {
                chocolate: { ids: ['white-30' as IngredientId], preferredId: 'white-30' as IngredientId },
                purpose: 'seal'
              }
            ]
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationAdditionalChocolates('v1' as ConfectionRecipeVariationSpec, undefined)
      ).toSucceed();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.additionalChocolates).toBeUndefined();
      }
    });

    test('fails when variation does not exist', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(
        wrapper.setVariationAdditionalChocolates('nope' as ConfectionRecipeVariationSpec, [])
      ).toFailWith(/does not exist/);
    });

    test('fails when variation is not a molded bonbon', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationAdditionalChocolates('v1' as ConfectionRecipeVariationSpec, [])).toFailWith(
        /not a molded bon-bon/
      );
    });

    test('supports undo', () => {
      const entity = makeMoldedBonBonEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const additionalChocolates: Confections.IAdditionalChocolateEntity[] = [
        {
          chocolate: { ids: ['white-30' as IngredientId], preferredId: 'white-30' as IngredientId },
          purpose: 'seal'
        }
      ];
      wrapper.setVariationAdditionalChocolates('v1' as ConfectionRecipeVariationSpec, additionalChocolates);
      wrapper.undo();
      const v = wrapper.variations[0];
      if (Confections.isMoldedBonBonRecipeVariationEntity(v)) {
        expect(v.additionalChocolates).toBeUndefined();
      }
    });
  });

  // ============================================================================
  // setVariationDecorations
  // ============================================================================

  describe('setVariationDecorations', () => {
    test('sets decorations on any variation type', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const decorations = {
        options: [{ id: 'dec-1' as DecorationId }],
        preferredId: 'dec-1' as DecorationId
      };
      expect(wrapper.setVariationDecorations('v1' as ConfectionRecipeVariationSpec, decorations)).toSucceed();
      expect(wrapper.variations[0].decorations?.preferredId).toBe('dec-1');
    });

    test('clears decorations when undefined', () => {
      const entity = makeMoldedBonBonEntity({
        variations: [
          makeMoldedBonBonVariation('v1', {
            decorations: {
              options: [{ id: 'dec-1' as DecorationId }],
              preferredId: 'dec-1' as DecorationId
            }
          })
        ]
      });
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationDecorations('v1' as ConfectionRecipeVariationSpec, undefined)).toSucceed();
      expect(wrapper.variations[0].decorations).toBeUndefined();
    });

    test('fails when variation does not exist', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      expect(wrapper.setVariationDecorations('nope' as ConfectionRecipeVariationSpec, undefined)).toFailWith(
        /does not exist/
      );
    });

    test('supports undo', () => {
      const entity = makeRolledTruffleEntity();
      const wrapper = EditedConfectionRecipe.create(entity).orThrow();
      const decorations = {
        options: [{ id: 'dec-1' as DecorationId }],
        preferredId: 'dec-1' as DecorationId
      };
      wrapper.setVariationDecorations('v1' as ConfectionRecipeVariationSpec, decorations);
      wrapper.undo();
      expect(wrapper.variations[0].decorations).toBeUndefined();
    });
  });
});
