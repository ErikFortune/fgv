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

/**
 * Shared test helper for creating a minimal ChocolateLibrary with comprehensive test entities.
 * This library covers all renderer branches including all ingredient types, mold types,
 * confection types, and optional field variations.
 * @packageDocumentation
 */

import {
  Allergen,
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  CacaoVariety,
  Celsius,
  Certification,
  ChocolateApplication,
  CollectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  DegreesMacMichael,
  Entities,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  FluidityStars,
  IngredientId,
  LibraryRuntime,
  Measurement,
  Millimeters,
  Minutes,
  MoldFormat,
  MoldId,
  NoteCategory,
  Percentage,
  ProcedureId,
  RatingScore,
  SlotId,
  TaskId,
  UrlCategory
} from '@fgv/ts-chocolate';

/**
 * Creates a comprehensive test library with all entity types and variations.
 * This library is suitable for testing all renderer code paths.
 *
 * Includes:
 * - 6 ingredient types (chocolate with all optional fields, sugar, dairy, fat, alcohol, flavor)
 * - 2 mold types (grid mold with all fields, count mold minimal)
 * - 1 task (for procedures)
 * - 2 procedures (one with all fields, one minimal)
 * - 1 filling recipe (with multiple variations)
 * - 3 confection types (molded bonbon, bar truffle, rolled truffle)
 *
 * @returns A fully initialized ChocolateLibrary for testing
 * @public
 */
