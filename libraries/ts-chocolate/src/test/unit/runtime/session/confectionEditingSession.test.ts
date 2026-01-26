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
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  ConfectionId,
  ConfectionName,
  ConfectionVersionSpec,
  FillingName,
  FillingVersionSpec,
  Measurement,
  IngredientId,
  Millimeters,
  MoldFormat,
  MoldId,
  Percentage,
  ProcedureId,
  FillingId,
  SlotId,
  SourceId
} from '../../../../packlets/common';
import {
  IAdditionalChocolate,
  IChocolateIngredient,
  IChocolateSpec,
  ICoatings,
  IConfectionMoldRef,
  IFillingRecipe,
  IFillingSlot,
  IGanacheCharacteristics,
  IMold,
  IMoldedBonBon,
  IBarTruffle,
  IProcedure,
  IProcedureRef,
  IRolledTruffle,
  Ingredient
} from '../../../../packlets/entities';
import { IOptionsWithPreferred } from '../../../../packlets/common';
import {
  RuntimeMoldedBonBon,
  RuntimeBarTruffle,
  RuntimeRolledTruffle,
  IConfectionContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedCoatings,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IRuntimeAlcoholIngredient,
  IRuntimeConfection,
  IRuntimeDairyIngredient,
  IRuntimeFatIngredient,
  IRuntimeFillingRecipe,
  IRuntimeFillingRecipeVersion,
  IRuntimeIngredient,
  IRuntimeMold,
  IRuntimeProcedure,
  IRuntimeChocolateIngredient,
  IRuntimeRenderedProcedure,
  IRuntimeSugarIngredient
} from '../../../../packlets/runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { ConfectionEditingSession } from '../../../../packlets/runtime/session';
import { Logging, succeed } from '@fgv/ts-utils';

