# @fgv/ts-chocolate

Main exports for @fgv/ts-chocolate library

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Entities](./Entities/README.md)

</td><td>

Entities packlet - consolidated data layer types and converters

</td></tr>
<tr><td>

[LibraryRuntime](./LibraryRuntime/README.md)

</td><td>

Library-runtime packlet - materialized projections of library entities

Provides resolved views of ingredients, fillings, confections, and other
library entities with automatic reference resolution, navigation helpers,
and rich query capabilities.

</td></tr>
<tr><td>

[Runtime](./Runtime/README.md)

</td><td>

Runtime packlet - session infrastructure and editing capabilities

Provides editing sessions for confections and fillings, built on top of
the library-runtime packlet's materialized projections.

</td></tr>
<tr><td>

[LibraryData](./LibraryData/README.md)

</td><td>



</td></tr>
<tr><td>

[BuiltIn](./BuiltIn/README.md)

</td><td>



</td></tr>
<tr><td>

[Editing](./Editing/README.md)

</td><td>

Generic editing framework for entity collections.

</td></tr>
<tr><td>

[UserLibrary](./UserLibrary/README.md)

</td><td>

User library packlet - user-specific data (journals, future inventory).

</td></tr>
<tr><td>

[UserRuntime](./UserRuntime/README.md)

</td><td>

User library runtime packlet.

</td></tr>
<tr><td>

[Model](./Model/README.md)

</td><td>

Branded types and enumerations for the chocolate library

</td></tr>
<tr><td>

[Converters](./Converters/README.md)

</td><td>

Converters for branded types

</td></tr>
<tr><td>

[Helpers](./Helpers/README.md)

</td><td>

Helper functions for composite IDs and serialization

</td></tr>
<tr><td>

[Validation](./Validation/README.md)

</td><td>

Validation helpers for branded types

</td></tr>
<tr><td>

[Validators](./Validators/README.md)

</td><td>

In-place validators for branded types

These validators perform IN-PLACE validation only:
- String input results in validated string output (same identity)
- Object input results in validated object output (same identity)

Use these when you need to validate that a value is ALREADY the correct type.

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

[ChocolateLibrary](./classes/ChocolateLibrary.md)

</td><td>

Main entry point for the chocolate library

</td></tr>
<tr><td>

[RuntimeContext](./classes/RuntimeContext.md)

</td><td>

Full runtime context with session creation capabilities.

</td></tr>
<tr><td>

[Workspace](./classes/Workspace.md)

</td><td>

The primary entry point for chocolate applications.

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

[IWorkspace](./interfaces/IWorkspace.md)

</td><td>

The primary entry point for chocolate applications.

</td></tr>
<tr><td>

[IWorkspaceCreateParams](./interfaces/IWorkspaceCreateParams.md)

</td><td>

Parameters for creating a workspace.

</td></tr>
<tr><td>

[IWorkspaceFactoryParams](./interfaces/IWorkspaceFactoryParams.md)

</td><td>

Parameters for creating a workspace with platform-specific defaults.

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

[CollectionId](./type-aliases/CollectionId.md)

</td><td>

Unique identifier for a source collection (of ingredients/recipes, etc)

</td></tr>
<tr><td>

[BaseIngredientId](./type-aliases/BaseIngredientId.md)

</td><td>

Ingredient identifier within a single source

</td></tr>
<tr><td>

[BaseFillingId](./type-aliases/BaseFillingId.md)

</td><td>

Filling recipe identifier within a single source

</td></tr>
<tr><td>

[BaseMoldId](./type-aliases/BaseMoldId.md)

</td><td>

Mold identifier within a single source

</td></tr>
<tr><td>

[BaseProcedureId](./type-aliases/BaseProcedureId.md)

</td><td>

Procedure identifier within a single source

</td></tr>
<tr><td>

[BaseTaskId](./type-aliases/BaseTaskId.md)

</td><td>

Task identifier within a single source

</td></tr>
<tr><td>

[IngredientId](./type-aliases/IngredientId.md)

</td><td>

