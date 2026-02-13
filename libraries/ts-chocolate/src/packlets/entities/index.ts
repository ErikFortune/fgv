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
  AnyConfectionRecipeVariationEntity,
  AnyConfectionRecipeEntity,
  AnyProducedConfectionEntity,
  BarTruffleRecipeEntity,
  MoldedBonBonRecipeEntity,
  RolledTruffleRecipeEntity,
  IBarTruffleRecipeVariationEntity,
  IMoldedBonBonRecipeVariationEntity,
  IRolledTruffleRecipeVariationEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  IConfectionDerivationEntity,
  IConfectionYield
} from './confections';
export {
  FillingsLibrary,
  FillingCategory,
  IFillingRecipeEntity,
  IFillingRecipeVariationEntity,
  IFillingRating,
  IProducedFillingEntity
} from './fillings';

export {
  IIngredientEntity,
  IngredientEntity,
  IngredientsLibrary,
  IAlcoholIngredientEntity,
  IDairyIngredientEntity,
  IChocolateIngredientEntity,
  IFatIngredientEntity,
  ISugarIngredientEntity,
  IGanacheCharacteristics
} from './ingredients';

export {
  JournalLibrary,
  AnyConfectionJournalEntry,
  AnyFillingJournalEntry,
  AnyJournalEntryEntity,
  AnyRecipeJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IConfectionEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IGroupNotesJournalEntryEntity,
  JournalEntryType
} from './journal';

export {
  SessionLibrary,
  AnySessionEntity,
  IConfectionSessionEntity,
  IFillingSessionEntity,
  PersistedSessionStatus
} from './session';

export {
  IngredientInventoryLibrary,
  MoldInventoryLibrary,
  IIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  InventoryType
} from './inventory';

export { MoldsLibrary, ICavities, ICavityDimensions, ICavityInfo, IMoldEntity } from './molds';

export { ProceduresLibrary, IProcedureEntity, IProcedureStepEntity } from './procedures';

export {
  TasksLibrary,
  ITaskEntity,
  IRawTaskEntity,
  IInlineTaskEntity,
  IRenderOptions,
  ITaskEntityInvocation
} from './tasks';

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
