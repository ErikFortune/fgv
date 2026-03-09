[Home](../README.md) > Entities

# Namespace: Entities

Entities packlet - consolidated data layer types and converters

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>

Aggregated converters from all entity submodules

</td></tr>
<tr><td>

[Confections](./Confections/README.md)

</td><td>



</td></tr>
<tr><td>

[Decorations](./Decorations/README.md)

</td><td>



</td></tr>
<tr><td>

[Fillings](./Fillings/README.md)

</td><td>



</td></tr>
<tr><td>

[Ingredients](./Ingredients/README.md)

</td><td>



</td></tr>
<tr><td>

[Inventory](./Inventory/README.md)

</td><td>

Inventory entities for the user library.

</td></tr>
<tr><td>

[Journal](./Journal/README.md)

</td><td>



</td></tr>
<tr><td>

[Locations](./Locations/README.md)

</td><td>



</td></tr>
<tr><td>

[Molds](./Molds/README.md)

</td><td>



</td></tr>
<tr><td>

[Procedures](./Procedures/README.md)

</td><td>



</td></tr>
<tr><td>

[Session](./Session/README.md)

</td><td>



</td></tr>
<tr><td>

[Tasks](./Tasks/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ConfectionsLibrary](./classes/ConfectionsLibrary.md)

</td><td>

Multi-source confection library with type-safe access

</td></tr>
<tr><td>

[FillingsLibrary](./classes/FillingsLibrary.md)

</td><td>

Multi-source filling recipe library with type-safe access

</td></tr>
<tr><td>

[IngredientsLibrary](./classes/IngredientsLibrary.md)

</td><td>

Multi-source ingredient library with type-safe access

</td></tr>
<tr><td>

[JournalLibrary](./classes/JournalLibrary.md)

</td><td>

A library for managing cooking Entities.Journal.AnyJournalEntryEntity | journal entries.

</td></tr>
<tr><td>

[SessionLibrary](./classes/SessionLibrary.md)

</td><td>

A library for managing persisted Entities.Session.AnySessionEntity | editing sessions.

</td></tr>
<tr><td>

[IngredientInventoryLibrary](./classes/IngredientInventoryLibrary.md)

</td><td>

A library for managing user Entities.Inventory.IIngredientInventoryEntryEntity | ingredient inventory entries.

</td></tr>
<tr><td>

[MoldInventoryLibrary](./classes/MoldInventoryLibrary.md)

</td><td>

A library for managing user Entities.Inventory.IMoldInventoryEntryEntity | mold inventory entries.

</td></tr>
<tr><td>

[LocationsLibrary](./classes/LocationsLibrary.md)

</td><td>

Multi-source location library with type-safe access.

</td></tr>
<tr><td>

[MoldsLibrary](./classes/MoldsLibrary.md)

</td><td>

Multi-source mold library with type-safe access

</td></tr>
<tr><td>

[ProceduresLibrary](./classes/ProceduresLibrary.md)

</td><td>

Multi-source procedure library with type-safe access

</td></tr>
<tr><td>

[DecorationsLibrary](./classes/DecorationsLibrary.md)

</td><td>

Multi-source decoration library with type-safe access

</td></tr>
<tr><td>

[TasksLibrary](./classes/TasksLibrary.md)

</td><td>

Multi-source task library with type-safe access

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IBarTruffleRecipeVariationEntity](./interfaces/IBarTruffleRecipeVariationEntity.md)

</td><td>

Variation interface for bar truffle confections.

</td></tr>
<tr><td>

[IMoldedBonBonRecipeVariationEntity](./interfaces/IMoldedBonBonRecipeVariationEntity.md)

</td><td>

Variation interface for molded bonbon confections.

</td></tr>
<tr><td>

[IRolledTruffleRecipeVariationEntity](./interfaces/IRolledTruffleRecipeVariationEntity.md)

</td><td>

Variation interface for rolled truffle confections.

</td></tr>
<tr><td>

[IProducedBarTruffleEntity](./interfaces/IProducedBarTruffleEntity.md)

</td><td>

Produced bar truffle with concrete choices.

</td></tr>
<tr><td>

