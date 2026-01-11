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
  Confection,
  ConfectionData,
  IBarTruffle,
  IBarTruffleVersion,
  IMoldedBonBon,
  IMoldedBonBonVersion,
  IRolledTruffle,
  IRolledTruffleVersion,
  isBarTruffle,
  isBarTruffleVersion,
  isMoldedBonBon,
  isMoldedBonBonVersion,
  isRolledTruffle,
  isRolledTruffleVersion
} from '../../../packlets/confections';
import {
  BaseConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  IngredientId,
  MoldId,
  RecipeId,
  SlotId,
  UrlCategory
} from '../../../packlets/common';
import { Measurement, Millimeters } from '../../../packlets/common';

describe('Confections model', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const moldedBonBonVersion: IMoldedBonBonVersion = {
    versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    createdDate: '2026-01-01',
    notes: 'Basic dome bonbon with dark ganache filling',
    yield: {
      count: 24,
      unit: 'pieces',
      weightPerPiece: 12 as Measurement
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
    }
  };

  const baseMoldedBonBon: IMoldedBonBon = {
    baseId: 'dark-dome-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Classic Dark Dome Bonbon' as ConfectionName,
    description: 'Traditional molded dark chocolate bonbon with dome shape',
    tags: ['classic', 'dark', 'molded', 'dome'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [moldedBonBonVersion]
  };

  const barTruffleVersion: IBarTruffleVersion = {
    versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    createdDate: '2026-01-01',
    notes: 'Standard 25mm square bar truffles',
    yield: {
      count: 48,
      unit: 'pieces',
      weightPerPiece: 10 as Measurement
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
    }
  };

  const baseBarTruffle: IBarTruffle = {
    baseId: 'dark-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Classic Dark Bar Truffle' as ConfectionName,
    description: 'Ganache slab cut into squares and enrobed',
    tags: ['classic', 'dark', 'bar', 'enrobed'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [barTruffleVersion]
  };

  const rolledTruffleVersion: IRolledTruffleVersion = {
    versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    createdDate: '2026-01-01',
    notes: 'Traditional rolled truffle with cocoa coating',
    yield: {
      count: 40,
      unit: 'pieces',
      weightPerPiece: 15 as Measurement
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
    }
  };

  const baseRolledTruffle: IRolledTruffle = {
    baseId: 'dark-cocoa-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Classic Cocoa-Dusted Truffle' as ConfectionName,
    description: 'Hand-rolled ganache truffle dusted with cocoa powder',
    tags: ['classic', 'dark', 'rolled', 'cocoa'],
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [rolledTruffleVersion]
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
          const version = confection.versions[0];
          expect(version.molds).toBeDefined();
          expect(version.shellChocolate).toBeDefined();
        } else {
          fail('Expected isMoldedBonBon to return true');
        }
      });

      test('narrows correctly for bar truffle', () => {
        const confection: ConfectionData = baseBarTruffle;
        if (isBarTruffle(confection)) {
          // TypeScript should know this is IBarTruffle
          const version = confection.versions[0];
          expect(version.frameDimensions).toBeDefined();
          expect(version.singleBonBonDimensions).toBeDefined();
        } else {
          fail('Expected isBarTruffle to return true');
        }
      });

      test('narrows correctly for rolled truffle', () => {
        const confection: ConfectionData = baseRolledTruffle;
        if (isRolledTruffle(confection)) {
          // TypeScript should know this is IRolledTruffle
          const version = confection.versions[0];
          expect(version.coatings).toBeDefined();
        } else {
          fail('Expected isRolledTruffle to return true');
        }
      });
    });

    describe('version type guards', () => {
      test('isMoldedBonBonVersion returns true for molded bonbon version', () => {
        expect(isMoldedBonBonVersion(moldedBonBonVersion)).toBe(true);
        expect(isMoldedBonBonVersion(barTruffleVersion)).toBe(false);
        expect(isMoldedBonBonVersion(rolledTruffleVersion)).toBe(false);
      });

      test('isBarTruffleVersion returns true for bar truffle version', () => {
        expect(isBarTruffleVersion(barTruffleVersion)).toBe(true);
        expect(isBarTruffleVersion(moldedBonBonVersion)).toBe(false);
        expect(isBarTruffleVersion(rolledTruffleVersion)).toBe(false);
      });

      test('isRolledTruffleVersion returns true for rolled truffle version', () => {
        expect(isRolledTruffleVersion(rolledTruffleVersion)).toBe(true);
        expect(isRolledTruffleVersion(moldedBonBonVersion)).toBe(false);
        expect(isRolledTruffleVersion(barTruffleVersion)).toBe(false);
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
        expect(baseMoldedBonBon.versions).toHaveLength(1);
        expect(baseMoldedBonBon.goldenVersionSpec).toBe('2026-01-01-01');
      });

      test('has optional base properties', () => {
        expect(baseMoldedBonBon.description).toBeDefined();
        expect(baseMoldedBonBon.tags).toBeDefined();
      });

      test('version has required properties', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.molds).toBeDefined();
        expect(version.shellChocolate).toBeDefined();
        expect(version.yield).toBeDefined();
      });

      test('version has optional properties', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.fillings).toBeDefined();
        expect(version.additionalChocolates).toBeUndefined();
      });

      test('molds structure is correct', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.molds.options).toHaveLength(1);
        expect(version.molds.options[0].id).toBe('common.dome-25mm');
        expect(version.molds.preferredId).toBe('common.dome-25mm');
      });

      test('shellChocolate structure is correct', () => {
        const version = baseMoldedBonBon.versions[0];
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
        expect(baseBarTruffle.versions).toHaveLength(1);
      });

      test('version has required properties', () => {
        const version = baseBarTruffle.versions[0];
        expect(version.frameDimensions).toBeDefined();
        expect(version.singleBonBonDimensions).toBeDefined();
        expect(version.yield).toBeDefined();
      });

      test('version has optional properties', () => {
        const version = baseBarTruffle.versions[0];
        expect(version.enrobingChocolate).toBeDefined();
      });

      test('frame dimensions structure is correct', () => {
        const version = baseBarTruffle.versions[0];
        expect(version.frameDimensions.width).toBe(300);
        expect(version.frameDimensions.height).toBe(200);
        expect(version.frameDimensions.depth).toBe(8);
      });

      test('single bonbon dimensions structure is correct', () => {
        const version = baseBarTruffle.versions[0];
        expect(version.singleBonBonDimensions.width).toBe(25);
        expect(version.singleBonBonDimensions.height).toBe(25);
      });
    });

    describe('IRolledTruffle', () => {
      test('has required base properties', () => {
        expect(baseRolledTruffle.baseId).toBe('dark-cocoa-truffle');
        expect(baseRolledTruffle.confectionType).toBe('rolled-truffle');
        expect(baseRolledTruffle.name).toBe('Classic Cocoa-Dusted Truffle');
        expect(baseRolledTruffle.versions).toHaveLength(1);
      });

      test('version has optional properties', () => {
        const version = baseRolledTruffle.versions[0];
        expect(version.coatings).toBeDefined();
        expect(version.enrobingChocolate).toBeUndefined();
      });

      test('coatings structure is correct', () => {
        const version = baseRolledTruffle.versions[0];
        expect(version.coatings?.ids).toHaveLength(1);
        expect(version.coatings?.ids[0]).toBe('common.cocoa-powder');
        expect(version.coatings?.preferredId).toBe('common.cocoa-powder');
      });
    });

    describe('IConfectionYield', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.yield.count).toBe(24);
        expect(version.yield.unit).toBe('pieces');
        expect(version.yield.weightPerPiece).toBe(12);
      });
    });

    describe('IFillingSlot', () => {
      test('structure is correct', () => {
        const version = baseMoldedBonBon.versions[0];
        expect(version.fillings).toHaveLength(1);
        const slot = version.fillings?.[0];
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

  // ============================================================================
  // Confection wrapper class
  // ============================================================================

  describe('Confection class', () => {
    const moldedBonBonWithTags: IMoldedBonBon = {
      baseId: 'tagged-bonbon' as BaseConfectionId,
      confectionType: 'molded-bonbon',
      name: 'Tagged Bonbon' as ConfectionName,
      tags: ['base-tag1', 'base-tag2'],
      urls: [{ url: 'https://example.com/base', category: 'Reference' as UrlCategory }],
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01',
          yield: { count: 24 },
          molds: { options: [{ id: 'common.dome-25mm' as MoldId }] },
          shellChocolate: { ids: ['common.chocolate-dark-64' as IngredientId] },
          additionalTags: ['version-tag1', 'base-tag1'], // duplicate to test deduplication
          additionalUrls: [{ url: 'https://example.com/v1', category: 'Version' as UrlCategory }]
        },
        {
          versionSpec: '2026-01-02-01' as ConfectionVersionSpec,
          createdDate: '2026-01-02',
          yield: { count: 30 },
          molds: { options: [{ id: 'common.dome-25mm' as MoldId }] },
          shellChocolate: { ids: ['common.chocolate-dark-64' as IngredientId] }
          // No additionalTags or additionalUrls
        }
      ]
    };

    describe('create', () => {
      test('succeeds with valid data', () => {
        expect(Confection.create(baseMoldedBonBon)).toSucceedAndSatisfy((confection) => {
          expect(confection.baseId).toBe('dark-dome-bonbon');
          expect(confection.confectionType).toBe('molded-bonbon');
        });
      });

      test('fails when golden version not found', () => {
        const badData: IMoldedBonBon = {
          ...baseMoldedBonBon,
          goldenVersionSpec: 'nonexistent-version' as ConfectionVersionSpec
        };
        expect(Confection.create(badData)).toFailWith(/golden version.*not found/i);
      });
    });

    describe('getEffectiveTags', () => {
      test('merges base and version tags with deduplication', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          const effectiveTags = confection.getEffectiveTags();
          expect(effectiveTags).toContain('base-tag1');
          expect(effectiveTags).toContain('base-tag2');
          expect(effectiveTags).toContain('version-tag1');
          // Check deduplication
          expect(effectiveTags.filter((t) => t === 'base-tag1').length).toBe(1);
          expect(effectiveTags.length).toBe(3);
        });
      });

      test('works with specific version', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          const secondVersion = confection.versions[1];
          const effectiveTags = confection.getEffectiveTags(secondVersion);
          // Only base tags since second version has no additionalTags
          expect(effectiveTags).toContain('base-tag1');
          expect(effectiveTags).toContain('base-tag2');
          expect(effectiveTags.length).toBe(2);
        });
      });

      test('returns empty array when no tags defined', () => {
        // Create confection without any tags
        const noTagsData: IMoldedBonBon = {
          baseId: 'no-tags' as BaseConfectionId,
          confectionType: 'molded-bonbon',
          name: 'No Tags Bonbon' as ConfectionName,
          goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          versions: [
            {
              versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
              createdDate: '2026-01-01',
              yield: { count: 24 },
              molds: { options: [{ id: 'common.dome-25mm' as MoldId }] },
              shellChocolate: { ids: ['common.chocolate-dark-64' as IngredientId] }
            }
          ]
        };
        expect(Confection.create(noTagsData)).toSucceedAndSatisfy((confection) => {
          const effectiveTags = confection.getEffectiveTags();
          expect(effectiveTags).toEqual([]);
        });
      });
    });

    describe('getEffectiveUrls', () => {
      test('merges base and version urls', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          const effectiveUrls = confection.getEffectiveUrls();
          expect(effectiveUrls).toHaveLength(2);
          expect(effectiveUrls[0].url).toBe('https://example.com/base');
          expect(effectiveUrls[1].url).toBe('https://example.com/v1');
        });
      });

      test('works with specific version', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          const secondVersion = confection.versions[1];
          const effectiveUrls = confection.getEffectiveUrls(secondVersion);
          // Only base URLs since second version has no additionalUrls
          expect(effectiveUrls).toHaveLength(1);
          expect(effectiveUrls[0].url).toBe('https://example.com/base');
        });
      });

      test('returns empty array when no urls defined', () => {
        // Create confection without any urls
        const noUrlsData: IMoldedBonBon = {
          baseId: 'no-urls' as BaseConfectionId,
          confectionType: 'molded-bonbon',
          name: 'No URLs Bonbon' as ConfectionName,
          goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          versions: [
            {
              versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
              createdDate: '2026-01-01',
              yield: { count: 24 },
              molds: { options: [{ id: 'common.dome-25mm' as MoldId }] },
              shellChocolate: { ids: ['common.chocolate-dark-64' as IngredientId] }
            }
          ]
        };
        expect(Confection.create(noUrlsData)).toSucceedAndSatisfy((confection) => {
          const effectiveUrls = confection.getEffectiveUrls();
          expect(effectiveUrls).toEqual([]);
        });
      });
    });

    describe('effectiveTags property', () => {
      test('returns effective tags for golden version', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          expect(confection.effectiveTags).toContain('base-tag1');
          expect(confection.effectiveTags).toContain('version-tag1');
        });
      });
    });

    describe('effectiveUrls property', () => {
      test('returns effective urls for golden version', () => {
        expect(Confection.create(moldedBonBonWithTags)).toSucceedAndSatisfy((confection) => {
          expect(confection.effectiveUrls).toHaveLength(2);
        });
      });
    });
  });
});
