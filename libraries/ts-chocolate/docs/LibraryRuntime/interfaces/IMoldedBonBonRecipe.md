[Home](../../README.md) > [LibraryRuntime](../README.md) > IMoldedBonBonRecipe

# Interface: IMoldedBonBonRecipe

Runtime confection narrowed to molded bonbon type.

**Extends:** [`IConfectionBase<IMoldedBonBonRecipeVariation, MoldedBonBonRecipeEntity>`](../../interfaces/IConfectionBase.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[confectionType](./IMoldedBonBonRecipe.confectionType.md)

</td><td>

`readonly`

</td><td>

"molded-bonbon"

</td><td>

Type is always 'molded-bonbon' for this confection

</td></tr>
<tr><td>

[molds](./IMoldedBonBonRecipe.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;

</td><td>

Resolved molds with preferred selection (from golden variation)

</td></tr>
<tr><td>

[shellChocolate](./IMoldedBonBonRecipe.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md)

</td><td>

Resolved shell chocolate specification (from golden variation)

</td></tr>
<tr><td>

[additionalChocolates](./IMoldedBonBonRecipe.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[]

</td><td>

Resolved additional chocolates (from golden variation)

</td></tr>
<tr><td>

[id](./IConfectionBase.id.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../../type-aliases/ConfectionId.md)

</td><td>

The composite confection ID (e.g., "common.dark-dome-bonbon").

</td></tr>
<tr><td>

[collectionId](./IConfectionBase.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The collection ID part of the composite ID.

</td></tr>
<tr><td>

[baseId](./IConfectionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../../type-aliases/BaseConfectionId.md)

</td><td>

The base confection ID within the source.

</td></tr>
<tr><td>

[name](./IConfectionBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../../type-aliases/ConfectionName.md)

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./IConfectionBase.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[tags](./IConfectionBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Base tags for searching/filtering (variation may add more)

</td></tr>
<tr><td>

[urls](./IConfectionBase.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Base URLs (variation may add more)

</td></tr>
<tr><td>

[goldenVariationSpec](./IConfectionBase.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) variation

</td></tr>
<tr><td>

[goldenVariation](./IConfectionBase.goldenVariation.md)

</td><td>

`readonly`

</td><td>

[IMoldedBonBonRecipeVariation](../../interfaces/IMoldedBonBonRecipeVariation.md)

</td><td>

The golden (default) variation - resolved.

</td></tr>
<tr><td>

[variations](./IConfectionBase.variations.md)

</td><td>

`readonly`

</td><td>

readonly [IMoldedBonBonRecipeVariation](../../interfaces/IMoldedBonBonRecipeVariation.md)[]

</td><td>

All variations - resolved.

</td></tr>
<tr><td>

[effectiveTags](./IConfectionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Gets effective tags for the golden variation (base + variation's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./IConfectionBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Gets effective URLs for the golden variation (base + variation's additional URLs).

</td></tr>
<tr><td>

[decorations](./IConfectionBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../../interfaces/IConfectionDecoration.md)[]

</td><td>

Decorations from the golden variation

</td></tr>
<tr><td>

[yield](./IConfectionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification from the golden variation

</td></tr>
<tr><td>

[fillings](./IConfectionBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[]

</td><td>

Resolved filling slots from the golden variation

</td></tr>
<tr><td>

[procedures](./IConfectionBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Resolved procedures from the golden variation

</td></tr>
<tr><td>

[entity](./IConfectionBase.entity.md)

</td><td>

`readonly`

</td><td>

[MoldedBonBonRecipeEntity](../../type-aliases/MoldedBonBonRecipeEntity.md)

</td><td>

Gets the underlying confection entity data.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[getVariation(variationSpec)](./IConfectionBase.getVariation.md)

</td><td>



</td><td>

Gets a specific variation by variation specifier.

</td></tr>
<tr><td>

[getEffectiveTags(variation)](./IConfectionBase.getEffectiveTags.md)

</td><td>



</td><td>

Gets effective tags for a specific variation.

</td></tr>
<tr><td>

[getEffectiveUrls(variation)](./IConfectionBase.getEffectiveUrls.md)

</td><td>



</td><td>

Gets effective URLs for a specific variation.

</td></tr>
<tr><td>

[isMoldedBonBon()](./IConfectionBase.isMoldedBonBon.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon confection.

</td></tr>
<tr><td>

[isBarTruffle()](./IConfectionBase.isBarTruffle.md)

</td><td>



</td><td>

Returns true if this is a bar truffle confection.

</td></tr>
<tr><td>

[isRolledTruffle()](./IConfectionBase.isRolledTruffle.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle confection.

</td></tr>
</tbody></table>
