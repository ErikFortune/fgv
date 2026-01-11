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
    fillings: [
      {
        slotId: 'center',
        name: 'Ganache Center',
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' }],
          preferredId: 'common.dark-ganache-classic'
        }
      }
    ],
    molds: {
      options: [{ id: 'common.dome-25mm' }],
      preferredId: 'common.dome-25mm'
    },
    shellChocolate: {
      ids: ['cacao-barry.guayaquil-64', 'common.chocolate-dark-64'],
      preferredId: 'cacao-barry.guayaquil-64'
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
      ids: ['cacao-barry.guayaquil-64'],
      preferredId: 'cacao-barry.guayaquil-64'
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
      ids: ['common.cocoa-powder'],
      preferredId: 'common.cocoa-powder'
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
    test('converts valid spec with preferredId', () => {
      const input = {
        ids: ['cacao-barry.guayaquil-64', 'common.chocolate-dark-64', 'felchlin.maracaibo-65'],
        preferredId: 'cacao-barry.guayaquil-64'
      };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(3);
        expect(result.ids[0]).toBe('cacao-barry.guayaquil-64');
        expect(result.preferredId).toBe('cacao-barry.guayaquil-64');
      });
    });

    test('converts valid spec without preferredId', () => {
      const input = { ids: ['cacao-barry.guayaquil-64'] };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(1);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('fails for missing ids', () => {
      const input = { preferredId: 'common.chocolate-dark-64' };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toFail();
    });

    test('fails for invalid ingredient ID format', () => {
      const input = { ids: ['invalid-no-dot'] };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toFail();
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        ids: ['cacao-barry.guayaquil-64'],
        preferredId: 'common.nonexistent-chocolate'
      };
      expect(ConfectionConverters.chocolateSpec.convert(input)).toFailWith(
        /chocolateSpec: preferredId 'common.nonexistent-chocolate' not found in ids/
      );
    });
  });

  // ============================================================================
  // confectionMolds converter
  // ============================================================================

  describe('confectionMolds', () => {
    test('converts valid molds with preferredId', () => {
      const input = {
        options: [{ id: 'common.dome-25mm', notes: 'Primary mold' }],
        preferredId: 'common.dome-25mm'
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(1);
        expect(result.options[0].id).toBe('common.dome-25mm');
        expect(result.options[0].notes).toBe('Primary mold');
        expect(result.preferredId).toBe('common.dome-25mm');
      });
    });

    test('converts valid molds without preferredId', () => {
      const input = {
        options: [{ id: 'common.dome-25mm' }]
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(1);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('fails for empty options array', () => {
      const input = { options: [] };
      // Empty array is valid - no molds required
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceed();
    });

    test('fails when preferredId is not in options', () => {
      const input = {
        options: [{ id: 'common.dome-25mm' }],
        preferredId: 'common.nonexistent-mold'
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toFailWith(
        /confectionMolds: preferredId 'common.nonexistent-mold' not found in options/
      );
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
  // Filling Option Converters
  // ============================================================================

  describe('recipeFillingOption', () => {
    test('converts valid recipe filling option', () => {
      const input = {
        type: 'recipe',
        id: 'common.dark-ganache-classic',
        notes: 'Rich dark chocolate ganache'
      };
      expect(ConfectionConverters.recipeFillingOption.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('recipe');
        expect(result.id).toBe('common.dark-ganache-classic');
        expect(result.notes).toBe('Rich dark chocolate ganache');
      });
    });

    test('converts recipe filling option without notes', () => {
      const input = {
        type: 'recipe',
        id: 'common.milk-ganache'
      };
      expect(ConfectionConverters.recipeFillingOption.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('recipe');
        expect(result.id).toBe('common.milk-ganache');
        expect(result.notes).toBeUndefined();
      });
    });

    test('fails for wrong type discriminator', () => {
      const input = {
        type: 'ingredient',
        id: 'common.dark-ganache-classic'
      };
      expect(ConfectionConverters.recipeFillingOption.convert(input)).toFail();
    });
  });

  describe('ingredientFillingOption', () => {
    test('converts valid ingredient filling option', () => {
      const input = {
        type: 'ingredient',
        id: 'common.praline-paste',
        notes: 'Hazelnut praline'
      };
      expect(ConfectionConverters.ingredientFillingOption.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('ingredient');
        expect(result.id).toBe('common.praline-paste');
        expect(result.notes).toBe('Hazelnut praline');
      });
    });

    test('fails for wrong type discriminator', () => {
      const input = {
        type: 'recipe',
        id: 'common.praline-paste'
      };
      expect(ConfectionConverters.ingredientFillingOption.convert(input)).toFail();
    });
  });

  describe('anyFillingOption', () => {
    test('converts recipe filling option', () => {
      const input = { type: 'recipe', id: 'common.dark-ganache-classic' };
      expect(ConfectionConverters.anyFillingOption.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('recipe');
      });
    });

    test('converts ingredient filling option', () => {
      const input = { type: 'ingredient', id: 'common.praline-paste' };
      expect(ConfectionConverters.anyFillingOption.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('ingredient');
      });
    });

    test('fails for unknown type', () => {
      const input = { type: 'unknown', id: 'common.something' };
      expect(ConfectionConverters.anyFillingOption.convert(input)).toFail();
    });
  });

  describe('fillingOptions', () => {
    test('converts filling options with preferred', () => {
      const input = {
        options: [
          { type: 'recipe', id: 'common.dark-ganache-classic' },
          { type: 'recipe', id: 'common.milk-ganache' }
        ],
        preferredId: 'common.dark-ganache-classic'
      };
      expect(ConfectionConverters.fillingOptions.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(2);
        expect(result.preferredId).toBe('common.dark-ganache-classic');
      });
    });

    test('converts filling options without preferred', () => {
      const input = {
        options: [{ type: 'ingredient', id: 'common.praline-paste' }]
      };
      expect(ConfectionConverters.fillingOptions.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(1);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('converts mixed recipe and ingredient options', () => {
      const input = {
        options: [
          { type: 'recipe', id: 'common.dark-ganache-classic' },
          { type: 'ingredient', id: 'common.praline-paste' }
        ],
        preferredId: 'common.praline-paste'
      };
      expect(ConfectionConverters.fillingOptions.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(2);
        expect(result.options[0].type).toBe('recipe');
        expect(result.options[1].type).toBe('ingredient');
      });
    });
  });

  describe('fillingSlot', () => {
    test('converts valid filling slot', () => {
      const input = {
        slotId: 'center',
        name: 'Ganache Center',
        filling: {
          options: [{ type: 'recipe', id: 'common.dark-ganache-classic' }],
          preferredId: 'common.dark-ganache-classic'
        }
      };
      expect(ConfectionConverters.fillingSlot.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.slotId).toBe('center');
        expect(result.name).toBe('Ganache Center');
        expect(result.filling.options).toHaveLength(1);
        expect(result.filling.preferredId).toBe('common.dark-ganache-classic');
      });
    });

    test('converts filling slot without name', () => {
      const input = {
        slotId: 'layer1',
        filling: {
          options: [{ type: 'ingredient', id: 'common.praline-paste' }]
        }
      };
      expect(ConfectionConverters.fillingSlot.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.slotId).toBe('layer1');
        expect(result.name).toBeUndefined();
      });
    });

    test('fails for missing slotId', () => {
      const input = {
        name: 'Some Filling',
        filling: { options: [] }
      };
      expect(ConfectionConverters.fillingSlot.convert(input)).toFail();
    });

    test('fails for missing filling', () => {
      const input = { slotId: 'center', name: 'Center' };
      expect(ConfectionConverters.fillingSlot.convert(input)).toFail();
    });

    test('fails when preferredId is not in options', () => {
      const input = {
        slotId: 'center',
        filling: {
          options: [
            { type: 'recipe', id: 'common.dark-ganache-classic' },
            { type: 'recipe', id: 'common.milk-ganache' }
          ],
          preferredId: 'common.nonexistent-recipe'
        }
      };
      expect(ConfectionConverters.fillingSlot.convert(input)).toFailWith(
        /fillingOptions: preferredId 'common.nonexistent-recipe' not found in options/
      );
    });
  });

  // ============================================================================
  // additionalChocolate converter
  // ============================================================================

  describe('additionalChocolate', () => {
    test('converts valid additional chocolate for seal', () => {
      const input = {
        chocolate: {
          ids: ['common.chocolate-dark-64'],
          preferredId: 'common.chocolate-dark-64'
        },
        purpose: 'seal'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.chocolate.ids[0]).toBe('common.chocolate-dark-64');
        expect(result.chocolate.preferredId).toBe('common.chocolate-dark-64');
        expect(result.purpose).toBe('seal');
      });
    });

    test('converts valid additional chocolate for decoration', () => {
      const input = {
        chocolate: {
          ids: ['common.chocolate-white']
        },
        purpose: 'decoration'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.purpose).toBe('decoration');
        expect(result.chocolate.preferredId).toBeUndefined();
      });
    });

    test('fails for invalid purpose', () => {
      const input = {
        chocolate: {
          ids: ['common.chocolate-dark-64']
        },
        purpose: 'invalid'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toFail();
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        chocolate: {
          ids: ['common.chocolate-dark-64'],
          preferredId: 'common.nonexistent-chocolate'
        },
        purpose: 'seal'
      };
      expect(ConfectionConverters.additionalChocolate.convert(input)).toFailWith(
        /additionalChocolate: preferredId 'common.nonexistent-chocolate' not found in ids/
      );
    });
  });

  // ============================================================================
  // coatings converter
  // ============================================================================

  describe('coatings', () => {
    test('converts valid coatings with preferredId', () => {
      const input = {
        ids: ['common.cocoa-powder', 'common.chopped-nuts'],
        preferredId: 'common.cocoa-powder'
      };
      expect(ConfectionConverters.coatings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(2);
        expect(result.preferredId).toBe('common.cocoa-powder');
      });
    });

    test('converts coatings without preferredId', () => {
      const input = {
        ids: ['common.cocoa-powder']
      };
      expect(ConfectionConverters.coatings.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(1);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        ids: ['common.cocoa-powder'],
        preferredId: 'common.nonexistent-coating'
      };
      expect(ConfectionConverters.coatings.convert(input)).toFailWith(
        /coatings: preferredId 'common.nonexistent-coating' not found in ids/
      );
    });
  });
});