describe('ConfectionEditingSession', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  // Create mock runtime objects that match the new resolved types
  const mockGanacheCharacteristics: IGanacheCharacteristics = {
    cacaoFat: 0.35 as unknown as Percentage,
    sugar: 0.25 as unknown as Percentage,
    milkFat: 0 as unknown as Percentage,
    water: 0.01 as unknown as Percentage,
    solids: 0.99 as unknown as Percentage,
    otherFats: 0 as unknown as Percentage
  };

  const mockChocolate64: IRuntimeChocolateIngredient = {
    id: 'common.chocolate-dark-64' as IngredientId,
    sourceId: 'common' as unknown as SourceId,
    baseId: 'chocolate-dark-64' as unknown as BaseIngredientId,
    name: 'Dark Chocolate 64%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 64 as unknown as Percentage,
    ganacheCharacteristics: mockGanacheCharacteristics,
    isChocolate(): this is IRuntimeChocolateIngredient {
      return true;
    },
    isDairy(): this is IRuntimeDairyIngredient {
      return false;
    },
    isSugar(): this is IRuntimeSugarIngredient {
      return false;
    },
    isFat(): this is IRuntimeFatIngredient {
      return false;
    },
    isAlcohol(): this is IRuntimeAlcoholIngredient {
      return false;
    },
    usedByFillings: () => [],
    primaryInFillings: () => [],
    alternateInFillings: () => [],
    raw: {} as unknown as IChocolateIngredient
  };

  const mockChocolate70: IRuntimeChocolateIngredient = {
    ...mockChocolate64,
    id: 'common.chocolate-dark-70' as IngredientId,
    baseId: 'chocolate-dark-70' as unknown as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    cacaoPercentage: 70 as unknown as Percentage
  };

  const mockIngredient = (id: IngredientId, name: string): IRuntimeIngredient => ({
    id,
    sourceId: 'common' as unknown as SourceId,
    baseId: id.split('.')[1] as unknown as BaseIngredientId,
    name,
    category: 'other',
    ganacheCharacteristics: mockGanacheCharacteristics,
    isChocolate(): this is IRuntimeChocolateIngredient {
      return false;
    },
    isDairy(): this is IRuntimeDairyIngredient {
      return false;
    },
    isSugar(): this is IRuntimeSugarIngredient {
      return false;
    },
    isFat(): this is IRuntimeFatIngredient {
      return false;
    },
    isAlcohol(): this is IRuntimeAlcoholIngredient {
      return false;
    },
    usedByFillings: () => [],
    primaryInFillings: () => [],
    alternateInFillings: () => [],
    raw: {} as unknown as Ingredient
  });

  const mockFilling = (id: FillingId, name: string): IRuntimeFillingRecipe => ({
    id,
    sourceId: 'common' as unknown as SourceId,
    baseId: id.split('.')[1] as unknown as BaseFillingId,
    name: name as unknown as FillingName,
    goldenVersionSpec: '2026-01-01-01' as unknown as FillingVersionSpec,
    goldenVersion: {} as unknown as IRuntimeFillingRecipeVersion,
    versions: [],
    getVersion: () => succeed({} as unknown as IRuntimeFillingRecipeVersion),
    latestVersion: {} as unknown as IRuntimeFillingRecipeVersion,
    versionCount: 1,
    getIngredientIds: () => new Set(),
    usesIngredient: () => false,
    raw: {} as unknown as IFillingRecipe
  });

  const mockMold = (id: MoldId, name: string): IRuntimeMold => ({
    id,
    sourceId: 'common' as unknown as SourceId,
    baseId: id.split('.')[1] as unknown as BaseMoldId,
    manufacturer: 'Mock Manufacturer',
    productNumber: 'MOCK-001',
    description: name,
    cavities: { kind: 'count', count: 24 },
    cavityCount: 24,
    cavityWeight: undefined,
    cavityDimensions: undefined,
    format: 'standard' as unknown as MoldFormat,
    tags: undefined,
    related: undefined,
    totalCapacity: undefined,
    displayName: name,
    raw: {} as unknown as IMold
  });

  const mockProcedure = (id: ProcedureId, name: string): IRuntimeProcedure => ({
    id,
    baseId: id.split('.')[1] as unknown as BaseProcedureId,
    name,
    steps: [],
    totalActiveTime: undefined,
    totalWaitTime: undefined,
    totalHoldTime: undefined,
    totalTime: undefined,
    stepCount: 0,
    isCategorySpecific: false,
    render: () => succeed({} as unknown as IRuntimeRenderedProcedure),
    raw: {} as unknown as IProcedure
  });

  const mockContext: IConfectionContext = {
    getRuntimeIngredient: jest.fn((id: IngredientId) => {
      if (id === 'common.chocolate-dark-64') return succeed(mockChocolate64);
      if (id === 'common.chocolate-dark-70') return succeed(mockChocolate70);
      if (id === 'common.caramel') return succeed(mockIngredient(id, 'Caramel'));
      if (id === 'common.praline') return succeed(mockIngredient(id, 'Praline'));
      if (id === 'common.cocoa-powder') return succeed(mockIngredient(id, 'Cocoa Powder'));
      if (id === 'common.powdered-sugar') return succeed(mockIngredient(id, 'Powdered Sugar'));
      if (id === 'common.chocolate-white') return succeed(mockIngredient(id, 'White Chocolate'));
      return succeed(mockIngredient(id, `Mock ${id}`));
    }),
    getRuntimeFilling: jest.fn((id: FillingId) => {
      if (id === 'common.dark-ganache-classic') return succeed(mockFilling(id, 'Dark Ganache Classic'));
      if (id === 'common.milk-ganache') return succeed(mockFilling(id, 'Milk Ganache'));
      return succeed(mockFilling(id, `Mock ${id}`));
    }),
    getRuntimeMold: jest.fn((id: MoldId) => {
      if (id === 'common.dome-25mm') return succeed(mockMold(id, 'Dome 25mm'));
      if (id === 'common.square-20mm') return succeed(mockMold(id, 'Square 20mm'));
      return succeed(mockMold(id, `Mock ${id}`));
    }),
    getRuntimeProcedure: jest.fn((id: ProcedureId) => {
      if (id === 'common.molded-bonbon-standard') return succeed(mockProcedure(id, 'Standard Molded Bonbon'));
      if (id === 'common.molded-bonbon-double-shell')
        return succeed(mockProcedure(id, 'Double Shell Molded Bonbon'));
      return succeed(mockProcedure(id, `Mock ${id}`));
    }),
    getRuntimeConfection: jest.fn((id: ConfectionId) => {
      // Return a minimal mock confection for parent navigation
      return succeed({
        id,
        name: 'Mock Confection'
      } as unknown as IRuntimeConfection);
    }),
    // Resolution helpers - delegate to the mock getRuntime* methods
    resolveChocolateSpec: jest.fn(
      (spec: IChocolateSpec, _confectionId: ConfectionId): IResolvedChocolateSpec => {
        const primaryId = spec.preferredId ?? spec.ids[0];
        const chocolate = mockContext.getRuntimeIngredient(primaryId).value as IRuntimeChocolateIngredient;
        return {
          chocolate,
          alternates: [],
          raw: spec
        };
      }
    ),
    resolveCoatings: jest.fn((coatings: ICoatings): IResolvedCoatings => {
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
    }),
    resolveMoldRefs: jest.fn(
      (
        molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>
      ): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> => {
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
      }
    ),
    resolveAdditionalChocolates: jest.fn(
      (
        additional: ReadonlyArray<IAdditionalChocolate> | undefined,
        confectionId: ConfectionId
      ): ReadonlyArray<IResolvedAdditionalChocolate> | undefined => {
        if (!additional || additional.length === 0) return undefined;
        return additional.map((item) => ({
          chocolate: mockContext.resolveChocolateSpec(item.chocolate, confectionId),
          purpose: item.purpose,
          raw: item
        }));
      }
    ),
    resolveFillingSlots: jest.fn(
      (slots: ReadonlyArray<IFillingSlot> | undefined): ReadonlyArray<IResolvedFillingSlot> | undefined => {
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
      }
    ),
    resolveProcedures: jest.fn(
      (
        procedures: IOptionsWithPreferred<IProcedureRef, ProcedureId> | undefined
      ): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined => {
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
    )
  };

  const moldedBonBonData: IMoldedBonBon = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Bonbon' as ConfectionName,
    description: 'A test molded bonbon',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    tags: ['test', 'bonbon'],
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Initial version',
        yield: {
          count: 24,
          unit: 'pieces',
          weightPerPiece: 12 as Measurement
        },
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Ganache Center',
            filling: {
              options: [
                { type: 'recipe', id: 'common.dark-ganache-classic' as FillingId },
                { type: 'recipe', id: 'common.milk-ganache' as FillingId },
                { type: 'ingredient', id: 'common.caramel' as IngredientId }
              ],
              preferredId: 'common.dark-ganache-classic' as FillingId
            }
          }
        ],
        decorations: [{ description: 'Gold leaf', preferred: true }],
        molds: {
          options: [{ id: 'common.dome-25mm' as MoldId }, { id: 'common.square-20mm' as MoldId }],
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
        procedures: {
          options: [
            { id: 'common.molded-bonbon-standard' as ProcedureId },
            { id: 'common.molded-bonbon-double-shell' as ProcedureId }
          ],
          preferredId: 'common.molded-bonbon-standard' as ProcedureId
        }
      }
    ]
  };

  const barTruffleData: IBarTruffle = {
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
          ids: ['common.chocolate-dark-64' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        }
      }
    ]
  };

  const rolledTruffleData: IRolledTruffle = {
    baseId: 'test-rolled' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    description: 'A test rolled truffle',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
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
        enrobingChocolate: {
          ids: ['common.chocolate-dark-64' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        },
        coatings: {
          ids: ['common.cocoa-powder' as IngredientId, 'common.powdered-sugar' as IngredientId],
          preferredId: 'common.cocoa-powder' as IngredientId
        }
      }
    ]
  };

  // Helper to create runtime confections
  const createMoldedBonBon = (): RuntimeMoldedBonBon => {
    return RuntimeMoldedBonBon.create(
      mockContext,
      'test.test-bonbon' as ConfectionId,
      moldedBonBonData
    ).orThrow();
  };

  const createBarTruffle = (): RuntimeBarTruffle => {
    return RuntimeBarTruffle.create(mockContext, 'test.test-bar' as ConfectionId, barTruffleData).orThrow();
  };

  const createRolledTruffle = (): RuntimeRolledTruffle => {
    return RuntimeRolledTruffle.create(
      mockContext,
      'test.test-rolled' as ConfectionId,
      rolledTruffleData
    ).orThrow();
  };

  // ============================================================================
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session for molded bonbon', () => {
      const confection = createMoldedBonBon();
      expect(ConfectionEditingSession.create({ sourceConfection: confection })).toSucceedAndSatisfy(
        (session) => {
          expect(session.sourceConfection).toBe(confection);
          expect(session.sessionId).toBeDefined();
          expect(session.isDirty).toBe(false);
          expect(session.isJournalingEnabled).toBe(true);
        }
      );
    });

    test('creates session for bar truffle', () => {
      const confection = createBarTruffle();
      expect(ConfectionEditingSession.create({ sourceConfection: confection })).toSucceedAndSatisfy(
        (session) => {
          expect(session.sourceConfection).toBe(confection);
          expect(session.isDirty).toBe(false);
        }
      );
    });

    test('creates session for rolled truffle', () => {
      const confection = createRolledTruffle();
      expect(ConfectionEditingSession.create({ sourceConfection: confection })).toSucceedAndSatisfy(
        (session) => {
          expect(session.sourceConfection).toBe(confection);
          expect(session.isDirty).toBe(false);
        }
      );
    });

    test('respects enableJournal parameter', () => {
      const confection = createMoldedBonBon();
      expect(
        ConfectionEditingSession.create({ sourceConfection: confection, enableJournal: false })
      ).toSucceedAndSatisfy((session) => {
        expect(session.isJournalingEnabled).toBe(false);
      });
    });

    test('respects initial yield count', () => {
      const confection = createMoldedBonBon();
      expect(
        ConfectionEditingSession.create({ sourceConfection: confection, yieldCount: 48 })
      ).toSucceedAndSatisfy((session) => {
        expect(session.yield.count).toBe(48);
        expect(session.yield.originalCount).toBe(24);
      });
    });

    test('respects initial weight per piece', () => {
      const confection = createMoldedBonBon();
      expect(
        ConfectionEditingSession.create({
          sourceConfection: confection,
          weightPerPiece: 20 as Measurement
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.yield.weightPerPiece).toBe(20);
        expect(session.yield.originalWeightPerPiece).toBe(12);
      });
    });

    test('accepts custom logger', () => {
      const confection = createMoldedBonBon();
      const customLogger = Logging.LogReporter.createDefault().orThrow();
      expect(
        ConfectionEditingSession.create({
          sourceConfection: confection,
          logger: customLogger
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.sourceConfection).toBe(confection);
      });
    });
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    test('initializes filling from preferred for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      const centerFilling = session.fillings.get('center' as SlotId);
      expect(centerFilling).toBeDefined();
      expect(centerFilling?.fillingId).toBe('common.dark-ganache-classic');
      expect(centerFilling?.status).toBe('original');
    });

    test('initializes mold from recommended for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.mold).toBeDefined();
      expect(session.mold?.moldId).toBe('common.dome-25mm');
      expect(session.mold?.status).toBe('original');
    });

    test('initializes shell chocolate for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.chocolates.size).toBeGreaterThan(0);
      const shellChocolate = session.chocolates.get('shell');
      expect(shellChocolate).toBeDefined();
      expect(shellChocolate?.ingredientId).toBe('common.chocolate-dark-64');
      expect(shellChocolate?.status).toBe('original');
    });

    test('initializes procedure from recommended for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.procedure).toBeDefined();
      expect(session.procedure?.procedureId).toBe('common.molded-bonbon-standard');
      expect(session.procedure?.status).toBe('original');
    });

    test('initializes coating for rolled truffle', () => {
      const confection = createRolledTruffle();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.coating).toBeDefined();
      expect(session.coating?.ingredientId).toBe('common.cocoa-powder');
      expect(session.coating?.status).toBe('original');
    });

    test('initializes yield correctly', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.yield.count).toBe(24);
      expect(session.yield.originalCount).toBe(24);
      expect(session.yield.weightPerPiece).toBe(12);
      expect(session.yield.originalWeightPerPiece).toBe(12);
      expect(session.yield.status).toBe('original');
    });

    test('does not have mold for bar truffle', () => {
      const confection = createBarTruffle();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.mold).toBeUndefined();
    });

    test('initializes filling from preferred ingredient option', () => {
      // Create a bonbon where the preferred filling is an ingredient
      const ingredientPreferredData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: {
                  options: [
                    { type: 'ingredient', id: 'common.caramel' as IngredientId },
                    { type: 'ingredient', id: 'common.praline' as IngredientId }
                  ],
                  preferredId: 'common.caramel' as IngredientId
                }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-ingr-preferred' as ConfectionId,
        ingredientPreferredData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      const centerFilling = session.fillings.get('center' as SlotId);
      expect(centerFilling).toBeDefined();
      expect(centerFilling?.ingredientId).toBe('common.caramel');
      expect(centerFilling?.fillingId).toBeUndefined();
      expect(centerFilling?.status).toBe('original');
    });

    test('initializes filling from first option when no preferred', () => {
      // Create a bonbon with options but no preferredId
      const noPreferredData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: {
                  options: [
                    { type: 'recipe', id: 'common.dark-ganache-classic' as FillingId },
                    { type: 'ingredient', id: 'common.caramel' as IngredientId }
                  ]
                  // No preferredId
                }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-preferred' as ConfectionId,
        noPreferredData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      const centerFilling = session.fillings.get('center' as SlotId);
      expect(centerFilling).toBeDefined();
      expect(centerFilling?.fillingId).toBe('common.dark-ganache-classic');
      expect(centerFilling?.status).toBe('original');
    });

    test('skips filling slots with empty options array', () => {
      // Create a bonbon with empty options array
      const emptyOptionsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: {
                  options: []
                }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-empty-options' as ConfectionId,
        emptyOptionsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Slots with empty options are skipped during initialization
      expect(session.fillings.size).toBe(0);
    });

    test('initializes multiple filling slots', () => {
      // Create a bonbon with multiple filling slots
      const multiSlotData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'outer-layer' as SlotId,
                name: 'Outer Ganache',
                filling: {
                  options: [{ type: 'recipe', id: 'common.dark-ganache-classic' as FillingId }],
                  preferredId: 'common.dark-ganache-classic' as FillingId
                }
              },
              {
                slotId: 'center' as SlotId,
                name: 'Center Insert',
                filling: {
                  options: [{ type: 'ingredient', id: 'common.praline' as IngredientId }],
                  preferredId: 'common.praline' as IngredientId
                }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-multi-slot' as ConfectionId,
        multiSlotData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.fillings.size).toBe(2);
      expect(session.fillings.get('outer-layer' as SlotId)?.fillingId).toBe('common.dark-ganache-classic');
      expect(session.fillings.get('center' as SlotId)?.ingredientId).toBe('common.praline');
    });

    test('does not have coating for rolled truffle without coatings', () => {
      // Create a rolled truffle without coatings
      const noCoatingsData: IRolledTruffle = {
        ...rolledTruffleData,
        versions: [
          {
            ...rolledTruffleData.versions[0],
            coatings: undefined
          }
        ]
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-no-coat' as ConfectionId,
        noCoatingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.coating).toBeUndefined();
    });
  });

  // ============================================================================
  // Filling Selection Tests
  // ============================================================================

  describe('selectFillingRecipe', () => {
    test('selects a filling recipe for a slot', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectFillingRecipe('center' as SlotId, 'common.milk-ganache' as FillingId)).toSucceed();
      const centerFilling = session.fillings.get('center' as SlotId);
      expect(centerFilling?.fillingId).toBe('common.milk-ganache');
      expect(centerFilling?.ingredientId).toBeUndefined();
      expect(centerFilling?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for confection without fillings', () => {
      // Create a molded bonbon without fillings
      const noFillingsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [{ ...moldedBonBonData.versions[0], fillings: undefined }]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon-no-fillings' as ConfectionId,
        noFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();
      expect(session.selectFillingRecipe('center' as SlotId, 'common.milk-ganache' as FillingId)).toFailWith(
        /does not exist/
      );
    });

    test('fails for non-existent slot', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(
        session.selectFillingRecipe('non-existent-slot' as SlotId, 'common.milk-ganache' as FillingId)
      ).toFailWith(/does not exist/);
    });

    test('adds journal entry when journaling is enabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectFillingRecipe('center' as SlotId, 'common.milk-ganache' as FillingId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('filling-select');
      expect(session.journalEntries[0].fillingSlotId).toBe('center');
    });

    test('does not add journal entry when journaling is disabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({
        sourceConfection: confection,
        enableJournal: false
      }).orThrow();

      session.selectFillingRecipe('center' as SlotId, 'common.milk-ganache' as FillingId);
      expect(session.journalEntries.length).toBe(0);
    });

    test('fails for slot with empty options since slot is not initialized', () => {
      // Create a bonbon with an empty options array in filling slot
      const emptyOptionsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: { options: [] }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-empty-options2' as ConfectionId,
        emptyOptionsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Slots with empty options are not initialized, so selection fails
      expect(
        session.selectFillingRecipe('center' as SlotId, 'common.dark-ganache-classic' as FillingId)
      ).toFailWith(/does not exist/);
    });
  });

  describe('selectFillingIngredient', () => {
    test('selects a filling ingredient for a slot', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(
        session.selectFillingIngredient('center' as SlotId, 'common.caramel' as IngredientId)
      ).toSucceed();
      const centerFilling = session.fillings.get('center' as SlotId);
      expect(centerFilling?.ingredientId).toBe('common.caramel');
      expect(centerFilling?.fillingId).toBeUndefined();
      expect(centerFilling?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for confection without fillings', () => {
      const noFillingsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [{ ...moldedBonBonData.versions[0], fillings: undefined }]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon-no-fillings2' as ConfectionId,
        noFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();
      expect(
        session.selectFillingIngredient('center' as SlotId, 'common.caramel' as IngredientId)
      ).toFailWith(/does not exist/);
    });

    test('fails for non-existent slot', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(
        session.selectFillingIngredient('non-existent-slot' as SlotId, 'common.caramel' as IngredientId)
      ).toFailWith(/does not exist/);
    });

    test('fails for slot with empty options since slot is not initialized', () => {
      // Create a bonbon with empty options in filling slot
      const emptyOptionsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            fillings: [
              {
                slotId: 'center' as SlotId,
                filling: { options: [] }
              }
            ]
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-empty-options3' as ConfectionId,
        emptyOptionsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Slots with empty options are not initialized, so selection fails
      expect(
        session.selectFillingIngredient('center' as SlotId, 'common.caramel' as IngredientId)
      ).toFailWith(/does not exist/);
    });
  });

  // ============================================================================
  // Mold Selection Tests
  // ============================================================================

  describe('selectMold', () => {
    test('selects a mold for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectMold('common.square-20mm' as MoldId)).toSucceed();
      expect(session.mold?.moldId).toBe('common.square-20mm');
      expect(session.mold?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-molded confection', () => {
      const confection = createBarTruffle();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectMold('common.dome-25mm' as MoldId)).toFailWith(/does not support mold selection/);
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectMold('common.square-20mm' as MoldId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('mold-select');
    });

    test('selects mold when no initial mold is set', () => {
      // Create a bonbon with empty molds array
      const emptyMoldsData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            molds: {
              options: [] // Empty array means no initial mold
            }
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-mold' as ConfectionId,
        emptyMoldsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Initial mold should be undefined
      expect(session.mold).toBeUndefined();

      // Should be able to select a mold
      expect(session.selectMold('common.dome-25mm' as MoldId)).toSucceed();
      expect(session.mold?.moldId).toBe('common.dome-25mm');
      expect(session.mold?.originalMoldId).toBe('common.dome-25mm');
      expect(session.mold?.status).toBe('modified');
    });

    test('initializes mold from first in array when no preferred', () => {
      // Create a bonbon with molds but no preferredId
      // This covers the preferredId ?? molds.options[0]?.id branch
      const noPreferredMoldData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            molds: {
              options: [{ id: 'common.square-20mm' as MoldId }]
              // No preferredId
            }
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-rec-mold' as ConfectionId,
        noPreferredMoldData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.mold).toBeDefined();
      expect(session.mold?.moldId).toBe('common.square-20mm');
      expect(session.mold?.status).toBe('original');
    });
  });

  // ============================================================================
  // Chocolate Selection Tests
  // ============================================================================

  describe('selectChocolate', () => {
    test('selects a shell chocolate', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectChocolate('shell', 'common.chocolate-dark-70' as IngredientId)).toSucceed();
      const shellChocolate = session.chocolates.get('shell');
      expect(shellChocolate?.ingredientId).toBe('common.chocolate-dark-70');
      expect(shellChocolate?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectChocolate('shell', 'common.chocolate-dark-70' as IngredientId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('chocolate-select');
    });

    test('adds new chocolate role that was not initialized', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // 'decoration' is not initialized for the molded bonbon
      expect(session.chocolates.get('decoration')).toBeUndefined();

      // Should be able to add a new chocolate role
      expect(session.selectChocolate('decoration', 'common.chocolate-white' as IngredientId)).toSucceed();
      expect(session.chocolates.get('decoration')?.ingredientId).toBe('common.chocolate-white');
      expect(session.chocolates.get('decoration')?.originalIngredientId).toBe('common.chocolate-white');
      expect(session.chocolates.get('decoration')?.status).toBe('modified');
    });
  });

  // ============================================================================
  // Yield Modification Tests
  // ============================================================================

  describe('setYieldCount', () => {
    test('sets yield count', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.setYieldCount(48)).toSucceed();
      expect(session.yield.count).toBe(48);
      expect(session.yield.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-positive count', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.setYieldCount(0)).toFailWith(/must be positive/);
      expect(session.setYieldCount(-1)).toFailWith(/must be positive/);
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setYieldCount(48);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('yield-modify');
    });

    test('status returns to original when count matches original', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setYieldCount(48);
      expect(session.yield.status).toBe('modified');

      session.setYieldCount(24);
      expect(session.yield.status).toBe('original');
    });
  });

  describe('setWeightPerPiece', () => {
    test('sets weight per piece', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.setWeightPerPiece(20 as Measurement)).toSucceed();
      expect(session.yield.weightPerPiece).toBe(20);
      expect(session.yield.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-positive weight', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.setWeightPerPiece(0 as Measurement)).toFailWith(/must be positive/);
      expect(session.setWeightPerPiece(-1 as Measurement)).toFailWith(/must be positive/);
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setWeightPerPiece(20 as Measurement);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('yield-modify');
    });
  });

  // ============================================================================
  // Procedure Selection Tests
  // ============================================================================

  describe('selectProcedure', () => {
    test('selects a procedure', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectProcedure('common.molded-bonbon-double-shell' as ProcedureId)).toSucceed();
      expect(session.procedure?.procedureId).toBe('common.molded-bonbon-double-shell');
      expect(session.procedure?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for confection without procedures', () => {
      const noProceduresData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [{ ...moldedBonBonData.versions[0], procedures: undefined }]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon-no-procedures' as ConfectionId,
        noProceduresData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();
      expect(session.selectProcedure('common.molded-bonbon-double-shell' as ProcedureId)).toFailWith(
        /does not support procedure selection/
      );
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectProcedure('common.molded-bonbon-double-shell' as ProcedureId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('procedure-select');
    });

    test('selects procedure when no initial procedure is set', () => {
      // Create a bonbon with empty procedures array
      const emptyProceduresData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            procedures: {
              options: [] // Empty array means no initial procedure
            }
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-procedure' as ConfectionId,
        emptyProceduresData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Initial procedure should be undefined
      expect(session.procedure).toBeUndefined();

      // Should be able to select a procedure
      expect(session.selectProcedure('common.molded-bonbon-standard' as ProcedureId)).toSucceed();
      expect(session.procedure?.procedureId).toBe('common.molded-bonbon-standard');
      expect(session.procedure?.originalProcedureId).toBeUndefined();
      expect(session.procedure?.status).toBe('modified');
    });

    test('initializes procedure from first in array when no preferred', () => {
      // Create a bonbon with procedures but no preferredId
      // This covers the preferredId ?? procedures.options[0]?.id branch
      const noPreferredProcData: IMoldedBonBon = {
        ...moldedBonBonData,
        versions: [
          {
            ...moldedBonBonData.versions[0],
            procedures: {
              options: [{ id: 'common.molded-bonbon-double-shell' as ProcedureId }]
              // No preferredId
            }
          }
        ]
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-rec-proc' as ConfectionId,
        noPreferredProcData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.procedure).toBeDefined();
      expect(session.procedure?.procedureId).toBe('common.molded-bonbon-double-shell');
      expect(session.procedure?.status).toBe('original');
    });
  });

  // ============================================================================
  // Coating Selection Tests
  // ============================================================================

  describe('selectCoating', () => {
    test('selects a coating for rolled truffle', () => {
      const confection = createRolledTruffle();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectCoating('common.powdered-sugar' as IngredientId)).toSucceed();
      expect(session.coating?.ingredientId).toBe('common.powdered-sugar');
      expect(session.coating?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-rolled truffle', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectCoating('common.cocoa-powder' as IngredientId)).toFailWith(
        /does not support coating selection/
      );
    });

    test('adds journal entry', () => {
      const confection = createRolledTruffle();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectCoating('common.powdered-sugar' as IngredientId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('coating-select');
    });

    test('selects coating when no initial coating is set', () => {
      // Create a rolled truffle without coatings
      const noCoatingsData: IRolledTruffle = {
        ...rolledTruffleData,
        versions: [
          {
            ...rolledTruffleData.versions[0],
            coatings: undefined
          }
        ]
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-no-coating' as ConfectionId,
        noCoatingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Initial coating should be undefined
      expect(session.coating).toBeUndefined();

      // Should be able to select a coating
      expect(session.selectCoating('common.cocoa-powder' as IngredientId)).toSucceed();
      expect(session.coating?.ingredientId).toBe('common.cocoa-powder');
      expect(session.coating?.originalIngredientId).toBeUndefined();
      expect(session.coating?.status).toBe('modified');
    });

    test('initializes coating from first id when no preferred', () => {
      // Create a rolled truffle with coatings but no preferredId
      // This covers the preferredId ?? ids[0] branch
      const noPreferredCoatingData: IRolledTruffle = {
        ...rolledTruffleData,
        versions: [
          {
            ...rolledTruffleData.versions[0],
            coatings: {
              ids: ['common.powdered-sugar' as IngredientId, 'common.cocoa-powder' as IngredientId]
              // No preferredId
            }
          }
        ]
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-no-rec-coating' as ConfectionId,
        noPreferredCoatingData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.coating).toBeDefined();
      expect(session.coating?.ingredientId).toBe('common.powdered-sugar');
      expect(session.coating?.status).toBe('original');
    });

    test('handles empty ids array with no preferred coating', () => {
      // Create a rolled truffle with coatings but empty ids array and no preferred
      // This covers the ids[0] short-circuit branch
      const emptyIdsCoatingData: IRolledTruffle = {
        ...rolledTruffleData,
        versions: [
          {
            ...rolledTruffleData.versions[0],
            coatings: {
              ids: []
              // No preferredId
            }
          }
        ]
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-empty-coating-ids' as ConfectionId,
        emptyIdsCoatingData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Coating should be undefined since there are no ids to pick from
      expect(session.coating).toBeUndefined();
    });
  });

  // ============================================================================
  // Notes Tests
  // ============================================================================

  describe('addNote', () => {
    test('adds a note to the journal', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.addNote('This is a test note');
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('note');
      expect(session.journalEntries[0].text).toBe('This is a test note');
    });

    test('does not add note when journaling is disabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({
        sourceConfection: confection,
        enableJournal: false
      }).orThrow();

      session.addNote('This note should not be added');
      expect(session.journalEntries.length).toBe(0);
    });
  });

  // ============================================================================
  // Journal Record Generation Tests
  // ============================================================================

  describe('toJournalRecord', () => {
    test('creates a valid journal record', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Make some modifications
      session.setYieldCount(48);
      session.addNote('Test session');

      expect(session.toJournalRecord('Session notes')).toSucceedAndSatisfy((record) => {
        expect(record.journalType).toBe('confection');
        expect(record.journalId).toBeDefined();
        expect(record.confectionVersionId).toBe('test.test-bonbon@2026-01-01-01');
        expect(record.yieldCount).toBe(48);
        expect(record.notes).toBe('Session notes');
        expect(record.entries).toHaveLength(2);
      });
    });

    test('creates journal record without notes', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.toJournalRecord()).toSucceedAndSatisfy((record) => {
        expect(record.notes).toBeUndefined();
      });
    });

    test('includes weight per piece if set', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.toJournalRecord()).toSucceedAndSatisfy((record) => {
        expect(record.weightPerPiece).toBe(12);
      });
    });
  });

  // ============================================================================
  // Save Tests
  // ============================================================================

  describe('save', () => {
    test('creates journal record by default', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setYieldCount(48);

      expect(session.save()).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalRecord).toBeDefined();
        expect(result.journalRecord?.journalType).toBe('confection');
      });
    });

    test('skips journal record when disabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({
        sourceConfection: confection,
        enableJournal: false
      }).orThrow();

      expect(session.save()).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeUndefined();
        expect(result.journalRecord).toBeUndefined();
      });
    });

    test('skips journal record when createJournalRecord is false', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.save({ createJournalRecord: false })).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeUndefined();
        expect(result.journalRecord).toBeUndefined();
      });
    });

    test('includes version spec when createNewVersion is true', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(
        session.save({
          createNewVersion: true,
          versionLabel: '2026-01-02-01' as ConfectionVersionSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.newVersionSpec).toBe('2026-01-02-01');
      });
    });

    test('fails when createNewVersion is true but no versionLabel', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.save({ createNewVersion: true })).toFailWith(/versionLabel is required/);
    });

    test('clears dirty flag after save', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setYieldCount(48);
      expect(session.isDirty).toBe(true);

      session.save();
      expect(session.isDirty).toBe(false);
    });

    test('includes journal notes in record', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.save({ journalNotes: 'Custom notes' })).toSucceedAndSatisfy((result) => {
        expect(result.journalRecord?.notes).toBe('Custom notes');
      });
    });
  });
});
