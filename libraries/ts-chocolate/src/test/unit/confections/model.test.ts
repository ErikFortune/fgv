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
  ConfectionData,
  IBarTruffle,
  IMoldedBonBon,
  IRolledTruffle,
  isBarTruffle,
  isMoldedBonBon,
  isRolledTruffle
} from '../../../packlets/confections';
import {
  BaseConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  IngredientId,
  MoldId,
  RecipeId,
  SlotId
} from '../../../packlets/common';
import { Grams, Millimeters } from '../../../packlets/common';

describe('Confections model', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const baseMoldedBonBon: IMoldedBonBon = {
    baseId: 'dark-dome-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Classic Dark Dome Bonbon' as ConfectionName,
    description: 'Traditional molded dark chocolate bonbon with dome shape',
    tags: ['classic', 'dark', 'molded', 'dome'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
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
    molds: {
      options: [{ id: 'common.dome-25mm' as MoldId }],
      preferredId: 'common.dome-25mm' as MoldId
    },
    shellChocolate: {
      ids: ['cacao-barry.guayaquil-64' as IngredientId, 'common.chocolate-dark-64' as IngredientId],
      preferredId: 'cacao-barry.guayaquil-64' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Basic dome bonbon with dark ganache filling'
      }
    ]
  };

  const baseBarTruffle: IBarTruffle = {
    baseId: 'dark-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Classic Dark Bar Truffle' as ConfectionName,
    description: 'Ganache slab cut into squares and enrobed',
    tags: ['classic', 'dark', 'bar', 'enrobed'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10 as Grams
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
      ids: ['cacao-barry.guayaquil-64' as IngredientId],
      preferredId: 'cacao-barry.guayaquil-64' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Standard 25mm square bar truffles'
      }
    ]
  };

  const baseRolledTruffle: IRolledTruffle = {
    baseId: 'dark-cocoa-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Classic Cocoa-Dusted Truffle' as ConfectionName,
    description: 'Hand-rolled ganache truffle dusted with cocoa powder',
    tags: ['classic', 'dark', 'rolled', 'cocoa'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 40,
      unit: 'pieces',
      weightPerPiece: 15 as Grams
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
    coatings: {
      ids: ['common.cocoa-powder' as IngredientId],
      preferredId: 'common.cocoa-powder' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Traditional rolled truffle with cocoa coating'
      }
    ]
  };

  // ============================================================================
  // Type Guards
  // ============================================================================

  describe('type guards', () => {
    describe('isMoldedBonBon', () => {
      test('returns true for molded bonbon', () => {
        expect(isMoldedBonBon(baseMoldedBonBon)).toBe(true);
      });

      test('returns false for bar truffle', () => {
        expect(isMoldedBonBon(baseBarTruffle)).toBe(false);
      });

      test('returns false for rolled truffle', () => {
        expect(isMoldedBonBon(baseRolledTruffle)).toBe(false);
      });
    });

    describe('isBarTruffle', () => {
      test('returns true for bar truffle', () => {
        expect(isBarTruffle(baseBarTruffle)).toBe(true);
      });

      test('returns false for molded bonbon', () => {
        expect(isBarTruffle(baseMoldedBonBon)).toBe(false);
      });

      test('returns false for rolled truffle', () => {
        expect(isBarTruffle(baseRolledTruffle)).toBe(false);
      });
    });

    describe('isRolledTruffle', () => {
      test('returns true for rolled truffle', () => {
        expect(isRolledTruffle(baseRolledTruffle)).toBe(true);
      });

      test('returns false for molded bonbon', () => {
        expect(isRolledTruffle(baseMoldedBonBon)).toBe(false);
      });

      test('returns false for bar truffle', () => {
        expect(isRolledTruffle(baseBarTruffle)).toBe(false);
      });
    });

    describe('type narrowing', () => {
      test('narrows correctly for molded bonbon', () => {
        const confection: ConfectionData = baseMoldedBonBon;
        if (isMoldedBonBon(confection)) {
          // TypeScript should know this is IMoldedBonBon
          expect(confection.molds).toBeDefined();
          expect(confection.shellChocolate).toBeDefined();
        } else {
          fail('Expected isMoldedBonBon to return true');
        }
      });

      test('narrows correctly for bar truffle', () => {
        const confection: ConfectionData = baseBarTruffle;
        if (isBarTruffle(confection)) {
          // TypeScript should know this is IBarTruffle
          expect(confection.frameDimensions).toBeDefined();
          expect(confection.singleBonBonDimensions).toBeDefined();
        } else {
          fail('Expected isBarTruffle to return true');
        }
      });

      test('narrows correctly for rolled truffle', () => {
        const confection: ConfectionData = baseRolledTruffle;
        if (isRolledTruffle(confection)) {
          // TypeScript should know this is IRolledTruffle
          expect(confection.coatings).toBeDefined();
        } else {
          fail('Expected isRolledTruffle to return true');
        }
      });
    });
  });

  // ============================================================================
  // Interface Structure
  // ============================================================================

  describe('interface structure', () => {
    describe('IMoldedBonBon', () => {
      test('has required properties', () => {
        expect(baseMoldedBonBon.baseId).toBe('dark-dome-bonbon');
        expect(baseMoldedBonBon.confectionType).toBe('molded-bonbon');
        expect(baseMoldedBonBon.name).toBe('Classic Dark Dome Bonbon');
        expect(baseMoldedBonBon.molds).toBeDefined();
        expect(baseMoldedBonBon.shellChocolate).toBeDefined();
        expect(baseMoldedBonBon.versions).toHaveLength(1);
        expect(baseMoldedBonBon.goldenVersionSpec).toBe('2026-01-01-01');
      });

      test('has optional properties', () => {
        expect(baseMoldedBonBon.description).toBeDefined();
        expect(baseMoldedBonBon.tags).toBeDefined();
        expect(baseMoldedBonBon.fillings).toBeDefined();
        expect(baseMoldedBonBon.additionalChocolates).toBeUndefined();
      });

      test('molds structure is correct', () => {
        expect(baseMoldedBonBon.molds.options).toHaveLength(1);
        expect(baseMoldedBonBon.molds.options[0].id).toBe('common.dome-25mm');
        expect(baseMoldedBonBon.molds.preferredId).toBe('common.dome-25mm');
      });

      test('shellChocolate structure is correct', () => {
        expect(baseMoldedBonBon.shellChocolate.ids).toHaveLength(2);
        expect(baseMoldedBonBon.shellChocolate.ids[0]).toBe('cacao-barry.guayaquil-64');
        expect(baseMoldedBonBon.shellChocolate.preferredId).toBe('cacao-barry.guayaquil-64');
      });
    });

    describe('IBarTruffle', () => {
      test('has required properties', () => {
        expect(baseBarTruffle.baseId).toBe('dark-bar-truffle');
        expect(baseBarTruffle.confectionType).toBe('bar-truffle');
        expect(baseBarTruffle.name).toBe('Classic Dark Bar Truffle');
        expect(baseBarTruffle.frameDimensions).toBeDefined();
        expect(baseBarTruffle.singleBonBonDimensions).toBeDefined();
        expect(baseBarTruffle.versions).toHaveLength(1);
      });

      test('has optional properties', () => {
        expect(baseBarTruffle.enrobingChocolate).toBeDefined();
      });

      test('frame dimensions structure is correct', () => {
        expect(baseBarTruffle.frameDimensions.width).toBe(300);
        expect(baseBarTruffle.frameDimensions.height).toBe(200);
        expect(baseBarTruffle.frameDimensions.depth).toBe(8);
      });

      test('single bonbon dimensions structure is correct', () => {
        expect(baseBarTruffle.singleBonBonDimensions.width).toBe(25);
        expect(baseBarTruffle.singleBonBonDimensions.height).toBe(25);
      });
    });

    describe('IRolledTruffle', () => {
      test('has required properties', () => {
        expect(baseRolledTruffle.baseId).toBe('dark-cocoa-truffle');
        expect(baseRolledTruffle.confectionType).toBe('rolled-truffle');
        expect(baseRolledTruffle.name).toBe('Classic Cocoa-Dusted Truffle');
        expect(baseRolledTruffle.versions).toHaveLength(1);
      });

      test('has optional properties', () => {
        expect(baseRolledTruffle.coatings).toBeDefined();
        expect(baseRolledTruffle.enrobingChocolate).toBeUndefined();
      });

      test('coatings structure is correct', () => {
        expect(baseRolledTruffle.coatings?.ids).toHaveLength(1);
        expect(baseRolledTruffle.coatings?.ids[0]).toBe('common.cocoa-powder');
        expect(baseRolledTruffle.coatings?.preferredId).toBe('common.cocoa-powder');
      });
    });

    describe('IConfectionYield', () => {
      test('structure is correct', () => {
        expect(baseMoldedBonBon.yield.count).toBe(24);
        expect(baseMoldedBonBon.yield.unit).toBe('pieces');
        expect(baseMoldedBonBon.yield.weightPerPiece).toBe(12);
      });
    });

    describe('IFillingSlot', () => {
      test('structure is correct', () => {
        expect(baseMoldedBonBon.fillings).toHaveLength(1);
        const slot = baseMoldedBonBon.fillings?.[0];
        expect(slot?.slotId).toBe('center');
        expect(slot?.filling.options).toHaveLength(1);
        expect(slot?.filling.preferredId).toBe('common.dark-ganache-classic');
      });
    });

    describe('IConfectionVersion', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.versionSpec).toBe('2026-01-01-01');
        expect(version.createdDate).toBe('2026-01-01');
        expect(version.notes).toBeDefined();
      });
    });
  });
});
