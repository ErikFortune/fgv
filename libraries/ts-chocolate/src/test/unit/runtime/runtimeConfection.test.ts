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
import { Success } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  ChocolateType,
  ConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  FillingName,
  FillingVersionSpec,
  IngredientCategory,
  IngredientId,
  Measurement,
  Millimeters,
  Model as CommonModel,
  MoldId,
  FillingId,
  ProcedureId,
  Percentage,
  SlotId,
  CollectionId,
  UrlCategory
} from '../../../packlets/common';
import {
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedCoatings,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IChocolateIngredient,
  IConfectionBase,
  IFillingRecipe,
  IRuntimeMold,
  IRuntimeProcedure,
  RuntimeConfection,
  RuntimeMoldedBonBon,
  RuntimeBarTruffle,
  RuntimeRolledTruffle
} from '../../../packlets/library-runtime';
import {
  Confections,
  Fillings,
  IChocolateIngredientEntity,
  IFillingRecipeEntity
} from '../../../packlets/entities';

describe('RuntimeConfection', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const moldedBonBonData: Confections.IMoldedBonBonEntity = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Bonbon' as ConfectionName,
    description: 'A test molded bonbon',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    tags: ['test', 'bonbon'],
    urls: [{ url: 'https://example.com/bonbon', category: 'Reference' as UrlCategory }],
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Initial version' }] as CommonModel.ICategorizedNote[],
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
        decorations: [
          { description: 'Gold leaf', preferred: true },
          { description: 'Cocoa butter transfer' }
        ],
        molds: {
          options: [{ id: 'common.dome-25mm' as MoldId }],
          preferredId: 'common.dome-25mm' as MoldId
        },
        shellChocolate: {
          ids: ['common.chocolate-dark-64' as IngredientId, 'common.chocolate-dark-70' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        },
        additionalChocolates: [
          {
            chocolate: {
              ids: ['common.chocolate-dark-64' as IngredientId],
              preferredId: 'common.chocolate-dark-64' as IngredientId
            },
            purpose: 'seal'
          }
        ],
        additionalTags: ['v1', 'classic'],
        additionalUrls: [{ url: 'https://example.com/v1', category: 'Version' as UrlCategory }]
      },
      {
        versionSpec: '2026-01-02-01' as ConfectionVersionSpec,
        createdDate: '2026-01-02',
        notes: [{ category: 'user', note: 'Updated recipe' }] as CommonModel.ICategorizedNote[],
        yield: {
          count: 24,
          unit: 'pieces',
          weightPerPiece: 12 as Measurement
        },
        molds: {
          options: [{ id: 'common.dome-25mm' as MoldId }],
          preferredId: 'common.dome-25mm' as MoldId
        },
        shellChocolate: {
          ids: ['common.chocolate-dark-64' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        }
      }
    ]
  };

  const barTruffleData: Confections.IBarTruffleEntity = {
    baseId: 'test-bar' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    description: 'A test bar truffle',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        yield: {
          count: 48,
          unit: 'pieces',
          weightPerPiece: 10 as Measurement
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
          ids: ['common.chocolate-dark-64' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        }
      }
    ]
  };

  const rolledTruffleData: Confections.IRolledTruffleEntity = {
    baseId: 'test-rolled' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        yield: {
          count: 40,
          unit: 'pieces'
        },
        enrobingChocolate: {
          ids: ['common.chocolate-dark-64' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        },
        coatings: {
          ids: ['common.cocoa-powder' as IngredientId],
          preferredId: 'common.cocoa-powder' as IngredientId
        }
      }
    ]
  };

  // Minimal context for testing - provides mock implementations for resolution
  const mockContext: IConfectionContext = {
    getRuntimeIngredient: (id: IngredientId) => {
      // Return a minimal mock chocolate ingredient
      return Success.with({
        id,
        sourceId: 'common' as CollectionId,
        baseId: 'chocolate-dark-64' as BaseIngredientId,
        name: 'Mock Chocolate',
        category: 'chocolate' as IngredientCategory,
        ganacheCharacteristics: { fatContent: 0.35 as Percentage, waterContent: 0.05 as Percentage },
        chocolateType: 'dark' as ChocolateType,
        cacaoPercentage: 64 as Percentage,
        raw: {} as IChocolateIngredientEntity,
        isChocolate: () => true,
        isDairy: () => false,
        isSugar: () => false,
        isFat: () => false,
        isAlcohol: () => false,
        usedByFillings: () => [],
        primaryInFillings: () => [],
        alternateInFillings: () => []
      } as unknown as IChocolateIngredient);
    },
    getRuntimeFilling: (id: FillingId) => {
      // Return a minimal mock filling recipe
      return Success.with({
        id,
        sourceId: 'common' as CollectionId,
        baseId: 'dark-ganache-classic' as BaseFillingId,
        name: 'Mock Ganache' as FillingName,
        goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
        raw: {} as IFillingRecipeEntity
      } as unknown as IFillingRecipe);
    },
    getRuntimeMold: (id: MoldId) => {
      // Return a minimal mock mold
      return Success.with({
        id,
        name: 'Mock Mold',
        dimensions: { width: 25 as Millimeters, height: 25 as Millimeters, depth: 10 as Millimeters }
      } as unknown as IRuntimeMold);
    },
    getRuntimeProcedure: (id: ProcedureId) => {
      // Return a minimal mock procedure
      return Success.with({
        id,
        name: 'Mock Procedure',
        steps: []
      } as unknown as IRuntimeProcedure);
    },
    getRuntimeConfection: (id: ConfectionId) => {
      // Return confection data based on ID for proper parent navigation testing
      if (id === 'test.test-bonbon') {
        return Success.with({
          id,
          name: 'Test Bonbon',
          confectionType: 'molded-bonbon',
          tags: ['test', 'bonbon'],
          urls: [{ url: 'https://example.com/bonbon', category: 'Reference' }]
        } as unknown as IConfectionBase);
      }
      if (id === 'test.test-bar') {
        return Success.with({
          id,
          name: 'Test Bar Truffle',
          confectionType: 'bar-truffle',
          tags: undefined,
          urls: undefined
        } as unknown as IConfectionBase);
      }
      if (id === 'test.test-rolled') {
        return Success.with({
          id,
          name: 'Test Rolled Truffle',
          confectionType: 'rolled-truffle',
          tags: undefined,
          urls: undefined
        } as unknown as IConfectionBase);
      }
      if (id === 'test.minimal') {
        return Success.with({
          id,
          name: 'Minimal Bonbon',
          confectionType: 'molded-bonbon',
          tags: undefined,
          urls: undefined
        } as unknown as IConfectionBase);
      }
      return Success.with({
        id,
        name: 'Mock Confection',
        tags: undefined,
        urls: undefined
      } as unknown as IConfectionBase);
    },
    // Resolution helpers - these delegate to the mock getRuntime* methods
    resolveChocolateSpec: (
      spec: Confections.IChocolateSpec,
      confectionId: ConfectionId
    ): IResolvedChocolateSpec => {
      const primaryId = spec.preferredId ?? spec.ids[0];
      const chocolate = mockContext.getRuntimeIngredient(primaryId).value as IChocolateIngredient;
      // Populate alternates from all IDs except the primary
      const alternates = spec.ids
        .filter((id) => id !== primaryId)
        .map((id) => mockContext.getRuntimeIngredient(id).value as IChocolateIngredient);
      return {
        chocolate,
        alternates,
        raw: spec
      };
    },
    resolveCoatings: (coatings: Confections.ICoatings): IResolvedCoatings => {
      const options = coatings.ids.map((id) => ({
        id,
        ingredient: mockContext.getRuntimeIngredient(id).value!
      }));
      const preferredId = coatings.preferredId ?? coatings.ids[0];
      return {
        options,
        preferred: options.find((opt) => opt.id === preferredId),
        raw: coatings
      };
    },
    resolveMoldRefs: (
      molds: CommonModel.IOptionsWithPreferred<Confections.IConfectionMoldRef, MoldId>
    ): CommonModel.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> => {
      const options = molds.options.map((ref) => ({
        id: ref.id,
        mold: mockContext.getRuntimeMold(ref.id).value!,
        notes: ref.notes,
        raw: ref
      }));
      return {
        options,
        preferredId: molds.preferredId
      };
    },
    resolveAdditionalChocolates: (
      additional: ReadonlyArray<Confections.IAdditionalChocolateEntity> | undefined,
      confectionId: ConfectionId
    ): ReadonlyArray<IResolvedAdditionalChocolate> | undefined => {
      if (!additional || additional.length === 0) return undefined;
      return additional.map((item) => ({
        chocolate: mockContext.resolveChocolateSpec(item.chocolate, confectionId),
        purpose: item.purpose,
        raw: item
      }));
    },
    resolveFillingSlots: (
      slots: ReadonlyArray<Confections.IFillingSlotEntity> | undefined
    ): ReadonlyArray<IResolvedFillingSlot> | undefined => {
      if (!slots || slots.length === 0) return undefined;
      return slots.map((slot) => ({
        slotId: slot.slotId,
        name: slot.name,
        filling: {
          options: slot.filling.options.map((opt) => {
            if (opt.type === 'recipe') {
              return {
                type: 'recipe' as const,
                id: opt.id,
                filling: mockContext.getRuntimeFilling(opt.id).value!,
                notes: opt.notes,
                raw: opt
              };
            }
            return {
              type: 'ingredient' as const,
              id: opt.id,
              ingredient: mockContext.getRuntimeIngredient(opt.id).value!,
              notes: opt.notes,
              raw: opt
            };
          }),
          preferredId: slot.filling.preferredId
        }
      }));
    },
    resolveProcedures: (
      procedures: CommonModel.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId> | undefined
    ): CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined => {
      if (!procedures || procedures.options.length === 0) return undefined;
      const options = procedures.options.map((ref) => ({
        id: ref.id,
        procedure: mockContext.getRuntimeProcedure(ref.id).value!,
        notes: ref.notes,
        raw: ref
      }));
      return {
        options,
        preferredId: procedures.preferredId
      };
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
      expect(runtime.collectionId).toBe('test');
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
      // filling.options is now resolved - check the filling object
      expect(slot?.filling.options[0].type).toBe('recipe');
      if (slot?.filling.options[0].type === 'recipe') {
        expect(slot.filling.options[0].filling.id).toBe('common.dark-ganache-classic');
      }
      expect(slot?.filling.preferredId).toBe('common.dark-ganache-classic');
    });

    test('exposes version properties', () => {
      expect(runtime.goldenVersionSpec).toBe('2026-01-01-01');
      expect(runtime.goldenVersion.versionSpec).toBe('2026-01-01-01');
      expect(runtime.goldenVersion.notes).toEqual([{ category: 'user', note: 'Initial version' }]);
      expect(runtime.versions).toHaveLength(2);
    });

    test('getVersion returns version for valid spec', () => {
      expect(runtime.getVersion('2026-01-02-01' as ConfectionVersionSpec)).toSucceedAndSatisfy((version) => {
        expect(version.notes).toEqual([{ category: 'user', note: 'Updated recipe' }]);
      });
    });

    test('getVersion returns cached version on subsequent calls', () => {
      const firstCall = runtime.getVersion('2026-01-01-01' as ConfectionVersionSpec);
      const secondCall = runtime.getVersion('2026-01-01-01' as ConfectionVersionSpec);
      expect(firstCall).toSucceed();
      expect(secondCall).toSucceed();
      // Verify both calls return the same cached instance
      expect(firstCall.value).toBe(secondCall.value);
    });

    test('getVersion fails for invalid spec', () => {
      expect(runtime.getVersion('9999-99-99-99' as ConfectionVersionSpec)).toFailWith(/not found/i);
    });

    test('exposes molded bonbon-specific properties', () => {
      expect(runtime.molds.options).toHaveLength(1);
      expect(runtime.molds.preferredId).toBe('common.dome-25mm');
      // shellChocolate is now resolved - check chocolate and alternates
      expect(runtime.shellChocolate.chocolate.id).toBe('common.chocolate-dark-64');
      expect(runtime.shellChocolate.alternates).toHaveLength(1);
      expect(runtime.shellChocolate.alternates[0].id).toBe('common.chocolate-dark-70');
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

    test('procedures is undefined when not set', () => {
      expect(runtime.procedures).toBeUndefined();
    });

    test('exposes urls from base confection', () => {
      expect(runtime.urls).toHaveLength(1);
      expect(runtime.urls?.[0].url).toBe('https://example.com/bonbon');
      expect(runtime.urls?.[0].category).toBe('Reference');
    });

    test('exposes typed goldenVersion', () => {
      const golden = runtime.goldenVersion;
      expect(golden.versionSpec).toBe('2026-01-01-01');
      expect(golden.molds.options).toHaveLength(1);
      // shellChocolate is resolved with raw access for IDs
      expect(golden.shellChocolate.raw.ids).toContain('common.chocolate-dark-64');
    });

    test('version exposes base properties', () => {
      const golden = runtime.goldenVersion;
      // Test base properties from RuntimeConfectionVersionBase
      expect(golden.createdDate).toBe('2026-01-01');
      expect(golden.confectionId).toBe('test.test-bonbon');
      expect(golden.yield.count).toBe(24);
      expect(golden.yield.unit).toBe('pieces');
      expect(golden.decorations).toHaveLength(2);
      expect(golden.notes).toEqual([{ category: 'user', note: 'Initial version' }]);
    });

    test('version exposes parent navigation', () => {
      const golden = runtime.goldenVersion;
      // Test parent navigation - version.confection returns the parent confection
      const parent = golden.confection;
      expect(parent.id).toBe('test.test-bonbon');
      expect(parent.name).toBe('Test Bonbon');
      expect(parent.confectionType).toBe('molded-bonbon');
    });

    test('version type guards work correctly', () => {
      const golden = runtime.goldenVersion;
      expect(golden.isMoldedBonBonVersion()).toBe(true);
      expect(golden.isBarTruffleVersion()).toBe(false);
      expect(golden.isRolledTruffleVersion()).toBe(false);
    });

    test('version exposes effectiveTags', () => {
      const golden = runtime.goldenVersion;
      // Test effectiveTags on the version object
      const effective = golden.effectiveTags;
      expect(effective).toContain('test');
      expect(effective).toContain('bonbon');
      expect(effective).toContain('v1');
      expect(effective).toContain('classic');
    });

    test('version exposes effectiveUrls', () => {
      const golden = runtime.goldenVersion;
      // Test effectiveUrls on the version object
      const effective = golden.effectiveUrls;
      expect(effective).toHaveLength(2);
      expect(effective[0].url).toBe('https://example.com/bonbon');
      expect(effective[1].url).toBe('https://example.com/v1');
    });

    test('version exposes raw data', () => {
      const golden = runtime.goldenVersion;
      expect(golden.raw).toBe(moldedBonBonData.versions[0]);
    });

    test('exposes typed versions array', () => {
      const versions = runtime.versions;
      expect(versions).toHaveLength(2);
      expect(versions[0].versionSpec).toBe('2026-01-01-01');
      expect(versions[1].versionSpec).toBe('2026-01-02-01');
      expect(versions[0].molds.options).toHaveLength(1);
    });

    test('effectiveTags merges base and version tags with deduplication', () => {
      const effective = runtime.effectiveTags;
      expect(effective).toContain('test');
      expect(effective).toContain('bonbon');
      expect(effective).toContain('v1');
      expect(effective).toContain('classic');
      expect(effective.length).toBe(4);
    });

    test('effectiveUrls merges base and version urls', () => {
      const effective = runtime.effectiveUrls;
      expect(effective).toHaveLength(2);
      expect(effective[0].url).toBe('https://example.com/bonbon');
      expect(effective[1].url).toBe('https://example.com/v1');
    });

    test('getEffectiveTags with specific version', () => {
      const secondVersion = runtime.versions[1];
      const effective = runtime.getEffectiveTags(secondVersion);
      // Base tags only since second version has no additionalTags
      expect(effective).toContain('test');
      expect(effective).toContain('bonbon');
      expect(effective.length).toBe(2);
    });

    test('getEffectiveUrls with specific version', () => {
      const secondVersion = runtime.versions[1];
      const effective = runtime.getEffectiveUrls(secondVersion);
      // Base URLs only since second version has no additionalUrls
      expect(effective).toHaveLength(1);
      expect(effective[0].url).toBe('https://example.com/bonbon');
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
      expect(runtime.collectionId).toBe('test');
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
      // enrobingChocolate is now resolved
      expect(runtime.enrobingChocolate?.chocolate.id).toBe('common.chocolate-dark-64');
    });

    test('type guards work correctly', () => {
      expect(runtime.isMoldedBonBon()).toBe(false);
      expect(runtime.isBarTruffle()).toBe(true);
      expect(runtime.isRolledTruffle()).toBe(false);
    });

    test('raw returns underlying data', () => {
      expect(runtime.raw).toBe(barTruffleData);
    });

    test('exposes typed versions array', () => {
      const versions = runtime.versions;
      expect(versions).toHaveLength(1);
      expect(versions[0].versionSpec).toBe('2026-01-01-01');
      expect(versions[0].frameDimensions.width).toBe(300);
    });

    test('version exposes base properties and parent navigation', () => {
      const golden = runtime.goldenVersion;
      // Test base properties
      expect(golden.createdDate).toBe('2026-01-01');
      expect(golden.confectionId).toBe('test.test-bar');
      expect(golden.yield.count).toBe(48);
      // Test parent navigation - confection getter override
      const parent = golden.confection;
      expect(parent.id).toBe('test.test-bar');
      expect(parent.confectionType).toBe('bar-truffle');
      // Test raw access
      expect(golden.raw).toBe(barTruffleData.versions[0]);
    });

    test('version type guards work correctly', () => {
      const golden = runtime.goldenVersion;
      expect(golden.isMoldedBonBonVersion()).toBe(false);
      expect(golden.isBarTruffleVersion()).toBe(true);
      expect(golden.isRolledTruffleVersion()).toBe(false);
    });

    test('version effectiveTags handles undefined base tags', () => {
      // Bar truffle mock has undefined tags
      const golden = runtime.goldenVersion;
      const effective = golden.effectiveTags;
      // Version has no additionalTags, base confection has undefined tags
      expect(effective).toHaveLength(0);
    });

    test('version effectiveUrls handles undefined base urls', () => {
      // Bar truffle mock has undefined urls
      const golden = runtime.goldenVersion;
      const effective = golden.effectiveUrls;
      // Version has no additionalUrls, base confection has undefined urls
      expect(effective).toHaveLength(0);
    });

    test('getVersion returns typed version', () => {
      expect(runtime.getVersion('2026-01-01-01' as ConfectionVersionSpec)).toSucceedAndSatisfy((version) => {
        expect(version.versionSpec).toBe('2026-01-01-01');
        expect(version.frameDimensions.width).toBe(300);
      });
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
      expect(runtime.collectionId).toBe('test');
      expect(runtime.baseId).toBe('test-rolled');
    });

    test('exposes core confection properties', () => {
      expect(runtime.name).toBe('Test Rolled Truffle');
      expect(runtime.confectionType).toBe('rolled-truffle');
    });

    test('exposes rolled truffle-specific properties', () => {
      // enrobingChocolate is now resolved
      expect(runtime.enrobingChocolate?.chocolate.id).toBe('common.chocolate-dark-64');
      // coatings is now resolved with preferred ingredient
      expect(runtime.coatings?.options).toHaveLength(1);
      expect(runtime.coatings?.preferred?.id).toBe('common.cocoa-powder');
      expect(runtime.coatings?.preferred?.ingredient).toBeDefined();
    });

    test('type guards work correctly', () => {
      expect(runtime.isMoldedBonBon()).toBe(false);
      expect(runtime.isBarTruffle()).toBe(false);
      expect(runtime.isRolledTruffle()).toBe(true);
    });

    test('raw returns underlying data', () => {
      expect(runtime.raw).toBe(rolledTruffleData);
    });

    test('exposes typed versions array', () => {
      const versions = runtime.versions;
      expect(versions).toHaveLength(1);
      expect(versions[0].versionSpec).toBe('2026-01-01-01');
      expect(versions[0].coatings?.raw.ids).toHaveLength(1);
    });

    test('version exposes base properties and parent navigation', () => {
      const golden = runtime.goldenVersion;
      // Test base properties
      expect(golden.createdDate).toBe('2026-01-01');
      expect(golden.confectionId).toBe('test.test-rolled');
      expect(golden.yield.count).toBe(40);
      // Test parent navigation - confection getter override
      const parent = golden.confection;
      expect(parent.id).toBe('test.test-rolled');
      expect(parent.confectionType).toBe('rolled-truffle');
      // Test raw access
      expect(golden.raw).toBe(rolledTruffleData.versions[0]);
    });

    test('version type guards work correctly', () => {
      const golden = runtime.goldenVersion;
      expect(golden.isMoldedBonBonVersion()).toBe(false);
      expect(golden.isBarTruffleVersion()).toBe(false);
      expect(golden.isRolledTruffleVersion()).toBe(true);
    });

    test('getVersion returns typed version', () => {
      expect(runtime.getVersion('2026-01-01-01' as ConfectionVersionSpec)).toSucceedAndSatisfy((version) => {
        expect(version.versionSpec).toBe('2026-01-01-01');
        expect(version.coatings?.raw.ids).toHaveLength(1);
      });
    });
  });

  // ============================================================================
  // Confection Without Optional Properties
  // ============================================================================

  describe('confection without optional properties', () => {
    const minimalMolded: Confections.IMoldedBonBonEntity = {
      baseId: 'minimal' as BaseConfectionId,
      confectionType: 'molded-bonbon',
      name: 'Minimal Bonbon' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01',
          yield: { count: 12 },
          molds: {
            options: [{ id: 'common.dome-25mm' as MoldId }]
          },
          shellChocolate: {
            ids: ['common.chocolate-dark-64' as IngredientId]
          }
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
        expect(runtime.procedures).toBeUndefined();
      });
    });

    test('returns empty arrays for effectiveTags when no tags defined', () => {
      expect(
        RuntimeMoldedBonBon.create(mockContext, 'test.minimal' as ConfectionId, minimalMolded)
      ).toSucceedAndSatisfy((runtime) => {
        // Tests both branches in getEffectiveTags: version undefined (uses golden) and tags undefined
        expect(runtime.getEffectiveTags()).toEqual([]);
        expect(runtime.effectiveTags).toEqual([]);
      });
    });

    test('returns empty arrays for effectiveUrls when no urls defined', () => {
      expect(
        RuntimeMoldedBonBon.create(mockContext, 'test.minimal' as ConfectionId, minimalMolded)
      ).toSucceedAndSatisfy((runtime) => {
        // Tests both branches in getEffectiveUrls: version undefined (uses golden) and urls undefined
        expect(runtime.getEffectiveUrls()).toEqual([]);
        expect(runtime.effectiveUrls).toEqual([]);
      });
    });
  });

  // ============================================================================
  // Bar Truffle Without Enrobing
  // ============================================================================

  describe('bar truffle without enrobing chocolate', () => {
    const barWithoutEnrobing: Confections.IBarTruffleEntity = {
      baseId: 'no-enrobing' as BaseConfectionId,
      confectionType: 'bar-truffle',
      name: 'Bar Without Enrobing' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01',
          yield: { count: 24 },
          frameDimensions: {
            width: 200 as Millimeters,
            height: 150 as Millimeters,
            depth: 10 as Millimeters
          },
          singleBonBonDimensions: {
            width: 20 as Millimeters,
            height: 20 as Millimeters
          }
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
    const rolledWithoutCoatings: Confections.IRolledTruffleEntity = {
      baseId: 'no-coatings' as BaseConfectionId,
      confectionType: 'rolled-truffle',
      name: 'Rolled Without Coatings' as ConfectionName,
      goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
      versions: [
        {
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
          createdDate: '2026-01-01',
          yield: { count: 30 }
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