[IProducedMoldedBonBonEntity](./interfaces/IProducedMoldedBonBonEntity.md)

</td><td>

Produced molded bonbon with concrete choices.

</td></tr>
<tr><td>

[IProducedRolledTruffleEntity](./interfaces/IProducedRolledTruffleEntity.md)

</td><td>

Produced rolled truffle with concrete choices.

</td></tr>
<tr><td>

[IConfectionDerivationEntity](./interfaces/IConfectionDerivationEntity.md)

</td><td>

Reference to a source confection recipe+variation from which a confection recipe was derived.

</td></tr>
<tr><td>

[IFillingRecipeEntity](./interfaces/IFillingRecipeEntity.md)

</td><td>

Complete filling recipe with all variations

</td></tr>
<tr><td>

[IFillingRecipeVariationEntity](./interfaces/IFillingRecipeVariationEntity.md)

</td><td>

Complete details for a single variation of a filling recipe

</td></tr>
<tr><td>

[IFillingRating](./interfaces/IFillingRating.md)

</td><td>

Rating for a specific category of a filling recipe variation

</td></tr>
<tr><td>

[IProducedFillingEntity](./interfaces/IProducedFillingEntity.md)

</td><td>

Produced filling with concrete choices.

</td></tr>
<tr><td>

[IIngredientEntity](./interfaces/IIngredientEntity.md)

</td><td>

Base ingredient interface

</td></tr>
<tr><td>

[IAlcoholIngredientEntity](./interfaces/IAlcoholIngredientEntity.md)

</td><td>

Alcohol-specific ingredient

</td></tr>
<tr><td>

[IDairyIngredientEntity](./interfaces/IDairyIngredientEntity.md)

</td><td>

Dairy-specific ingredient

</td></tr>
<tr><td>

[IChocolateIngredientEntity](./interfaces/IChocolateIngredientEntity.md)

</td><td>

Chocolate-specific ingredient

</td></tr>
<tr><td>

[IFatIngredientEntity](./interfaces/IFatIngredientEntity.md)

</td><td>

Fat-specific ingredient

</td></tr>
<tr><td>

[ISugarIngredientEntity](./interfaces/ISugarIngredientEntity.md)

</td><td>

Sugar-specific ingredient

</td></tr>
<tr><td>

[IGanacheCharacteristics](./interfaces/IGanacheCharacteristics.md)

</td><td>

Characteristics relevant to ganache calculations

</td></tr>
<tr><td>

[IConfectionProductionJournalEntryEntity](./interfaces/IConfectionProductionJournalEntryEntity.md)

</td><td>

Journal entry for confection production sessions.

</td></tr>
<tr><td>

[IConfectionEditJournalEntryEntity](./interfaces/IConfectionEditJournalEntryEntity.md)

</td><td>

Journal entry for confection edits.

</td></tr>
<tr><td>

[IFillingProductionJournalEntryEntity](./interfaces/IFillingProductionJournalEntryEntity.md)

</td><td>

Journal entry for filling production sessions.

</td></tr>
<tr><td>

[IFillingEditJournalEntryEntity](./interfaces/IFillingEditJournalEntryEntity.md)

</td><td>

Journal entry for filling recipe edits.

</td></tr>
<tr><td>

[IConfectionSessionEntity](./interfaces/IConfectionSessionEntity.md)

</td><td>

Persisted confection editing session with full editing state.

</td></tr>
<tr><td>

[IExecutionState](./interfaces/IExecutionState.md)

</td><td>

Session-level execution state for production tracking.

</td></tr>
<tr><td>

[IFillingSessionEntity](./interfaces/IFillingSessionEntity.md)

</td><td>

Persisted filling editing session with full editing state.

</td></tr>
<tr><td>

[IStepExecutionEntry](./interfaces/IStepExecutionEntry.md)

</td><td>

A single entry in the append-only execution log.

</td></tr>
<tr><td>

[IIngredientInventoryEntryEntity](./interfaces/IIngredientInventoryEntryEntity.md)

</td><td>

Inventory entry for ingredients.

</td></tr>
<tr><td>

[IMoldInventoryEntryEntity](./interfaces/IMoldInventoryEntryEntity.md)

</td><td>

Inventory entry for molds.

