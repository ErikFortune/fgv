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
  FillingId,
  FillingName,
  FillingVersionSpec,
  Measurement,
  IngredientId,
  Millimeters,
  MoldFormat,
  MoldId,
  Percentage,
  ProcedureId,
  SlotId,
  SourceId
} from '../../../../packlets/common';
import {
  Confections as ConfectionEntities,
  IChocolateIngredient,
  IFillingRecipe,
  IGanacheCharacteristics,
  IIngredient,
  IMold,
  IProcedure,
  ConfectionsLibrary,
  FillingsLibrary,
  IngredientsLibrary,
  MoldsLibrary,
  ProceduresLibrary
} from '../../../../packlets/entities';
import { ChocolateLibrary } from '../../../../packlets/library-runtime';
import { RuntimeContext, Session } from '../../../../packlets/runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  MoldedBonBonEditingSession,
  BarTruffleEditingSession,
  RolledTruffleEditingSession
} from '../../../../packlets/runtime/session';

describe('ConfectionEditingSession Factory', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const mockChars: IGanacheCharacteristics = {
    cacaoFat: 35 as Percentage,
    sugar: 25 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 99 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredient = {
    baseId: 'chocolate-dark-64' as BaseIngredientId,
    name: 'Dark Chocolate 64%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 64 as Percentage,
    ganacheCharacteristics: mockChars
  };

  const caramel: IIngredient = {
    baseId: 'caramel' as BaseIngredientId,
    name: 'Caramel',
    category: 'sugar',
    ganacheCharacteristics: mockChars
  };

  const caramelFilling: IFillingRecipe = {
    baseId: 'caramel-filling' as BaseFillingId,
    name: 'Caramel Filling' as FillingName,
    category: 'ganache',
    goldenVersionSpec: '2024-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2024-01-01-01' as FillingVersionSpec,
        createdDate: '2024-01-01',
        baseWeight: 300 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['test.caramel' as IngredientId],
              preferredId: 'test.caramel' as IngredientId
            },
            amount: 300 as Measurement
          }
        ]
      }
    ]
  };

  const squareMold: IMold = {
    baseId: 'square-24' as BaseMoldId,
    manufacturer: 'Test Mfg',
    productNumber: 'SQ-24',
    format: 'other' as MoldFormat,
    cavities: {
      kind: 'count',
      count: 24,
      info: {
        weight: 11 as Measurement,
        dimensions: {
          length: 25 as Millimeters,
          width: 25 as Millimeters,
          depth: 15 as Millimeters
        }
      }
    }
  };

  const standardProc: IProcedure = {
    baseId: 'molded-bonbon-standard' as BaseProcedureId,
    name: 'Standard Molded Bonbon',
    steps: []
  };

  const moldedBonBon: ConfectionEntities.IMoldedBonBon = {
    baseId: 'test-bonbon' as BaseConfectionId,
    name: 'Test Bonbon' as ConfectionName,
    confectionType: 'molded-bonbon',
    goldenVersionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
        createdDate: '2024-01-01',
        yield: {
          count: 24,
          unit: 'pieces',
          weightPerPiece: 11 as Measurement
        },
        molds: {
          options: [{ id: 'test.square-24' as MoldId }],
          preferredId: 'test.square-24' as MoldId
        },
        shellChocolate: {
          ids: ['test.chocolate-dark-64' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        },
        fillings: [
          {
            slotId: 'filling-1' as SlotId,
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'test.caramel-filling' as FillingId
                }
              ],
              preferredId: 'test.caramel-filling' as ConfectionEntities.FillingOptionId
            }
          }
        ],
        procedures: {
          options: [{ id: 'test.molded-bonbon-standard' as ProcedureId }],
          preferredId: 'test.molded-bonbon-standard' as ProcedureId
        }
      }
    ]
  };

  const barTruffle: ConfectionEntities.IBarTruffle = {
    baseId: 'test-bar' as BaseConfectionId,
    name: 'Test Bar' as ConfectionName,
    confectionType: 'bar-truffle',
    goldenVersionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
        createdDate: '2024-01-01',
        yield: {
          count: 12,
          unit: 'pieces',
          weightPerPiece: 20 as Measurement
        },
        frameDimensions: {
          width: 300 as Millimeters,
          height: 200 as Millimeters,
          depth: 10 as Millimeters
        },
        singleBonBonDimensions: {
          width: 25 as Millimeters,
          height: 25 as Millimeters
        },
        enrobingChocolate: {
          ids: ['test.chocolate-dark-64' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        },
        fillings: [
          {
            slotId: 'filling-1' as SlotId,
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'test.caramel-filling' as FillingId
                }
              ],
              preferredId: 'test.caramel-filling' as ConfectionEntities.FillingOptionId
            }
          }
        ]
      }
    ]
  };

  const rolledTruffle: ConfectionEntities.IRolledTruffle = {
    baseId: 'test-rolled' as BaseConfectionId,
    name: 'Test Rolled' as ConfectionName,
    confectionType: 'rolled-truffle',
    goldenVersionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
    versions: [
      {
        versionSpec: '2024-01-01-01' as unknown as ConfectionVersionSpec,
        createdDate: '2024-01-01',
        yield: {
          count: 36,
          unit: 'pieces',
          weightPerPiece: 15 as Measurement
        },
        enrobingChocolate: {
          ids: ['test.chocolate-dark-64' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        },
        fillings: [
          {
            slotId: 'filling-1' as SlotId,
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'test.caramel-filling' as FillingId
                }
              ],
              preferredId: 'test.caramel-filling' as ConfectionEntities.FillingOptionId
            }
          }
        ]
      }
    ]
  };

  let ctx: RuntimeContext;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'chocolate-dark-64': darkChocolate,
            caramel
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'caramel-filling': caramelFilling
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'square-24': squareMold
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const procedures = ProceduresLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'molded-bonbon-standard': standardProc
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-bonbon': moldedBonBon,
            'test-bar': barTruffle,
            'test-rolled': rolledTruffle
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, molds, procedures, confections }
    }).orThrow();

    ctx = RuntimeContext.fromLibrary(library).orThrow();
  });

  // ============================================================================
  // Factory Tests - Dispatches to Type-Specific Sessions
  // ============================================================================

  describe('create', () => {
    test('creates MoldedBonBonEditingSession for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection, ctx)).toSucceedAndSatisfy((session) => {
        expect(session).toBeInstanceOf(MoldedBonBonEditingSession);
        expect(session.sessionId).toBeDefined();
        expect(session.baseConfection).toBe(confection);
        expect(session.context).toBe(ctx);
      });
    });

    test('creates BarTruffleEditingSession for bar truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection, ctx)).toSucceedAndSatisfy((session) => {
        expect(session).toBeInstanceOf(BarTruffleEditingSession);
        expect(session.baseConfection).toBe(confection);
        expect(session.context).toBe(ctx);
      });
    });

    test('creates RolledTruffleEditingSession for rolled truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-rolled' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection, ctx)).toSucceedAndSatisfy((session) => {
        expect(session).toBeInstanceOf(RolledTruffleEditingSession);
        expect(session.baseConfection).toBe(confection);
      });
    });

    test('creates filling sessions eagerly for recipe slots', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection, ctx)).toSucceedAndSatisfy((session) => {
        expect(session).toBeInstanceOf(MoldedBonBonEditingSession);
        // Should have created filling session for the recipe slot
        const fillingSession = session.getFillingSession('filling-1' as SlotId);
        expect(fillingSession).toBeDefined();
        expect(fillingSession!.targetWeight).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Common Session Methods
  // ============================================================================

  describe('fillingSessions', () => {
    test('provides access to filling sessions', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection, ctx).orThrow();

      const fillingSessions = session.fillingSessions;
      expect(fillingSessions.size).toBe(1);
      expect(fillingSessions.has('filling-1' as SlotId)).toBe(true);
    });
  });

  describe('getFillingSession', () => {
    test('returns filling session for valid slot', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection, ctx).orThrow();

      const fillingSession = session.getFillingSession('filling-1' as SlotId);
      expect(fillingSession).toBeDefined();
    });

    test('returns undefined for non-existent slot', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection, ctx).orThrow();

      const fillingSession = session.getFillingSession('non-existent' as SlotId);
      expect(fillingSession).toBeUndefined();
    });
  });
});
