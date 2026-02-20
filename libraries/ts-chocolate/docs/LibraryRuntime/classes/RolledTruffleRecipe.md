[Home](../../README.md) > [LibraryRuntime](../README.md) > RolledTruffleRecipe

# Class: RolledTruffleRecipe

A resolved view of a rolled truffle confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

**Extends:** [`ConfectionBase<IRolledTruffleRecipeVariation, RolledTruffleRecipeEntity>`](../../classes/ConfectionBase.md)

**Implements:** [`IRolledTruffleRecipe`](../../interfaces/IRolledTruffleRecipe.md)

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

[confectionType](./RolledTruffleRecipe.confectionType.md)

</td><td>

`readonly`

</td><td>

"rolled-truffle"

</td><td>

Confection type is always 'rolled-truffle' for this type

</td></tr>
<tr><td>

[fillings](./RolledTruffleRecipe.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots from the golden variation.

</td></tr>
<tr><td>

[procedures](./RolledTruffleRecipe.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Resolved procedures from the golden variation.

</td></tr>
<tr><td>

[enrobingChocolate](./RolledTruffleRecipe.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md) | undefined

</td><td>

Resolved enrobing chocolate specification (from golden variation, optional).

</td></tr>
<tr><td>

[coatings](./RolledTruffleRecipe.coatings.md)

</td><td>

`readonly`

</td><td>

[IResolvedCoatings](../../interfaces/IResolvedCoatings.md) | undefined

</td><td>

Resolved coating specification (from golden variation, optional).

</td></tr>
<tr><td>

[entity](./RolledTruffleRecipe.entity.md)

</td><td>

`readonly`

</td><td>

[RolledTruffleRecipeEntity](../../type-aliases/RolledTruffleRecipeEntity.md)

</td><td>

Gets the underlying rolled truffle data entity

</td></tr>
<tr><td>

[id](./ConfectionBase.id.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../../type-aliases/ConfectionId.md)

</td><td>

The composite confection ID (e.g., "common.dark-dome-bonbon")

</td></tr>
<tr><td>

[collectionId](./ConfectionBase.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./ConfectionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../../type-aliases/BaseConfectionId.md)

</td><td>

The base confection ID within the source

</td></tr>
<tr><td>

[name](./ConfectionBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../../type-aliases/ConfectionName.md)

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./ConfectionBase.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description

</td></tr>
<tr><td>

[tags](./ConfectionBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Base tags for searching/filtering (variation may add more via additionalTags)

</td></tr>
<tr><td>

[urls](./ConfectionBase.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[] | undefined

</td><td>

Base URLs (variation may add more via additionalUrls)

</td></tr>
<tr><td>

[goldenVariationSpec](./ConfectionBase.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) variation

</td></tr>
<tr><td>

[decorations](./ConfectionBase.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionDecorationRef](../../interfaces/IResolvedConfectionDecorationRef.md), [DecorationId](../../type-aliases/DecorationId.md)&gt; | undefined

</td><td>

Resolved decorations from the golden variation

</td></tr>
<tr><td>

[yield](./ConfectionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification from the golden variation

</td></tr>
<tr><td>

[goldenVariation](./ConfectionBase.goldenVariation.md)

</td><td>

`readonly`

</td><td>

TVariation

</td><td>

The golden (default) variation - resolved.

</td></tr>
<tr><td>

[variations](./ConfectionBase.variations.md)

</td><td>

`readonly`

</td><td>

readonly TVariation[]

</td><td>

All variations - resolved.

</td></tr>
<tr><td>

[effectiveTags](./ConfectionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Gets effective tags for the golden variation (base tags + variation's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./ConfectionBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Gets effective URLs for the golden variation (base URLs + variation's additional URLs).

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

[create(context, id, confection)](./RolledTruffleRecipe.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a RolledTruffle.

</td></tr>
<tr><td>

[getGoldenVariation()](./ConfectionBase.getGoldenVariation.md)

</td><td>



</td><td>

Gets the golden (default) variation - resolved.

</td></tr>
<tr><td>

[getVariations()](./ConfectionBase.getVariations.md)

</td><td>



</td><td>

Gets all variations - resolved.

</td></tr>
<tr><td>

[getVariationFromEntity(entity)](./ConfectionBase.getVariationFromEntity.md)

</td><td>



</td><td>

Wraps an arbitrary variation entity using this confection's context.

</td></tr>
<tr><td>

[getVariation(variationSpec)](./ConfectionBase.getVariation.md)

</td><td>



</td><td>

Gets a specific variation by variation specifier.

</td></tr>
<tr><td>

[getEffectiveTags(variation)](./ConfectionBase.getEffectiveTags.md)

</td><td>



</td><td>

Gets effective tags for a specific variation (base tags + variation's additional tags).

</td></tr>
<tr><td>

[getEffectiveUrls(variation)](./ConfectionBase.getEffectiveUrls.md)

</td><td>



</td><td>

Gets effective URLs for a specific variation (base URLs + variation's additional URLs).

</td></tr>
<tr><td>

[isMoldedBonBon()](./ConfectionBase.isMoldedBonBon.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon confection.

</td></tr>
<tr><td>

[isBarTruffle()](./ConfectionBase.isBarTruffle.md)

</td><td>



</td><td>

Returns true if this is a bar truffle confection.

</td></tr>
<tr><td>

[isRolledTruffle()](./ConfectionBase.isRolledTruffle.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle confection.

</td></tr>
</tbody></table>