</td></tr>
<tr><td>

[ILocationEntity](./interfaces/ILocationEntity.md)

</td><td>

Represents a production location (e.g., storage area, workspace, shelf).

</td></tr>
<tr><td>

[ICavityDimensions](./interfaces/ICavityDimensions.md)

</td><td>

Dimensions of a mold cavity in millimeters

</td></tr>
<tr><td>

[ICavityInfo](./interfaces/ICavityInfo.md)

</td><td>

Information about a mold cavity

</td></tr>
<tr><td>

[IMoldEntity](./interfaces/IMoldEntity.md)

</td><td>

Represents a chocolate mold

</td></tr>
<tr><td>

[IProcedureEntity](./interfaces/IProcedureEntity.md)

</td><td>

Represents a procedure for making chocolate confections

</td></tr>
<tr><td>

[IProcedureStepEntity](./interfaces/IProcedureStepEntity.md)

</td><td>

A single step in a procedure (persisted data model).

</td></tr>
<tr><td>

[IDecorationEntity](./interfaces/IDecorationEntity.md)

</td><td>

A decoration entity — a first-class library entity describing a confection decoration.

</td></tr>
<tr><td>

[IDecorationIngredientEntity](./interfaces/IDecorationIngredientEntity.md)

</td><td>

An ingredient used in a decoration, with alternates and an amount.

</td></tr>
<tr><td>

[IDecorationRating](./interfaces/IDecorationRating.md)

</td><td>

Rating for a specific category of a decoration.

</td></tr>
<tr><td>

[IDecorationRefEntity](./interfaces/IDecorationRefEntity.md)

</td><td>

Reference to a decoration entity from a confection variation.

</td></tr>
<tr><td>

[ITaskEntity](./interfaces/ITaskEntity.md)

</td><td>

A reusable task template with runtime-computed properties.

</td></tr>
<tr><td>

[IRawTaskEntity](./interfaces/IRawTaskEntity.md)

</td><td>

Persisted task data - the data model stored in YAML/JSON files.

</td></tr>
<tr><td>

[IInlineTaskEntity](./interfaces/IInlineTaskEntity.md)

</td><td>

An inline task defined directly in a procedure step.

</td></tr>
<tr><td>

[IRenderOptions](./interfaces/IRenderOptions.md)

</td><td>

Options for rendering procedure steps.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[AnyConfectionRecipeVariationEntity](./type-aliases/AnyConfectionRecipeVariationEntity.md)

</td><td>

Union type for all confection variation types.

</td></tr>
<tr><td>

[AnyConfectionRecipeEntity](./type-aliases/AnyConfectionRecipeEntity.md)

</td><td>

Discriminated union of all confection data types.

</td></tr>
<tr><td>

[AnyProducedConfectionEntity](./type-aliases/AnyProducedConfectionEntity.md)

</td><td>

Discriminated union of produced confection types.

</td></tr>
<tr><td>

[BarTruffleRecipeEntity](./type-aliases/BarTruffleRecipeEntity.md)

</td><td>

Bar truffle confection

</td></tr>
<tr><td>

[MoldedBonBonRecipeEntity](./type-aliases/MoldedBonBonRecipeEntity.md)

</td><td>

Molded bonbon confection

</td></tr>
<tr><td>

[RolledTruffleRecipeEntity](./type-aliases/RolledTruffleRecipeEntity.md)

</td><td>

Rolled truffle confection

</td></tr>
<tr><td>

[BufferedConfectionYield](./type-aliases/BufferedConfectionYield.md)

</td><td>

Union type for buffered yield specifications.

</td></tr>
<tr><td>

[ConfectionYield](./type-aliases/ConfectionYield.md)

</td><td>

Union type for yield specifications.

</td></tr>
<tr><td>

[FillingCategory](./type-aliases/FillingCategory.md)

</td><td>

Categories for classifying filling recipes by type

</td></tr>
<tr><td>

[IngredientEntity](./type-aliases/IngredientEntity.md)

</td><td>

Discriminated union of all ingredient types

</td></tr>
<tr><td>

[AnyConfectionJournalEntry](./type-aliases/AnyConfectionJournalEntry.md)

