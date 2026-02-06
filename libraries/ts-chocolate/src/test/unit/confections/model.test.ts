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
import { Confections } from '../../../packlets/entities';
import {
  BaseConfectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  IngredientId,
  MoldId,
  FillingId,
  SlotId,
  Model as CommonModel
} from '../../../packlets/common';
import { Measurement, Millimeters } from '../../../packlets/common';

describe('Confections model', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const moldedBonBonVersion: Confections.IMoldedBonBonRecipeVariationEntity = {
    variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-01',
    notes: [
      { category: 'user', note: 'Basic dome bonbon with dark ganache filling' }
    ] as CommonModel.ICategorizedNote[],
    yield: {
      count: 24,
      unit: 'pieces',
      weightPerPiece: 12 as Measurement
    },
    fillings: [
      {
        slotId: 'center' as SlotId,
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' as FillingId }],
          preferredId: 'common.dark-ganache-classic' as FillingId
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
    }
  };

  const baseMoldedBonBon: Confections.MoldedBonBonRecipeEntity = {
    baseId: 'dark-dome-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Classic Dark Dome Bonbon' as ConfectionName,
    description: 'Traditional molded dark chocolate bonbon with dome shape',
    tags: ['classic', 'dark', 'molded', 'dome'],
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [moldedBonBonVersion]
  };

  const barTruffleVersion: Confections.IBarTruffleRecipeVariationEntity = {
    variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-01',
    notes: [
      { category: 'user', note: 'Standard 25mm square bar truffles' }
    ] as CommonModel.ICategorizedNote[],
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10 as Measurement
    },
    fillings: [
      {
        slotId: 'center' as SlotId,
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' as FillingId }],
          preferredId: 'common.dark-ganache-classic' as FillingId
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
    }
  };

  const baseBarTruffle: Confections.BarTruffleRecipeEntity = {
    baseId: 'dark-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Classic Dark Bar Truffle' as ConfectionName,
    description: 'Ganache slab cut into squares and enrobed',
    tags: ['classic', 'dark', 'bar', 'enrobed'],
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [barTruffleVersion]
  };

  const rolledTruffleVersion: Confections.IRolledTruffleRecipeVariationEntity = {
    variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    createdDate: '2026-01-01',
    notes: [
      { category: 'user', note: 'Traditional rolled truffle with cocoa coating' }
    ] as CommonModel.ICategorizedNote[],
    yield: {
      count: 40,
      unit: 'pieces',
      weightPerPiece: 15 as Measurement
    },
    fillings: [
      {
        slotId: 'center' as SlotId,
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' as FillingId }],
          preferredId: 'common.dark-ganache-classic' as FillingId
        }
      }
    ],
    coatings: {
      ids: ['common.cocoa-powder' as IngredientId],
      preferredId: 'common.cocoa-powder' as IngredientId
    }
  };

  const baseRolledTruffle: Confections.RolledTruffleRecipeEntity = {
    baseId: 'dark-cocoa-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Classic Cocoa-Dusted Truffle' as ConfectionName,
    description: 'Hand-rolled ganache truffle dusted with cocoa powder',
    tags: ['classic', 'dark', 'rolled', 'cocoa'],
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [rolledTruffleVersion]
  };

  // ============================================================================
  // Type Guards
  // ============================================================================

  describe('type guards', () => {
    describe('isMoldedBonBon', () => {
      test('returns true for molded bonbon', () => {
        expect(Confections.isMoldedBonBonRecipeEntity(baseMoldedBonBon)).toBe(true);
      });

      test('returns false for bar truffle', () => {
        expect(Confections.isMoldedBonBonRecipeEntity(baseBarTruffle)).toBe(false);
      });

      test('returns false for rolled truffle', () => {
        expect(Confections.isMoldedBonBonRecipeEntity(baseRolledTruffle)).toBe(false);
      });
    });

    describe('isBarTruffle', () => {
      test('returns true for bar truffle', () => {
        expect(Confections.isBarTruffleEntity(baseBarTruffle)).toBe(true);
      });

      test('returns false for molded bonbon', () => {
        expect(Confections.isBarTruffleEntity(baseMoldedBonBon)).toBe(false);
      });

      test('returns false for rolled truffle', () => {
        expect(Confections.isBarTruffleEntity(baseRolledTruffle)).toBe(false);
      });
    });

    describe('isRolledTruffle', () => {
      test('returns true for rolled truffle', () => {
        expect(Confections.isRolledTruffleRecipeEntity(baseRolledTruffle)).toBe(true);
      });

      test('returns false for molded bonbon', () => {
        expect(Confections.isRolledTruffleRecipeEntity(baseMoldedBonBon)).toBe(false);
      });

      test('returns false for bar truffle', () => {
        expect(Confections.isRolledTruffleRecipeEntity(baseBarTruffle)).toBe(false);
      });
    });

    describe('type narrowing', () => {
      test('narrows correctly for molded bonbon', () => {
        const confection: Confections.AnyConfectionRecipeEntity = baseMoldedBonBon;
        if (Confections.isMoldedBonBonRecipeEntity(confection)) {
          // TypeScript should know this is IMoldedBonBon
          const version = confection.variations[0];
          expect(version.molds).toBeDefined();
          expect(version.shellChocolate).toBeDefined();
        } else {
          fail('Expected isMoldedBonBon to return true');
        }
      });

      test('narrows correctly for bar truffle', () => {
        const confection: Confections.AnyConfectionRecipeEntity = baseBarTruffle;
        if (Confections.isBarTruffleEntity(confection)) {
          // TypeScript should know this is IBarTruffle
          const version = confection.variations[0];
          expect(version.frameDimensions).toBeDefined();
          expect(version.singleBonBonDimensions).toBeDefined();
        } else {
          fail('Expected isBarTruffle to return true');
        }
      });

      test('narrows correctly for rolled truffle', () => {
        const confection: Confections.AnyConfectionRecipeEntity = baseRolledTruffle;
        if (Confections.isRolledTruffleRecipeEntity(confection)) {
          // TypeScript should know this is IRolledTruffle
          const version = confection.variations[0];
          expect(version.coatings).toBeDefined();
        } else {
          fail('Expected isRolledTruffleEntity to return true');
        }
      });
    });

    describe('version type guards', () => {
      test('isMoldedBonBonVersion returns true for molded bonbon version', () => {
        expect(Confections.isMoldedBonBonRecipeVariationEntity(moldedBonBonVersion)).toBe(true);
        expect(Confections.isMoldedBonBonRecipeVariationEntity(barTruffleVersion)).toBe(false);
        expect(Confections.isMoldedBonBonRecipeVariationEntity(rolledTruffleVersion)).toBe(false);
      });

      test('isBarTruffleVersion returns true for bar truffle version', () => {
        expect(Confections.isBarTruffleRecipeVariationEntity(barTruffleVersion)).toBe(true);
        expect(Confections.isBarTruffleRecipeVariationEntity(moldedBonBonVersion)).toBe(false);
        expect(Confections.isBarTruffleRecipeVariationEntity(rolledTruffleVersion)).toBe(false);
      });

      test('isRolledTruffleVersion returns true for rolled truffle version', () => {
        expect(Confections.isRolledTruffleRecipeVariationEntity(rolledTruffleVersion)).toBe(true);
        expect(Confections.isRolledTruffleRecipeVariationEntity(moldedBonBonVersion)).toBe(false);
        expect(Confections.isRolledTruffleRecipeVariationEntity(barTruffleVersion)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Interface Structure
  // ============================================================================

  describe('interface structure', () => {
    describe('IMoldedBonBon', () => {
      test('has required base properties', () => {
        expect(baseMoldedBonBon.baseId).toBe('dark-dome-bonbon');
        expect(baseMoldedBonBon.confectionType).toBe('molded-bonbon');
        expect(baseMoldedBonBon.name).toBe('Classic Dark Dome Bonbon');
        expect(baseMoldedBonBon.variations).toHaveLength(1);
        expect(baseMoldedBonBon.goldenVariationSpec).toBe('2026-01-01-01');
      });

      test('has optional base properties', () => {
        expect(baseMoldedBonBon.description).toBeDefined();
        expect(baseMoldedBonBon.tags).toBeDefined();
      });

      test('version has required properties', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.molds).toBeDefined();
        expect(version.shellChocolate).toBeDefined();
        expect(version.yield).toBeDefined();
      });

      test('version has optional properties', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.fillings).toBeDefined();
        expect(version.additionalChocolates).toBeUndefined();
      });

      test('molds structure is correct', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.molds.options).toHaveLength(1);
        expect(version.molds.options[0].id).toBe('common.dome-25mm');
        expect(version.molds.preferredId).toBe('common.dome-25mm');
      });

      test('shellChocolate structure is correct', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.shellChocolate.ids).toHaveLength(2);
        expect(version.shellChocolate.ids[0]).toBe('cacao-barry.guayaquil-64');
        expect(version.shellChocolate.preferredId).toBe('cacao-barry.guayaquil-64');
      });
    });

    describe('IBarTruffle', () => {
      test('has required base properties', () => {
        expect(baseBarTruffle.baseId).toBe('dark-bar-truffle');
        expect(baseBarTruffle.confectionType).toBe('bar-truffle');
        expect(baseBarTruffle.name).toBe('Classic Dark Bar Truffle');
        expect(baseBarTruffle.variations).toHaveLength(1);
      });

      test('version has required properties', () => {
        const version = baseBarTruffle.variations[0];
        expect(version.frameDimensions).toBeDefined();
        expect(version.singleBonBonDimensions).toBeDefined();
        expect(version.yield).toBeDefined();
      });

      test('version has optional properties', () => {
        const version = baseBarTruffle.variations[0];
        expect(version.enrobingChocolate).toBeDefined();
      });

      test('frame dimensions structure is correct', () => {
        const version = baseBarTruffle.variations[0];
        expect(version.frameDimensions.width).toBe(300);
        expect(version.frameDimensions.height).toBe(200);
        expect(version.frameDimensions.depth).toBe(8);
      });

      test('single bonbon dimensions structure is correct', () => {
        const version = baseBarTruffle.variations[0];
        expect(version.singleBonBonDimensions.width).toBe(25);
        expect(version.singleBonBonDimensions.height).toBe(25);
      });
    });

    describe('IRolledTruffle', () => {
      test('has required base properties', () => {
        expect(baseRolledTruffle.baseId).toBe('dark-cocoa-truffle');
        expect(baseRolledTruffle.confectionType).toBe('rolled-truffle');
        expect(baseRolledTruffle.name).toBe('Classic Cocoa-Dusted Truffle');
        expect(baseRolledTruffle.variations).toHaveLength(1);
      });

      test('version has optional properties', () => {
        const version = baseRolledTruffle.variations[0];
        expect(version.coatings).toBeDefined();
        expect(version.enrobingChocolate).toBeUndefined();
      });

      test('coatings structure is correct', () => {
        const version = baseRolledTruffle.variations[0];
        expect(version.coatings?.ids).toHaveLength(1);
        expect(version.coatings?.ids[0]).toBe('common.cocoa-powder');
        expect(version.coatings?.preferredId).toBe('common.cocoa-powder');
      });
    });

    describe('IConfectionYield', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.yield.count).toBe(24);
        expect(version.yield.unit).toBe('pieces');
        expect(version.yield.weightPerPiece).toBe(12);
      });
    });

    describe('IFillingSlot', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.fillings).toHaveLength(1);
        const slot = version.fillings?.[0];
        expect(slot?.slotId).toBe('center');
        expect(slot?.filling.options).toHaveLength(1);
        expect(slot?.filling.preferredId).toBe('common.dark-ganache-classic');
      });
    });

    describe('IConfectionVersion', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.variations[0];
        expect(version.variationSpec).toBe('2026-01-01-01');
        expect(version.createdDate).toBe('2026-01-01');
        expect(version.notes).toBeDefined();
      });
    });
  });
});
