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
  Converters as ConfectionConverters,
  isMoldedBonBon,
  isBarTruffle,
  isRolledTruffle
} from '../../../packlets/confections';

describe('Confections converters', () => {
  // ============================================================================
  // Test Data - Valid
  // ============================================================================

  const validMoldedBonBon = {
    baseId: 'dark-dome-bonbon',
    confectionType: 'molded-bonbon',
    name: 'Classic Dark Dome Bonbon',
    description: 'Traditional molded dark chocolate bonbon',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01',
    yield: {
      count: 24,
      unit: 'pieces',
      weightPerPiece: 12
    },
    fillings: {
      recipes: ['common.dark-ganache-classic'],
      recommendedFillingId: 'common.dark-ganache-classic'
    },
    molds: {
      molds: [{ moldId: 'common.dome-25mm' }],
      recommendedMoldId: 'common.dome-25mm'
    },
    shellChocolate: {
      ingredientId: 'cacao-barry.guayaquil-64',
      alternateIngredientIds: ['common.chocolate-dark-64']
    },
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: 'Basic dome bonbon'
      }
    ]
  };

  const validBarTruffle = {
    baseId: 'dark-bar-truffle',
    confectionType: 'bar-truffle',
    name: 'Classic Dark Bar Truffle',
    description: 'Ganache slab cut into squares',
    goldenVersionSpec: '2026-01-01-01',
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10
    },
    frameDimensions: {
      width: 300,
      height: 200,
      depth: 8
    },
    singleBonBonDimensions: {
      width: 25,
      height: 25
    },
    enrobingChocolate: {
      ingredientId: 'cacao-barry.guayaquil-64'
    },
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: 'Standard bar truffles'
      }
    ]
  };

  const validRolledTruffle = {
    baseId: 'dark-cocoa-truffle',
    confectionType: 'rolled-truffle',
    name: 'Classic Cocoa-Dusted Truffle',
    description: 'Hand-rolled ganache truffle',
    goldenVersionSpec: '2026-01-01-01',
    yield: {
      count: 40,
      unit: 'pieces',
      weightPerPiece: 15
    },
    coatings: {
      ingredients: [{ ingredientId: 'common.cocoa-powder' }],
      recommendedIngredientId: 'common.cocoa-powder'
    },
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: 'Traditional rolled truffle'
      }
    ]
  };

  // ============================================================================
  // confectionYield converter
  // ============================================================================

  describe('confectionYield', () => {
    test('converts valid yield with all fields', () => {
      const input = { count: 24, unit: 'pieces', weightPerPiece: 12 };
      expect(ConfectionConverters.confectionYield.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.count).toBe(24);
        expect(result.unit).toBe('pieces');
        expect(result.weightPerPiece).toBe(12);
      });
    });

    test('converts valid yield with only required fields', () => {
      const input = { count: 24 };
      expect(ConfectionConverters.confectionYield.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.count).toBe(24);
        expect(result.unit).toBeUndefined();
        expect(result.weightPerPiece).toBeUndefined();
      });
    });

    test('fails for missing count', () => {
      const input = { unit: 'pieces' };
      expect(ConfectionConverters.confectionYield.convert(input)).toFail();
    });

    test('fails for non-numeric count', () => {
      const input = { count: 'twenty-four' };
      expect(ConfectionConverters.confectionYield.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confectionDecoration converter
  // ============================================================================

  describe('confectionDecoration', () => {
    test('converts valid decoration with all fields', () => {
      const input = { description: 'Gold leaf accent', preferred: true };
      expect(ConfectionConverters.confectionDecoration.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('Gold leaf accent');
        expect(result.preferred).toBe(true);
      });
    });

    test('converts valid decoration with only required fields', () => {
      const input = { description: 'Cocoa powder dusting' };
      expect(ConfectionConverters.confectionDecoration.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('Cocoa powder dusting');
        expect(result.preferred).toBeUndefined();
      });
    });

    test('fails for missing description', () => {
      const input = { preferred: true };
      expect(ConfectionConverters.confectionDecoration.convert(input)).toFail();
    });
  });

  // ============================================================================
  // chocolateSpec converter
  // ============================================================================

  describe('chocolateSpec', () => {
    test('converts valid spec with alternates', () => {
      const input = {
        ingredientId: 'cacao-barry.guayaquil-64',
        alternateIngredientIds: ['common.chocolate-dark-64', 'felchlin.maracaibo-65']
      };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredientId).toBe('cacao-barry.guayaquil-64');
        expect(result.alternateIngredientIds).toHaveLength(2);
      });
    });

    test('converts valid spec without alternates', () => {
      const input = { ingredientId: 'cacao-barry.guayaquil-64' };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredientId).toBe('cacao-barry.guayaquil-64');
        expect(result.alternateIngredientIds).toBeUndefined();
      });
    });

    test('fails for missing ingredientId', () => {
      const input = { alternateIngredientIds: ['common.chocolate-dark-64'] };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toFail();
    });

    test('fails for invalid ingredient ID format', () => {
      const input = { ingredientId: 'invalid-no-dot' };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confectionMolds converter
  // ============================================================================

  describe('confectionMolds', () => {
    test('converts valid molds with recommended', () => {
      const input = {
        molds: [{ moldId: 'common.dome-25mm', notes: 'Primary mold' }],
        recommendedMoldId: 'common.dome-25mm'
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.molds).toHaveLength(1);
        expect(result.molds[0].moldId).toBe('common.dome-25mm');
        expect(result.molds[0].notes).toBe('Primary mold');
        expect(result.recommendedMoldId).toBe('common.dome-25mm');
      });
    });

    test('converts valid molds without recommended', () => {
      const input = {
        molds: [{ moldId: 'common.dome-25mm' }]
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.molds).toHaveLength(1);
        expect(result.recommendedMoldId).toBeUndefined();
      });
    });

    test('fails for empty molds array', () => {
      const input = { molds: [] };
      // Empty array is valid - no molds required
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceed();
    });
  });

  // ============================================================================
  // frameDimensions converter
  // ============================================================================

  describe('frameDimensions', () => {
    test('converts valid dimensions', () => {
      const input = { width: 300, height: 200, depth: 8 };
      expect(ConfectionConverters.frameDimensions.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.width).toBe(300);
        expect(result.height).toBe(200);
        expect(result.depth).toBe(8);
      });
    });

    test('fails for missing required field', () => {
      const input = { width: 300, height: 200 };
      expect(ConfectionConverters.frameDimensions.convert(input)).toFail();
    });
  });

  // ============================================================================
  // bonBonDimensions converter
  // ============================================================================

  describe('bonBonDimensions', () => {
    test('converts valid dimensions', () => {
      const input = { width: 25, height: 25 };
      expect(ConfectionConverters.bonBonDimensions.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.width).toBe(25);
        expect(result.height).toBe(25);
      });
    });

    test('fails for missing required field', () => {
      const input = { width: 25 };
      expect(ConfectionConverters.bonBonDimensions.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confectionVersion converter
  // ============================================================================

  describe('confectionVersion', () => {
    test('converts valid version with notes', () => {
      const input = {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: 'Initial version'
      };
      expect(ConfectionConverters.confectionVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.versionSpec).toBe('2026-01-01-01');
        expect(result.createdDate).toBe('2026-01-01');
        expect(result.notes).toBe('Initial version');
      });
    });

    test('converts valid version without notes', () => {
      const input = {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01'
      };
      expect(ConfectionConverters.confectionVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.versionSpec).toBe('2026-01-01-01');
        expect(result.notes).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // moldedBonBon converter
  // ============================================================================

  describe('moldedBonBon', () => {
    test('converts valid molded bonbon', () => {
      expect(ConfectionConverters.moldedBonBon.convert(validMoldedBonBon)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('molded-bonbon');
        expect(result.baseId).toBe('dark-dome-bonbon');
        expect(result.molds).toBeDefined();
        expect(result.shellChocolate).toBeDefined();
      });
    });

    test('fails for wrong confection type', () => {
      const input = { ...validMoldedBonBon, confectionType: 'bar-truffle' };
      expect(ConfectionConverters.moldedBonBon.convert(input)).toFail();
    });

    test('fails for missing molds', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { molds: _molds, ...input } = validMoldedBonBon;
      expect(ConfectionConverters.moldedBonBon.convert(input)).toFail();
    });

    test('fails for missing shellChocolate', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { shellChocolate: _shell, ...input } = validMoldedBonBon;
      expect(ConfectionConverters.moldedBonBon.convert(input)).toFail();
    });
  });

  // ============================================================================
  // barTruffle converter
  // ============================================================================

  describe('barTruffle', () => {
    test('converts valid bar truffle', () => {
      expect(ConfectionConverters.barTruffle.convert(validBarTruffle)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('bar-truffle');
        expect(result.baseId).toBe('dark-bar-truffle');
        expect(result.frameDimensions).toBeDefined();
        expect(result.singleBonBonDimensions).toBeDefined();
      });
    });

    test('fails for wrong confection type', () => {
      const input = { ...validBarTruffle, confectionType: 'molded-bonbon' };
      expect(ConfectionConverters.barTruffle.convert(input)).toFail();
    });

    test('fails for missing frameDimensions', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { frameDimensions: _frame, ...input } = validBarTruffle;
      expect(ConfectionConverters.barTruffle.convert(input)).toFail();
    });
  });

  // ============================================================================
  // rolledTruffle converter
  // ============================================================================

  describe('rolledTruffle', () => {
    test('converts valid rolled truffle', () => {
      expect(ConfectionConverters.rolledTruffle.convert(validRolledTruffle)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('rolled-truffle');
        expect(result.baseId).toBe('dark-cocoa-truffle');
        expect(result.coatings).toBeDefined();
      });
    });

    test('converts rolled truffle without optional fields', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { coatings: _coatings, ...input } = validRolledTruffle;
      expect(ConfectionConverters.rolledTruffle.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('rolled-truffle');
        expect(result.coatings).toBeUndefined();
        expect(result.enrobingChocolate).toBeUndefined();
      });
    });

    test('fails for wrong confection type', () => {
      const input = { ...validRolledTruffle, confectionType: 'molded-bonbon' };
      expect(ConfectionConverters.rolledTruffle.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confectionData (oneOf) converter
  // ============================================================================

  describe('confectionData (discriminated union)', () => {
    test('converts molded bonbon', () => {
      expect(ConfectionConverters.confectionData.convert(validMoldedBonBon)).toSucceedAndSatisfy((result) => {
        expect(isMoldedBonBon(result)).toBe(true);
      });
    });

    test('converts bar truffle', () => {
      expect(ConfectionConverters.confectionData.convert(validBarTruffle)).toSucceedAndSatisfy((result) => {
        expect(isBarTruffle(result)).toBe(true);
      });
    });

    test('converts rolled truffle', () => {
      expect(ConfectionConverters.confectionData.convert(validRolledTruffle)).toSucceedAndSatisfy(
        (result) => {
          expect(isRolledTruffle(result)).toBe(true);
        }
      );
    });

    test('fails for unknown confection type', () => {
      const input = { ...validMoldedBonBon, confectionType: 'unknown-type' };
      expect(ConfectionConverters.confectionData.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confection converter (with validation)
  // ============================================================================

  describe('confection (validated)', () => {
    test('converts and validates valid confection', () => {
      expect(ConfectionConverters.confection.convert(validMoldedBonBon)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('dark-dome-bonbon');
        expect(result.goldenVersionSpec).toBe('2026-01-01-01');
      });
    });

    test('fails when versions array is empty', () => {
      const input = { ...validMoldedBonBon, versions: [] };
      expect(ConfectionConverters.confection.convert(input)).toFailWith(/at least one version/i);
    });

    test('fails when golden version not found in versions', () => {
      const input = { ...validMoldedBonBon, goldenVersionSpec: '9999-99-99-99' };
      expect(ConfectionConverters.confection.convert(input)).toFailWith(/Golden version.*not found/i);
    });

    test('succeeds when golden version exists in versions', () => {
      const input = {
        ...validMoldedBonBon,
        versions: [
          { versionSpec: '2026-01-01-01', createdDate: '2026-01-01' },
          { versionSpec: '2026-02-01-01', createdDate: '2026-02-01' }
        ],
        goldenVersionSpec: '2026-02-01-01'
      };
      expect(ConfectionConverters.confection.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.goldenVersionSpec).toBe('2026-02-01-01');
      });
    });
  });

  // ============================================================================
  // confectionFillings converter
  // ============================================================================

  describe('confectionFillings', () => {
    test('converts fillings with recipes', () => {
      const input = {
        recipes: ['common.dark-ganache-classic', 'common.milk-ganache'],
        recommendedFillingId: 'common.dark-ganache-classic'
      };
      expect(ConfectionConverters.confectionFillings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recipes).toHaveLength(2);
        expect(result.recommendedFillingId).toBe('common.dark-ganache-classic');
      });
    });

    test('converts fillings with ingredients', () => {
      const input = {
        ingredients: ['common.cocoa-powder'],
        recommendedFillingId: 'common.cocoa-powder'
      };
      expect(ConfectionConverters.confectionFillings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredients).toHaveLength(1);
      });
    });

    test('converts empty fillings', () => {
      const input = {};
      expect(ConfectionConverters.confectionFillings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recipes).toBeUndefined();
        expect(result.ingredients).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // additionalChocolate converter
  // ============================================================================

  describe('additionalChocolate', () => {
    test('converts valid additional chocolate for seal', () => {
      const input = {
        ingredientId: 'common.chocolate-dark-64',
        purpose: 'seal'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredientId).toBe('common.chocolate-dark-64');
        expect(result.purpose).toBe('seal');
      });
    });

    test('converts valid additional chocolate for decoration', () => {
      const input = {
        ingredientId: 'common.chocolate-white',
        purpose: 'decoration'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.purpose).toBe('decoration');
      });
    });

    test('fails for invalid purpose', () => {
      const input = {
        ingredientId: 'common.chocolate-dark-64',
        purpose: 'invalid'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toFail();
    });
  });

  // ============================================================================
  // coatings converter
  // ============================================================================

  describe('coatings', () => {
    test('converts valid coatings', () => {
      const input = {
        ingredients: [{ ingredientId: 'common.cocoa-powder' }, { ingredientId: 'common.chopped-nuts' }],
        recommendedIngredientId: 'common.cocoa-powder'
      };
      expect(ConfectionConverters.coatings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredients).toHaveLength(2);
        expect(result.recommendedIngredientId).toBe('common.cocoa-powder');
      });
    });

    test('converts coatings without recommended', () => {
      const input = {
        ingredients: [{ ingredientId: 'common.cocoa-powder' }]
      };
      expect(ConfectionConverters.coatings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recommendedIngredientId).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // confectionProcedures converter
  // ============================================================================

  describe('confectionProcedures', () => {
    test('converts valid procedures', () => {
      const input = {
        procedures: [
          { procedureId: 'common.temper-dark', notes: 'For shells' },
          { procedureId: 'common.fill-molds' }
        ],
        recommendedProcedureId: 'common.temper-dark'
      };
      expect(ConfectionConverters.confectionProcedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedures).toHaveLength(2);
        expect(result.procedures[0].notes).toBe('For shells');
        expect(result.recommendedProcedureId).toBe('common.temper-dark');
      });
    });
  });
});