</td><td>

Union type for confection journal entries (edit or production)

</td></tr>
<tr><td>

[AnyFillingJournalEntry](./type-aliases/AnyFillingJournalEntry.md)

</td><td>

Union type for filling journal entries (edit or production)

</td></tr>
<tr><td>

[AnyJournalEntryEntity](./type-aliases/AnyJournalEntryEntity.md)

</td><td>

Discriminated union of all journal entry types.

</td></tr>
<tr><td>

[AnyRecipeJournalEntryEntity](./type-aliases/AnyRecipeJournalEntryEntity.md)

</td><td>

Discriminated union of recipe-based journal entry types.

</td></tr>
<tr><td>

[JournalEntryType](./type-aliases/JournalEntryType.md)

</td><td>

Types of journal entries.

</td></tr>
<tr><td>

[AnySessionEntity](./type-aliases/AnySessionEntity.md)

</td><td>

Discriminated union of all persisted session types.

</td></tr>
<tr><td>

[PersistedSessionStatus](./type-aliases/PersistedSessionStatus.md)

</td><td>

Persisted session lifecycle state.

</td></tr>
<tr><td>

[PersistedSessionType](./type-aliases/PersistedSessionType.md)

</td><td>

Persisted session type discriminator.

</td></tr>
<tr><td>

[StepExecutionStatus](./type-aliases/StepExecutionStatus.md)

</td><td>

Status of an individual step execution entry.

</td></tr>
<tr><td>

[IngredientInventoryEntryBaseId](./type-aliases/IngredientInventoryEntryBaseId.md)

</td><td>

Base ID for an ingredient inventory entry within an inventory collection.

</td></tr>
<tr><td>

[MoldInventoryEntryBaseId](./type-aliases/MoldInventoryEntryBaseId.md)

</td><td>

Base ID for a mold inventory entry within an inventory collection.

</td></tr>
<tr><td>

[InventoryType](./type-aliases/InventoryType.md)

</td><td>

Inventory entry type discriminator.

</td></tr>
<tr><td>

[ICavities](./type-aliases/ICavities.md)

</td><td>

Represents the cavities in a mold

</td></tr>
<tr><td>

[ITaskEntityInvocation](./type-aliases/ITaskEntityInvocation.md)

</td><td>

A task invocation - either a reference to a library task or an inline task definition.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isYieldInFrames](./functions/isYieldInFrames.md)

</td><td>

Type guard for IYieldInFrames (molded bon-bon variation yield).

</td></tr>
<tr><td>

[isBarTruffleYield](./functions/isBarTruffleYield.md)

</td><td>

Type guard for IBarTruffleYield (bar truffle variation yield).

</td></tr>
<tr><td>

[isYieldInPieces](./functions/isYieldInPieces.md)

</td><td>

Type guard for IYieldInPieces (rolled truffle variation yield).

</td></tr>
<tr><td>

[isBufferedYieldInFrames](./functions/isBufferedYieldInFrames.md)

</td><td>

Type guard for IBufferedYieldInFrames (produced molded bon-bon yield).

</td></tr>
<tr><td>

[isBufferedBarTruffleYield](./functions/isBufferedBarTruffleYield.md)

</td><td>

Type guard for IBufferedBarTruffleYield (produced bar truffle yield).

</td></tr>
<tr><td>

[isBufferedYieldInPieces](./functions/isBufferedYieldInPieces.md)

</td><td>

Type guard for IBufferedYieldInPieces (produced rolled truffle yield).

</td></tr>
<tr><td>

[createBlankLocationEntity](./functions/createBlankLocationEntity.md)

</td><td>

Create a blank location entity with sensible defaults.

</td></tr>
<tr><td>

[isTaskRefEntity](./functions/isTaskRefEntity.md)

</td><td>

Type guard for task ref - discriminates by presence of `taskId`

</td></tr>
<tr><td>

[isInlineTaskEntity](./functions/isInlineTaskEntity.md)

</td><td>

Type guard for inline task - discriminates by presence of `task`

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[allDecorationRatingCategories](./variables/allDecorationRatingCategories.md)

</td><td>

Valid rating categories for decorations

</td></tr>
</tbody></table>