Globally unique ingredient identifier (composite)

</td></tr>
<tr><td>

[FillingId](./type-aliases/FillingId.md)

</td><td>

Globally unique filling recipe identifier (composite)

</td></tr>
<tr><td>

[MoldId](./type-aliases/MoldId.md)

</td><td>

Globally unique mold identifier (composite)

</td></tr>
<tr><td>

[ProcedureId](./type-aliases/ProcedureId.md)

</td><td>

Globally unique procedure identifier (composite)

</td></tr>
<tr><td>

[TaskId](./type-aliases/TaskId.md)

</td><td>

Globally unique task identifier (composite)

</td></tr>
<tr><td>

[FillingName](./type-aliases/FillingName.md)

</td><td>

Non-unique filling recipe name used for display and grouping

</td></tr>
<tr><td>

[FillingRecipeVariationSpec](./type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Specifier for a filling recipe variation within a filling recipe

</td></tr>
<tr><td>

[IndexerId](./type-aliases/IndexerId.md)

</td><td>

Unique identifier for an indexer in the reverse index system

</td></tr>
<tr><td>

[FillingRecipeVariationId](./type-aliases/FillingRecipeVariationId.md)

</td><td>

Globally unique filling recipe variation identifier (composite)

</td></tr>
<tr><td>

[BaseJournalId](./type-aliases/BaseJournalId.md)

</td><td>

Journal identifier within a single collection

</td></tr>
<tr><td>

[JournalId](./type-aliases/JournalId.md)

</td><td>

Globally unique journal identifier (composite)

</td></tr>
<tr><td>

[BaseConfectionId](./type-aliases/BaseConfectionId.md)

</td><td>

Confection identifier within a single source

</td></tr>
<tr><td>

[ConfectionId](./type-aliases/ConfectionId.md)

</td><td>

Globally unique confection identifier (composite)

</td></tr>
<tr><td>

[ConfectionName](./type-aliases/ConfectionName.md)

</td><td>

Non-unique confection name used for display

</td></tr>
<tr><td>

[ConfectionRecipeVariationSpec](./type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Specifier for a recipe variation within a confection

</td></tr>
<tr><td>

[ConfectionRecipeVariationId](./type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Globally unique confection variation identifier (composite)

</td></tr>
<tr><td>

[SessionSpec](./type-aliases/SessionSpec.md)

</td><td>

Unique identifier for an editing session

</td></tr>
<tr><td>

[BaseSessionId](./type-aliases/BaseSessionId.md)

</td><td>

Session identifier within a single collection (user library session storage).

</td></tr>
<tr><td>

[SessionId](./type-aliases/SessionId.md)

</td><td>

Globally unique persisted session identifier (composite).

</td></tr>
<tr><td>

[SlotId](./type-aliases/SlotId.md)

</td><td>

Unique identifier for a filling slot within a confection or recipe

</td></tr>
<tr><td>

[Measurement](./type-aliases/Measurement.md)

</td><td>

Measurement amount (non-negative number in the specified unit).

</td></tr>
<tr><td>

[Percentage](./type-aliases/Percentage.md)

</td><td>

Percentage value (0-100)

</td></tr>
<tr><td>

[Celsius](./type-aliases/Celsius.md)

</td><td>

Temperature in Celsius

</td></tr>
<tr><td>

[DegreesMacMichael](./type-aliases/DegreesMacMichael.md)

</td><td>

Viscosity in degrees MacMichael

</td></tr>
<tr><td>

[RatingScore](./type-aliases/RatingScore.md)

</td><td>

Rating score (1-5 scale)

</td></tr>
<tr><td>

[Minutes](./type-aliases/Minutes.md)

</td><td>

Time in minutes

</td></tr>
<tr><td>

[Millimeters](./type-aliases/Millimeters.md)

</td><td>

Length in millimeters

</td></tr>
<tr><td>

[IngredientCategory](./type-aliases/IngredientCategory.md)

</td><td>

Base categories of ingredients (discriminated union tag)

</td></tr>
<tr><td>

[ChocolateType](./type-aliases/ChocolateType.md)

</td><td>

Types of chocolate

</td></tr>
<tr><td>

[CacaoVariety](./type-aliases/CacaoVariety.md)

</td><td>

Varieties of cacao beans

</td></tr>
<tr><td>

[FluidityStars](./type-aliases/FluidityStars.md)

</td><td>

Fluidity in Callebaut star ratings (1-5)

</td></tr>
<tr><td>

[ChocolateApplication](./type-aliases/ChocolateApplication.md)

</td><td>

Recommended applications for chocolate

</td></tr>
<tr><td>

[WeightUnit](./type-aliases/WeightUnit.md)

</td><td>

Supported weight units for output conversion

</td></tr>
<tr><td>

[MeasurementUnit](./type-aliases/MeasurementUnit.md)

</td><td>

Measurement unit types for recipe ingredients.

</td></tr>
<tr><td>

[SpoonUnit](./type-aliases/SpoonUnit.md)

</td><td>

Spoon measurement units that share the same scaling system

</td></tr>
<tr><td>

[SpoonLevel](./type-aliases/SpoonLevel.md)

</td><td>

Spoon level indicator for dry measurements.

</td></tr>
<tr><td>

[IngredientPhase](./type-aliases/IngredientPhase.md)

</td><td>

Physical phase of an ingredient - display hint for UI.

</td></tr>
<tr><td>

[Allergen](./type-aliases/Allergen.md)

</td><td>

Common allergens that may be present in ingredients

</td></tr>
<tr><td>

[Certification](./type-aliases/Certification.md)

</td><td>

Certifications that an ingredient may have.

</td></tr>
<tr><td>

[BuiltInSource](./type-aliases/BuiltInSource.md)

</td><td>

Well-known built-in source identifiers

</td></tr>
<tr><td>

[MoldFormat](./type-aliases/MoldFormat.md)

</td><td>

Chocolate World mold format series.

</td></tr>
<tr><td>

[ConfectionType](./type-aliases/ConfectionType.md)

</td><td>

Types of confections (discriminator for confection union)

</td></tr>
<tr><td>

[ChocolateRole](./type-aliases/ChocolateRole.md)

</td><td>

Role that a chocolate plays in a confection.

</td></tr>
<tr><td>

[AdditionalChocolatePurpose](./type-aliases/AdditionalChocolatePurpose.md)

</td><td>

Purpose for additional chocolates in molded bonbons.

</td></tr>
<tr><td>

[FillingCategory](./type-aliases/FillingCategory.md)

</td><td>

Filling recipe category for classification

</td></tr>
<tr><td>

[ProcedureType](./type-aliases/ProcedureType.md)

</td><td>

Procedure type - can be a filling category, confection type, or other

</td></tr>
<tr><td>

[NoteCategory](./type-aliases/NoteCategory.md)

</td><td>

Category for notes associated with an entity.

</td></tr>
<tr><td>

[UrlCategory](./type-aliases/UrlCategory.md)

</td><td>

Category for a URL associated with an entity.

</td></tr>
<tr><td>

[WorkspaceState](./type-aliases/WorkspaceState.md)

</td><td>

State of the workspace with respect to key store and encryption.

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

[createNodeWorkspace](./functions/createNodeWorkspace.md)

</td><td>

Creates a workspace with Node.js platform defaults.

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

[ZeroMeasurement](./variables/ZeroMeasurement.md)

</td><td>

Zero measurement constant

</td></tr>
<tr><td>

[ZeroPercent](./variables/ZeroPercent.md)

</td><td>

Zero percent constant

</td></tr>
<tr><td>

[HundredPercent](./variables/HundredPercent.md)

</td><td>

One hundred percent constant

</td></tr>
<tr><td>

[DefaultNoteCategory](./variables/DefaultNoteCategory.md)

</td><td>

Default note category for general/unspecified notes.

</td></tr>
<tr><td>

[DefaultUrlCategory](./variables/DefaultUrlCategory.md)

</td><td>

Default URL category for general/unspecified URLs.

</td></tr>
</tbody></table>
