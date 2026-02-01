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
  NoteCategory,
  Percentage,
  ProcedureId,
  SlotId,
  SourceId
} from '../../../../packlets/common';
import {
  IChocolateIngredient,
  IFillingRecipe,
  IGanacheCharacteristics,
  IIngredient,
  IMold,
  IMoldedBonBon,
  IBarTruffle,
  IProcedure,
  IRolledTruffle,
  ConfectionsLibrary,
  FillingsLibrary,
  IngredientsLibrary,
  MoldsLibrary,
  ProceduresLibrary
} from '../../../../packlets/entities';
import { ChocolateLibrary, RuntimeContext, Session } from '../../../../packlets/runtime';

describe('ConfectionEditingSession', () => {
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

  const darkChocolate70: IChocolateIngredient = {
    baseId: 'chocolate-dark-70' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: mockChars
  };

  const caramel: IIngredient = {
    baseId: 'caramel' as BaseIngredientId,
    name: 'Caramel',
    category: 'sugar',
    ganacheCharacteristics: mockChars
  };

  const cocoaPowder: IIngredient = {
    baseId: 'cocoa-powder' as BaseIngredientId,
    name: 'Cocoa Powder',
    category: 'other',
    ganacheCharacteristics: mockChars
  };

  const powderedSugar: IIngredient = {
    baseId: 'powdered-sugar' as BaseIngredientId,
    name: 'Powdered Sugar',
    category: 'sugar',
    ganacheCharacteristics: mockChars
  };

  const darkGanache: IFillingRecipe = {
    baseId: 'dark-ganache-classic' as BaseFillingId,
    name: 'Dark Ganache Classic' as FillingName,
    category: 'ganache',
    description: 'Classic dark ganache',
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Original recipe',
        ingredients: [
          { ingredient: { ids: ['test.chocolate-dark-64' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.caramel' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const dome25mm: IMold = {
    baseId: 'dome-25mm' as BaseMoldId,
    manufacturer: 'Test Manufacturer',
    productNumber: 'DOME-25',
    description: 'Dome 25mm',
    cavities: { kind: 'count', count: 24 },
    format: 'other' as MoldFormat
  };

  const square20mm: IMold = {
    baseId: 'square-20mm' as BaseMoldId,
    manufacturer: 'Test Manufacturer',
    productNumber: 'SQ-20',
    description: 'Square 20mm',
    cavities: { kind: 'count', count: 28 },
    format: 'other' as MoldFormat
  };

  const standardProc: IProcedure = {
    baseId: 'molded-bonbon-standard' as BaseProcedureId,
    name: 'Standard Molded Bonbon',
    steps: []
  };

  const doubleShellProc: IProcedure = {
    baseId: 'molded-bonbon-double-shell' as BaseProcedureId,
    name: 'Double Shell Molded Bonbon',
    steps: []
  };

  const moldedBonBon: IMoldedBonBon = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test Bonbon' as ConfectionName,
    description: 'A test molded bonbon',
    goldenVersionSpec: '2026-01-01-01' as ConfectionVersionSpec,
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
              options: [{ type: 'recipe', id: 'test.dark-ganache-classic' as FillingId }],
              preferredId: 'test.dark-ganache-classic' as FillingId
            }
          }
        ],
        molds: {
          options: [{ id: 'test.dome-25mm' as MoldId }, { id: 'test.square-20mm' as MoldId }],
          preferredId: 'test.dome-25mm' as MoldId
        },
        shellChocolate: {
          ids: ['test.chocolate-dark-64' as IngredientId, 'test.chocolate-dark-70' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        },
        procedures: {
          options: [
            { id: 'test.molded-bonbon-standard' as ProcedureId },
            { id: 'test.molded-bonbon-double-shell' as ProcedureId }
          ],
          preferredId: 'test.molded-bonbon-standard' as ProcedureId
        }
      }
    ]
  };

  const barTruffle: IBarTruffle = {
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
              options: [{ type: 'recipe', id: 'test.dark-ganache-classic' as FillingId }],
              preferredId: 'test.dark-ganache-classic' as FillingId
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
          ids: ['test.chocolate-dark-64' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        }
      }
    ]
  };

  const rolledTruffle: IRolledTruffle = {
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
              options: [{ type: 'recipe', id: 'test.dark-ganache-classic' as FillingId }],
              preferredId: 'test.dark-ganache-classic' as FillingId
            }
          }
        ],
        enrobingChocolate: {
          ids: ['test.chocolate-dark-64' as IngredientId],
          preferredId: 'test.chocolate-dark-64' as IngredientId
        },
        coatings: {
          ids: ['test.cocoa-powder' as IngredientId, 'test.powdered-sugar' as IngredientId],
          preferredId: 'test.cocoa-powder' as IngredientId
        }
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
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'chocolate-dark-64': darkChocolate,
            'chocolate-dark-70': darkChocolate70,
            /* eslint-enable @typescript-eslint/naming-convention */
            caramel,
            /* eslint-disable @typescript-eslint/naming-convention */
            'cocoa-powder': cocoaPowder,
            'powdered-sugar': powderedSugar
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
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-ganache-classic': darkGanache
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
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dome-25mm': dome25mm,
            'square-20mm': square20mm
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
            'molded-bonbon-standard': standardProc,
            'molded-bonbon-double-shell': doubleShellProc
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
          isMutable: false,
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
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection)).toSucceedAndSatisfy((session) => {
        expect(session.sessionId).toBeDefined();
        expect(session.baseConfection).toBe(confection);
        expect(session.hasChanges).toBe(false);
        expect(session.confectionType).toBe('molded-bonbon');
      });
    });

    test('creates session for bar truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection)).toSucceedAndSatisfy((session) => {
        expect(session.baseConfection).toBe(confection);
        expect(session.hasChanges).toBe(false);
        expect(session.confectionType).toBe('bar-truffle');
      });
    });

    test('creates session for rolled truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-rolled' as ConfectionId).orThrow();
      expect(Session.ConfectionEditingSession.create(confection)).toSucceedAndSatisfy((session) => {
        expect(session.baseConfection).toBe(confection);
        expect(session.hasChanges).toBe(false);
        expect(session.confectionType).toBe('rolled-truffle');
      });
    });
  });

  // ============================================================================
  // Common Editing Methods Tests
  // ============================================================================

  describe('setYield', () => {
    test('delegates to produced wrapper', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(
        session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement })
      ).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.snapshot.yield.count).toBe(48);
    });
  });

  describe('setFillingSlot', () => {
    test('delegates to produced wrapper with recipe choice', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(
        session.setFillingSlot('center' as SlotId, {
          type: 'recipe',
          fillingId: 'test.dark-ganache-classic' as FillingId
        })
      ).toSucceed();
    });

    test('delegates to produced wrapper with ingredient choice', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(
        session.setFillingSlot('center' as SlotId, {
          type: 'ingredient',
          ingredientId: 'test.caramel' as IngredientId
        })
      ).toSucceed();
      expect(session.hasChanges).toBe(true);
    });
  });

  describe('removeFillingSlot', () => {
    test('delegates to produced wrapper', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.removeFillingSlot('center' as SlotId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });
  });

  describe('setNotes', () => {
    test('delegates to produced wrapper', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test note' }];
      expect(session.setNotes(notes)).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.snapshot.notes).toEqual(notes);
    });
  });

  describe('setProcedure', () => {
    test('delegates to produced wrapper', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setProcedure('test.molded-bonbon-double-shell' as ProcedureId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });
  });

  // ============================================================================
  // Type-Specific Methods Tests (molded bonbon)
  // ============================================================================

  describe('setMold', () => {
    test('works for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setMold('test.square-20mm' as MoldId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for non-molded confection', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setMold('test.dome-25mm' as MoldId)).toFailWith(/molded bonbon/i);
    });
  });

  describe('setShellChocolate', () => {
    test('works for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setShellChocolate('test.chocolate-dark-70' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for non-molded confection', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setShellChocolate('test.chocolate-dark-64' as IngredientId)).toFailWith(
        /molded bonbon/i
      );
    });
  });

  describe('setSealChocolate', () => {
    test('works for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setSealChocolate('test.chocolate-dark-64' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for non-molded confection', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setSealChocolate('test.chocolate-dark-64' as IngredientId)).toFailWith(/molded bonbon/i);
    });
  });

  describe('setDecorationChocolate', () => {
    test('works for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setDecorationChocolate('test.chocolate-dark-70' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for non-molded confection', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setDecorationChocolate('test.chocolate-dark-64' as IngredientId)).toFailWith(
        /molded bonbon/i
      );
    });
  });

  // ============================================================================
  // Type-Specific Methods Tests (bar truffle and rolled truffle)
  // ============================================================================

  describe('setEnrobingChocolate', () => {
    test('works for bar truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-bar' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setEnrobingChocolate('test.chocolate-dark-70' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('works for rolled truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-rolled' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setEnrobingChocolate('test.chocolate-dark-70' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for molded bonbon', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setEnrobingChocolate('test.chocolate-dark-64' as IngredientId)).toFailWith(
        /bar truffle.*rolled truffle/i
      );
    });
  });

  // ============================================================================
  // Type-Specific Methods Tests (rolled truffle)
  // ============================================================================

  describe('setCoating', () => {
    test('works for rolled truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-rolled' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setCoating('test.powdered-sugar' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });

    test('fails for non-rolled truffle', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.setCoating('test.cocoa-powder' as IngredientId)).toFailWith(/rolled truffle/i);
    });
  });

  // ============================================================================
  // Undo/Redo Tests
  // ============================================================================

  describe('undo/redo', () => {
    test('can undo changes', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      expect(session.hasChanges).toBe(true);

      expect(session.undo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(false);
    });

    test('can redo changes', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      session.undo().orThrow();

      expect(session.redo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(true);
    });

    test('canUndo reflects undo availability', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.canUndo()).toBe(false);
      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      expect(session.canUndo()).toBe(true);
    });

    test('canRedo reflects redo availability', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.canRedo()).toBe(false);
      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      session.undo().orThrow();
      expect(session.canRedo()).toBe(true);
    });
  });

  // ============================================================================
  // Save Analysis Tests
  // ============================================================================

  describe('analyzeSaveOptions', () => {
    test('provides analysis for yield changes', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canCreateVersion).toBe(true);
      expect(analysis.recommendedOption).toBe('version');
      expect(analysis.changes.weightChanged).toBe(true);
    });
  });

  // ============================================================================
  // Save Operations Tests
  // ============================================================================

  describe('saveAsNewVersion', () => {
    test('creates journal entry with new version spec', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();

      expect(
        session.saveAsNewVersion({
          versionSpec: '2026-01-02-01' as ConfectionVersionSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.newVersionSpec).toBe('2026-01-02-01');
      });
    });
  });

  describe('saveAsNewConfection', () => {
    test('creates journal entry', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();

      expect(
        session.saveAsNewConfection({
          newId: 'test.new-bonbon' as ConfectionId,
          versionSpec: '2026-01-01-01' as ConfectionVersionSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Journal Creation Tests
  // ============================================================================

  describe('toEditJournalEntry', () => {
    test('creates edit journal entry', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();

      expect(session.toEditJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-edit');
        expect(entry.id).toBeDefined();
        expect(entry.versionId).toBe('test.test-bonbon@2026-01-01-01');
        expect(entry.recipe).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test session' }];
      expect(session.toEditJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });
  });

  describe('toProductionJournalEntry', () => {
    test('creates production journal entry', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('confection-production');
        expect(entry.id).toBeDefined();
        expect(entry.versionId).toBe('test.test-bonbon@2026-01-01-01');
        expect(entry.yield).toBeDefined();
        expect(entry.produced).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      const notes = [{ category: 'production' as NoteCategory, note: 'Production run' }];
      expect(session.toProductionJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });
  });

  // ============================================================================
  // Change Detection Tests
  // ============================================================================

  describe('hasChanges', () => {
    test('returns false for new session', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.hasChanges).toBe(false);
    });

    test('returns true after modifications', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      expect(session.hasChanges).toBe(true);
    });

    test('returns false after undo to original state', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      session.scaleToYield({ count: 48, unit: 'pieces', weightPerPiece: 12 as Measurement }).orThrow();
      session.undo().orThrow();
      expect(session.hasChanges).toBe(false);
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    test('provides sessionId', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
    });

    test('provides baseConfection', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.baseConfection).toBe(confection);
    });

    test('provides confectionType', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.confectionType).toBe('molded-bonbon');
    });

    test('provides produced wrapper', () => {
      const confection = ctx.getRuntimeConfection('test.test-bonbon' as ConfectionId).orThrow();
      const session = Session.ConfectionEditingSession.create(confection).orThrow();

      expect(session.produced).toBeDefined();
      expect(session.produced.snapshot).toBeDefined();
    });
  });
});
