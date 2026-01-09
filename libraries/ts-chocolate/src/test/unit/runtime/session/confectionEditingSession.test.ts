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
  ProcedureId,
  RecipeId
} from '../../../../packlets/common';
import { IMoldedBonBon, IBarTruffle, IRolledTruffle } from '../../../../packlets/confections';
import {
  RuntimeMoldedBonBon,
  RuntimeBarTruffle,
  RuntimeRolledTruffle,
  IConfectionContext
} from '../../../../packlets/runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { ConfectionEditingSession } from '../../../../packlets/runtime/session';
import { Logging } from '@fgv/ts-utils';

describe('ConfectionEditingSession', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const mockContext: IConfectionContext = {
    getRecipe: jest.fn(),
    getIngredient: jest.fn(),
    getMold: jest.fn(),
    getProcedure: jest.fn()
  };

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
    fillings: {
      recipes: ['common.dark-ganache-classic' as RecipeId, 'common.milk-ganache' as RecipeId],
      ingredients: ['common.caramel' as IngredientId],
      recommendedFillingId: 'common.dark-ganache-classic' as RecipeId
    },
    decorations: [{ description: 'Gold leaf', preferred: true }],
    molds: {
      molds: [{ moldId: 'common.dome-25mm' as MoldId }, { moldId: 'common.square-20mm' as MoldId }],
      recommendedMoldId: 'common.dome-25mm' as MoldId
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
    confectionProcedures: {
      procedures: [
        { procedureId: 'common.molded-bonbon-standard' as ProcedureId },
        { procedureId: 'common.molded-bonbon-double-shell' as ProcedureId }
      ],
      recommendedProcedureId: 'common.molded-bonbon-standard' as ProcedureId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Initial version'
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
    fillings: {
      recipes: ['common.dark-ganache-classic' as RecipeId]
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
    description: 'A test rolled truffle',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
    yield: {
      count: 40,
      unit: 'pieces',
      weightPerPiece: 15 as Grams
    },
    fillings: {
      recipes: ['common.dark-ganache-classic' as RecipeId]
    },
    enrobingChocolate: {
      ingredientId: 'common.chocolate-dark-64' as IngredientId
    },
    coatings: {
      ingredients: [
        { ingredientId: 'common.cocoa-powder' as IngredientId },
        { ingredientId: 'common.powdered-sugar' as IngredientId }
      ],
      recommendedIngredientId: 'common.cocoa-powder' as IngredientId
    },
    versions: [
      {
        versionSpec: '2026-01-01-01' as ConfectionVersionSpec,
        createdDate: '2026-01-01'
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
          weightPerPiece: 20 as Grams
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
    test('initializes filling from recommended for molded bonbon', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.filling).toBeDefined();
      expect(session.filling?.recipeId).toBe('common.dark-ganache-classic');
      expect(session.filling?.status).toBe('original');
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

    test('initializes filling from recommended ingredient (no recipes)', () => {
      // Create a bonbon where the recommendedFillingId is an ingredient and there are no recipes
      // This ensures the fillings.recipes?.includes branch short-circuits
      const ingredientOnlyRecommendedData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {
          // No recipes property - fillings.recipes is undefined
          ingredients: ['common.caramel' as IngredientId, 'common.praline' as IngredientId],
          recommendedFillingId: 'common.caramel' as IngredientId
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-ingr-rec-no-recipes' as ConfectionId,
        ingredientOnlyRecommendedData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.filling).toBeDefined();
      expect(session.filling?.ingredientId).toBe('common.caramel');
      expect(session.filling?.recipeId).toBeUndefined();
      expect(session.filling?.status).toBe('original');
    });

    test('initializes filling from recommended ingredient (with recipes present)', () => {
      // Create a bonbon where the recommendedFillingId is an ingredient that's NOT in recipes
      // but recipes exist - this covers the case where includes returns false
      const ingredientRecommendedData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {
          recipes: ['common.dark-ganache-classic' as RecipeId],
          ingredients: ['common.caramel' as IngredientId, 'common.praline' as IngredientId],
          recommendedFillingId: 'common.caramel' as IngredientId
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-ingr-rec' as ConfectionId,
        ingredientRecommendedData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.filling).toBeDefined();
      expect(session.filling?.ingredientId).toBe('common.caramel');
      expect(session.filling?.recipeId).toBeUndefined();
      expect(session.filling?.status).toBe('original');
    });

    test('handles recommended filling not in recipes or ingredients', () => {
      // Create a bonbon where recommendedFillingId exists, recipes exist but don't contain it,
      // and ingredients is undefined. This covers the short-circuit branch of fillings.ingredients?.includes()
      const orphanRecommendedData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {
          recipes: ['common.dark-ganache-classic' as RecipeId],
          // No ingredients array - undefined
          recommendedFillingId: 'common.unknown-filling' as RecipeId // Not in recipes
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-orphan-rec' as ConfectionId,
        orphanRecommendedData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Filling should be undefined since recommended isn't in recipes and ingredients is undefined
      expect(session.filling).toBeUndefined();
    });

    test('initializes filling from first ingredient when no recipes', () => {
      // Create a bonbon with only ingredients (no recipes, no recommended)
      const ingredientsOnlyData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {
          ingredients: ['common.caramel' as IngredientId, 'common.praline' as IngredientId]
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-ingr-only' as ConfectionId,
        ingredientsOnlyData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.filling).toBeDefined();
      expect(session.filling?.ingredientId).toBe('common.caramel');
      expect(session.filling?.recipeId).toBeUndefined();
      expect(session.filling?.status).toBe('original');
    });

    test('does not have coating for rolled truffle without coatings', () => {
      // Create a rolled truffle without coatings
      const noCoatingsData: IRolledTruffle = {
        ...rolledTruffleData,
        coatings: undefined
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
    test('selects a filling recipe', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectFillingRecipe('common.milk-ganache' as RecipeId)).toSucceed();
      expect(session.filling?.recipeId).toBe('common.milk-ganache');
      expect(session.filling?.ingredientId).toBeUndefined();
      expect(session.filling?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for confection without fillings', () => {
      // Create a molded bonbon without fillings
      const noFillingsData = { ...moldedBonBonData, fillings: undefined };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon-no-fillings' as ConfectionId,
        noFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();
      expect(session.selectFillingRecipe('common.milk-ganache' as RecipeId)).toFailWith(
        /does not support fillings/
      );
    });

    test('adds journal entry when journaling is enabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.selectFillingRecipe('common.milk-ganache' as RecipeId);
      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('filling-select');
    });

    test('does not add journal entry when journaling is disabled', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({
        sourceConfection: confection,
        enableJournal: false
      }).orThrow();

      session.selectFillingRecipe('common.milk-ganache' as RecipeId);
      expect(session.journalEntries.length).toBe(0);
    });

    test('selects recipe when no initial filling is set', () => {
      // Create a bonbon with empty fillings (no recipes, no ingredients, no recommended)
      // This results in _filling being undefined but fillings being supported
      const emptyFillingsData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {}
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-empty-fillings2' as ConfectionId,
        emptyFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Initial filling should be undefined
      expect(session.filling).toBeUndefined();

      // Should be able to select a recipe
      expect(session.selectFillingRecipe('common.dark-ganache-classic' as RecipeId)).toSucceed();
      expect(session.filling?.recipeId).toBe('common.dark-ganache-classic');
      expect(session.filling?.status).toBe('modified');
    });
  });

  describe('selectFillingIngredient', () => {
    test('selects a filling ingredient', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.selectFillingIngredient('common.caramel' as IngredientId)).toSucceed();
      expect(session.filling?.ingredientId).toBe('common.caramel');
      expect(session.filling?.recipeId).toBeUndefined();
      expect(session.filling?.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for confection without fillings', () => {
      const noFillingsData = { ...moldedBonBonData, fillings: undefined };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.test-bonbon-no-fillings' as ConfectionId,
        noFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();
      expect(session.selectFillingIngredient('common.caramel' as IngredientId)).toFailWith(
        /does not support fillings/
      );
    });

    test('selects ingredient when no initial filling is set', () => {
      // Create a bonbon with empty fillings (no recipes, no ingredients, no recommended)
      // This results in _filling being undefined but fillings being supported
      const emptyFillingsData: IMoldedBonBon = {
        ...moldedBonBonData,
        fillings: {}
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-empty-fillings' as ConfectionId,
        emptyFillingsData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Initial filling should be undefined
      expect(session.filling).toBeUndefined();

      // Should be able to select an ingredient
      expect(session.selectFillingIngredient('common.caramel' as IngredientId)).toSucceed();
      expect(session.filling?.ingredientId).toBe('common.caramel');
      expect(session.filling?.status).toBe('modified');
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
        molds: {
          molds: [] // Empty array means no initial mold
        }
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

    test('initializes mold from first in array when no recommended', () => {
      // Create a bonbon with molds but no recommendedMoldId
      // This covers the recommendedMoldId ?? molds.molds[0]?.moldId branch
      const noRecommendedMoldData: IMoldedBonBon = {
        ...moldedBonBonData,
        molds: {
          molds: [{ moldId: 'common.square-20mm' as MoldId }]
          // No recommendedMoldId
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-rec-mold' as ConfectionId,
        noRecommendedMoldData
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

      expect(session.setWeightPerPiece(20 as Grams)).toSucceed();
      expect(session.yield.weightPerPiece).toBe(20);
      expect(session.yield.status).toBe('modified');
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-positive weight', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.setWeightPerPiece(0 as Grams)).toFailWith(/must be positive/);
      expect(session.setWeightPerPiece(-1 as Grams)).toFailWith(/must be positive/);
    });

    test('adds journal entry', () => {
      const confection = createMoldedBonBon();
      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      session.setWeightPerPiece(20 as Grams);
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
      const noProceduresData = { ...moldedBonBonData, confectionProcedures: undefined };
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
        confectionProcedures: {
          procedures: [] // Empty array means no initial procedure
        }
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

    test('initializes procedure from first in array when no recommended', () => {
      // Create a bonbon with procedures but no recommendedProcedureId
      // This covers the recommendedProcedureId ?? procedures.procedures[0]?.procedureId branch
      const noRecommendedProcData: IMoldedBonBon = {
        ...moldedBonBonData,
        confectionProcedures: {
          procedures: [{ procedureId: 'common.molded-bonbon-double-shell' as ProcedureId }]
          // No recommendedProcedureId
        }
      };
      const confection = RuntimeMoldedBonBon.create(
        mockContext,
        'test.bonbon-no-rec-proc' as ConfectionId,
        noRecommendedProcData
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
        coatings: undefined
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

    test('initializes coating from first ingredient when no recommended', () => {
      // Create a rolled truffle with coatings but no recommendedIngredientId
      // This covers the recommendedId ?? coatings.ingredients[0]?.ingredientId branch
      const noRecommendedCoatingData: IRolledTruffle = {
        ...rolledTruffleData,
        coatings: {
          ingredients: [
            { ingredientId: 'common.powdered-sugar' as IngredientId },
            { ingredientId: 'common.cocoa-powder' as IngredientId }
          ]
          // No recommendedIngredientId
        }
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-no-rec-coating' as ConfectionId,
        noRecommendedCoatingData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      expect(session.coating).toBeDefined();
      expect(session.coating?.ingredientId).toBe('common.powdered-sugar');
      expect(session.coating?.status).toBe('original');
    });

    test('handles empty ingredients array with no recommended coating', () => {
      // Create a rolled truffle with coatings but empty ingredients array and no recommended
      // This covers the coatings.ingredients[0]?.ingredientId short-circuit branch (line 680)
      const emptyIngredientsCoatingData: IRolledTruffle = {
        ...rolledTruffleData,
        coatings: {
          ingredients: []
          // No recommendedIngredientId
        }
      };
      const confection = RuntimeRolledTruffle.create(
        mockContext,
        'test.rolled-empty-coating-ingr' as ConfectionId,
        emptyIngredientsCoatingData
      ).orThrow();

      const session = ConfectionEditingSession.create({ sourceConfection: confection }).orThrow();

      // Coating should be undefined since there are no ingredients to pick from
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
