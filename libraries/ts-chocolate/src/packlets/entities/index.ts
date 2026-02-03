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
 * Entities packlet - consolidated data layer types and converters
 * @packageDocumentation
 */

// Re-export models, collections, and libraries (not Converters which would conflict)

export {
  ConfectionsLibrary,
  AnyConfectionVersion,
  AnyConfection,
  AnyProducedConfection,
  IBarTruffle,
  IMoldedBonBon,
  IRolledTruffle,
  IBarTruffleVersion,
  IMoldedBonBonVersion,
  IRolledTruffleVersion,
  IProducedBarTruffle,
  IProducedMoldedBonBon,
  IProducedRolledTruffle
} from './confections';
export {
  FillingsLibrary,
  FillingCategory,
  IFillingRecipe,
  IFillingRecipeVersion,
  IFillingRating,
  IProducedFilling
} from './fillings';

export {
  IIngredient,
  Ingredient,
  IngredientsLibrary,
  IAlcoholIngredient,
  IDairyIngredient,
  IChocolateIngredient,
  IFatIngredient,
  ISugarIngredient,
  IGanacheCharacteristics
} from './ingredients';

export {
  JournalLibrary,
  AnyConfectionJournalEntry,
  AnyFillingJournalEntry,
  AnyJournalEntry,
  IConfectionProductionJournalEntry,
  IConfectionEditJournalEntry,
  IFillingProductionJournalEntry,
  IFillingEditJournalEntry,
  JournalEntryType
} from './journal';

export {
  SessionLibrary,
  AnyPersistedSession,
  IPersistedConfectionSession,
  IPersistedFillingSession,
  PersistedSessionStatus
} from './session';

export { IngredientInventoryLibrary, MoldInventoryLibrary, InventoryType } from './inventory';

export { MoldsLibrary, ICavities, ICavityDimensions, ICavityInfo, IMold } from './molds';

export * from './procedures/model';
export * from './procedures/collection';
export * from './procedures/library';

export * from './tasks/model';
export * from './tasks/collection';
export * from './tasks/library';

// Export aggregated converters namespace
import * as Converters from './converters';
export { Converters };

// Export as namespaces for consumers who prefer that style (includes Converters)
import * as Confections from './confections';
import * as Fillings from './fillings';
import * as Ingredients from './ingredients';
import * as Inventory from './inventory';
import * as Journal from './journal';
import * as Molds from './molds';
import * as Procedures from './procedures';
import * as Session from './session';
import * as Tasks from './tasks';

export { Confections, Fillings, Ingredients, Inventory, Journal, Molds, Procedures, Session, Tasks };
