[Home](../../README.md) > [Entities](../README.md) > Fillings

# Namespace: Fillings

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IIngredientModifiers](./interfaces/IIngredientModifiers.md)

</td><td>

Modifiers that qualify how an ingredient is measured or added.

</td></tr>
<tr><td>

[IFillingIngredientEntity](./interfaces/IFillingIngredientEntity.md)

</td><td>

Reference to an ingredient used in a filling recipe.

</td></tr>
<tr><td>

[IFillingUsageEntity](./interfaces/IFillingUsageEntity.md)

</td><td>

Record of a filling recipe being used (for production tracking)

</td></tr>
<tr><td>

[IFillingDerivationEntity](./interfaces/IFillingDerivationEntity.md)

</td><td>

Reference to a source filling recipe+variation from which a filling recipe was derived.

</td></tr>
<tr><td>

[IScalingRefEntity](./interfaces/IScalingRefEntity.md)

</td><td>

Lightweight scaling reference - the default storage format for scaled filling recipes.

</td></tr>
<tr><td>

[IIngredientSnapshotEntity](./interfaces/IIngredientSnapshotEntity.md)

</td><td>

Optional ingredient snapshot for archival purposes.

</td></tr>
<tr><td>

[IProducedFillingIngredientEntity](./interfaces/IProducedFillingIngredientEntity.md)

</td><td>

Resolved filling ingredient with concrete choice.

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

[RatingCategory](./type-aliases/RatingCategory.md)

</td><td>

Categories for rating a filling recipe variation

</td></tr>
<tr><td>

[IProcedureRefEntity](./type-aliases/IProcedureRefEntity.md)

</td><td>

Reference to a procedure that can be used with a filling recipe.

</td></tr>
<tr><td>

[FillingCollectionEntry](./type-aliases/FillingCollectionEntry.md)

</td><td>

A single entry in a fillings collection.

</td></tr>
<tr><td>

[FillingCollectionEntryInit](./type-aliases/FillingCollectionEntryInit.md)

</td><td>

Initialization type for a FillingsLibrary collection entry.

</td></tr>
<tr><td>

[FillingCollectionValidator](./type-aliases/FillingCollectionValidator.md)

</td><td>

Validator type for FillingsLibrary collections.

</td></tr>
<tr><td>

[FillingCollection](./type-aliases/FillingCollection.md)

</td><td>

Type for the collections in a FillingsLibrary.

</td></tr>
<tr><td>

[IFillingFileTreeSource](./type-aliases/IFillingFileTreeSource.md)

</td><td>

File tree source for filling recipe data.

</td></tr>
<tr><td>

[FillingsMergeSource](./type-aliases/FillingsMergeSource.md)

</td><td>

Specifies a fillings library to merge into a new library.

</td></tr>
<tr><td>

[IFillingsLibraryParams](./type-aliases/IFillingsLibraryParams.md)

</td><td>

Parameters for creating a FillingsLibrary instance synchronously.

</td></tr>
<tr><td>

[IFillingsLibraryAsyncParams](./type-aliases/IFillingsLibraryAsyncParams.md)

</td><td>

Parameters for creating a FillingsLibrary instance asynchronously with encryption support.

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

[createBlankFillingRecipeEntity](./functions/createBlankFillingRecipeEntity.md)

</td><td>

Creates a minimal blank filling recipe entity suitable for the "new filling" create flow.

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

[allFillingCategories](./variables/allFillingCategories.md)

</td><td>

All possible filling categories

</td></tr>
<tr><td>

[allRatingCategories](./variables/allRatingCategories.md)

</td><td>

All possible rating categories

</td></tr>
</tbody></table>
