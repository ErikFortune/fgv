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
import { Converters, Confections } from '../../../packlets/entities';

const ConfectionConverters = Converters.Confections;

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
    goldenVariationSpec: '2026-01-01-01',
    variations: [
      {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Basic dome bonbon' }],
        yield: {
          numFrames: 1
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
        }
      }
    ]
  };

  const validBarTruffle = {
    baseId: 'dark-bar-truffle',
    confectionType: 'bar-truffle',
    name: 'Classic Dark Bar Truffle',
    description: 'Ganache slab cut into squares',
    goldenVariationSpec: '2026-01-01-01',
    variations: [
      {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Standard bar truffles' }],
        yield: {
          numPieces: 48,
          weightPerPiece: 10,
          dimensions: {
            width: 25,
            height: 25,
            depth: 8
          }
        },
        enrobingChocolate: {
          ids: ['cacao-barry.guayaquil-64'],
          preferredId: 'cacao-barry.guayaquil-64'
        }
      }
    ]
  };

  const validRolledTruffle = {
    baseId: 'dark-cocoa-truffle',
    confectionType: 'rolled-truffle',
    name: 'Classic Cocoa-Dusted Truffle',
    description: 'Hand-rolled ganache truffle',
    goldenVariationSpec: '2026-01-01-01',
    variations: [
      {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Traditional rolled truffle' }],
        yield: {
          numPieces: 40,
          weightPerPiece: 15
        },
        coatings: {
          ids: ['common.cocoa-powder'],
          preferredId: 'common.cocoa-powder'
        }
      }
    ]
  };

  // ============================================================================
  // yield converters
  // ============================================================================

  describe('yieldInFrames', () => {
    test('converts valid yield in frames', () => {
      const input = { numFrames: 2 };
      expect(ConfectionConverters.yieldInFrames.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.numFrames).toBe(2);
      });
    });

    test('fails for missing numFrames', () => {
      const input = { count: 24 };
      expect(ConfectionConverters.yieldInFrames.convert(input)).toFail();
    });
  });

  describe('yieldInPieces', () => {
    test('converts valid yield in pieces', () => {
      const input = { numPieces: 40, weightPerPiece: 15 };
      expect(ConfectionConverters.yieldInPieces.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.numPieces).toBe(40);
        expect(result.weightPerPiece).toBe(15);
      });
    });

    test('fails for missing numPieces', () => {
      const input = { weightPerPiece: 15 };
      expect(ConfectionConverters.yieldInPieces.convert(input)).toFail();
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
        options: [{ id: 'common.dome-25mm', notes: [{ category: 'user', note: 'Primary mold' }] }],
        preferredId: 'common.dome-25mm'
      };
      expect(ConfectionConverters.confectionMolds.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(1);
        expect(result.options[0].id).toBe('common.dome-25mm');
        expect(result.options[0].notes).toEqual([{ category: 'user', note: 'Primary mold' }]);
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
  // barTruffleYield converter
  // ============================================================================

  describe('barTruffleYield', () => {
    test('converts valid bar truffle yield', () => {
      const input = { numPieces: 48, weightPerPiece: 10, dimensions: { width: 25, height: 25, depth: 8 } };
      expect(ConfectionConverters.barTruffleYield.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.numPieces).toBe(48);
        expect(result.weightPerPiece).toBe(10);
        expect(result.dimensions.width).toBe(25);
        expect(result.dimensions.height).toBe(25);
        expect(result.dimensions.depth).toBe(8);
      });
    });

    test('fails for missing dimensions', () => {
      const input = { numPieces: 48, weightPerPiece: 10 };
      expect(ConfectionConverters.barTruffleYield.convert(input)).toFail();
    });

    test('fails for missing depth in dimensions', () => {
      const input = { numPieces: 48, weightPerPiece: 10, dimensions: { width: 25, height: 25 } };
      expect(ConfectionConverters.barTruffleYield.convert(input)).toFail();
    });
  });

  describe('anyConfectionRecipeVariation', () => {
    test('converts valid molded bonbon variation', () => {
      const input = {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Initial variation' }],
        yield: { numFrames: 1 },
        molds: { options: [{ id: 'common.dome-25mm' }] },
        shellChocolate: { ids: ['common.chocolate-dark-64'] }
      };
      expect(ConfectionConverters.anyConfectionRecipeVariationEntity.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.variationSpec).toBe('2026-01-01-01');
          expect(result.createdDate).toBe('2026-01-01');
          expect(result.notes).toEqual([{ category: 'user', note: 'Initial variation' }]);
        }
      );
    });

    test('converts valid bar truffle variation', () => {
      const input = {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        yield: { numPieces: 48, weightPerPiece: 10, dimensions: { width: 25, height: 25, depth: 8 } }
      };
      expect(ConfectionConverters.anyConfectionRecipeVariationEntity.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.variationSpec).toBe('2026-01-01-01');
          expect(result.notes).toBeUndefined();
        }
      );
    });
  });

  // ============================================================================
  // moldedBonBon converter
  // ============================================================================

  describe('moldedBonBon', () => {
    test('converts valid molded bonbon', () => {
      expect(ConfectionConverters.moldedBonBonEntity.convert(validMoldedBonBon)).toSucceedAndSatisfy(
        (result) => {
          expect(result.confectionType).toBe('molded-bonbon');
          expect(result.baseId).toBe('dark-dome-bonbon');
          const variation = result.variations[0];
          expect(variation.molds).toBeDefined();
          expect(variation.shellChocolate).toBeDefined();
        }
      );
    });

    test('fails for wrong confection type', () => {
      const input = { ...validMoldedBonBon, confectionType: 'bar-truffle' };
      expect(ConfectionConverters.moldedBonBonEntity.convert(input)).toFail();
    });

    test('fails for variation missing molds', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { molds: _molds, ...variationWithoutMolds } = validMoldedBonBon.variations[0];
      const input = { ...validMoldedBonBon, variations: [variationWithoutMolds] };
      expect(ConfectionConverters.moldedBonBonEntity.convert(input)).toFail();
    });

    test('fails for variation missing shellChocolate', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { shellChocolate: _shell, ...variationWithoutShell } = validMoldedBonBon.variations[0];
      const input = { ...validMoldedBonBon, variations: [variationWithoutShell] };
      expect(ConfectionConverters.moldedBonBonEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // barTruffle converter
  // ============================================================================

  describe('barTruffle', () => {
    test('converts valid bar truffle', () => {
      expect(ConfectionConverters.barTruffleEntity.convert(validBarTruffle)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('bar-truffle');
        expect(result.baseId).toBe('dark-bar-truffle');
        const variation = result.variations[0];
        expect(variation.yield.dimensions).toBeDefined();
      });
    });

    test('fails for wrong confection type', () => {
      const input = { ...validBarTruffle, confectionType: 'molded-bonbon' };
      expect(ConfectionConverters.barTruffleEntity.convert(input)).toFail();
    });

    test('fails for variation missing yield', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { yield: _yield, ...variationWithoutYield } = validBarTruffle.variations[0];
      const input = { ...validBarTruffle, variations: [variationWithoutYield] };
      expect(ConfectionConverters.barTruffleEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // rolledTruffle converter
  // ============================================================================

  describe('rolledTruffle', () => {
    test('converts valid rolled truffle', () => {
      expect(ConfectionConverters.rolledTruffleEntity.convert(validRolledTruffle)).toSucceedAndSatisfy(
        (result) => {
          expect(result.confectionType).toBe('rolled-truffle');
          expect(result.baseId).toBe('dark-cocoa-truffle');
          const variation = result.variations[0];
          expect(variation.coatings).toBeDefined();
        }
      );
    });

    test('converts rolled truffle variation without optional fields', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { coatings: _coatings, ...variationWithoutCoatings } = validRolledTruffle.variations[0];
      const input = { ...validRolledTruffle, variations: [variationWithoutCoatings] };
      expect(ConfectionConverters.rolledTruffleEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.confectionType).toBe('rolled-truffle');
        const variation = result.variations[0];
        expect(variation.coatings).toBeUndefined();
        expect(variation.enrobingChocolate).toBeUndefined();
      });
    });

    test('fails for wrong confection type', () => {
      const input = { ...validRolledTruffle, confectionType: 'molded-bonbon' };
      expect(ConfectionConverters.rolledTruffleEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confectionData (oneOf) converter
  // ============================================================================

  describe('confectionData (discriminated union)', () => {
    test('converts molded bonbon', () => {
      expect(ConfectionConverters.anyConfectionRawEntity.convert(validMoldedBonBon)).toSucceedAndSatisfy(
        (result) => {
          expect(Confections.isMoldedBonBonRecipeEntity(result)).toBe(true);
        }
      );
    });

    test('converts bar truffle', () => {
      expect(ConfectionConverters.anyConfectionRawEntity.convert(validBarTruffle)).toSucceedAndSatisfy(
        (result) => {
          expect(Confections.isBarTruffleEntity(result)).toBe(true);
        }
      );
    });

    test('converts rolled truffle', () => {
      expect(ConfectionConverters.anyConfectionRawEntity.convert(validRolledTruffle)).toSucceedAndSatisfy(
        (result) => {
          expect(Confections.isRolledTruffleRecipeEntity(result)).toBe(true);
        }
      );
    });

    test('fails for unknown confection type', () => {
      const input = { ...validMoldedBonBon, confectionType: 'unknown-type' };
      expect(ConfectionConverters.anyConfectionRawEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // confection converter (with validation)
  // ============================================================================

  describe('confection (validated)', () => {
    test('converts and validates valid confection', () => {
      expect(ConfectionConverters.anyConfectionEntity.convert(validMoldedBonBon)).toSucceedAndSatisfy(
        (result) => {
          expect(result.baseId).toBe('dark-dome-bonbon');
          expect(result.goldenVariationSpec).toBe('2026-01-01-01');
        }
      );
    });

    test('fails when variations array is empty', () => {
      const input = { ...validMoldedBonBon, variations: [] };
      expect(ConfectionConverters.anyConfectionEntity.convert(input)).toFailWith(/at least one variation/i);
    });

    test('fails when golden variation not found in variations', () => {
      const input = { ...validMoldedBonBon, goldenVariationSpec: '9999-99-99-99' };
      expect(ConfectionConverters.anyConfectionEntity.convert(input)).toFailWith(
        /Golden variation.*not found/i
      );
    });

    test('succeeds when golden variation exists in variations', () => {
      const input = {
        ...validMoldedBonBon,
        variations: [
          { ...validMoldedBonBon.variations[0], variationSpec: '2026-01-01-01', createdDate: '2026-01-01' },
          { ...validMoldedBonBon.variations[0], variationSpec: '2026-02-01-01', createdDate: '2026-02-01' }
        ],
        goldenVariationSpec: '2026-02-01-01'
      };
      expect(ConfectionConverters.anyConfectionEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.goldenVariationSpec).toBe('2026-02-01-01');
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
        notes: [{ category: 'user', note: 'Rich dark chocolate ganache' }]
      };
      expect(ConfectionConverters.recipeFillingOptionEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('recipe');
        expect(result.id).toBe('common.dark-ganache-classic');
        expect(result.notes).toEqual([{ category: 'user', note: 'Rich dark chocolate ganache' }]);
      });
    });

    test('converts recipe filling option without notes', () => {
      const input = {
        type: 'recipe',
        id: 'common.milk-ganache'
      };
      expect(ConfectionConverters.recipeFillingOptionEntity.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.recipeFillingOptionEntity.convert(input)).toFail();
    });
  });

  describe('ingredientFillingOption', () => {
    test('converts valid ingredient filling option', () => {
      const input = {
        type: 'ingredient',
        id: 'common.praline-paste',
        notes: [{ category: 'user', note: 'Hazelnut praline' }]
      };
      expect(ConfectionConverters.ingredientFillingOptionEntity.convert(input)).toSucceedAndSatisfy(
        (result) => {
          expect(result.type).toBe('ingredient');
          expect(result.id).toBe('common.praline-paste');
          expect(result.notes).toEqual([{ category: 'user', note: 'Hazelnut praline' }]);
        }
      );
    });

    test('fails for wrong type discriminator', () => {
      const input = {
        type: 'recipe',
        id: 'common.praline-paste'
      };
      expect(ConfectionConverters.ingredientFillingOptionEntity.convert(input)).toFail();
    });
  });

  describe('anyFillingOption', () => {
    test('converts recipe filling option', () => {
      const input = { type: 'recipe', id: 'common.dark-ganache-classic' };
      expect(ConfectionConverters.anyFillingOptionEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('recipe');
      });
    });

    test('converts ingredient filling option', () => {
      const input = { type: 'ingredient', id: 'common.praline-paste' };
      expect(ConfectionConverters.anyFillingOptionEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('ingredient');
      });
    });

    test('fails for unknown type', () => {
      const input = { type: 'unknown', id: 'common.something' };
      expect(ConfectionConverters.anyFillingOptionEntity.convert(input)).toFail();
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
      expect(ConfectionConverters.fillingOptionEntities.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options).toHaveLength(2);
        expect(result.preferredId).toBe('common.dark-ganache-classic');
      });
    });

    test('converts filling options without preferred', () => {
      const input = {
        options: [{ type: 'ingredient', id: 'common.praline-paste' }]
      };
      expect(ConfectionConverters.fillingOptionEntities.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.fillingOptionEntities.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.fillingSlotEntity.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.fillingSlotEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.slotId).toBe('layer1');
        expect(result.name).toBeUndefined();
      });
    });

    test('fails for missing slotId', () => {
      const input = {
        name: 'Some Filling',
        filling: { options: [] }
      };
      expect(ConfectionConverters.fillingSlotEntity.convert(input)).toFail();
    });

    test('fails for missing filling', () => {
      const input = { slotId: 'center', name: 'Center' };
      expect(ConfectionConverters.fillingSlotEntity.convert(input)).toFail();
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
      expect(ConfectionConverters.fillingSlotEntity.convert(input)).toFailWith(
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
      expect(ConfectionConverters.additionalChocolateEntity.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.additionalChocolateEntity.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(ConfectionConverters.additionalChocolateEntity.convert(input)).toFail();
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        chocolate: {
          ids: ['common.chocolate-dark-64'],
          preferredId: 'common.nonexistent-chocolate'
        },
        purpose: 'seal'
      };
      expect(ConfectionConverters.additionalChocolateEntity.convert(input)).toFailWith(
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
      expect(ConfectionConverters.coatingsEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(2);
        expect(result.preferredId).toBe('common.cocoa-powder');
      });
    });

    test('converts coatings without preferredId', () => {
      const input = {
        ids: ['common.cocoa-powder']
      };
      expect(ConfectionConverters.coatingsEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ids).toHaveLength(1);
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('fails when preferredId is not in ids', () => {
      const input = {
        ids: ['common.cocoa-powder'],
        preferredId: 'common.nonexistent-coating'
      };
      expect(ConfectionConverters.coatingsEntity.convert(input)).toFailWith(
        /coatings: preferredId 'common.nonexistent-coating' not found in ids/
      );
    });
  });
});