export function createTestLibrary(): LibraryRuntime.ChocolateLibrary {
  // ==========================================================================
  // Ingredients (6 types)
  // ==========================================================================

  const darkChocolate: Entities.Ingredients.IChocolateIngredientEntity = {
    baseId: 'dark-choc-70' as BaseIngredientId,
    name: 'Test Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: {
      cacaoFat: 36 as Percentage,
      sugar: 34 as Percentage,
      milkFat: 0 as Percentage,
      water: 1 as Percentage,
      solids: 29 as Percentage,
      otherFats: 0 as Percentage
    },
    manufacturer: 'TestCo',
    description: 'A test dark chocolate',
    tags: ['dark', 'test'],
    fluidityStars: 3 as FluidityStars,
    viscosityMcM: 45 as DegreesMacMichael,
    temperatureCurve: {
      melt: 50 as Celsius,
      cool: 27 as Celsius,
      working: 31 as Celsius
    },
    beanVarieties: ['Criollo' as CacaoVariety],
    applications: ['molding' as ChocolateApplication],
    origins: ['Venezuela'],
    allergens: ['milk' as Allergen],
    traceAllergens: ['nuts' as Allergen],
    certifications: ['organic' as Certification],
    vegan: false,
    urls: [
      {
        category: 'manufacturer' as UrlCategory,
        url: 'https://example.com/choc'
      }
    ]
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const milkChocolate: Entities.Ingredients.IChocolateIngredientEntity = {
    baseId: 'milk-choc-40' as BaseIngredientId,
    name: 'Test Milk Chocolate 40%',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: {
      cacaoFat: 20 as Percentage,
      sugar: 40 as Percentage,
      milkFat: 10 as Percentage,
      water: 1 as Percentage,
      solids: 29 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const sugarEntity: Entities.Ingredients.ISugarIngredientEntity = {
    baseId: 'white-sugar' as BaseIngredientId,
    name: 'White Sugar',
    category: 'sugar',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 100 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    sweetnessPotency: 1.0,
    hydrationNumber: 0.9
  };

  const creamEntity: Entities.Ingredients.IDairyIngredientEntity = {
    baseId: 'heavy-cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 3 as Percentage,
      milkFat: 36 as Percentage,
      water: 58 as Percentage,
      solids: 3 as Percentage,
      otherFats: 0 as Percentage
    },
    fatContent: 36 as Percentage,
    waterContent: 58 as Percentage
  };

  const butterEntity: Entities.Ingredients.IFatIngredientEntity = {
    baseId: 'cocoa-butter' as BaseIngredientId,
    name: 'Cocoa Butter',
    category: 'fat',
    ganacheCharacteristics: {
      cacaoFat: 100 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    meltingPoint: 34 as Celsius
  };

  const rumEntity: Entities.Ingredients.IAlcoholIngredientEntity = {
    baseId: 'dark-rum' as BaseIngredientId,
    name: 'Dark Rum',
    category: 'alcohol',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 60 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    alcoholByVolume: 40 as Percentage,
    flavorProfile: 'Rich and spiced'
  };

  const vanillaEntity: Entities.Ingredients.IIngredientEntity = {
    baseId: 'vanilla-extract' as BaseIngredientId,
    name: 'Vanilla Extract',
    category: 'flavor',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 50 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  // ==========================================================================
  // Molds (2 types)
  // ==========================================================================

  const gridMold: Entities.Molds.IMoldEntity = {
    baseId: 'cw-2227' as BaseMoldId,
    manufacturer: 'Chocolate World',
    productNumber: 'CW2227',
    description: 'Classic praline mold',
    format: 'series-1000' as MoldFormat,
    cavities: {
      kind: 'grid',
      columns: 4,
      rows: 6,
      info: {
        weight: 10 as Measurement,
        dimensions: {
          width: 30 as Millimeters,
          length: 30 as Millimeters,
          depth: 15 as Millimeters
        }
      }
    },
    tags: ['praline'],
    related: ['test.cw-1000' as MoldId],
    notes: [
      {
        category: 'general' as NoteCategory,
        note: 'Great for ganache'
      }
    ],
    urls: [
      {
        category: 'product-page' as UrlCategory,
        url: 'https://example.com/mold'
      }
    ]
  };

  const countMold: Entities.Molds.IMoldEntity = {
    baseId: 'cw-1000' as BaseMoldId,
    manufacturer: 'Chocolate World',
    productNumber: 'CW1000',
    format: 'series-2000' as MoldFormat,
    cavities: {
      kind: 'count',
      count: 12
    }
  };

  // ==========================================================================
  // Tasks (needed for procedures)
  // ==========================================================================

  const testTask: Entities.Tasks.IRawTaskEntity = {
    baseId: 'melt-chocolate' as BaseTaskId,
    name: 'Melt Chocolate',
    template: 'Melt {{chocolate}} to {{temperature}}°C'
  };

  // ==========================================================================
  // Procedures
  // ==========================================================================

  const testProcedure: Entities.Procedures.IProcedureEntity = {
    baseId: 'ganache-basic' as BaseProcedureId,
    name: 'Basic Ganache',
    category: 'ganache',
    description: 'Standard ganache procedure',
    tags: ['ganache', 'basic'],
    steps: [
      {
        order: 1,
        task: {
          taskId: 'test.melt-chocolate' as TaskId,
          params: { chocolate: 'dark', temperature: 50 }
        },
        activeTime: 10 as Minutes,
        temperature: 50 as Celsius,
        notes: [
          {
            category: 'general' as NoteCategory,
            note: 'Stir gently'
          }
        ]
      },
      {
        order: 2,
        task: {
          task: {
            baseId: 'inline-task' as BaseTaskId,
            name: 'Mix',
            template: 'Mix ingredients together'
          },
          params: {}
        },
        activeTime: 5 as Minutes,
        waitTime: 30 as Minutes,
        holdTime: 120 as Minutes
      }
    ],
    notes: [
      {
        category: 'general' as NoteCategory,
        note: 'Allow to cool'
      }
    ]
  };

  const minimalProcedure: Entities.Procedures.IProcedureEntity = {
    baseId: 'simple-mix' as BaseProcedureId,
    name: 'Simple Mix',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'mix' as BaseTaskId,
            name: 'Mix',
            template: 'Mix everything'
          },
          params: {}
        }
      }
    ]
  };

  // ==========================================================================
  // Filling Recipe
  // ==========================================================================

  const testFilling: Entities.Fillings.IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    description: 'Rich dark chocolate ganache',
    tags: ['dark', 'ganache'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          {
            ingredient: { ids: ['test.dark-choc-70' as IngredientId] },
            amount: 200 as Measurement
          },
          {
            ingredient: { ids: ['test.heavy-cream' as IngredientId] },
            amount: 150 as Measurement,
            notes: [
              {
                category: 'general' as NoteCategory,
                note: 'Warm first'
              }
            ]
          }
        ],
        baseWeight: 350 as Measurement,
        yield: '50 bonbons',
        notes: [
          {
            category: 'tasting' as NoteCategory,
            note: 'Rich and smooth'
          }
        ],
        ratings: [
          {
            category: 'taste',
            score: 5 as RatingScore
          },
          {
            category: 'texture',
            score: 4 as RatingScore,
            notes: [
              {
                category: 'general' as NoteCategory,
                note: 'Slightly firm'
              }
            ]
          }
        ],
        procedures: {
          options: [
            {
              id: 'test.ganache-basic' as ProcedureId,
              notes: [
                {
                  category: 'general' as NoteCategory,
                  note: 'Standard method'
                }
              ]
            },
            {
              id: 'test.simple-mix' as ProcedureId
            }
          ],
          preferredId: 'test.ganache-basic' as ProcedureId
        }
      },
      {
        variationSpec: '2026-02-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-02-01',
        ingredients: [
          {
            ingredient: { ids: ['test.dark-choc-70' as IngredientId] },
            amount: 250 as Measurement
          },
          {
            ingredient: {
              ids: ['test.heavy-cream' as IngredientId],
              preferredId: 'test.heavy-cream' as IngredientId
            },
            amount: 100 as Measurement
          }
        ],
        baseWeight: 350 as Measurement
      }
    ],
    urls: [
      {
        category: 'video' as UrlCategory,
        url: 'https://example.com/ganache-video'
      }
    ]
  };

  // ==========================================================================
  // Confections (3 types)
  // ==========================================================================

  const moldedBonBon: Entities.MoldedBonBonRecipeEntity = {
    baseId: 'test-bonbon' as BaseConfectionId,
    confectionType: 'molded-bonbon',
    name: 'Test BonBon' as ConfectionName,
    description: 'A test molded bonbon',
    tags: ['bonbon', 'test'],
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: {
          count: 24,
          unit: 'pieces',
          weightPerPiece: 12 as Measurement
        },
        molds: {
          options: [
            {
              id: 'test.cw-2227' as MoldId,
              notes: [
                {
                  category: 'general' as NoteCategory,
                  note: 'Primary mold'
                }
              ]
            }
          ],
          preferredId: 'test.cw-2227' as MoldId
        },
        shellChocolate: {
          ids: ['test.dark-choc-70' as IngredientId, 'test.milk-choc-40' as IngredientId],
          preferredId: 'test.dark-choc-70' as IngredientId
        },
        additionalChocolates: [
          {
            chocolate: {
              ids: ['test.dark-choc-70' as IngredientId, 'test.milk-choc-40' as IngredientId],
              preferredId: 'test.dark-choc-70' as IngredientId
            },
            purpose: 'seal'
          }
        ],
        fillings: [
          {
            slotId: 'center' as SlotId,
            name: 'Center Filling',
            filling: {
              options: [
                {
                  type: 'recipe',
                  id: 'test.dark-ganache' as FillingId,
                  notes: [
                    {
                      category: 'general' as NoteCategory,
                      note: 'Main filling'
                    }
                  ]
                }
              ],
              preferredId: 'test.dark-ganache' as FillingId
            }
          }
        ],
        decorations: [
          {
            description: 'Gold leaf',
            preferred: true
          },
          {
            description: 'Cocoa powder'
          }
        ],
        procedures: {
          options: [
            {
              id: 'test.ganache-basic' as ProcedureId,
              notes: [
                {
                  category: 'general' as NoteCategory,
                  note: 'Standard process'
                }
              ]
            }
          ],
          preferredId: 'test.ganache-basic' as ProcedureId
        }
      },
      {
        variationSpec: '2026-02-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-02-01',
        yield: {
          count: 30,
          unit: 'pieces'
        },
        molds: {
          options: [
            {
              id: 'test.cw-1000' as MoldId
            }
          ]
        },
        shellChocolate: {
          ids: ['test.milk-choc-40' as IngredientId]
        }
      }
    ],
    urls: [
      {
        category: 'product-page' as UrlCategory,
        url: 'https://example.com/bonbon'
      }
    ]
  };

  const barTruffle: Entities.BarTruffleRecipeEntity = {
    baseId: 'test-bar-truffle' as BaseConfectionId,
    confectionType: 'bar-truffle',
    name: 'Test Bar Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: {
          count: 30
        },
        frameDimensions: {
          width: 250 as Millimeters,
          height: 20 as Millimeters,
          depth: 300 as Millimeters
        },
        singleBonBonDimensions: {
          width: 25 as Millimeters,
          height: 20 as Millimeters
        },
        enrobingChocolate: {
          ids: ['test.dark-choc-70' as IngredientId, 'test.milk-choc-40' as IngredientId],
          preferredId: 'test.dark-choc-70' as IngredientId
        }
      }
    ]
  };

  const rolledTruffle: Entities.RolledTruffleRecipeEntity = {
    baseId: 'test-rolled-truffle' as BaseConfectionId,
    confectionType: 'rolled-truffle',
    name: 'Test Rolled Truffle' as ConfectionName,
    goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
        createdDate: '2026-01-01',
        yield: {
          count: 20,
          unit: 'truffles'
        },
        enrobingChocolate: {
          ids: ['test.dark-choc-70' as IngredientId, 'test.milk-choc-40' as IngredientId],
          preferredId: 'test.dark-choc-70' as IngredientId
        },
        coatings: {
          ids: ['test.cocoa-butter' as IngredientId, 'test.white-sugar' as IngredientId],
          preferredId: 'test.cocoa-butter' as IngredientId
        }
      }
    ]
  };

  // ==========================================================================
  // Assembly
  // ==========================================================================

  const ingredients = Entities.Ingredients.IngredientsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'dark-choc-70': darkChocolate,
          'white-sugar': sugarEntity,
          'heavy-cream': creamEntity,
          'cocoa-butter': butterEntity,
          'dark-rum': rumEntity,
          'vanilla-extract': vanillaEntity
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const fillings = Entities.Fillings.FillingsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'dark-ganache': testFilling
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const molds = Entities.Molds.MoldsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'cw-2227': gridMold,
          'cw-1000': countMold
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const tasks = Entities.Tasks.TasksLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'melt-chocolate': testTask
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const procedures = Entities.Procedures.ProceduresLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'ganache-basic': testProcedure,
          'simple-mix': minimalProcedure
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const confections = Entities.Confections.ConfectionsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'test' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: {
          'test-bonbon': moldedBonBon,
          'test-bar-truffle': barTruffle,
          'test-rolled-truffle': rolledTruffle
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const entityLibrary = LibraryRuntime.ChocolateEntityLibrary.create({
    libraries: {
      ingredients,
      fillings,
      molds,
      procedures,
      tasks,
      confections
    }
  }).orThrow();

  return LibraryRuntime.ChocolateLibrary.fromChocolateEntityLibrary(entityLibrary).orThrow();
}
