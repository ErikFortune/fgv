[Home](../../README.md) > [Entities](../README.md) > Confections

# Namespace: Confections

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IMoldedBonBonYield](./interfaces/IMoldedBonBonYield.md)

</td><td>

Frame-based yield specification for molded bonbons.

</td></tr>
<tr><td>

[IConfectionDecoration](./interfaces/IConfectionDecoration.md)

</td><td>

Decoration specification for a Entities.Confections.AnyConfectionEntity | confection.

</td></tr>
<tr><td>

[IRecipeFillingOptionEntity](./interfaces/IRecipeFillingOptionEntity.md)

</td><td>

Recipe filling option - references a recipe (e.g., ganache)

</td></tr>
<tr><td>

[IIngredientFillingOptionEntity](./interfaces/IIngredientFillingOptionEntity.md)

</td><td>

Ingredient filling option - references an ingredient (e.g., praline paste)

</td></tr>
<tr><td>

[IFillingSlotEntity](./interfaces/IFillingSlotEntity.md)

</td><td>

A single filling slot with its own options and preferred selection.

</td></tr>
<tr><td>

[IAdditionalChocolateEntity](./interfaces/IAdditionalChocolateEntity.md)

</td><td>

Additional chocolate specification with purpose.

</td></tr>
<tr><td>

[IFrameDimensions](./interfaces/IFrameDimensions.md)

</td><td>

Frame dimensions for bar truffle production

</td></tr>
<tr><td>

[IBonBonDimensions](./interfaces/IBonBonDimensions.md)

</td><td>

Single bonbon dimensions for bar truffle cutting

</td></tr>
<tr><td>

[IConfectionRecipeVariationEntityBase](./interfaces/IConfectionRecipeVariationEntityBase.md)

</td><td>

Base variation interface - shared by all confection variation types.

</td></tr>
<tr><td>

[IConfectionRecipeEntityBase](./interfaces/IConfectionRecipeEntityBase.md)

</td><td>

Base confection interface - all confection types share these properties.

</td></tr>
<tr><td>

[IResolvedFillingSlotEntity](./interfaces/IResolvedFillingSlotEntity.md)

</td><td>

Resolved slot with recipe filling.

</td></tr>
<tr><td>

[IResolvedIngredientSlotEntity](./interfaces/IResolvedIngredientSlotEntity.md)

</td><td>

Resolved slot with ingredient filling.

</td></tr>
<tr><td>

[IProducedConfectionEntityBase](./interfaces/IProducedConfectionEntityBase.md)

</td><td>

Base interface for all produced confection types.

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

[AnyConfectionYield](./type-aliases/AnyConfectionYield.md)

</td><td>

Discriminated union of all yield types.

</td></tr>
<tr><td>

[FillingOptionType](./type-aliases/FillingOptionType.md)

</td><td>

Discriminator for filling option types

</td></tr>
<tr><td>

[FillingOptionId](./type-aliases/FillingOptionId.md)

</td><td>

Union type for filling option IDs.

</td></tr>
<tr><td>

[AnyFillingOptionEntity](./type-aliases/AnyFillingOptionEntity.md)

</td><td>

Discriminated union of filling options.

</td></tr>
<tr><td>

[IChocolateSpec](./type-aliases/IChocolateSpec.md)

</td><td>

Chocolate specification for shell, enrobing, or coating.

</td></tr>
<tr><td>

[IConfectionMoldRef](./type-aliases/IConfectionMoldRef.md)

</td><td>

Reference to a mold used for a confection.

</td></tr>
<tr><td>

[ICoatingsEntity](./type-aliases/ICoatingsEntity.md)

</td><td>

Coating specification for rolled truffles.

</td></tr>
<tr><td>

[ResolvedSlotType](./type-aliases/ResolvedSlotType.md)

</td><td>

Resolved slot type discriminator.

</td></tr>
<tr><td>

[AnyResolvedFillingSlotEntity](./type-aliases/AnyResolvedFillingSlotEntity.md)

</td><td>

Union of resolved filling slot types.

</td></tr>
<tr><td>

[ConfectionCollectionEntry](./type-aliases/ConfectionCollectionEntry.md)

</td><td>

A single entry in a confections collection.

</td></tr>
<tr><td>

