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
  ConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  Grams,
  IngredientId,
  Millimeters,
  MoldId,
  RecipeId,
  SlotId
} from '../../../packlets/common';
import { IMoldedBonBon, IBarTruffle, IRolledTruffle } from '../../../packlets/confections';
import {
  RuntimeConfection,
  RuntimeMoldedBonBon,
  RuntimeBarTruffle,
  RuntimeRolledTruffle,
  IConfectionContext
} from '../../../packlets/runtime';

describe('RuntimeConfection', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const moldedBonBonData: IMoldedBonBon = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Bonbon' as ConfectionName,
    description: 'A test molded bonbon',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    tags: ['test', 'bonbon'],
    yield: {
      count: 24,
      unit: 'pieces',
      weightPerPiece: 12 as Grams
    },
    fillings: [
      {
        slotId: 'center' as SlotId,
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' as RecipeId }],
          preferredId: 'common.dark-ganache-classic' as RecipeId
        }
      }
    ],
    decorations: [{ description: 'Gold leaf', preferred: true }, { description: 'Cocoa butter transfer' }],
    molds: {
      options: [{ id: 'common.dome-25mm' as MoldId }],
      preferredId: 'common.dome-25mm' as MoldId
    },
    shellChocolate: {
      ingredientId: 'common.chocolate-dark-64' as IngredientId,
      alternateIngredientIds: ['common.chocolate-dark-70' as IngredientId]
    },
    additionalChocolates: [
      {
        ingredientId: 'common.chocolate-dark-64' as IngredientId,
        purpose: 'seal'
      }
    ],
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Initial version'
      },
      {
        versionSpec: '2026-01-02-01' as ConfectionVersionSpec,
        createdDate: '2026-01-02',
        notes: 'Updated recipe'
      }
    ]
  };

  const barTruffleData: IBarTruffle = {
    baseId: 'test-bar' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    description: 'A test bar truffle',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10 as Grams
    },
    frameDimensions: {
      width: 300 as Millimeters,
      height: 200 as Millimeters,
      depth: 8 as Millimeters
    },
    singleBonBonDimensions: {
      width: 25 as Millimeters,
      height: 25 as Millimeters
    },
    enrobingChocolate: {
      ingredientId: 'common.chocolate-dark-64' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01'
      }
    ]
  };

  const rolledTruffleData: IRolledTruffle = {
    baseId: 'test-rolled' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 40,
      unit: 'pieces'
    },
    enrobingChocolate: {
      ingredientId: 'common.chocolate-dark-64' as IngredientId
    },
    coatings: {
      ingredients: [{ ingredientId: 'common.cocoa-powder' as IngredientId }],
      recommendedIngredientId: 'common.cocoa-powder' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01'
      }
    ]
  };

  // Minimal context for testing
  const mockContext: IConfectionContext = {
    getConfection: () => {
      throw new Error('Not implemented in test context');
    }
  };

  // ============================================================================
  // RuntimeConfection Factory
  // ============================================================================

  describe('RuntimeConfection.create', () => {
    test('creates RuntimeMoldedBonBon for molded-bonbon type', () => {
      expect(
        RuntimeConfection.create(mockContext, 'test.test-bonbon' as ConfectionId, moldedBonBonData)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime).toBeInstanceOf(RuntimeMoldedBonBon);
        expect(runtime.confectionType).toBe('molded-bonbon');
      });
    });

    test('creates RuntimeBarTruffle for bar-truffle type', () => {
      expect(
        RuntimeConfection.create(mockContext, 'test.test-bar' as ConfectionId, barTruffleData)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime).toBeInstanceOf(RuntimeBarTruffle);
        expect(runtime.confectionType).toBe('bar-truffle');
      });
    });

    test('creates RuntimeRolledTruffle for rolled-truffle type', () => {
      expect(
        RuntimeConfection.create(mockContext, 'test.test-rolled' as ConfectionId, rolledTruffleData)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime).toBeInstanceOf(RuntimeRolledTruffle);
        expect(runtime.confectionType).toBe('rolled-truffle');
      });
    });
  });

  // ============================================================================
  // RuntimeMoldedBonBon
  // ============================================================================

  describe('RuntimeMoldedBonBon', () => {
    let runtime: RuntimeMoldedBonBon;

    beforeEach(() => {
      runtime = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon' as ConfectionId,
        moldedBonBonData
      ).orThrow();
    });

    test('exposes identity properties', () => {
      expect(runtime.id).toBe('test.test-bonbon');
      expect(runtime.sourceId).toBe('test');
      expect(runtime.baseId).toBe('test-bonbon');
    });

    test('exposes core confection properties', () => {
      expect(runtime.name).toBe('Test Bonbon');
      expect(runtime.description).toBe('A test molded bonbon');
      expect(runtime.confectionType).toBe('molded-bonbon');
      expect(runtime.tags).toEqual(['test', 'bonbon']);
    });

    test('exposes yield properties', () => {
      expect(runtime.yield.count).toBe(24);
      expect(runtime.yield.unit).toBe('pieces');
      expect(runtime.yield.weightPerPiece).toBe(12);
    });

    test('exposes decorations', () => {
      expect(runtime.decorations).toHaveLength(2);
      expect(runtime.decorations?.[0].description).toBe('Gold leaf');
      expect(runtime.decorations?.[0].preferred).toBe(true);
    });

    test('exposes fillings', () => {
      expect(runtime.fillings).toHaveLength(1);
      const slot = runtime.fillings?.[0];
      expect(slot?.slotId).toBe('center');
      expect(slot?.filling.options[0].id).toBe('common.dark-ganache-classic');
      expect(slot?.filling.preferredId).toBe('common.dark-ganache-classic');
    });

    test('exposes version properties', () => {
      expect(runtime.goldenVersionSpec).toBe('2026-01-01-01');
      expect(runtime.goldenVersion.versionSpec).toBe('2026-01-01-01');
      expect(runtime.goldenVersion.notes).toBe('Initial version');
      expect(runtime.versions).toHaveLength(2);
    });

    test('getVersion returns version for valid spec', () => {
      expect(runtime.getVersion('2026-01-02-01' as ConfectionVersionSpec)).toSucceedAndSatisfy((version) => {
        expect(version.notes).toBe('Updated recipe');
      });
    });

    test('getVersion fails for invalid spec', () => {
      expect(runtime.getVersion('9999-99-99-99' as ConfectionVersionSpec)).toFailWith(/not found/i);
    });

    test('exposes molded bonbon-specific properties', () => {
      expect(runtime.molds.options).toHaveLength(1);
      expect(runtime.molds.preferredId).toBe('common.dome-25mm');
      expect(runtime.shellChocolate.ingredientId).toBe('common.chocolate-dark-64');
      expect(runtime.shellChocolate.alternateIngredientIds).toContain('common.chocolate-dark-70');
      expect(runtime.additionalChocolates).toHaveLength(1);
      expect(runtime.additionalChocolates?.[0].purpose).toBe('seal');
    });

    test('type guards work correctly', () => {
      expect(runtime.isMoldedBonBon()).toBe(true);
      expect(runtime.isBarTruffle()).toBe(false);
      expect(runtime.isRolledTruffle()).toBe(false);
    });

    test('raw returns underlying data', () => {
      expect(runtime.raw).toBe(moldedBonBonData);
    });

    test('confectionProcedures is undefined when not set', () => {
      expect(runtime.confectionProcedures).toBeUndefined();
    });
  });

  // ============================================================================
  // RuntimeBarTruffle
  // ============================================================================

  describe('RuntimeBarTruffle', () => {
    let runtime: RuntimeBarTruffle;

    beforeEach(() => {
      runtime = RuntimeBarTruffle.create(
        mockContext,
        'test.test-bar' as ConfectionId,
        barTruffleData
      ).orThrow();
    });

    test('exposes identity properties', () => {
      expect(runtime.id).toBe('test.test-bar');
      expect(runtime.sourceId).toBe('test');
      expect(runtime.baseId).toBe('test-bar');
    });

    test('exposes core confection properties', () => {
      expect(runtime.name).toBe('Test Bar Truffle');
      expect(runtime.confectionType).toBe('bar-truffle');
    });

    test('exposes bar truffle-specific properties', () => {
      expect(runtime.frameDimensions.width).toBe(300);
      expect(runtime.frameDimensions.height).toBe(200);
      expect(runtime.frameDimensions.depth).toBe(8);
      expect(runtime.singleBonBonDimensions.width).toBe(25);
      expect(runtime.singleBonBonDimensions.height).toBe(25);
      expect(runtime.enrobingChocolate?.ingredientId).toBe('common.chocolate-dark-64');
    });

    test('type guards work correctly', () => {
      expect(runtime.isMoldedBonBon()).toBe(false);
      expect(runtime.isBarTruffle()).toBe(true);
      expect(runtime.isRolledTruffle()).toBe(false);
    });

    test('raw returns underlying data', () => {
      expect(runtime.raw).toBe(barTruffleData);
    });
  });

  // ============================================================================
  // RuntimeRolledTruffle
  // ============================================================================

  describe('RuntimeRolledTruffle', () => {
    let runtime: RuntimeRolledTruffle;

    beforeEach(() => {
      runtime = RuntimeRolledTruffle.create(
        mockContext,
        'test.test-rolled' as ConfectionId,
        rolledTruffleData
      ).orThrow();
    });

    test('exposes identity properties', () => {
      expect(runtime.id).toBe('test.test-rolled');
      expect(runtime.sourceId).toBe('test');
      expect(runtime.baseId).toBe('test-rolled');
    });

    test('exposes core confection properties', () => {
      expect(runtime.name).toBe('Test Rolled Truffle');
      expect(runtime.confectionType).toBe('rolled-truffle');
    });

    test('exposes rolled truffle-specific properties', () => {
      expect(runtime.enrobingChocolate?.ingredientId).toBe('common.chocolate-dark-64');
      expect(runtime.coatings?.ingredients).toHaveLength(1);
      expect(runtime.coatings?.recommendedIngredientId).toBe('common.cocoa-powder');
    });

    test('type guards work correctly', () => {
      expect(runtime.isMoldedBonBon()).toBe(false);
      expect(runtime.isBarTruffle()).toBe(false);
      expect(runtime.isRolledTruffle()).toBe(true);
    });

    test('raw returns underlying data', () => {
      expect(runtime.raw).toBe(rolledTruffleData);
    });
  });

  // ============================================================================
  // Confection Without Optional Properties
  // ============================================================================

  describe('confection without optional properties', () => {
    const minimalMolded: IMoldedBonBon = {
      baseId: 'minimal' as BaseConfectionId,
      confectionType: 'molded-bonbon',
      name: 'Minimal Bonbon' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      yield: { count: 12 },
      molds: {
        options: [{ id: 'common.dome-25mm' as MoldId }]
      },
      shellChocolate: {
        ingredientId: 'common.chocolate-dark-64' as IngredientId
      },
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01'
        }
      ]
    };

    test('handles missing optional properties', () => {
      expect(
        RuntimeMoldedBonBon.create(mockContext, 'test.minimal' as ConfectionId, minimalMolded)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime.description).toBeUndefined();
        expect(runtime.tags).toBeUndefined();
        expect(runtime.decorations).toBeUndefined();
        expect(runtime.fillings).toBeUndefined();
        expect(runtime.additionalChocolates).toBeUndefined();
        expect(runtime.confectionProcedures).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Bar Truffle Without Enrobing
  // ============================================================================

  describe('bar truffle without enrobing chocolate', () => {
    const barWithoutEnrobing: IBarTruffle = {
      baseId: 'no-enrobing' as BaseConfectionId,
      confectionType: 'bar-truffle',
      name: 'Bar Without Enrobing' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      yield: { count: 24 },
      frameDimensions: {
        width: 200 as Millimeters,
        height: 150 as Millimeters,
        depth: 10 as Millimeters
      },
      singleBonBonDimensions: {
        width: 20 as Millimeters,
        height: 20 as Millimeters
      },
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01'
        }
      ]
    };

    test('handles missing enrobing chocolate', () => {
      expect(
        RuntimeBarTruffle.create(mockContext, 'test.no-enrobing' as ConfectionId, barWithoutEnrobing)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime.enrobingChocolate).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Rolled Truffle Without Coatings
  // ============================================================================

  describe('rolled truffle without coatings', () => {
    const rolledWithoutCoatings: IRolledTruffle = {
      baseId: 'no-coatings' as BaseConfectionId,
      confectionType: 'rolled-truffle',
      name: 'Rolled Without Coatings' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      yield: { count: 30 },
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01'
        }
      ]
    };

    test('handles missing coatings and enrobing', () => {
      expect(
        RuntimeRolledTruffle.create(mockContext, 'test.no-coatings' as ConfectionId, rolledWithoutCoatings)
      ).toSucceedAndSatisfy((runtime) => {
        expect(runtime.coatings).toBeUndefined();
        expect(runtime.enrobingChocolate).toBeUndefined();
      });
    });
  });
});