[ConfectionCollectionEntryInit](./type-aliases/ConfectionCollectionEntryInit.md)

</td><td>

Initialization type for a ConfectionsLibrary collection entry.

</td></tr>
<tr><td>

[ConfectionCollectionValidator](./type-aliases/ConfectionCollectionValidator.md)

</td><td>

Validator type for ConfectionsLibrary collections.

</td></tr>
<tr><td>

[ConfectionCollection](./type-aliases/ConfectionCollection.md)

</td><td>

Type for the collections in a ConfectionsLibrary.

</td></tr>
<tr><td>

[IConfectionFileTreeSource](./type-aliases/IConfectionFileTreeSource.md)

</td><td>

File tree source for confection data.

</td></tr>
<tr><td>

[ConfectionsMergeSource](./type-aliases/ConfectionsMergeSource.md)

</td><td>

Specifies a confections library to merge into a new library.

</td></tr>
<tr><td>

[IConfectionsLibraryParams](./type-aliases/IConfectionsLibraryParams.md)

</td><td>

Parameters for creating a ConfectionsLibrary instance synchronously.

</td></tr>
<tr><td>

[IConfectionsLibraryAsyncParams](./type-aliases/IConfectionsLibraryAsyncParams.md)

</td><td>

Parameters for creating a ConfectionsLibrary instance asynchronously with encryption support.

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

[isMoldedBonBonYield](./functions/isMoldedBonBonYield.md)

</td><td>

Type guard to check if a yield is frame-based (for molded bonbons).

</td></tr>
<tr><td>

[isMoldedBonBonRecipeEntity](./functions/isMoldedBonBonRecipeEntity.md)

</td><td>

Type guard for Entities.Confections.MoldedBonBonRecipeEntity | molded bon-bon recipe entity.

</td></tr>
<tr><td>

[isBarTruffleEntity](./functions/isBarTruffleEntity.md)

</td><td>

Type guard for Entities.Confections.BarTruffleRecipeEntity | bar truffle recipe entity.

</td></tr>
<tr><td>

[isRolledTruffleRecipeEntity](./functions/isRolledTruffleRecipeEntity.md)

</td><td>

Type guard for Entities.Confections.RolledTruffleRecipeEntity | rolled truffle recipe entity.

</td></tr>
<tr><td>

[isMoldedBonBonRecipeVariationEntity](./functions/isMoldedBonBonRecipeVariationEntity.md)

</td><td>

Type guard for Entities.Confections.IMoldedBonBonRecipeVariationEntity | molded bon-bon recipe variation entity.

</td></tr>
<tr><td>

[isBarTruffleRecipeVariationEntity](./functions/isBarTruffleRecipeVariationEntity.md)

</td><td>

Type guard for Entities.Confections.IBarTruffleRecipeVariationEntity | bar truffle recipe variation entity.

</td></tr>
<tr><td>

[isRolledTruffleRecipeVariationEntity](./functions/isRolledTruffleRecipeVariationEntity.md)

</td><td>

Type guard for Entities.Confections.IRolledTruffleRecipeVariationEntity | rolled truffle recipe variation entity.

</td></tr>
<tr><td>

[isResolvedFillingSlotEntity](./functions/isResolvedFillingSlotEntity.md)

</td><td>

Type guard for IResolvedFillingSlot

</td></tr>
<tr><td>

[isResolvedIngredientSlotEntity](./functions/isResolvedIngredientSlotEntity.md)

</td><td>

Type guard for IResolvedIngredientSlot

</td></tr>
<tr><td>

[isProducedMoldedBonBonEntity](./functions/isProducedMoldedBonBonEntity.md)

</td><td>

Type guard for IProducedMoldedBonBon

</td></tr>
<tr><td>

[isProducedBarTruffleEntity](./functions/isProducedBarTruffleEntity.md)

</td><td>

Type guard for IProducedBarTruffle

</td></tr>
<tr><td>

[isProducedRolledTruffleEntity](./functions/isProducedRolledTruffleEntity.md)

</td><td>

Type guard for IProducedRolledTruffle

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

[allResolvedSlotTypes](./variables/allResolvedSlotTypes.md)

</td><td>

All resolved slot types.

</td></tr>
</tbody></table>
